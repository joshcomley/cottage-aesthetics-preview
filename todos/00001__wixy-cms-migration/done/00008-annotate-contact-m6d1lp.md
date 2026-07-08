# 00008 [m6d1lp] M4 step 3 — Annotate contact.html

## What
Add `data-wx-*` bindings to `pages/contact.html` and populate
`content/contact.json`: page hero, form intro, form labels/placeholder/consent/
thanks text, contact info block (reuses `@address`/`@phone`/`@phoneHref`/`@email`/
`@emailHref`/`@hours`/`@social.*` from index.html's contact-teaser).

## Why
Spec/03-site-migration.md §3 step 3, seventh page in the specified order.

## Context / current state
Full reasoning for this page's judgment calls (alert() text staying JS-only, map
iframe src staying static) in this repo's decisions/00006.

## Relevant files
- spec/03-site-migration.md §3 step 3
- decisions/00001-partials-and-nav-shape, decisions/00006-contact-annotation
  (this workspace)

## How to continue + acceptance
`python -m builder validate` clean. Verified directly (bypassing the committed
baseline): comparing the true pre-migration raw site against this build shows 0
failures, 0 advisory, across text/links/images/computed-styles/screenshots, all 9
pages, desktop + mobile.

## Links
PR: cottage-aesthetics-preview#11
