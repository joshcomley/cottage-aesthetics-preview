# Decision: resize 4 oversized homepage/about images, evidence-first (Brief WP4-4D)

## Symptom

Brief Work package 4, section 4D (`docs/search-indexing-implementation-brief.md`, wixy repo)
calls for inventorying rendered vs. source image dimensions and ranking by avoidable bytes,
preferring responsive derivatives over blanket quality reduction, and reconsidering quality
defaults only with visual evidence. The wixy-engine-repo session (implementation lead for this
programme) did the inventory: built this site's `main`, visited all 13 pages at desktop
(1280px) and mobile (390px) viewports with Playwright, and recorded `naturalWidth/Height` vs.
`getBoundingClientRect()` for every `<img>`, cross-referenced against on-disk byte size.

## What was decided

**Only 4 images are resized. Nothing else is touched, on the evidence available.**

A first inventory pass flagged ~9.7 MiB as "avoidable" across 111 images, but two classes were
false positives, caught before any file was touched:
- **Gallery before/after images**: `pages/gallery.html`'s lightbox
  (`.lightbox img{max-width:94vw;max-height:90vh}`, confirmed by direct grep) shows these at
  near-full-viewport size, with a `.lightbox img.zoomed{transform:scale(2)}` 2x-zoom feature on
  top (also confirmed) — a DOM-only, no-interaction probe never opens the lightbox, so every
  gallery image was flagged from its (small) grid-tile size alone. These are excluded entirely.
- **`images/lounge.jpg`**: used as a small grid tile in `about.json`'s `cottage.img2` (confirmed
  — `content/about.json` line 24), but *also* as `content/index.json`'s `hero.bg` (confirmed —
  line 45), a full-viewport CSS background via `data-wx-bg` (`pages/index.html` line 20,
  `<section class="hero" ... data-wx-bg="hero.bg">`) — invisible to a DOM `<img>` probe. Its
  small-teaser use is not evidence it can be shrunk; its hero use was never measured. Excluded
  until that's measured properly (a follow-up, not this PR — see "What to watch for").

The remaining, evidence-backed finding converges with the brief's own WP0 Lighthouse estimate
(~1.13 MiB avoidable image transfer on the homepage) — cross-validation that this measurement
is right.

**The 4 images actually resized**, all `object-fit:cover` inside `.gal` (`site.css`:
`grid-auto-rows:150px`, `.gal img:first-child{grid-row:span 2}` — confirmed by direct grep,
independently re-derived to explain the exact box sizes below rather than taken on trust), used
only in `content/index.json`'s and/or `content/about.json`'s `cottage` sections (confirmed via
direct grep of both files — no other content-JSON references either. Both files' `cottage`
sections were checked, not just the one the dispatch quoted):

| File | Used by (content key) | Source → Target | Bytes before → after |
|---|---|---|---|
| `f4ad5776-img-3350.jpg` | `index.json` `cottage.img2` | 1500×2000 → 570×760 | 515,381 → 84,399 B |
| `d1fdb284-c5630fce-b3e8-4a49-9411-81908fedb436.jpg` | `index.json` `cottage.img1` | 1536×1152 → 918×689 | 320,494 → 132,398 B |
| `exterior.jpg` | `index.json` `cottage.img3` + `about.json` `cottage.img3` | 907×1280 → 570×804 | 221,176 → 100,199 B |
| `room.jpg` | `about.json` `cottage.img1` | 1280×960 → 918×689 | 200,357 → 125,256 B |

**Total: 1,257,408 → 442,252 bytes — 815,156 B (796.0 KiB / 0.777 MiB) removed, a 64.8%
reduction on these 4 files.** (The dispatch estimated "roughly 1.0-1.1 MiB"; the precisely
measured result is smaller. Reporting the real number rather than the estimate.)

**Target-size math, independently re-derived, not just trusted**: each target preserves the
*source's* aspect ratio exactly (a resize can't change aspect ratio without cropping pixels,
which none of these need — `object-fit:cover` in CSS does the crop at render time). For each
image, the minimum 1x source size needed to cover its box under `cover` scaling is
`max(box_w/src_w, box_h/src_h)` applied to the source's own dimensions; the target is that
minimum at 2x DPR plus ~10% margin. Verified by recomputing all 4 independently: every target
matches the dispatched figures, and every target's aspect ratio matches its source's to within
rounding.

**Method**: Pillow, `Image.LANCZOS` resampling, `ImageOps.exif_transpose` applied before
resizing (no-op here — none of the 4 source files carried EXIF orientation, confirmed directly
— but kept as a defensive default), saved as JPEG quality 85 (matching this repo's existing
upload convention — not a defaults change, just applying the existing default to correctly-sized
derivatives). Same filenames, replaced in place in `images/` — every `content/*.json` reference
stays valid; no template or content change was needed for this PR at all.

## Verification

- `python -m builder validate` / `build`: clean, both before and after the resize.
- **Visual comparison at real rendered size**, per the brief's "preserve visual quality"
  requirement: built the site twice (before/after), served both, and screenshotted the actual
  `.cottage .gal` grids on `index.html` and `about.html` plus `index.html`'s `.hero` section, at
  both viewports (6 pairs). The `.hero` pair (uses untouched `lounge.jpg`) is byte-for-byte
  identical (0.000 mean pixel diff) — confirms nothing else regressed. The 4 grid pairs show a
  small diff (mean ~2.7-4.0/255, ~7-12% of pixels differing by >10/255 in some channel) fully
  consistent with ordinary JPEG-requantization/resampling noise, not a content or framing
  change — confirmed both by this pixel-diff metric and by direct visual inspection of
  side-by-side before/after composites: no perceptible quality loss at actual display size.
- (A citation in the dispatch — "decisions/00013's own precedent for 'don't silently recompress
  irreplaceable originals'" — doesn't check out: this repo's `decisions/00013` is actually about
  the GitHub Pages deploy workflow, unrelated. Doing the visual comparison anyway, on the
  brief's own explicit requirement, not on that citation.)

## What to watch for

- **Local `parity` is NOT clean — this is expected, but for a different reason than WP5's text/
  link drift, worth naming precisely.** `python -m builder parity` reports 2 real failures:
  `index/images` and `about/images`, both "image set differs" — the harness fingerprints each
  `<img>`'s *(url, width, height)* tuple, and 3-4 of these URLs now report different pixel
  dimensions than the committed baseline recorded (same filenames, so `build`/`validate` are
  unaffected, but the dimension fingerprint differs). This is a **new failure mode** for this
  repo's decisions/00008 "two-step baseline" precedent: WP5 hit it via *text/link* content
  drift; this PR hits it via *pixel-dimension* drift from an in-place asset resize — same root
  cause (baseline predates a real, intentional change on this branch), different trigger. The
  dispatch predicted parity would already be clean ("pure asset swap, no text/link/behaviour
  change"); that prediction was reasonable but wrong — dimension changes count as a behaviour
  change to this harness even when no template or content JSON changes. Screenshot diffs are
  advisory-only (as expected) and include the usual local Windows cross-platform noise on pages
  this PR never touched (e.g. `treatments/screenshot mobile: 100%`, `treatments.html` untouched
  by this PR) — already-diagnosed noise from WP4's investigation, not new.
- Flagged to the peer (wixy-engine-repo session) before any rebaseline, per their explicit
  instruction on this package. Expected resolution matches WP5's: a `capture-baseline.yml` run
  against this PR's branch, a wixy-repo action outside this repo's scope.
- **Real CI (PR #47, run 31674399498) confirmed the same root cause but a wider blast radius
  than the local prediction above**: `--strict-screenshots` (real CI only, not run locally —
  see "Environment" precedent from WP5) promotes the screenshot diff from advisory to a hard
  failure, so real CI shows **5** failures, not 2: `index/images`, `index/screenshot` desktop
  (1.60%) and mobile (2.31%), `about/images`, `about/screenshot` desktop (2.34%) — all against
  the same 1% budget, all the same underlying cause (baseline predates this PR's real pixel
  changes). Not a new/different bug; a fuller manifestation of the one already diagnosed.
- **`lounge.jpg` and the gallery before/after images remain unmeasured, not confirmed-optimal.**
  The brief explicitly allows documenting remaining named assets for a follow-up rather than
  blocking on measuring everything at once. `lounge.jpg`'s hero-background use needs a
  CSS-background-aware measurement (computed `background-size` / viewport coverage), not the
  `<img>`-only probe used here, before any conclusion about its sizing.
- This repo's own `CLAUDE.md` "Images" section still points at wixy's `tooling/downscale_photos.py`
  for downscaling — that tool no longer exists in the wixy repo (removed pre-publication per wixy
  decisions/00054, business-specific). Worth a small fix, flagged but not done in this PR (out of
  scope, not blocking).
