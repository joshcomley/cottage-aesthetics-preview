# 00001 [n8k3qz] M4 step 2 — Partials extraction

## What
Extract `partials/{header,footer,booking-modal}.html` from `site.js`'s JS-string
injection; wire `@global` bindings (brand, `@nav` via `data-wx-list`, footer
columns, phone/email/social, booking URL via `data-wx-attr` on `<body>`); slim
`site.js` to behavior only.

## Why
Spec/03-site-migration.md §3 step 2 — the second migration step, landing before
per-page content annotation (step 3) so the shared chrome (and nav, which needs
every page's `meta`) exists before pages get annotated one by one.

## Context / current state
Worktree: `cottage-aesthetics-preview__worktrees\00001__wixy-cms-migration`,
branch `milestone-4-partials-and-nav`. Depends on M3 (migration step 1, wixy PRs
#13-18 + CA PR #1) being merged.

## Relevant files
- spec/03-site-migration.md §3 step 2, §4 (site.js behavior inventory)
- spec/02-content-model.md §3 (_global.json shape), §6 (collections table)
- decisions/00001-partials-and-nav-shape (this workspace) — full writeup of the
  judgment calls made (nav shape, static CTA text, DOMContentLoaded fix, etc.)

## How to continue + acceptance
`python -m builder validate`/`build` green; parity harness shows 0 failures
comparing the true pre-migration raw site against this build (verified directly,
bypassing the then-stale committed baseline which needed its own recapture after
three upstream wixy fixes this step surfaced — decisions/00005/00006/00008 in
the wixy repo).

## Links
PR: (fill in when opened)
