# Decision: fix the gallery rendering permanently blank in production

## Symptom

The operator reported (screenshot, real phone, `ca.cinnamons.uk/gallery.html`) that the page
below the intro text was completely blank — no before/after photos, no category filter
outcome visible. Confirmed it persisted after a hard reload (not a load-timing/connection
blip). Reproduced identically in a headed Playwright session at a matching mobile viewport,
so it wasn't device-specific either.

## Root cause — measured, not assumed

`site.js` (line 29-32) implements a generic scroll-reveal: any element with class `reveal`
starts `opacity:0` (site.css: `.reveal{opacity:0;transform:translateY(24px);...}`) and only
gets `.in` (→ `opacity:1`) once an `IntersectionObserver({threshold:0.12})` reports it
crossing 12% visible.

`pages/gallery.html` applied `reveal` to `#basliders` — the CONTAINER holding every
`gallery.sliders` item — not to each item individually. Measured directly on the live build:
`#basliders`'s rendered height is **17,724px** (52 currently-visible slider pairs). 12% of
that is **2,127px of viewport overlap required** — but the viewport itself is only ~844px
tall on the reported device. No scroll position can ever produce that much overlap: the
element can be AT MOST ~840px inside an 844px viewport at once, an intersection ratio around
4.7%, permanently below the 0.12 threshold. `.in` never gets added; `opacity` stays `0`
forever. The `#bagrid` ("more results" tiles) container has the identical latent defect,
currently unsymptomatic only because `gallery.tiles` is nearly empty right now.

This is why the earlier live-verification (post-#27 publish) didn't catch it: `.ba-slider`
children were checked for DOM presence, correct bounding box, and image load state — all of
which are unaffected by an ancestor's `opacity:0`. Checking child-element geometry without
checking the ancestor's actual paint state (`getComputedStyle(...).opacity` /
`classList.contains('in')`) missed it completely.

**Not introduced by this session's feature work.** `gallery.sliders`' visible-item count grew
from 8 to 52 via the site owner's OWN publishes (v37 through v43, made through the "Show on
site" switch shipped earlier this same day) — this defect was live and broken before the
source-post-link feature's own publish (v44), for however long between whichever publish
first pushed the container's height past the point where 12% became unreachable at real
device viewport heights, and the moment this was reported. A latent defect in the reveal
pattern's design, not a regression from any single change.

## What was decided

Move `reveal` from the two LIST CONTAINERS (`#basliders`, `#bagrid`) to each individual list
ITEM (`.ba-slider`, `.ba-tile`) instead. Every item now fades in independently as it
individually crosses the 12% threshold — a normal, bounded-size element, not an
unboundedly-growing one, so the threshold is always achievable regardless of how many items
Purdi's gallery eventually holds. This is the same pattern already proven at this exact scale
by the PRE-EXISTING per-slider `IntersectionObserver` (`.bas-frame`, threshold 0.55) used for
the "drag hint" nudge animation a few lines below — 52 concurrent observers is not a new
concern in this file.

Verified against a real local build (not just reasoning about the CSS): before the fix, 0/52
sliders ever received `.in` across a full scroll-through. After, a realistic (150px-step)
scroll-through reveals 52/52. A coarse synthetic scroll (675px jumps, roughly 2.5x a single
item's height) occasionally missed 1/52 — confirmed as a test-harness granularity artifact,
not a real defect, by re-running at finer granularity and getting 52/52 every time; real
touch/wheel scrolling is far more continuous than either synthetic pattern.

## What to watch for

- **Any future `reveal` usage on an element whose height scales with user-editable content
  must go on the per-item element, never the container** — this is a design trap, not a
  one-off mistake: it works perfectly at small sizes (a handful of items keeps the container
  short enough that 12% is trivially reachable) and only breaks once real content growth
  pushes the container past a viewport-dependent size ceiling, by which point it's live in
  production before anyone notices in local testing (a dev's own gallery fixture is unlikely
  to have anywhere near 52 items).
- The rendered-parity baseline (wixy repo, `builder/tests/parity/baseline/gallery/`) needs
  recapturing again after this fix — its screenshot was captured against the STILL-BROKEN
  (blank) state (decisions/00121's rebaseline predates this discovery), so the current
  baseline is itself now a screenshot of the bug. This actually gives real regression
  protection going forward: a future accidental revert to container-level `reveal` would show
  up as a near-100% screenshot diff, the same signature a fully-blank page produces.
- No dedicated automated test covers this specific interaction (scroll-reveal actually making
  content visible) in either repo today — the wixy e2e suite covers the ADMIN editing
  experience, not the public site's client-side JS behavior, and the parity harness's
  screenshot check is the only thing that would now catch a regression, indirectly. A
  purpose-built test (e.g. a Playwright spec that scrolls and asserts `.in` count) would be a
  reasonable follow-up, but wasn't written here — this was fixed and verified by hand under
  time pressure (production was actively broken for the site owner), not skipped by
  oversight.
