import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { UnrolledThread } from '@/lib/twitter/types';
import 'highlight.js/styles/github-dark.css';
import type { Components } from 'react-markdown';
import { ZoomImage } from '@/components/ZoomImage';

// pbs.twimg.com acepta ?name=large para servir la foto en tamaño completo.
// Si la URL ya trae query, se encadena con &.
function largeUrl(url: string): string {
  return `${url}${url.includes('?') ? '&' : '?'}name=large`;
}

// Custom markdown components for proper text hierarchy and spacing
const components: Partial<Components> = {
  // Headings with clear hierarchy
  h1: ({ children }) => (
    <h1 className="text-4xl font-bold text-white mt-12 mb-8 pb-4 border-b border-gray-700 tracking-tight">
      {children}
    </h1>
  ),

  h2: ({ children }) => (
    <h2 className="text-3xl font-bold text-palette-lime mt-12 mb-6 tracking-tight">
      {children}
    </h2>
  ),

  h3: ({ children }) => (
    <h3 className="text-2xl font-semibold text-palette-pink mt-8 mb-4 tracking-tight">
      {children}
    </h3>
  ),

  h4: ({ children }) => (
    <h4 className="font-display text-xl font-semibold text-gray-200 mt-6 mb-3 tracking-tight">
      {children}
    </h4>
  ),

  // Paragraphs with clear separation
  p: ({ children }) => (
    <p className="text-gray-300 leading-loose mb-6 text-base">{children}</p>
  ),

  // Links with clear clickability
  a: ({ href, children }) => {
    const isExternal = href?.startsWith("http");
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-palette-lime font-medium border border-palette-lime/30 bg-palette-lime/10 px-2.5 py-1.5 rounded-md text-sm hover:bg-palette-lime/20 hover:border-palette-lime/60 transition-all duration-200 no-underline"
        >
          {children}
        </a>
      );
    }
    return (
      <a
        href={href}
        className="text-palette-lime font-medium underline underline-offset-4 decoration-palette-lime/50 decoration-2 hover:text-palette-lime hover:decoration-palette-lime transition-all duration-200"
      >
        {children}
      </a>
    );
  },

  // Strong/bold text
  strong: ({ children }) => (
    <strong className="text-white font-semibold">{children}</strong>
  ),

  // Photos arrive as inline Markdown, below the tweet that attached them.
  // `no-referrer` es obligatorio: pbs.twimg.com devuelve 351 Forbidden si el
  // Referer no es x.com, y el navegador bloquearía la respuesta (ORB).
  img: ({ src, alt }) =>
    typeof src === 'string' ? (
      <ZoomImage
        src={src}
        alt={alt || 'Tweet image'}
        expandSrc={largeUrl(src)}
        referrerPolicy="no-referrer"
      />
    ) : null,

  // Inline code vs code blocks
  code: ({ className, children, ...props }) => {
    // If className contains language- prefix, it's a code block (handled by rehype-highlight)
    // Otherwise it's inline code
    const isCodeBlock = className?.includes("language-");
    if (!isCodeBlock) {
      return (
        <code
          className="text-palette-lime bg-palette-lime/20 px-2 py-1 rounded font-mono text-sm border border-palette-lime/20"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },

  // Code blocks
  pre: ({ children }) => (
    <pre className="bg-palette-code border border-gray-700 rounded-lg shadow-xl mt-6 mb-6 overflow-x-auto">
      {children}
    </pre>
  ),

  // Blockquotes with visual distinction
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-palette-lime bg-palette-lime/10 pl-6 py-4 my-6 rounded-r-lg text-gray-300">
      {children}
    </blockquote>
  ),

  // Lists with proper spacing
  ul: ({ children }) => (
    <ul className="list-disc pl-6 my-6 space-y-2 text-gray-300">{children}</ul>
  ),

  ol: ({ children }) => (
    <ol className="list-decimal pl-6 my-6 space-y-2 text-gray-300">
      {children}
    </ol>
  ),

  li: ({ children }) => <li className="leading-relaxed">{children}</li>,

  // Horizontal rules for section dividers
  hr: () => <hr className="border-gray-700 my-12 border-t-2" />,

  // Tables (if used)
  table: ({ children }) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full divide-y divide-gray-700">{children}</table>
    </div>
  ),

  thead: ({ children }) => <thead className="bg-gray-800/50">{children}</thead>,

  tbody: ({ children }) => (
    <tbody className="divide-y divide-gray-800">{children}</tbody>
  ),

  tr: ({ children }) => <tr>{children}</tr>,

  th: ({ children }) => (
    <th className="px-4 py-3 text-left text-white font-semibold text-sm uppercase tracking-wider">
      {children}
    </th>
  ),

  td: ({ children }) => (
    <td className="px-4 py-3 text-gray-300 text-sm">{children}</td>
  ),
};

export function ThreadArticle({ thread }: { thread: UnrolledThread }) {
  return (
    <main className="min-h-screen bg-palette-card pt-12 pb-28 px-4 ">
      <article className="max-w-4xl mx-auto">

        {/* Content */}
        <div className="bg-palette-elevated rounded-xl overflow-hidden">
          {/* Header */}
          <header className="p-8 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-palette-lime mb-3">
              <span>X Thread Unrolled</span>
              <span>•</span>
              <span>{thread.estimatedReadTime} min read</span>
            </div>

            <div className="flex items-center gap-4">
              {thread.author.avatar_url ? (
                // <img> y no next/image: vinext descarta props extra (como
                // referrerPolicy) al delegar avatares remotos a unpic, y sin
                // `no-referrer` pbs.twimg.com responde 351 y el navegador
                // bloquea la respuesta por ORB.
                <img
                  src={thread.author.avatar_url}
                  alt={thread.author.name}
                  width={48}
                  height={48}
                  loading="eager"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="rounded-full border border-white/10"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                  {thread.author.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-bold text-white">
                  {thread.author.name}
                  <span className="text-xs font-normal text-gray-400 ml-2">@{thread.author.screen_name}</span>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(thread.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </header>
          {/* Markdown Content: each tweet's text and, below it, its photos */}
          <section className="p-8 prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-a:text-palette-lime prose-strong:text-white">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={components}>
              {thread.markdownContent}
            </ReactMarkdown>
          </section>

          {/* Cached-copy notice: the 30-day TTL is a cost control, and the visitor
              deserves to know the article can be behind the live thread. */}
          <footer className="border-t border-white/10 px-8 py-5">
            <p className="text-xs leading-relaxed text-gray-500">
              This is a cached copy of the thread, up to 30 days old. Later edits or
              deletions by the author are not reflected here.{' '}
              <a
                href={`https://x.com/i/status/${thread.tweetId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 underline decoration-gray-600 underline-offset-2 transition-colors hover:text-palette-lime"
              >
                View the original on X
              </a>
              .
            </p>
          </footer>
        </div>
      </article>
    </main>
  );
}
