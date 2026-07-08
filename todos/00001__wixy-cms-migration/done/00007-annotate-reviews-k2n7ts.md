# 00007 [k2n7ts] M4 step 3 — Annotate reviews.html

## What
Convert `pages/reviews.html`'s page-local JS-array-built content (`R` array,
`insertAdjacentHTML`) into `data-wx-list` markup + `content/reviews.json`
(`reviews.items` collection). Delete the inline `<script>` block entirely (no
behavior beyond injection, per spec/03 §1).

## Why
Spec/03-site-migration.md §3 step 3, sixth page in the specified order.

## Context / current state
Full reasoning for this page's judgment calls (closing curly quote moved into
content, star row / rating line staying static) in this repo's decisions/00005.

## Relevant files
- spec/02-content-model.md §6, spec/03-site-migration.md §1/§3 step 3
- decisions/00001-partials-and-nav-shape, decisions/00005-reviews-annotation
  (this workspace)

## How to continue + acceptance
`python -m builder validate` clean. Verified directly (bypassing the committed
baseline): comparing the true pre-migration raw site against this build shows 0
failures, 0 advisory, across text/links/images/computed-styles/screenshots, all 9
pages, desktop + mobile.

## Links
PR: cottage-aesthetics-preview#10
