// Reads TWTAPI_KEY and spends paid quota on every call: must never reach the
// client bundle. `server-only` turns that mistake into a build failure instead
// of a silently broken fetch from the browser.
import 'server-only';

import { unstable_cache } from 'next/cache';
import { Logger } from "@/lib/logger";
import { UnrolledThread, TweetDetailConversationResponse, TwtAPIRawResponse, TimelineInstruction, TimelineEntry, TweetNode, ThreadItem, TweetMedia, ThreadLinkPreview } from '@/lib/twitter/types';
import crypto from 'crypto';

/**
 * Fetch with exponential backoff for rate limit handling
 */
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429 && attempt < maxRetries - 1) {
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }

    return response;
  }
  throw new Error('Rate limit exceeded after retries');
}

// A daily window, not a minute one: a minute window has no relationship to a
// monthly quota, so a loop could sustain any rate forever.
// ponytail: still per-process, so the real ceiling is instances x cap. Only a
// shared store would make it global — not worth a dependency at this traffic.
const TWTAPI_MAX_PER_DAY = Number(process.env.TWTAPI_DAILY_CAP ?? 10);
const TWTAPI_WINDOW_MS = 86_400_000;

// 30 days, not 24 hours. The Data Cache expires on the TTL, and the next request
// after expiry pays again — so a 24h TTL costs one call per thread PER DAY, and
// a single busy thread could eat 30 calls a month on its own.
const CACHE_TTL_SECONDS = 2_592_000;

/**
 * The thread itself is the problem — a bad ID, a deleted tweet, or a payload we
 * can't read. Callers turn this into a 404. Everything else thrown from here
 * (missing key, exhausted quota, TwtAPI 5xx, network) is operational and must
 * NOT be disguised as "this thread doesn't exist".
 */
export class ThreadUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ThreadUnavailableError';
  }
}

declare global {
  // eslint-disable-next-line no-var
  var twtapiBudget: { count: number; windowStart: number } | undefined;
}

function checkTwtApiBudget() {
  const now = Date.now();
  const state = (globalThis.twtapiBudget ??= { count: 0, windowStart: now });
  if (now - state.windowStart > TWTAPI_WINDOW_MS) {
    state.count = 0;
    state.windowStart = now;
  }
  if (++state.count > TWTAPI_MAX_PER_DAY) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
}

/**
 * Fetches and unrolls thread data using TwtAPI (www.twtapi.com).
 * Never call this directly — go through `fetchAndUnrollThread` below, which
 * memoizes it. Reaching the network without the memo is paying for nothing.
 */
async function fetchAndUnrollUncached(tweetId: string): Promise<UnrolledThread> {
  // Single choke point for every caller (page + any future route).
  if (!/^\d+$/.test(tweetId)) {
    throw new ThreadUnavailableError('Invalid tweet ID');
  }

  const apiKey = process.env.TWTAPI_KEY;
  // Hard-wired off in production: a stray DISABLE_CACHE on Vercel would turn
  // every single page view into a paid call.
  const disableCache =
    process.env.NODE_ENV !== 'production' && process.env.DISABLE_CACHE === 'true';

  if (!apiKey) {
    // Operational, not a missing thread: without the key nothing can be served,
    // so this must surface as a real error rather than a 404.
    Logger.error(new Error('TWTAPI_KEY is not configured'), { hint: 'The thread viewer cannot fetch without it.' });
    throw new Error('Thread service is not configured.');
  }

  // TwtAPI conversation endpoint (optimized for thread fetching)
  const apiUrl = `https://www.twtapi.com/api-proxy/api/v1/twitter/TweetDetailConversationv2?tweet_id=${tweetId}`;

  console.log('🔍 Fetching from TwtAPI:', {
    tweetId,
    apiUrl,
    cacheStatus: disableCache ? 'DISABLED (dev mode)' : 'ENABLED (30d)'
  });

  // Reached only on a cache miss now, because the memo above skips this whole
  // function on a hit — a visitor served from cache used to burn a unit anyway.
  checkTwtApiBudget();

  const response = await fetchWithRetry(
    apiUrl,
    {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      next: disableCache ? { revalidate: 0 } : { revalidate: CACHE_TTL_SECONDS },
    }
  );

  if (!response.ok) {
    // Only a genuine "no such tweet" is a 404. The rest are the service failing,
    // and collapsing them into a 404 is what hides an exhausted quota or a bad
    // key behind a "thread not found" page.
    if (response.status === 404) {
      throw new ThreadUnavailableError('Tweet not found upstream.');
    }
    if (response.status === 429) throw new Error('Rate limit exceeded. Please try again later.');
    if (response.status === 401) throw new Error('Invalid TwtAPI key.');
    if (response.status === 402) throw new Error('Insufficient TwtAPI balance.');
    throw new Error(`TwtAPI responded with status: ${response.status}`);
  }

  const rawData = await response.json() as TwtAPIRawResponse;
  console.log('📊 TwtAPI Response received:', {
    status: response.status,
    hasData: !!(rawData && typeof rawData === 'object' && 'data' in rawData),
    dataType: rawData && typeof rawData === 'object' ? rawData.constructor?.name : 'unknown'
  });

  // Parse the raw GraphQL structure into your component's UnrolledThread type
  return parseThreadToArticle(rawData);
}

/**
 * Public entry point. `unstable_cache` skips the body entirely on a hit, so a
 * cached thread costs no network call and no budget unit, and the
 * generateMetadata + page double-call collapses into one real fetch.
 */
export const fetchAndUnrollThread = unstable_cache(
  fetchAndUnrollUncached,
  // v2: el parser ahora emite tarjetas de enlace. Cambiar la clave invalida los
  // hilos guardados con el formato viejo (30 días); sin esto no verían cards.
  ['twtapi-thread-v2'],
  { revalidate: CACHE_TTL_SECONDS },
);

// X publica la miniatura de una tarjeta en varias resoluciones. Se eligen las
// panorámicas (1.91:1) antes que las cuadradas para que el recorte de la card
// no se coma el texto de la propia imagen.
const CARD_IMAGE_BINDINGS = [
  'photo_image_full_size_large',
  'summary_photo_image_large',
  'photo_image_full_size',
  'summary_photo_image',
  'player_image_large',
  'thumbnail_image_large',
  'thumbnail_image_original',
];

const CARD_ALT_BINDINGS = [
  'photo_image_full_size_alt_text',
  'summary_photo_image_alt_text',
  'player_image_alt_text',
];

/**
 * Extrae la tarjeta de enlace de un tweet. Devuelve `undefined` para las
 * tarjetas que no son un enlace con titular (por ejemplo `unified_card`, que
 * usan los anuncios y no trae `binding_values`).
 */
function extractLinkPreview(tweet: TweetNode): ThreadLinkPreview | undefined {
  const bindings = tweet.tweet_card?.legacy?.binding_values;
  if (!bindings?.length) return undefined;

  const byKey = new Map(
    bindings.map((binding) => [binding.key ?? '', binding.value] as const)
  );
  const title = byKey.get('title')?.string_value?.trim();
  if (!title) return undefined;

  // `card_url` viene sin expandir (t.co), así que se cruza con `entities.urls`
  // para quedarnos con el destino real; es lo que abre el enlace de la card.
  // Si no viniera, X asocia la tarjeta al último enlace del tweet.
  const cardUrl = byKey.get('card_url')?.string_value;
  const urls = tweet.legacy?.entities?.urls ?? [];
  const urlEntity =
    urls.find(
      (entity) =>
        cardUrl && (entity.url === cardUrl || entity.expanded_url === cardUrl)
    ) ??
    [...urls].reverse().find((entity) => entity.expanded_url) ??
    urls[urls.length - 1];

  const url = urlEntity?.expanded_url ?? urlEntity?.url ?? cardUrl;
  if (!url) return undefined;

  const imageBinding = CARD_IMAGE_BINDINGS.map((key) => byKey.get(key)).find(
    (value) => value?.image_value?.url
  );
  const altBinding = CARD_ALT_BINDINGS.map((key) => byKey.get(key)).find(
    (value) => value?.string_value
  );

  return {
    url,
    title,
    description: byKey.get('description')?.string_value?.trim() || undefined,
    domain:
      byKey.get('vanity_url')?.string_value?.trim() ||
      byKey.get('domain')?.string_value?.trim() ||
      undefined,
    imageUrl: imageBinding?.image_value?.url,
    imageAlt:
      altBinding?.string_value?.trim() || imageBinding?.image_value?.alt || title,
  };
}

/** El titular va como texto de un enlace Markdown: hay que neutralizar sus corchetes. */
function escapeLinkText(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/([\\[\]])/g, '\\$1');
}

export function parseThreadToArticle(rawData: TwtAPIRawResponse): UnrolledThread {
  try {
    let rootTweetNode: TweetNode | null = null;
    let threadNodes: TweetNode[] = [];

    // ---------------------------------------------------------
    // SCENARIO A: Direct Tweet Format (TweetDetailv2 shape)
    // ---------------------------------------------------------
    if (rawData && typeof rawData === 'object' && 'data' in rawData) {
      const data = (rawData as TweetDetailConversationResponse).data;
      if (data?.tweetResult?.result) {
        rootTweetNode = data.tweetResult.result;
      }
      // ---------------------------------------------------------
      // SCENARIO B: Timeline Format (TweetDetailConversationv2 shape)
      // ---------------------------------------------------------
      else if (data?.timeline_response?.instructions) {
        const instructions = data.timeline_response.instructions;

        const addEntries = instructions.find((i: TimelineInstruction) =>
          i.__typename === 'TimelineAddEntries' || i.type === 'TimelineAddEntries'
        );

        const entries = addEntries?.entries || [];

        // Find the root entry (usually the first item starting with 'tweet-')
        const rootEntry = entries.find((e: TimelineEntry) => e.entryId?.startsWith('tweet-'));

        // Handle Twitter's inconsistent nesting (content vs itemContent)
        const content = rootEntry?.content?.content || rootEntry?.content?.itemContent;
        const tweetResult = content?.tweetResult?.result || content?.tweet_results?.result;
        rootTweetNode = tweetResult ?? null;

        // Extract Thread Replies
        const threadModule = entries.find((e: TimelineEntry) => e.content?.__typename === 'TimelineTimelineModule');
        const replyItems = threadModule?.content?.items || [];

        // Map replies, safely navigating the nested structure
        threadNodes = replyItems
          .map((item: ThreadItem) => {
            const itemContent = item.item?.item?.content || item.item?.content;
            const node = itemContent?.tweetResult?.result || itemContent?.tweet_results?.result;

            // Unwrap if nested in visibility results
            if (node?.__typename === 'TweetWithVisibilityResults' && node.tweet) {
              return node.tweet;
            }
            return node;
          })
          .filter((node): node is TweetNode => node !== null && node !== undefined);
      }
    }

    // ---------------------------------------------------------
    // UNWRAP ROOT TWEET (If hidden behind VisibilityResults)
    // ---------------------------------------------------------
    if (rootTweetNode?.__typename === 'TweetWithVisibilityResults') {
      rootTweetNode = rootTweetNode.tweet ?? null;
    }

    // ---------------------------------------------------------
    // FAIL-SAFE
    // ---------------------------------------------------------
    if (!rootTweetNode) {
      // Shape only, never content: tweet bodies are third-party personal data and
      // this lands in Vercel's logs. The old full dump contradicted /privacidad.
      Logger.error(new Error('Failed to find root tweet'), {
        envelope: Object.keys(rawData ?? {}),
        data: Object.keys(rawData?.data ?? {}),
      });
      throw new ThreadUnavailableError('Root tweet not found in payload');
    }

    // ---------------------------------------------------------
    // EXTRACT DATA
    // ---------------------------------------------------------
    const authorData = rootTweetNode.core?.user_result?.result?.legacy || rootTweetNode.core?.user_results?.result?.legacy;
    const authorId = rootTweetNode.legacy?.user_id_str;

    // Filter replies to only include those from the original author
    const authorReplies = threadNodes.filter((node: TweetNode) => node.legacy?.user_id_str === authorId);

    const allTweets = [rootTweetNode, ...authorReplies];

    let markdownContent = '';
    const images: { url: string; alt: string }[] = [];
    const linkPreviews: ThreadLinkPreview[] = [];

    allTweets.forEach((node, tweetIndex) => {
      const linkPreview = extractLinkPreview(node);
      let text = node.legacy?.full_text || '';

      // El enlace que respalda la tarjeta se quita del texto porque debajo se
      // emite la tarjeta completa. Los demás t.co se dejan tal cual.
      for (const entity of node.legacy?.entities?.urls ?? []) {
        if (
          entity.url &&
          linkPreview &&
          (entity.expanded_url === linkPreview.url || entity.url === linkPreview.url)
        ) {
          text = text.split(entity.url).join('');
        }
      }

      // Clean up standalone t.co links that just point to attached media
      text = text.replace(/https:\/\/t\.co\/[a-zA-Z0-9]+$/, '').trim();

      if (text) {
        markdownContent += `${text}\n\n`;
      }

      // Each photo is emitted as inline Markdown directly under the text of the
      // tweet that attached it, to keep the thread's context: they used to be
      // flattened to the top of the article, which destroyed the ordering.
      const mediaArr = node.legacy?.extended_entities?.media || node.legacy?.entities?.media || [];
      const photos = mediaArr.filter(
        (media: TweetMedia) => media.type === 'photo' && media.media_url_https
      );

      photos.forEach((media: TweetMedia, photoIndex: number) => {
        const url = media.media_url_https as string;
        const alt =
          photos.length > 1
            ? `Image ${photoIndex + 1} from tweet ${tweetIndex + 1}`
            : `Image from tweet ${tweetIndex + 1}`;

        images.push({ url, alt });
        markdownContent += `![${alt}](${url})\n\n`;
      });

      // La tarjeta va al final del tweet, donde X la muestra. Se escribe como un
      // enlace Markdown normal: ThreadArticle lo reconoce por su href y lo pinta
      // como card. Fuera del unroller sigue siendo un enlace válido.
      if (linkPreview) {
        linkPreviews.push(linkPreview);
        markdownContent += `[${escapeLinkText(linkPreview.title)}](<${linkPreview.url}>)\n\n`;
      }
    });

    // ---------------------------------------------------------
    // FORMAT RETURN
    // ---------------------------------------------------------
    const firstLine = rootTweetNode.legacy?.full_text?.split('\n')[0] || 'Thread';
    const tweetId = rootTweetNode.rest_id || '';

    // Strip image markdown before trimming, otherwise a photo-first thread gets a
    // raw pbs.twimg.com URL as its meta description. Link cards contribute their
    // headline, not the bracket syntax.
    const excerpt =
      markdownContent
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 160) + '…';

    return {
      id: crypto.randomUUID(),
      tweetId,
      title: firstLine.substring(0, 60) + (firstLine.length > 60 ? '...' : ''),
      excerpt,
      author: {
        name: authorData?.name || 'Unknown',
        screen_name: authorData?.screen_name || 'unknown',
        avatar_url: authorData?.profile_image_url_https,
      },
      created_at: rootTweetNode.legacy?.created_at || new Date().toISOString(),
      markdownContent: markdownContent.trim(),
      images,
      linkPreviews,
      estimatedReadTime: Math.max(1, Math.ceil(markdownContent.split(' ').length / 200)),
    };
  } catch (error) {
    Logger.error(error instanceof Error ? error : new Error(String(error)), { phase: 'twitter-parse' });
    throw error;
  }
}
