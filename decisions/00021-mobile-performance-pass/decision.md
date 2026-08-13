# Decision: Brief WP4's site-repo pieces (4A/4C/4E) — mobile performance pass

## Symptom

The 2026-08-12 search-indexing audit's measured mobile Lighthouse baseline (Brief Work
package 4, `docs/search-indexing-implementation-brief.md` in the wixy repo): homepage
Performance 66, FCP 3.2s, LCP 9.6–9.8s, 1.531 MiB transfer; gallery Performance 77, LCP 4.6s,
13.558 MiB / 114 requests. Named root causes: `.reveal{opacity:0;...}` delays the H1 behind
an `IntersectionObserver`, and gallery images (~106 of them) had no `loading`/`decoding`
hints and were transferred eagerly regardless of scroll position. 4B (intrinsic image
dimensions) and 4D (image-byte reduction) are engine-side/evidence-gated respectively and
explicitly out of scope for this PR.

## What was decided — 4A (primary text independent of animation)

`.reveal`'s default state flipped from hidden to **visible** (`site.css`): a new
`.reveal-pending` class carries the old hidden-then-fade-in treatment, and only `site.js`
adds it — only to an element it has confirmed, via `getBoundingClientRect()` at
`DOMContentLoaded`, is **not currently in the viewport**. Above-the-fold content (the
homepage hero, including the H1) is therefore never touched by the animation system at all:
no JS, a JS error before this code runs, `prefers-reduced-motion`, or a slow/absent
`IntersectionObserver` all leave it at its default visible state, because none of those
failure modes can ever ADD a hiding class — there's nothing to fail out of. A CSS
`@media (prefers-reduced-motion: reduce)` rule is a second, independent safety net (the JS
already checks `matchMedia` before touching anything, but the CSS guard means even a future
JS bug can't reintroduce the bug), and `.reveal-pending:focus`/`:focus-within` guarantees
keyboard focus can never land on invisible content mid-transition.

Verified, not assumed: a Playwright test suite (17 checks, all passing) covers no-JS
(`java_script_enabled=False`), `reduced_motion="reduce"` (zero elements left pending or
invisible on either page), motion-on (H1 opacity is `1` at `DOMContentLoaded`, the hero
wrapper never gets `reveal-pending`, at least one genuinely below-fold element does — proving
the mechanism still animates something), and 60 sequential `Tab` presses with no focus stop
ever landing on `opacity < 1`.

## What was decided — 4C (stop eager gallery transfer)

`loading="lazy" decoding="async"` added to the before/after slider images
(`.bas-after`/`.bas-before`, `pages/gallery.html`) — previously eager. Gallery tiles already
had `loading="lazy"`; `decoding="async"` was added there too.

**The brief's own carve-out ("do not lazy-load the true LCP image") was checked against
measurement, not assumption**, using Lighthouse's `lcp-breakdown-insight` audit (a newer
Lighthouse-13 audit; the classic `largest-contentful-paint-element` audit no longer exists in
this installed version) against both pages: the homepage's LCP element is
`.hero-band .wrap.reveal p.tag` (text); the gallery page's is `p.ba-note` (text, the
consent/permission note above the filter bar). Neither page has an above-fold image as its
LCP candidate, so lazy-loading was applied uniformly to every slider/tile — no first-item
carve-out was needed (and the `data-wx-list` templating has no per-index conditional to
express one with anyway).

Re-verified after the change, with the same rigor: dragging a slider still updates the
clip-path correctly once scrolled into view (after letting the page's own unrelated "nudge"
auto-demo animation — `site.js`'s per-slider `IntersectionObserver`, untouched by this PR —
finish first), a filter change reveals the right slider/tile items and their now-lazy image
has actually loaded, and the lightbox opens with a real `src` on a lazily-loaded tile.

## What was decided — 4E (fonts, measured before changing)

`theme/theme.json`: `serif` (Cormorant Garamond) weights `["400","500","600"]` →
`["400","500"]`; `sans` (Jost) weights `["300","400","500"]` → `["300","400"]`. `script`
(Pinyon Script, single weight) untouched. This is the only file that needed changing — the
Google Fonts `<link>` in every `pages/*.html` is regenerated from `theme.json` by
`builder/templates.py` at build time (`generate_fonts_url` → `_find_fonts_link(...).href =
fonts_url`) and must never be hand-edited (confirmed by reading that code path, not just
trusting this repo's own `CLAUDE.md` claim that it works this way).

**"Provable" was established two independent ways, cross-checked against each other:**
1. A live computed-style probe (Playwright, all 9 pages, every text-bearing element plus
   `button`/`input[type=range]`/`summary`) recording every actually-rendered
   `(fontFamily, fontWeight, fontStyle)` triple.
2. An exhaustive `grep` of every `font-weight`/`font:` shorthand declaration across
   `site.css` and every page's inline `<style>` block (7 total declarations, all found).

Both agreed: nothing anywhere requests weight 600 (Cormorant Garamond, either style) or
weight 500 (Jost). Italics were kept — `.hero .tag`, `.brand .b1`, and `.quoteband .bigq` all
set `font-style: italic` explicitly and are visually prominent (the hero tagline, the header
wordmark, a pull-quote); removing the italic axis would force faux/oblique synthesis from the
upright face, a real design regression, not a safe trim. (Removing weight 600 has the
schema-forced side effect of also not requesting "500 italic" independently — `theme.json`
ties `italics` to the whole weight list, not per-weight — but nothing computes to weight 500
italic either, so this cost nothing real.)

**Honest result, not overclaimed:** measured actual network bytes before/after (Lighthouse,
both pages) — **zero byte difference**. Google Fonts subsets `.woff2` files per weight/script
already; a browser only ever fetches the specific weight files a page's rendered text
actually needs, regardless of how many extra weights the stylesheet's `@font-face` block
declares. The real benefit is a font contract that no longer claims weights nothing uses —
not a measured transfer reduction on these two pages. Self-hosting was considered and
deliberately left out of scope, per the brief's own explicit caution ("do not trade a 2s
render delay for an undocumented font-maintenance burden") and the same instruction repeated
in this work package's dispatch — licensing/subsetting/update-ownership/cache-policy were not
separately investigated, so it stays out of scope rather than being implemented on an unclean
basis.

## Verification methodology (the numbers below, and why they can be trusted)

Lighthouse's `--throttling-method=simulate` (the CLI default) produced **wildly unstable**
homepage LCP readings against my local dev server — anywhere from 1.6s to 10s across
consecutive runs on an otherwise-unchanged page. Rather than average away the noise or pick
the flattering runs, this was root-caused before any number was trusted:

1. A ground-truth check — the browser's own `PerformanceObserver` for
   `largest-contentful-paint` entries, read directly via Playwright with **no** Lighthouse
   throttling involved — showed the homepage's real LCP element rendering at a **consistent
   148–220ms** across 5 fresh page loads. The fix works; the instability was in the
   measurement, not the page.
2. Switching to `--throttling-method=devtools` (real applied throttling, not a post-hoc
   simulation from a captured trace) produced tight, consistent readings (±0.1s across 3
   runs) that were also consistent with the ground-truth check's magnitude once scaled by
   realistic mobile network/CPU throttling. All numbers below use devtools throttling.
3. A cold local dev-server's first request is itself measurably slower than every request
   after it (confirmed directly: an explicit warm-up before measuring changed nothing further
   once the server was already warm) — every run below was taken only after warming the
   target server first.
4. The "before" baseline was rebuilt from `origin/main`'s actual committed files (`git show
   origin/main:site.css` etc., not just "undo my edits") and measured under the identical
   methodology, so the comparison is apples-to-apples. Absolute values are **not** comparable
   to the brief's own baseline table, which measured the live public origin over a real
   network — this repo's numbers are a same-methodology, same-machine A/B comparison, useful
   for isolating this PR's effect, not a substitute for a real post-publish measurement.

## Measured results (mobile, devtools throttling, median of 3)

| Page | Metric | Before | After |
|---|---:|---:|---:|
| Home | LCP | 3.07s | **2.37s** |
| Home | Transfer | 1.518 MiB | 1.520 MiB |
| Home | CLS | 0.000 | 0.000 |
| Gallery | LCP | 3.16s | **2.01s** |
| Gallery | Transfer | 7.909 MiB | **2.295 MiB** |
| Gallery | CLS | 0.001 | 0.001 |

Against the brief's acceptance criteria: homepage LCP is under both the 4.0s target and the
2.5s stretch target; gallery transfer is under the 2.5MiB target (a 71% reduction) and CLS is
unaffected (well under 0.1) on both pages. Homepage transfer does **not** meet the <1.0 MiB
target — see the next section, which is the brief's own documented-exception path for exactly
this case.

## Homepage transfer >1.0 MiB — documented, not silently missed

1.500 MiB across 10 resources; **90% of it is five unoptimized photos**, all pre-existing and
untouched by this PR: `f4ad5776-img-3350.jpg` (503.5 KiB), `d1fdb284-…fedb436.jpg` (313.2
KiB), `exterior.jpg` (216.2 KiB), `lounge.jpg` (207.5 KiB), `purdi.jpg` (149.5 KiB). The
remaining ~10% is the four font files (128.7 KiB, unaffected by 4E per above) and the HTML
document itself (17.4 KiB). This matches the brief's own baseline audit almost exactly ("about
1.13 MiB of avoidable image transfer") — reducing it is explicitly 4D's job (dimension-aware
responsive derivatives / re-encoding), explicitly out of scope for this PR, and evidence-gated
on its own inventory-and-ranking pass that hasn't happened yet.

## CI/parity: one real, engine-side finding — reported, not routed around

Running this repo's own parity check locally (`python -m builder parity`, matching `ci.yml`
exactly) surfaced two categories of failure, investigated separately rather than assumed to be
either "fine" or "my bug":

- **Screenshot percentage diffs on every page (1.9–4.3%, two pages "100%")** — confirmed to be
  cross-platform font-rasterization noise, not a real regression: re-running the identical
  check without `--strict-screenshots` turns every one of them `[advisory]`, and this repo's
  own `docs/ai/testing.md`-referenced convention (already noted in prior decisions, e.g.
  00005) is explicit that strict pixel-diffing is only meaningful on the pinned CI platform
  (`ubuntu-latest`) — this machine is Windows. The two "100%" mobile diffs are a **hard-fail
  quirk, not a magnitude claim**: `compare.py`'s `pixel_diff_ratio` returns `1.0` outright on
  ANY dimension mismatch before attempting a pixel comparison, and my capture was 24px
  shorter than the committed baseline (9203 vs 9227px) — itself plausibly more of the same
  cross-platform text-metric drift over a ~9200px page. A before/after comparison on this same
  machine (same Chrome, same platform) produced **byte-identical page heights**, which rules
  out this PR's own code as the source of that 24px gap.
- **`gallery/images: image set differs` (missing/extra with `(0, 0)` dimensions) — genuinely
  real, and traced to its exact mechanism, not left as a mystery.** The parity harness's
  `capture_page` (`builder/tests/parity/capture.py`) reads `naturalWidth`/`naturalHeight` via
  `page.eval_on_selector_all` right after `goto` + a fixed 300ms settle — it never scrolls, so
  a correctly-lazy image below the fold has never been asked to load and reports `(0, 0)`.
  This is not limited to the metadata check: even `capture_screenshot`'s `full_page=True`
  capture — which does force Chromium to render the whole scrollable height — raced the same
  problem on the gallery page specifically (confirmed directly: later slider rows render as
  blank placeholder boxes in the "after" screenshot where "before" shows real photos; a
  manual scroll-through with per-step waits still left roughly half of the page's ~106 images
  incomplete, because draining that many lazy fetches through a handful of concurrent
  connections genuinely takes longer than either capture step gives it — not a rendering bug,
  a timing one). A real user scrolling at a normal pace does not hit this — confirmed by this
  entry's own 4C interaction tests above, which used a realistic scroll-and-settle sequence
  and found every image loaded correctly.

**This is a genuine wixy-engine gap** (the capture harness has no "wait for all images, or
force them eager, before measuring" step, needed now that a page can legitimately have both
many images and correct lazy-loading), not something fixable from this repo, and not something
this PR's own diff can be blamed for causing incorrectly — the underlying markup change is
exactly what Brief WP4 4C asked for. Per this work package's own boundary, this was reported
rather than patched — this repo's `CLAUDE.md` forbids editing the wixy engine repo directly.
This PR was opened anyway (the same established pattern as decisions/00019/00020): its own
diff is independently verified correct above; a real CI run confirms or refines this analysis
with authoritative, pinned-platform evidence before anything gets reported further.

## What to watch for

- If a future PR adds MORE `.reveal`-classed content, the visible-by-default contract holds
  automatically — nothing about this mechanism is homepage- or hero-specific, it's a general
  site.css/site.js change.
- The homepage's five heavy photos remain the dominant lever for hitting the <1.0 MiB
  homepage-transfer target — that's 4D, not this PR, and needs its own bytes-avoidable ranking
  first (explicitly not done here).
- `capture.py`'s image-loading gap will resurface for ANY future page that legitimately mixes
  many images with correct lazy-loading — worth fixing at the engine level once picked up,
  rather than re-diagnosed from scratch next time.
- The font-weight trim's real payoff (a shorter, honest `@font-face` contract) doesn't show up
  in a bytes graph — don't be surprised if a future measurement pass finds "no difference" and
  concludes it did nothing; the actual value is documented above.
