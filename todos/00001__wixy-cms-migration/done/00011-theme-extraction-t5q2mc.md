# 00011 [t5q2mc] M5 (this repo's half) — Theme extraction

## What
Move `:root` out of `site.css` into `theme/theme.json`, replace all 13
hardcoded `font-family` literals in `site.css` with the three font vars, add
a `theme.css` link (before `site.css`) to all 9 pages' `<head>`, and write the
site repo `CLAUDE.md`.

## Why
Spec/03-site-migration.md §3 step 4 + §6.

## Context / current state
The hero's hardcoded `lounge.jpg` background URL was already stripped from
`site.css` in the M4 index.html annotation PR (#3) — nothing left to do there.
Full reasoning for this milestone's judgment calls (font weight/italics
extraction, why only `site.css` and not page-local `<style>` blocks got
touched, the Google Fonts URL difference, why the CLAUDE.md is being written
now rather than at M3 step 1 as spec's heading literally says) in this repo's
decisions/00007.

## Relevant files
- spec/02-content-model.md §4/§9, spec/03-site-migration.md §3 step 4/§6
- decisions/00007-theme-extraction (this workspace)
- `builder/theme.py`, `builder/templates.py` (wixy repo) — both already fully
  implemented from Milestone 2, no wixy-side code changes needed for this
  milestone.

## How to continue + acceptance
`python -m builder validate` clean. Verified directly (bypassing the committed
baseline): comparing the true pre-migration raw site against this build shows
0 failures, 0 advisory, across text/links/images/computed-styles/screenshots,
all 9 pages, desktop + mobile. Inspected the built `theme.css` directly for
byte-identical `:root` values.

## Links
PR: cottage-aesthetics-preview#14
