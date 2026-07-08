# 00004 [h5t8nq] M4 step 3 — Annotate treatments.html

## What
Add `data-wx-*` bindings to `pages/treatments.html` and populate
`content/treatments.json`: page hero, the nested `sections[].cards` collection (5
category sections, 12 tcards total), the separate `rx.items` collection (3
prescription accordions), end CTA. Converts alternating section backgrounds from
inline `style` to a `.cat-sections .cat:nth-of-type(even)` CSS rule.

## Why
Spec/03-site-migration.md §3 step 3, third page in the specified order — the most
structurally complex remaining page (two collections, one of them nested).

## Context / current state
Required wixy PR #21 first (rx-item.schema.json was missing the `price` field —
decisions/00002(d) in wixy corrected by wixy decisions/00009). Full reasoning for
this page's judgment calls (nested-list-container audit, nth-of-type scoping,
`&nbsp;` entity round-trip fact) in this repo's decisions/00002.

## Relevant files
- spec/02-content-model.md §6, spec/03-site-migration.md §3 step 3
- decisions/00001-partials-and-nav-shape, decisions/00002-treatments-annotation
  (this workspace)
- wixy decisions/00009-rx-item-schema-price-field

## How to continue + acceptance
`python -m builder validate` clean. Verified directly (bypassing the committed
baseline): comparing the true pre-migration raw site against this build shows 0
failures, 0 advisory, across text/links/images/computed-styles/screenshots, all 9
pages, desktop + mobile (this page is one of the two mobile-screenshot-captured
pages).

## Links
PR: cottage-aesthetics-preview#7
wixy PR: joshcomley/wixy#21 (rx-item schema fix, prerequisite)
