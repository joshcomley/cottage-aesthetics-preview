# 00005 [w3c6rf] M4 step 3 — Annotate gallery.html

## What
Convert `pages/gallery.html`'s page-local JS-array-built content (`SLIDERS`/`TILES`)
into `data-wx-list` markup + `content/gallery.json` (`gallery.sliders` +
`gallery.tiles` collections). The inline script keeps its drag/nudge/filter/lightbox
behavior but reads the builder-rendered DOM instead of building it.

## Why
Spec/03-site-migration.md §3 step 3, fourth page in the specified order — the only
remaining page needing a structural JS-to-DOM conversion rather than plain
annotation (spec/02 §6, spec/03 §3 step 3).

## Context / current state
Full reasoning for this page's judgment calls (figcaption title/sub split + CSS
rename, the `data-wx-img` alt-text entity convention) in this repo's decisions/00003.

## Relevant files
- spec/02-content-model.md §6, spec/03-site-migration.md §3 step 3
- decisions/00001-partials-and-nav-shape, decisions/00003-gallery-annotation (this
  workspace)

## How to continue + acceptance
`python -m builder validate` clean. Verified directly (bypassing the committed
baseline): comparing the true pre-migration raw site against this build shows 0
failures, 0 advisory, across text/links/images/computed-styles/screenshots, all 9
pages, desktop + mobile.

## Links
PR: cottage-aesthetics-preview#8
