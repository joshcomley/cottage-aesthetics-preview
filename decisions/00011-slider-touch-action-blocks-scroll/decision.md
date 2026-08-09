# Decision: `touch-action: pan-y` instead of `none` on the before/after slider

## Symptom

The operator: a vertical swipe intended to scroll the gallery page instead gets caught by
whichever before/after slider it started on — the page doesn't scroll, and the slider's
divider jumps to wherever the touch happened to land. Reported as a real usability problem,
not a one-off; it happens on ANY vertical swipe that starts over an image, and there are now
52 of them on the page.

## Root cause

`.bas-frame` (the slider's image-comparison box) was styled `touch-action:none`. This tells
the browser to hand every touch gesture over this element to JavaScript, disabling the
browser's own native touch handling entirely — including vertical scrolling. It doesn't
matter that the intended interaction is only ever horizontal (drag left/right to compare):
`none` blocks BOTH axes, so any touch that starts on an image — including one meant purely as
a scroll — gets captured by the (invisible, full-frame) `<input type="range">` underneath and
interpreted as a horizontal drag-to-position gesture.

## What was decided

Changed `touch-action:none` to `touch-action:pan-y` on both `.bas-frame` and `.bas-range` —
this tells the browser "let your own native vertical panning (scrolling) proceed as normal;
only claim horizontal gestures for the element's own handling." This is the standard fix for
exactly this class of conflict (any horizontal drag-slider embedded in a vertically-scrolling
page), and was chosen over the operator's own initial suggestion (shrink the draggable area
down to just the divider) because it fixes the actual complaint (page doesn't scroll)
*without* trading away the current, deliberately generous full-image drag target — a thin
divider-only hit area would make the comparison slider noticeably harder to grab on a phone,
a real regression to the primary interaction for a cosmetic-adjacent fix.

## Verification

Genuine touch-event simulation (Chrome DevTools Protocol's `Input.dispatchTouchEvent` via a
real touch-enabled browser context — not synthetic DOM `dispatchEvent` calls, which don't
reliably exercise the same browser-compositor-level `touch-action` handling a real finger
does):

- **Red, confirmed against the unfixed code first**: a pure vertical swipe starting on a
  slider left `scrollY` completely unchanged and moved the slider's value by 15 points
  (40→25) — reproducing the report exactly.
- **Green**: the same swipe (100px, 300px, and 600px vertical distances) scrolled the page
  correctly every time, with the slider value held at **exactly zero drift** in all three
  cases once a confound was controlled for (see below) — and a horizontal drag still moves
  the divider correctly (50→91).
- **A real confound caught and controlled for, not glossed over**: an early measurement
  showed a small (0-22 point) value drift that looked like residual touch-action slop. Traced
  to `site.js`'s own unrelated "auto-nudge" demo animation (a `requestAnimationFrame` sweep
  that plays ~350-1750ms after a slider first scrolls into view, to hint that it's
  draggable) — the test's own timing happened to overlap it. Re-run with the slider given
  time to finish that animation and settle back to its resting value first: zero drift, every
  time, at every distance tested.

## What to watch for

- `touch-action:none` is occasionally the *right* choice for an element with genuinely
  two-axis custom gesture handling — it is NOT a default to reach for on anything that only
  cares about ONE axis. If a future slider/drag control is added anywhere on the public site,
  default to `pan-x` or `pan-y` (whichever axis the control does NOT use) over `none`, and
  verify with real touch-event simulation, not just a mouse-drag test — mouse events don't
  exercise `touch-action` at all, so a control that "works fine" in a quick manual desktop
  check can still be broken for every real phone visitor.
