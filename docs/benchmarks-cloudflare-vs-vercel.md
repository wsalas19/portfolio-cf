# Cloudflare Workers (vinext) vs Vercel (Next.js) — performance benchmark

Date: **2026-10-24**

- **Vercel / Next.js**: https://www.wsalas.com
- **Cloudflare / vinext**: https://portfolio-cf.wsalas.workers.dev
- **Tool**: Lighthouse 13.5.0, headless Chrome, `performance` category only
- **Samples**: 3 runs for home-mobile, 2 for home-desktop, 2 for blog-post-mobile, 2 for visor-mobile; medians below
- **Throttling**: Lighthouse mobile default for mobile cases, `desktop-config` for desktop
- **Network**: one machine in Barranquilla, Colombia. This is lab data from one location, not CrUX field data.

Reproduce with `pnpm bench` (full) or `BENCH_RUNS=1 pnpm bench` (quick). Raw LHR files are written to `benchmark/raw/` (gitignored); medians are in `benchmark/results.json`.

## Medians

| Case | Site | Score | TTFB | FCP | LCP | TBT | CLS | Speed Index | Total KB | Req | Img KB | JS KB | Font KB |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| home-mobile | Vercel | 40 | 88 | 1812 | 6146 | 7363 | 0 | 7024 | 400 | 28 | 58 | 241 | 60 |
| home-mobile | Cloudflare | 35 | 178 | 2336 | 10722 | 6613 | 0 | 7316 | 2041 | 47 | 1633 | 300 | 60 |
| home-desktop | Vercel | 58 | 91 | 430 | 1472 | 20003 | 0 | 3045 | 388 | 32 | 31 | 243 | 60 |
| home-desktop | Cloudflare | 49.5 | 336 | 584 | 2307 | 19809 | 0 | 3855 | 2076 | 49.5 | 1633 | 300 | 80 |
| blog-post-mobile | Vercel | 96 | 87 | 1211 | 2277 | 147 | 0 | 1979 | 446 | 25 | 3 | 336 | 60 |
| blog-post-mobile | Cloudflare | 92.5 | 181 | 1742 | 3080 | 79 | 0 | 2836 | 554 | 38 | 3 | 397 | 100 |
| visor-mobile | Vercel | 91 | 88 | 1258 | 3434 | 45 | 0 | 2492 | 471 | 26 | 3 | 321 | 99 |
| visor-mobile | Cloudflare | 83.5 | 116 | 2391 | 4153 | 0 | 0 | 2786 | 522 | 36 | 3 | 366 | 100 |

TBT is the lab proxy for INP. INP itself was not measured; field data would require CrUX/RUM.

## What the numbers say

### 1. The home page is slow on both, for the same reason

Home-mobile scores **40 (Vercel)** and **35 (Cloudflare)**. TBT is 6.6–7.4 s on mobile and ~20 s on desktop on both deployments. The cause is the home page itself — `FaultyTerminal` WebGL, animations, and the long main-thread work behind them — not the host. The CF/Vercel gap on home is 5–8.5 score points, but both are far from a good Lighthouse score.

Fixing the home page (deferring/lazy-loading the WebGL terminal, reducing animation work, splitting the hero) would improve both numbers more than any hosting change.

### 2. Image delivery is the main Cloudflare regression

Cloudflare home ships **1,633 KB of images**; Vercel ships **58 KB** for the same page. The Lighthouse `image-delivery-insight` estimates **1,560 KiB** of savings on the CF build:

| Image | Transferred | Displayed at | Waste |
|---|---:|---|---:|
| `/images/profile-img.png` | 565 KB | 98×98 | 563 KB |
| `/images/frieda-player.png` | 393 KB | 186×98 | 390 KB |
| Barranquilla Verde cover (`.webp`) | 328 KB | 727×413 | 282 KB |
| Doctor Portal screenshot | 149 KB | 180×98 | 147 KB |
| Invoify screenshot | 81 KB | 196×98 | 78 KB |
| Visor screenshot | 58 KB | 211×98 | 54 KB |
| Twitter Threads screenshot | 50 KB | 217×98 | 46 KB |

Vercel's `next/image` resizes/compresses at request time. Under vinext, local images are served through `/_next/image` as a **302 redirect to the original file**, so the browser downloads the full-size asset. Unpic does not resize local/R2 images without a transforming CDN.

This alone explains most of the home LCP gap: **10.7 s vs 6.1 s on mobile**, and it adds 19 extra requests.

### 3. R2-backed pages pay a TTFB penalty

| Page | Vercel TTFB | Cloudflare TTFB | Why |
|---|---:|---:|---|
| home | 88 ms | 178 ms | CF is dynamic (R2 content), Vercel is static `X-Vercel-Cache: HIT` |
| home desktop | 91 ms | 336 ms | same, more HTML/JS work |
| blog post | 87 ms | 181 ms | CF is dynamic (R2), Vercel is SSG |
| visor | 88 ms | 116 ms | both static; CF Worker/edge overhead |

The blog post still lands at **92.5 vs 96** and the visor at **83.5 vs 91**, so the runtime R2 choice has a measurable but not catastrophic cost. The blog TBT is actually better on CF (79 ms vs 147 ms), and the visor TBT is 0 ms vs 45 ms.

If TTFB needs to match Vercel, add a page-level cache for the R2-backed routes (Workers Cache or KV, with `revalidateTag` on admin writes) or move those pages back to build-time/ISR.

### 4. Cloudflare ships more JavaScript and fonts

| Page | JS Vercel | JS Cloudflare | Delta |
|---|---:|---:|---:|
| home | 241 KB | 300 KB | +59 KB |
| blog post | 336 KB | 397 KB | +61 KB |
| visor | 321 KB | 366 KB | +45 KB |

Fonts are also larger on CF for the blog/visor (100 KB vs 60/99 KB), likely because of font file/subset differences. The JS gap is 15–20%; it is secondary to the image gap but worth investigating (Vite chunking, React 19, Unpic, package imports).

### 5. CLS is already perfect

CLS is **0** on every case for both deployments. No layout-shift work is needed.

## Recommendations, in order

1. **Optimize the home images.** The profile avatar is 565 KB for a 98×98 slot. Pre-generate WebP/AVIF at display sizes (or use Cloudflare Images/Polish/Image Resizing) and serve a real `srcset`. This is worth ~1.5 MB and is the single biggest win. No `sharp` required if you use Cloudflare Images or a pre-sized asset pipeline.
2. **Fix the home main thread.** Defer/lazy-load `FaultyTerminal` and reduce animation work. TBT is 6.6–20 s on both hosts; this is the reason the home score is 35–58 despite a clean CLS.
3. **Cache the R2-backed pages.** Add Workers Cache/KV page caching or ISR for `/`, `/es`, `/blog`, `/blog/[slug]`, `/privacidad`, `/terminos`; invalidate on admin writes with `revalidateTag`. Target: ~100 ms TTFB like Vercel.
4. **Trim JS and fonts.** Investigate the 45–61 KB JS delta and the 40 KB font delta; preload the critical font and subset to the weights actually used.
5. **Visor LCP.** CF visor is 4.15 s vs 3.43 s. The TBT is already better; the LCP difference is likely JS/font/load order. Preload the chart chunk or reduce the initial bundle.

## Build and deploy pipeline (Cloudflare)

From the successful Workers Builds run `3eac93f3`:

| Phase | Time |
|---|---:|
| Initialize environment | 19.8 s |
| Clone repository | 1.8 s |
| Install tools/dependencies | 19.6 s |
| Build | 15.1 s |
| Deploy | 14.5 s |
| **Total** | **~71 s** |

The manual deploy reported **17 ms Worker startup time**. Vercel's remote build time was not instrumented, so this report does not compare build pipelines beyond the Cloudflare side.

## Bottom line

For the **blog and tool pages**, the Cloudflare/vinext copy is competitive: 92.5 vs 96 on the blog, 83.5 vs 91 on the visor, better TBT on both, and the same perfect CLS. The migration cost shows up in two places: **image delivery (1.6 MB vs 58 KB on home)** and **dynamic R2 TTFB (178–336 ms vs 88–91 ms)**. Both are fixable without abandoning the runtime-R2 architecture.

The home page is poor on both hosts. Its WebGL/animation workload is a product performance issue, not a hosting issue, and should be fixed before using the home Lighthouse score as a hosting verdict.
