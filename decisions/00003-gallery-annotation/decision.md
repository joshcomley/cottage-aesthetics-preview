# Milestone 4 step 3: gallery.html annotation

## Context

Spec/03-site-migration.md §3 step 3, fourth page — the only remaining page whose
content was built by page-local JS reading a plain JS array (`SLIDERS`/`TILES`)
rather than static HTML. Per spec/02 §6 and §3, this is a structural conversion, not
just annotation: the JS keeps its drag/filter/lightbox BEHAVIOR but stops building
the slider/tile DOM itself, mirroring the `site.js`/partials split from step 2
(decisions/00001).

## Decisions

**1. The JS rewrite reads the already-rendered DOM instead of building it.**
Replaced `SLIDERS.forEach(...)`/`TILES.forEach(...)` (which created `<figure>`
elements via `fig.innerHTML=...` and appended them) with
`document.querySelectorAll('.ba-slider'/'.ba-tile').forEach(...)` that finds the
builder-rendered figures and wires up behavior (drag `set()`/nudge/IntersectionObserver
for sliders; click→lightbox for tiles) directly against their existing children.
Filtering and lightbox logic were already structure-based (reading `data-cat`
attributes and querying by class/id) and needed no changes at all.

**2. The two decorative SVG icons (drag-handle arrows, zoom-badge magnifier) moved
from JS string constants into the static template markup**, since the whole
`<figure>` is now builder-rendered from one shared item template — they no longer
need to be string-concatenated per item, just written once in the HTML like any
other static decoration.

**3. The slider range input's `aria-label` is now generic static text** ("Drag to
reveal the after result"), not per-item title-interpolated — per spec/03 §3 step 3's
explicit instruction ("use a generic static aria-label on slider inputs — no
attribute interpolation of item titles"). `data-wx-attr` sets a whole attribute to
one resolved key's value; it has no string-templating/concatenation mechanism, so
per-item interpolation was never available as an option here — the spec anticipated
this and prescribed the fallback directly.

**4. Slider figcaptions needed their title text moved into its own wrapping
`<span>`, and the existing sub-label `<span>` needed a new `.cap-sub` class (with
`site.css`'s — actually this page's own local `<style>` block's — selector renamed
from the bare-tag `.ba-slider figcaption span` to `.ba-slider figcaption
.cap-sub`).** The raw markup had the title as a bare text node directly inside
`<figcaption>`, with only the sub-label wrapped in an (unclassed) `<span>`. A
`data-wx` text binding on `<figcaption>` itself would call `el.clear()` and wipe the
nested sub-span entirely (same class of bug as index.html's testimonial curly-quote
issue, decisions/00001-era — data-wx replaces an element's ENTIRE innerHTML). Two
independently-editable fields inside one caption require two separate bound
elements; wrapping title in a *new*, unclassed `<span>` risked it silently
inheriting the existing `figcaption span` rule (block display, small caps, clay
color) meant only for the sub-label, changing computed styles. Fixed by scoping that
rule to a class that only the sub-label carries, leaving the title-span
unstyled (identical rendering to the original bare text node, since a plain
inline span with no rules inherits its parent's font/color exactly like a text
node would).

**5. `data-wx-img` alt text uses a PLAIN `&` character, not the `&amp;` entity —
the opposite convention from `data-wx` text bindings.** Verified by reading
`builder/bindings.py` directly (not assumed): `_apply_text` parses its value through
`sanitize_rich_lite` + an HTML-fragment parse (so entities in the JSON get
interpreted — decisions/00002 in this repo already established `&amp;`/`&nbsp;`
round-trip clean there), but `_apply_img` sets `el["alt"] = alt` as a raw string
assignment with NO sanitization or fragment-parsing at all — BeautifulSoup's
serializer then escapes whatever literal characters are in that string exactly
once. Writing the entity text `&amp;` into an alt field would have been escaped
AGAIN on output (`&amp;amp;`), rendering literally as the text "&amp;" in a
screen reader / alt tooltip instead of "&". Confirmed against the built output
directly (`"Cheek & Lip Definition — before"`, single ampersand, correct) rather
than left as a theoretical concern. Applies to `content/gallery.json`'s
`gallery.sliders[].before/after.alt` and `gallery.tiles[].img.alt` — the "Cheek &
Lip Definition" slider needed BOTH forms in the same content object (`&amp;` in
`title`, plain `&` in `before.alt`/`after.alt`).

## Verification

`python -m builder validate` clean. Direct raw-vs-built parity check (bypassing the
committed baseline): 0 failures, 0 advisory, across text/links/images/computed-
styles/screenshots, all 9 pages, desktop + mobile.

## What to watch for

- Decision 5's img-alt-vs-text-binding entity distinction applies to EVERY future
  `data-wx-img` alt field across the remaining pages, not just gallery's. Check any
  alt text containing `&`, `<`, `>`, or `"` against this rule before authoring it.
- Decision 4's pattern (new wrapping element for a previously-bare-text field
  sharing a container with another bound field) is the same underlying rule as
  this repo's decisions/00002 point 2 (audit shared containers before wrapping) —
  same principle, different failure mode (styling leak vs binding drop).
