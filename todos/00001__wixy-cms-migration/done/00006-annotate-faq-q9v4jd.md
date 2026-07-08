# 00006 [q9v4jd] M4 step 3 — Annotate faq.html

## What
Add `data-wx-*` bindings to `pages/faq.html` and populate `content/faq.json`: page
hero, draft-flag notice, `faq.items` collection (8 Q&A accordions), CTA strip title.
Moves the "How do I book?" answer's inline underline style to a `.fbody a` rule in
`site.css`.

## Why
Spec/03-site-migration.md §3 step 3, fifth page in the specified order.

## Context / current state
`faq.items` intentionally has no fixed JSON Schema (spec/02 §10). Full reasoning
for this page's judgment calls (CSS extraction, the `rel=noopener/noreferrer`
auto-injection finding, why no `display:contents` wrapper was needed) in this
repo's decisions/00004.

## Relevant files
- spec/02-content-model.md §5/§6/§10, spec/03-site-migration.md §3 step 3
- decisions/00001-partials-and-nav-shape, decisions/00004-faq-annotation (this
  workspace)

## How to continue + acceptance
`python -m builder validate` clean. Verified directly (bypassing the committed
baseline): comparing the true pre-migration raw site against this build shows 0
failures, 0 advisory, across text/links/images/computed-styles/screenshots, all 9
pages, desktop + mobile.

## Links
PR: cottage-aesthetics-preview#9
