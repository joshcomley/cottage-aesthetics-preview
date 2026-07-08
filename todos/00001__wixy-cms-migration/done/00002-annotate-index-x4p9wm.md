# 00002 [x4p9wm] M4 step 3 — Annotate index.html

## What
Add `data-wx-*` bindings to `pages/index.html` and populate `content/index.json`:
hero (incl. `data-wx-bg`), welcome, about teaser, 4 values cards, 2 quotebands,
`treatments.cards` collection (6 cards, book/enquire pattern), cottage section
(3 images + 4 features), contact teaser (`@address`/`@phoneHref`/`@emailHref`/
`@hours`), CTA box.

## Why
Spec/03-site-migration.md §3 step 3, first page in the specified order
(index, about, treatments, gallery, faq, reviews, contact, aftercare, policies).

## Context / current state
Also required stripping `.hero`'s hardcoded `url('images/lounge.jpg')` from
`site.css` (kept `background-position/size/repeat`, letting the builder's
`data-wx-bg` inline style supply the image) — spec/03 §3 step 3's explicit note.
Fixed `_global.json`'s `address` from a 2-element string array (the spec's own
literal worked example shape) to a single rich-lite string with an embedded
`<br>` — the binding engine's `data-wx-list` requires dict items, so a
plain-string array has no supported binding mechanism; a rich-lite string with
`<br>` (already an allowed tag) renders identically.

## Bug found + fixed while annotating
`data-wx="key"` replaces an element's ENTIRE innerHTML (`el.clear()` then
re-insert) — the curly quote marks (`“…”`) around both testimonial quotes were
static template text sitting INSIDE the bound `<p class="bigq">` element, so
they got wiped along with the placeholder text. Fixed by moving the quote marks
into the JSON content values themselves. Generalizes: any literal character
inside a bound element must be part of the content value, never left as
"surrounding" template decoration.

## Relevant files
- spec/03-site-migration.md §3 step 3, §6 (site.js behavior, tcard book/enquire)
- spec/02-content-model.md §3 (card CTA pattern), §6 (treatments.cards schema)
- decisions/00001-partials-and-nav-shape (this workspace)

## How to continue + acceptance
`python -m builder validate` clean. Verified directly (bypassing the committed
baseline): comparing the true pre-migration raw site against this build shows 0
failures across text/links/images/computed-styles/screenshots, all 9 pages,
desktop + mobile.

## Links
PR: cottage-aesthetics-preview#3 — merged
