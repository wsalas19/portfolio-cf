# wsalas.com

Personal site for William Salas — full-stack product development and technical
review. The home page sells the service; the blog and the tools are where the
work is shown rather than described.

## Stack

- **Next.js 15** (App Router) · **React 18** · **TypeScript** in `strict` mode
- **Tailwind CSS 3** with a small set of custom utilities in `src/app/globals.css`
  (palette lives in `tailwind.config.ts`)
- **pnpm** as the package manager · Node 20+
- No CMS, no database. Content is Markdown in git — see [Content](#content).

## Routes

| Route | What it is |
|---|---|
| `/` | Landing: hero, stats, selected work, services, experience, blog, FAQ, CTA, contact |
| `/blog` · `/blog/[slug]` | Articles written in Markdown, no CMS |
| `/tools` | Index of the free tools |
| `/twitter-threads` | X/Twitter thread reader (needs `TWTAPI_KEY`) |
| `/visor-credito` | Colombian mortgage simulator — all math runs client-side |
| `/privacidad` · `/terminos` | Legal documents, rendered from `content/legal` |
| `/admin` | Password-protected content panel (see below) |

## Getting started

```bash
pnpm install
cp .env.example .env   # then fill it in
pnpm dev               # http://localhost:3000
```

Every environment variable is declared and validated in `src/lib/env.ts` — that
file is the source of truth, not this README. All of them are optional: without
`RESEND_*` the contact form fails to send, without the admin variables `/admin`
fails closed, and the rest of the site still renders.

> **Running a production build:** stop `pnpm dev` first. `next build` and
> `next dev` share `.next`, and building while the dev server is up fails with a
> `PageNotFoundError` naming routes that are perfectly fine. It is cache
> corruption, not a code defect.

## Content

Articles are Markdown files in `content/blog/`, with frontmatter parsed by
`gray-matter`:

```yaml
---
title: "The title"
date: "2026-08-09"
excerpt: "One or two sentences used in the listings."
tags: ["AI", "Developer Tools"]
author: "William Salas"
---
```

Reading time is derived from the word count; posts are sorted by date
descending. The loader lives in `src/lib/blog/posts.ts` and is `server-only`.

**The `/admin` panel** is for editing this content without leaving the browser.
It reads and writes through the **GitHub API**, not the filesystem — on Vercel
the filesystem is a read-only snapshot of the last build. The token stays on the
server (`src/lib/admin/server.ts` is the only module that touches it); sessions
are signed cookies, and writes carry the blob `sha` so a save against a version
that moved returns `409` instead of overwriting it.

## Tests

```bash
node --test tests/admin-auth.test.mjs   # admin auth boundary: password, sessions, path allowlists
npx tsc --noEmit                        # types
pnpm lint                               # eslint
```

The test file is `.mjs` on purpose: it falls outside the `tsconfig.json`
`include`, so it can import the auth module directly without pulling the
`server-only` graph into the type-check.

## Deploy

Vercel, region `iad1` (`vercel.json`). `next build` is the build command;
security headers and the CSP come from `src/middleware.ts`, and the social card
is generated at build time by `src/app/opengraph-image.tsx`, so there is no
`og-image.png` to keep in sync.
