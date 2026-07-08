# Milestone 4 step 3: reviews.html annotation

## Context

Spec/03-site-migration.md §3 step 3, sixth page — `reviews.items` (9 review cards
`{name, text}`). Per spec/03 §1 and the handover, unlike gallery.html this page's
inline `<script>` has NO behavior beyond DOM injection, so it is deleted outright
once `reviews.items` is a real `data-wx-list` collection (not rewritten to read the
DOM, as gallery's was).

## Decisions

**1. Each review's closing curly quote (`”`) moved into the `text` field's content
value itself**, exactly the same fix as index.html's testimonials (this repo's
decisions/00001-era precedent, predating this repo's own decisions/ log — see the
handover). The raw JS template appended a literal `”` after each review's text
INSIDE the bound `<p class="q">` element (`'<p class="q">'+r.t+'”</p>'`) — binding
`.text` to that `<p>` would `el.clear()` and drop the trailing glyph on every
render. Unlike the opening curly quote (rendered via a pure CSS
`.rcard .q::before{content:"“"}` pseudo-element — never part of the DOM, so
completely unaffected by binding), the closing one is real text content and has no
CSS-pseudo-element equivalent in the original markup, so it must live in the JSON
value. Every `reviews.items[].text` value therefore ends with `”`.

**2. The star row (`<div class="stars">★★★★★</div>`) and "Google review"
attribution (`<span class="src">Google review</span>`) inside each card stay
static template markup, not bound fields** — spec/02 §6 says this explicitly
("star row + `Google review` attribution are fixed template structure"), so no
judgment call needed there.

**3. The page-hero's aggregate rating line (`<div class="stars-hero">★★★★★
&nbsp;5.0 on Google</div>`) ALSO stays entirely static/unbound** — spec doesn't
address this element specifically (it only speaks to the per-card star row), so
this extends decision 2's reasoning by analogy: the star glyphs are the same
decorative device, and splitting "5.0 on Google" out as its own bound field would
require introducing a new wrapping element around bare text sharing a container
with the (also un-splittable) star glyphs and an `&nbsp;` — the same class of
complexity flagged in decisions/00003 and 00004, spent here on a value that
rarely changes. If the actual Google rating ever needs editing, treat it as a
template change at that time rather than pre-binding a field on the chance it
might.

**4. The inline `<script>` block (the `R` array + `.forEach`/`insertAdjacentHTML`
DOM-building loop) was deleted entirely**, not rewritten to read the DOM (contrast
with gallery.html's approach in decisions/00003) — per spec/03 §1's explicit
statement that this page's script "has NO behavior beyond injection" and is
"deleted after conversion." Confirmed directly: the only thing the script did was
build and insert the `.rcard` elements; nothing else in `site.js` or this page
references `#grid` or reads review data.

## Verification

`python -m builder validate` clean. Direct raw-vs-built parity check (bypassing the
committed baseline): 0 failures, 0 advisory, across text/links/images/computed-
styles/screenshots, all 9 pages, desktop + mobile.

## What to watch for

- Decision 1's pattern (trailing/leading punctuation baked into a CSS
  `::before`/`::after` pseudo-element vs. real DOM text) recurs wherever a bound
  element's visible punctuation isn't literally in its own tag — check for
  `::before`/`::after` content rules on any element before assuming a raw JS
  string's leading/trailing characters need moving into JSON content; if there's
  no pseudo-element already producing it, it usually does need to move (as here).
