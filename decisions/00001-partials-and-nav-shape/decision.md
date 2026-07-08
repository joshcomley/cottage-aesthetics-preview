# Milestone 4 step 2: partials extraction, nav shape, static CTA precedent

## Context

Spec/03-site-migration.md §3 step 2: extract `partials/{header,footer,booking-modal}.html`
from `site.js`'s JS-string injection, wire `@global` bindings, slim `site.js` to
behavior only. Several details weren't spelled out explicitly and needed judgment
calls, made here and recorded per this repo's own decision-log convention
(mirrored from the wixy repo's).

## Decisions

**1. `meta` seeded on all 9 pages' `content/<slug>.json` in this same PR, not
just the pages being fully annotated.** `@nav` (spec/02 §3) is builder-derived from
every page's `meta.inNav`/`meta.navOrder`/`meta.navLabel` — but step 2 (partials)
necessarily lands before step 3 (per-page content annotation). Without every
page's `meta` present from the start, `build_nav` (which silently skips any page
lacking `meta.inNav`, per its own docstring) would render an EMPTY nav the moment
partials go live — breaking parity immediately, before step 3 even begins. So
every page gets its full `meta` block now (title/description/ogImage/navLabel/
inNav/navOrder); the rest of each page's content (hero, sections, collections)
is added when that page gets annotated in its own step-3 PR.

**2. `@nav` renders twice per page (desktop `.nav-links` + mobile `.mobile-menu`),
matching the original site.js exactly** (it called its own `links()` helper
twice). This required two follow-on fixes, both upstream in wixy:
- `_mark_nav_active` only marked the first `data-wx-list="@nav"` container found
  — fixed to mark every one (wixy decisions/00007).
- The builder's list expansion (`_expand_list`) always *appends* rendered items
  after whatever's already in the container — so a static "Book Now" sibling
  would end up BEFORE the nav items in DOM order, not after. A CSS `order` trick
  fixes the *visual* position but not `innerText`'s reading order (confirmed:
  `innerText` follows DOM order, not flex `order`), so links/text probes would
  still fail. The actual fix: wrap just the item template in an inner
  `<span class="nav-list" data-wx-list="@nav">` with `display:contents` (so its
  rendered children become genuine flex children of `.nav-links`/`.mobile-menu`,
  `gap` applies normally), with the static Book Now button as a sibling of that
  wrapper, untouched by list expansion. This fixes DOM order, visual order, and
  text order simultaneously — no CSS trick needed.

**3. CTA button text stays static template text, not a bound key** — "Book Now",
"Enquire", "Book a Free Consultation", "Book online", "View details", etc. are
NOT modeled as `content/*.json` keys. Inferred from spec/02 §3's own worked
example: the hero's two CTA buttons ("View Treatments" / "Book a Free
Consultation") have no corresponding content keys in the spec's normative
example, even though the rest of the hero (`eyebrow`/`title`/`tag`) is fully
bound. Treated as template-level UI chrome, same category as the `❦` sprig and
`★★★★★` glyphs the spec explicitly allows to stay unbound. Binding every CTA
label individually across 9 pages would be excessive relative to this precedent.

**4. Footer column headings ("Explore"/"Visit"/"Get in touch") stay static** —
`footer-link.schema.json` only covers individual link items (`{label, href}`);
there's no schema field for a column's own heading, and spec/02 §3's own
`_global.json` example writes `"footer": {"…": "columns/links as lists"}` without
implying column labels are separately content-modeled. Treated as structural
labels, consistent with decision 3.

**5. Two new `_global.json` keys beyond the spec's literal "MUST include" list**:
`emailHref` (`"mailto:…"`, mirroring the already-spec'd `phoneHref`) and
`footerTagline` (the footer's descriptive line, using an embedded `<br>` — the
rich-lite allowlist already permits `br`, so this needed no new mechanism). The
spec's phrasing ("exact keys fixed by migration, but MUST include") reads as a
floor, not an exhaustive list.

**6. `site.js` deferred to `DOMContentLoaded`.** The original script built and
inserted header/footer/modal itself, so querying them immediately after
insertion always worked. The slimmed script no longer builds them (server-side
partials do) but kept the same script-tag position — which sits BEFORE the
footer/booking-modal markers on every page (only the header marker precedes it).
Querying `.book-overlay` synchronously at that point returned `null` and threw.
Rather than relocating the script tag on all 9 pages (fragile to future
reordering), wrapped the whole behavior setup in a `DOMContentLoaded` listener —
robust regardless of where the tag sits, since the entire document (all
server-rendered partials included) is guaranteed parsed by then.

## Verification

Directly compared the true pre-migration raw site against this milestone's build
using the parity harness's own capture/compare functions (bypassing the
then-stale committed baseline, which itself needed recapturing after each
harness-side fix from decisions 00005/00006/00008 upstream in wixy): 0 failures,
0 advisory, across text/links/images/computed-styles/screenshots, all 9 pages,
both desktop and mobile variants.

## What to watch for

- Any new page-local CTA added later should follow decision 3 (static text)
  unless it's genuinely per-item variant content (like the treatment cards'
  book/enquire toggle, which IS a real data-driven boolean, not decorative).
- If a future column needs a bound heading, that's a real schema gap to fix
  upstream in wixy (`footer-link.schema.json` or a parallel mechanism), not a
  reason to bind it as a fake list item.
