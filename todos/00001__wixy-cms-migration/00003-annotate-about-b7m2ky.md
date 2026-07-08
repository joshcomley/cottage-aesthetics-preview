# 00003 [b7m2ky] M4 step 3 — Annotate about.html

## What
Add `data-wx-*` bindings to `pages/about.html` and populate `content/about.json`:
page hero, about (image + 3 body paragraphs + signature), philosophy section,
cottage section (image gallery + 2 paragraphs), credentials list (6 items),
CTA strip title.

## Why
Spec/03-site-migration.md §3 step 3, second page in the specified order.

## Context / current state
No collections on this page — every visible text node bound individually
(consistent with decisions/00001's precedent: CTA button text and the ✓
bullet-glyph stay static/unbound).

## Relevant files
- spec/03-site-migration.md §3 step 3
- decisions/00001-partials-and-nav-shape (this workspace)

## How to continue + acceptance
`python -m builder validate` clean. Verified directly (bypassing the committed
baseline): comparing the true pre-migration raw site against this build shows 0
failures across text/links/images/computed-styles/screenshots, all 9 pages,
desktop + mobile — clean on the first attempt (no bugs found this page).

## Links
PR: (fill in when opened)
