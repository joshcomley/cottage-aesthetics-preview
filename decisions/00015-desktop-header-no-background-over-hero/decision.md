# Decision: scope a dark overlay to `header:has(~ .hero)` instead of a blanket header background

## Symptom

Reported by the owner from a desktop screenshot: the fixed top header (logo + nav links +
Book Now) sitting over the home page's photo hero is hard to read wherever the photo behind
it is light (the plaster wall, the roman blind, the window) — the logo and nav-link text
have no backing panel, only a `text-shadow`.

## Root cause

`header{...}` (site.css) carries no `background` at all. A background is only added by
`header.scrolled{background:rgba(241,232,217,.92);...}`, toggled by `site.js` once
`window.scrollY > 60`. Before that scroll threshold, the only legibility aid is
`header:not(.scrolled) ...{text-shadow:0 1px 9px rgba(18,12,8,.6)}` — not enough contrast
against the lighter regions of a photographic background.

This is **not** actually gated by any desktop-only media query (the repo has no `min-width`
breakpoints at all) — confirmed by screenshotting the unfixed site at 390px: the brand
wordmark is just as washed out there, over the same light window/wall area. It reads as a
desktop-only bug only because six nav links + Book Now spread a much wider strip of unbacked
text across the photo than the mobile view's brand + hamburger icon do.

## What was decided

Added one rule:

```css
header:has(~ .hero):not(.scrolled):not(.menu-open){background:rgba(18,12,9,.64)}
```

placed immediately after `header.scrolled{...}`. The color is the **exact** `rgba(18,12,9,.64)`
already used by `.hero-band` — so the header reads as a continuation of the same overlay the
hero itself uses below it, per the owner's own framing of the ask ("same kind of background
as the main section").

Two deliberate narrowing choices, both load-bearing:

1. **`:has(~ .hero)`, not a blanket `header:not(.scrolled)`.** Inner pages (About, Treatments,
   FAQ, ...) use `.page-hero{background:var(--mocha)}` — a solid `#5E4635` — and the header
   already sits on it with zero contrast problem (confirmed by screenshot, byte-for-byte
   unchanged before/after this fix). Alpha-blending `rgba(18,12,9,.64)` over that solid mocha
   computes to roughly `rgb(45,33,25)` — visibly darker than the mocha immediately below the
   header — which would have painted a new horizontal seam across every inner page that
   doesn't have this bug today. `:has()` ties the rule to the actual condition (a photo hero
   behind it) instead of a page-naming convention (`data-page="home"`) that a future
   photo-hero page could silently fall outside of.
2. **`:not(.menu-open)`.** Without it, the new rule's specificity (`header` + two
   pseudo-classes) outranks the pre-existing `header.menu-open{background:var(--cream)}`
   (`header` + one class) even though `.menu-open`'s rule comes later in source order —
   equal-looking rules, unequal specificity. That let the dark overlay win while the mobile
   hamburger dropdown was open on the (unscrolled) home page, leaving the header row's own
   logo + hamburger icon rendering dark-mocha-on-near-black instead of the intended
   dark-mocha-on-cream (the dropdown list itself was fine — `.mobile-menu{background:
   var(--cream)}` is a separate selector, unaffected). Caught by screenshotting the actual
   interaction, not by reading the cascade — three conditions deep, the specificity math
   isn't obvious from the selector text alone.

## Verification

Playwright screenshots, built via the wixy builder (`python -m builder build`), before/after:

- `index.html` desktop (1560px) and mobile (390px), unscrolled — logo + nav now read clearly
  against the same photo that made them unreadable before.
- `about.html` desktop, unscrolled — pixel-identical before/after (no inner-page regression).
- `index.html` mobile, hamburger menu open — cream backdrop + dark text restored once
  `:not(.menu-open)` was added; the first pass (without it) was visibly broken
  (dark-on-dark).

`python -m builder validate` — clean.

`python -m builder parity` (non-strict, run locally on Windows) reports exactly one **hard**,
cross-platform failure: `index/styles` — `header#hd`'s computed `background-color` differs
from the committed baseline. That's the intended, expected consequence of this fix (an
`rgba(0,0,0,0)` → `rgba(18,12,9,.64)` change), not a regression. The accompanying screenshot
diffs are advisory-only on this platform per this repo's own platform policy (font
rasterization differs enough between Windows and the pinned `ubuntu-latest` CI runner to
blow the 1% budget on totally unrelated, unchanged pages too) — real screenshot parity is
judged only by the wixy repo's `capture-baseline.yml` job on `ubuntu-latest`, run as a
companion PR against this branch per spec/03-site-migration.md §5 point 3.

## What to watch for

The header now has three visually distinct resting states — default-over-photo-hero,
scrolled, and mobile-menu-open — that don't nest as cleanly as the existing rules' plain
`:not(.scrolled)` pattern suggests once a new rule's specificity is high enough to matter.
Any future `header`-level rule meant only for the true default state (not scrolled, not
menu-open) needs the same `:not(.scrolled):not(.menu-open)` pair — and `:has(~ .hero)` too,
if it's meant to be specific to the photo hero rather than every page.
