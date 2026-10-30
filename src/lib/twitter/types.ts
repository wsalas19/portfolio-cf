export interface ThreadAuthor {
  name: string;
  screen_name: string;
  avatar_url?: string;
}

export interface ThreadImage {
  url: string;
  alt: string;
}

/**
 * Tarjeta de enlace que X muestra bajo un tweet. Sale de
 * `tweet_card.legacy.binding_values`; el `url` es el destino ya expandido, que
 * es también la clave con la que el markdown la referencia.
 */
export interface ThreadLinkPreview {
  url: string;
  title: string;
  description?: string;
  domain?: string;
  imageUrl?: string;
  imageAlt?: string;
}

export interface UnrolledThread {
  id: string;
  tweetId: string;
  title: string;
  excerpt: string;
  author: ThreadAuthor;
  markdownContent: string;
  images?: ThreadImage[];
  linkPreviews?: ThreadLinkPreview[];
  created_at: string;
  estimatedReadTime: number;
}

// TwtAPI Response Types
export interface TwtAPIResponse<T> {
  code: number;
  msg: string;
  data: T;
}

// TwtAPI Timeline Instruction Types
export interface TimelineInstruction {
  __typename?: string;
  type?: string;
  entries?: TimelineEntry[];
}

export interface TimelineEntry {
  entryId?: string;
  content?: TimelineEntryContent;
}

export interface TimelineEntryContent {
  content?: TimelineEntryContent;
  itemContent?: ItemContent;
  tweetResult?: TweetResult;
  tweet_results?: TweetResult;
  __typename?: string;
  items?: ThreadItem[]; // For timeline modules
}

export interface ItemContent {
  tweetResult?: TweetResult;
  tweet_results?: TweetResult;
}

export interface TweetResult {
  result?: TweetNode;
  rest_id?: string;
}

export interface TweetNode {
  rest_id?: string;
  legacy?: TweetLegacy;
  core?: TweetCore;
  note_tweet?: NoteTweet;
  tweet_card?: TweetCard;
  __typename?: string;
  tweet?: TweetNode; // For unwrapping TweetWithVisibilityResults
}

export interface TweetCore {
  user_result?: UserResult;
  user_results?: UserResult;
}

export interface UserResult {
  result?: UserResultData;
}

export interface UserResultData {
  rest_id?: string;
  legacy?: TweetUserLegacy;
}

export interface TweetUserLegacy {
  name: string;
  screen_name: string;
  profile_image_url_https?: string;
}

export interface TweetLegacy {
  user_id_str?: string;
  full_text?: string;
  created_at?: string;
  extended_entities?: ExtendedEntities;
  entities?: TweetEntities;
}

export interface ExtendedEntities {
  media?: TweetMedia[];
}

export interface TweetEntities {
  media?: TweetMedia[];
  urls?: TweetUrlEntity[];
}

export interface TweetUrlEntity {
  url?: string;
  expanded_url?: string;
  display_url?: string;
}

export interface TweetCard {
  legacy?: {
    name?: string;
    binding_values?: TweetCardBindingValue[];
  };
}

/**
 * X guarda la tarjeta como una lista de pares clave/valor. Solo se modelan las
 * variantes que usamos: texto e imagen.
 */
export interface TweetCardBindingValue {
  key?: string;
  value?: {
    string_value?: string;
    image_value?: {
      url?: string;
      alt?: string;
      width?: number;
      height?: number;
    };
  };
}

export interface TweetMedia {
  type: string;
  media_url_https?: string;
}

export interface NoteTweet {
  result?: NoteTweetResult;
}

export interface NoteTweetResult {
  text?: string;
}

export interface TimelineTimelineModule {
  items?: ThreadItem[];
}

export interface ThreadItem {
  item?: ThreadItemContent;
}

export interface ThreadItemContent {
  item?: ThreadItemContent;
  content?: ItemContent;
}

export interface TweetDetailConversationResponse {
  data: {
    timeline_response?: {
      instructions: TimelineInstruction[];
    };
    tweetResult?: {
      result: TweetNode;
    };
    tweet_results?: {
      result: TweetNode;
    };
  };
}

// Raw API response type for parsing
export type TwtAPIRawResponse = TweetDetailConversationResponse | Record<string, unknown>;

// FxTwitter API types (kept for backwards compatibility if needed)
export interface TwitterAuthor {
  name: string;
  screen_name: string;
  avatar_url: string;
}

export interface TwitterMedia {
  photos: TwitterPhoto[];
}

export interface TwitterPhoto {
  url: string;
}

export interface TwitterQuote {
  author: { screen_name: string };
  text: string;
}

export interface TwitterTweet {
  author: TwitterAuthor;
  created_at: string;
  text: string;
  media?: TwitterMedia;
  quote?: TwitterQuote;
}
