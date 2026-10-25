# Cloudflare Workers (vinext) vs Vercel (Next.js) — performance benchmark

Date: **2026-10-25**

- **Vercel / Next.js**: https://www.wsalas.com
- **Cloudflare / vinext**: https://portfolio-cf.wsalas.workers.dev
- **Tool**: Lighthouse 13.5.0, headless Chrome, `performance` category only
- **Samples**: 3 runs for home-mobile, 2 for home-desktop, 2 for blog-post-mobile, 2 for visor-mobile; medians below
- **Throttling**: Lighthouse mobile default for mobile cases, `desktop-config` for desktop
- **Network**: one machine in Barranquilla, Colombia. This is lab data from one location, not CrUX field data.
- **Cloudflare Images optimizer is enabled** in this revision (see below).

Reproduce with `pnpm bench` (full) or `BENCH_RUNS=1 pnpm bench` (quick). Raw LHR files are written to `benchmark/raw/` (gitignored); medians are in `benchmark/results.json`. The pre-optimizer medians are preserved in `benchmark/results-before-images.json`.

## Medians

| Case | Site | Score | TTFB | FCP | LCP | TBT | CLS | Speed Index | Total KB | Req | Img KB | JS KB | Font KB |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| home-mobile | Vercel | 45 | 91 | 1275 | 5406 | 7143 | 0 | 5942 | 400 | 28 | 58 | 241 | 60 |
| home-mobile | Cloudflare | 43 | 368 | 2180 | 6009 | 7057 | 0 | 5028 | 537 | 39 | 133 | 300 | 60 |
| home-desktop | Vercel | 59 | 93 | 419 | 1422 | 20113 | 0 | 2740 | 388 | 32 | 31 | 243 | 60 |
| home-desktop | Cloudflare | 57.5 | 609 | 548 | 1524 | 19465 | 0 | 3011 | 552 | 41 | 133 | 300 | 60 |
| blog-post-mobile | Vercel | 96 | 104 | 1150 | 2580 | 127 | 0 | 1779 | 446 | 25 | 3 | 336 | 60 |
| blog-post-mobile | Cloudflare | 89.5 | 373 | 1965 | 3419 | 65 | 0 | 2543 | 512 | 36 | 2 | 397 | 60 |
| visor-mobile | Vercel | 91.5 | 104 | 1312 | 3131 | 135 | 0 | 2008 | 471 | 26 | 3 | 321 | 99 |
| visor-mobile | Cloudflare | 88.5 | 169 | 2065 | 3512 | 0 | 0 | 2760 | 520 | 35 | 2 | 366 | 100 |

TBT is the lab proxy for INP. INP itself was not measured; field data would require CrUX/RUM. TTFB on the Cloudflare side varies considerably run-to-run (see the TTFB note).

## Cloudflare Images Free is enough

Cloudflare Images Free includes **5,000 unique transformations per month** for images stored outside Images, such as R2 or `public/`. Only new source + parameter combinations count; repeated requests for the same transformation do not count again. There are no Images storage or delivery charges because the originals stay in R2/public — only transformations apply.

The site has roughly 38 source images. Even at six responsive widths each, that is ~228 unique transformations, comfortably under 5,000. The `IMAGES` binding and `imagesOptimizer()` are wired in `wrangler.jsonc` and `vite.config.ts`.

Concrete effect:

- `/images/profile-img.png` was **578 KB**; the optimized `w=128` variant is **1.9 KB**.
- Home images: **1,633 KB → 133 KB**.
- The remaining `image-delivery-insight` estimate is **87 KiB**, from small project/testimonial thumbnails.

## Before/after the image optimizer

Home, mobile and desktop medians:

| Metric | Vercel | Cloudflare before | Cloudflare after |
|---|---:|---:|---:|
| Home mobile score | 45 | 35 | **43** |
| Home mobile LCP | 5.41 s | 10.72 s | **6.01 s** |
| Home mobile total | 400 KB | 2,041 KB | **537 KB** |
| Home mobile images | 58 KB | 1,633 KB | **133 KB** |
| Home desktop score | 59 | 49.5 | **57.5** |
| Home desktop LCP | 1.42 s | 2.31 s | **1.52 s** |
| Home desktop total | 388 KB | 2,076 KB | **552 KB** |

The image optimizer closed almost the entire home LCP gap. The remaining home gap is mostly main-thread work, not bytes.

## What the numbers say

### 1. Home is now close; the remaining problem is the WebGL hero

Home-mobile is **43 vs 45** and home-desktop **57.5 vs 59**. LCP is 6.0 s vs 5.4 s on mobile and 1.52 s vs 1.42 s on desktop. TBT is 7.1 s vs 7.1 s on mobile and 19.5 s vs 20.1 s on desktop.

The home page is dominated by `FaultyTerminal` WebGL and the animations around it. That is a product/code issue, not a hosting issue. Replacing or deferring it is the next meaningful win on both deployments.

### 2. Dynamic R2 pages pay a TTFB penalty

| Page | Vercel TTFB | Cloudflare TTFB |
|---|---:|---:|
| home | 90–93 ms | 146–370 ms (one desktop outlier at 869 ms) |
| blog post | 91–117 ms | 218–527 ms |
| visor | 96–111 ms | 114–224 ms |

Vercel serves the home and blog from its static/ISR cache (`X-Vercel-Cache: HIT`). Cloudflare renders the R2-backed home/blog/legal routes dynamically (`Cache-Control: private, no-cache, no-store`). The visor is static on both and the TTFB difference is small.

The runtime-R2 tradeoff is real but defensible: content edits are live immediately with no redeploy. If the TTFB needs to match Vercel, add a page-level cache (Workers Cache or KV) or ISR with `revalidateTag("content")` on admin writes.

### 3. Cloudflare still ships more JavaScript

| Page | JS Vercel | JS Cloudflare | Delta |
|---|---:|---:|---:|
| home | 241 KB | 300 KB | +59 KB |
| blog post | 336 KB | 397 KB | +61 KB |
| visor | 321 KB | 366 KB | +45 KB |

This is now a larger relative gap than images. It is worth investigating Vite chunking, React 19, Unpic, and package imports, but it is secondary to the home WebGL work.

### 4. Fonts and CLS are fine

Fonts are 60–100 KB on both, essentially equal except the visor's 99 vs 100 KB. CLS is **0** on every case for both deployments.

### 5. Blog and visor remain healthy

- Blog: **89.5 vs 96**. TBT is better on Cloudflare (65 ms vs 127 ms); the score gap is LCP/TTFB variance.
- Visor: **88.5 vs 91.5**. TBT is 0 ms vs 135 ms; LCP is 3.51 s vs 3.13 s.

The small sample means one cold run can move these medians several points. The pre-optimizer blog run, for example, was 92.5.

## Recommendations, in order

1. **Replace or defer `FaultyTerminal`.** A static poster or a short looping video (WebM/AV1 + MP4 fallback) with a poster, `preload="none"`, `playsinline`, `prefers-reduced-motion`, and mobile fallback would remove the WebGL main-thread cost. Do not use a GIF: it is large and still decodes on the main thread. A static poster is the cheapest and likely enough; add motion only if the visual needs it.
2. **Clean up the remaining 87 KiB of image waste.** The biggest offenders are now small project/testimonial thumbnails. Check the widths generated by the `srcset` for those slots; they are minor.
3. **Cache the R2-backed pages.** Workers Cache/KV page caching or ISR, invalidated by `revalidateTag("content")`, would bring TTFB closer to Vercel's ~90 ms.
4. **Trim the JS delta.** Investigate the 45–61 KB difference after the hero work; use bundle analysis and consider lazy-loading below-the-fold sections.
5. **Visor LCP.** 3.51 s vs 3.13 s; TBT is already better. Preload the chart chunk or reduce the initial bundle.

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

After enabling Cloudflare Images Free, the Cloudflare/vinext copy is **within 1.5–2 Lighthouse points of Vercel on the home page** and remains competitive on the blog and visor. The migration costs are now:

- **Dynamic R2 TTFB**: typically 150–370 ms vs Vercel's ~90 ms, with occasional cold outliers.
- **JS payload**: 45–61 KB heavier.
- **Home WebGL**: the dominant TBT/LCP issue on both hosts, not a hosting difference.

Image optimization was the biggest regression and is now largely fixed for free. The next highest-leverage change is the hero animation, followed by page caching for the R2 routes.
