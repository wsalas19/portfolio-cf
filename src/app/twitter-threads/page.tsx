'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Check, Infinity as InfinityIcon, Link2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

// Real, long-lived public thread so the prefilled example actually works when submitted.
const EXAMPLE_URL = 'https://x.com/naval/status/1002103360646823936';

const extractTweetId = (url: string): string | null => {
  const match = url.match(/(?:twitter\.com|x\.com)\/(?:#!\/)?\w+\/status\/(\d+)/);
  return match ? match[1] : null;
};

function ThreadPreview() {
  const tweets = [
    "I quit my job to build in public. Here's everything I learned 👇",
    "1. Consistency beats intensity. Show up daily, even when it's quiet.",
    "2. Ship before you're ready. Feedback beats perfection.",
    '3. Build in public — attention compounds.',
  ];
  return (
    <div className="rounded-xl border border-white/10 bg-palette-elevated p-4 text-left">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-palette-lime to-palette-pink text-sm font-bold text-gray-900">
          B
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight">Build in Public</div>
          <div className="text-xs text-gray-500">@buildinpublic · 25 posts</div>
        </div>
      </div>
      <ul className="space-y-2">
        {tweets.map((t, i) => (
          <li
            key={i}
            className={`rounded-lg p-2.5 text-sm leading-snug text-gray-300 ${
              i === 0 ? 'border border-white/10 bg-white/5' : 'bg-white/[0.03]'
            }`}
          >
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ArticlePreview() {
  const points = [
    'Consistency beats intensity — showing up daily wins.',
    "Ship before you're ready; feedback beats perfection.",
    'Building in public compounds attention over time.',
  ];
  return (
    <div className="rounded-xl border border-white/10 bg-palette-elevated p-5 text-left">
      <div className="text-[10px] font-bold uppercase tracking-widest text-palette-lime">
        X Thread Unrolled · 4 min read
      </div>
      <h3 className="mt-2 text-lg font-bold leading-tight">
        What I Learned <span className="text-palette-pink">Building in Public</span>
      </h3>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-gray-300">
        {points.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
    </div>
  );
}

function Demo() {
  return (
    <div className="mt-12 flex flex-col items-stretch gap-4 md:flex-row md:items-center">
      <div className="flex-1">
        <ThreadPreview />
      </div>
      <div
        aria-hidden
        className="rotate-90 self-center text-2xl font-bold text-palette-lime md:rotate-0"
      >
        →
      </div>
      <div className="flex-1">
        <ArticlePreview />
      </div>
    </div>
  );
}

const steps = [
  { icon: Link2, title: 'Paste a thread URL', desc: 'Copy any X/Twitter thread link.' },
  { icon: Zap, title: 'We fetch it', desc: 'The full conversation is extracted in seconds.' },
  { icon: BookOpen, title: 'Get your article', desc: 'A clean, readable, shareable article.' },
];

const perks = [
  { icon: Check, label: 'No signup required' },
  { icon: Zap, label: 'Instant — under 3 seconds' },
  { icon: InfinityIcon, label: 'Free forever' },
];

export default function TwitterThreadsPage() {
  const [url, setUrl] = useState(EXAMPLE_URL);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    try {
      const tweetId = extractTweetId(url);
      if (!tweetId) throw new Error('Invalid tweet URL format');

      router.push(`/twitter-threads/${tweetId}`);
    } catch (error) {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Something went wrong',
      });
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-palette-card text-white pb-10">
      <section className="mx-auto max-w-3xl px-4 py-14 md:py-20">
        {/* Hero */}
        <div className="text-center">
          <span className="inline-block rounded-full border border-palette-lime/30 bg-palette-lime/10 px-3 py-1 text-xs font-semibold tracking-wide text-palette-lime">
            Free Tool · No Signup Required
          </span>
          <h1 className="mt-5 text-3xl font-bold leading-tight text-transparent bg-gradient-to-r from-palette-lime to-palette-pink bg-clip-text md:text-5xl">
            Turn X Threads into Readable Articles in One Click
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-gray-400 md:text-lg">
            Stop screenshotting threads. Get clean, shareable articles you can actually
            read.
          </p>
        </div>

        {/* Visual proof */}
        <Demo />

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          aria-label="Convert a thread"
          className="mt-12 space-y-4 rounded-2xl border border-white/10 bg-palette-elevated p-6 md:p-8"
        >
          <label
            htmlFor="thread-url"
            className="text-xs font-semibold uppercase tracking-wider text-gray-400"
          >
            Thread URL
          </label>
          <div className="relative">
            <Input
              id="thread-url"
              type="url"
              placeholder="https://x.com/username/status/1234567890"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="h-11 border-white/20 bg-transparent pr-10 text-white placeholder:text-gray-500"
            />
            {url && (
              <button
                type="button"
                onClick={() => setUrl('')}
                aria-label="Clear URL"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Paste any X/Twitter thread URL — we’ll extract the full conversation.
          </p>
          <Button
            type="submit"
            variant="green"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Fetching thread…' : 'Create Article'}
          </Button>
        </form>

        {/* Trust markers */}
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-400">
          {perks.map(({ icon: Icon, label }) => (
            <li key={label} className="inline-flex items-center gap-1.5">
              <Icon className="h-4 w-4 shrink-0 text-palette-lime" strokeWidth={2.25} aria-hidden />
              {label}
            </li>
          ))}
        </ul>

        {/* How it works */}
        <h2 className="mt-16 text-center text-2xl font-bold">How it works</h2>
        <ol className="mt-10 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <li key={title} className="relative text-center">
              {/* Hilo que encadena los pasos: sólo donde van en fila, porque en móvil
                  se apilan y una línea horizontal no conectaría nada. */}
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-[calc(50%+1.75rem)] top-7 hidden h-px w-[calc(100%-1.5rem)] bg-gradient-to-r from-palette-lime/50 via-white/10 to-palette-pink/50 md:block"
                />
              )}
              <div className="relative inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-white/[0.08] to-transparent">
                <Icon className="h-6 w-6 text-palette-lime" strokeWidth={1.75} aria-hidden />
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-palette-pink text-[11px] font-bold text-gray-900">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mx-auto mt-1.5 max-w-[16rem] text-sm leading-relaxed text-gray-400">
                {desc}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
