# 00009 [f4r9wx] M4 step 3 — Annotate aftercare.html

## What
Add `data-wx-*` bindings to `pages/aftercare.html` and populate
`content/aftercare.json`: page hero, draft-flag notice, three sections (first 24
hours, following days, when to contact), CTA strip title. List items bound
individually (not a collection).

## Why
Spec/03-site-migration.md §3 step 3, eighth page in the specified order.

## Context / current state
No new judgment calls — reuses established patterns directly (individual list-item
binding from index.html/about.html's "values"/"creds" precedent, draft-flag from
faq.html's decisions/00004). No new decisions/ entry needed.

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
PR: cottage-aesthetics-preview#12
