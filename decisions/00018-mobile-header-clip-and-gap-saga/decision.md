# Decision: the real cause of the mobile "header half off top" / "gap on the right" reports was a CSS Grid overflow trap, unrelated to header or hero CSS

## Symptom, in the order reported

1. "When I scroll, the title bar half disappears at the top of the screen" (mobile,
   home page). Real cause: `header:not(.scrolled)`'s text color/shadow snapped
   instantly while the header's own `background`/`backdrop-filter` transition took
   0.3s — for that window, low-contrast dark text sat on a still-transparent
   background. **Fixed correctly** (PR #38): gave the text color/shadow their own
   synced `.3s` transition. This fix was right and stayed right the whole time.
2. Follow-up: "only on the HOME page - the header disappears half off the top of
   the screen." Diagnosed (wrongly, in hindsight) as a `.hero{min-height:100vh}` /
   mobile-URL-bar-collapse reflow issue. Fixed with `min-height:100dvh` (PR #39).
3. On-device: dvh introduced a visible content-snap during scroll, plus a gap on
   the right edge. Diagnosed as dvh's live-tracking recalculation; switched to the
   static `100svh` (PR #40).
4. On-device: snap fixed, gap unchanged. Reverted the whole `.hero` viewport-unit
   experiment back to plain `100vh`, and instead promoted `header` to its own GPU
   compositing layer (`transform:translateZ(0);will-change:transform`) as a more
   conservative fix for the *original* clip bug's likely mechanism (a mobile
   compositor glitch during the URL-bar animation) — PR #41.
5. On-device: gap on the right persisted, a NEW gap appeared at the bottom, and
   the header stopped going transparent over the hero at all.

Every one of PRs #39/#40/#41's underlying assumptions was verified against headless
Chromium (Playwright, Pixel 7 device emulation, 412px viewport) at every stage and
always came back clean — zero overflow, correct transparent header, hero filling
the viewport exactly. That was never a false negative from bad testing methodology;
it was testing at the WRONG WIDTH.

## Root cause (found once the operator asked to check for horizontal scroll)

`site.css`'s `.vgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:1.6rem}`
(the home page's "Cottage philosophy" 4 values cards) collapses to
`grid-template-columns:1fr 1fr` at `@media(max-width:860px)` — still TWO columns on
mobile. CSS Grid items default to `min-width:auto`, i.e. their minimum size is
their own content's min-content width, not 0. `.vcard`'s paragraph text (e.g.
"Time to talk, assess and treat properly — never a conveyor belt.") doesn't wrap
below its natural min-content width, so each `1fr` track gets forced wider than
its actual `1fr` share whenever the viewport is too narrow to fit that min-content
in 2 columns — a textbook, extremely common CSS Grid overflow trap.

Confirmed directly: at a 360px viewport, `document.documentElement.scrollWidth`
was a fixed **402px**, completely independent of the real viewport width (320px
through 393px ALL overflowed to exactly 402px — the same min-content-driven
minimum in every case; only clears once the viewport is wide enough, ≥412px, to
fit two columns without forcing overflow). `header#hd`, despite
`position:fixed;left:0;right:0` and no transform/will-change at the time, computed
to that SAME phantom 402px width instead of the real viewport — its right edge
was genuinely off-screen. That's the actual mechanism behind every "gap on the
right" / apparent-clipping report: the header (and other document-flow content)
was legitimately laid out against a wider-than-visible canvas.

**This is completely independent of `.hero`, `dvh`/`svh`, or any header transform.**
Confirmed by testing directly against the header CSS as it existed on plain `main`
(no `will-change`, no `transform`, plain `100vh`) — the 402px overflow was already
there. It was invisible to every headless test run this session because Playwright's
Pixel 7 emulation uses a 412px viewport — one pixel-class above the ~402px
overflow threshold this specific grid content happens to trigger. Any REAL phone
narrower than ~412px (iPhone SE/mini at 375px, most Android phones at 360–393px —
the overwhelming majority of real visitors) hit it every time.

## What was decided

`min-width:0` on every grid-item card class that can hold body text
(`.vcard`, `.tcard`, `.rcard`) and on the direct children of the remaining
2-column-at-any-width grids (`.about .grid`, `.cottage .grid`, `.contact .grid`) —
not just `.vcard`, which is the only one CURRENTLY exposed (it's the only
shared-`site.css` grid still at 2+ columns on mobile; `.tgrid`/`.rgrid`/the others
collapse to a single column at their own breakpoints, which is why they weren't
visibly broken yet, but carry the identical latent trap). `min-width:0` has zero
visual effect except relaxing the forced minimum — safe, standard, well-known fix
for this exact class of bug.

Verified by building the site and sweeping every page × 7 viewport widths
(320–412px) for `scrollWidth > clientWidth`: went from a 42px overflow on the home
page to a single 1px sub-pixel rounding artifact (invisible, ordinary CSS Grid
gap-math, not the same bug) on one page/width combination.

PR #38 (the text-transition sync) and PR #41 (GPU-layer-promoted header) both
stayed in place — #38 fixed a real, independent bug; #41's GPU-layer promotion is
a reasonable, low-risk, broadly-compatible belt-and-braces addition for the
original mobile-compositor clip glitch even though it likely wasn't the dominant
cause once the real overflow is fixed. `.hero` stayed at plain `100vh` (the
`dvh`/`svh` detour was fully reverted in #41 and never needed to come back).

## What to watch for

- **A mobile "gap" or "clipping" report near a `position:fixed` header is not
  automatically a header-positioning bug.** `position:fixed;left:0;right:0` is
  spec'd to size against the viewport — if it's NOT matching the viewport, look
  for horizontal document overflow FIRST (`document.documentElement.scrollWidth
  > clientWidth`) before touching header/hero CSS at all. This session spent four
  PRs iterating on the wrong subsystem before checking this.
- **Headless test viewport width matters as much as the assertion itself.** A
  bug that only exists on narrower-than-412px viewports is invisible under a
  Pixel-7-emulation-only test regime. Any future mobile-layout regression test
  should sweep a genuinely narrow width (≤375px) in addition to whatever the
  "default mobile" device profile happens to be — this repo's own parity harness
  mobile-screenshot slugs should be checked against this if it recurs.
- **Any new card-style component added to a CSS Grid (`display:grid` with
  `1fr`-family columns) needs `min-width:0` on the grid item from day one** if it
  can ever hold body text — this is not a one-off patch, it's a pattern this repo
  should default to for every future grid card.
