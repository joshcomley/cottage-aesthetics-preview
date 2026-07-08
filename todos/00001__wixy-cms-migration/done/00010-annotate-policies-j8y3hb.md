# 00010 [j8y3hb] M4 step 3 — Annotate policies.html

## What
Add `data-wx-*` bindings to `pages/policies.html` and populate
`content/policies.json`: page hero, draft-flag notice, five policy sections
(deposits, cancellations, late arrivals, prescription treatments, comfort &
safety), CTA strip title.

## Why
Spec/03-site-migration.md §3 step 3, ninth and final page in the specified order.

## Context / current state
No new judgment calls — reuses established patterns directly (same structure as
aftercare.html: individually-bound section title/body pairs, draft-flag). No new
decisions/ entry needed. This closes out Milestone 4 step 3 entirely — all nine
pages are now fully annotated.

## Relevant files
- spec/02-content-model.md §6, spec/03-site-migration.md §3 step 3
- decisions/00001-partials-and-nav-shape, decisions/00004-faq-annotation (this
  workspace)

## How to continue + acceptance
`python -m builder validate` clean. Verified directly (bypassing the committed
baseline): comparing the true pre-migration raw site against this build shows 0
failures, 0 advisory, across text/links/images/computed-styles/screenshots, all 9
pages, desktop + mobile.

## Links
PR: cottage-aesthetics-preview#13
