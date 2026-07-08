# Milestone 5: theme extraction

## Context

Spec/03-site-migration.md §3 step 4: move the `:root` block out of `site.css`
into `theme/theme.json`, replace hardcoded `font-family` literals in `site.css`
with the three font vars, link `theme.css` before `site.css` on every page, let
the Google Fonts link become builder-generated, and write the site repo
`CLAUDE.md` (spec/03 §6).

## Decisions

**1. `theme/theme.json`'s values are copied verbatim from `site.css`'s existing
`:root` block** — 12 colors + `shadow`, byte-identical hex codes. Font
weights/italics were read off the existing hand-written Google Fonts `<link>`
href (`ital,wght@0,400;0,500;0,600;1,400;1,500` for Cormorant Garamond →
weights `["400","500","600"]`, italics `true`; `wght@300;400;500` for Jost →
`["300","400","500"]`, no italics; bare `family=Pinyon+Script` for Pinyon
Script → `["400"]`, no italics).

**2. Only `site.css`'s font-family literals were replaced (13 occurrences) —
page-local `<style>` blocks (gallery.html's `.gfilter button`, reviews.html's
`.rcard .q`, etc.) were left untouched.** This is spec-literal, not a judgment
call: spec/03 §3 step 4 says "replace hardcoded font-family literals in
site.css" specifically, not site-wide. `--font-serif`/`--font-sans`/
`--font-script` ARE globally available custom properties once `theme.css`
loads (any stylesheet, including page-local blocks, could reference them) —
if a future milestone wants page-local blocks converted too, that's a new,
separate scope decision, not implied by this one.

**3. Verified the builder-generated Google Fonts URL differs slightly from
the original hand-written one, and confirmed via the parity harness this is
harmless** — spec/02 §4 pre-authorizes this ("per-weight italic subsets may
differ slightly... tests must not assert the URL string"). Concretely: the
generated URL adds an italic-600 variant (`1,600`) the original didn't
request, and adds an explicit `:wght@400` axis to Pinyon Script (original was
a bare family with no axis). Direct raw-vs-built parity check (screenshots
included, both desktop and mobile): 0 failures, 0 advisory — confirms neither
difference causes any visible rendering change.

**4. Wrote the site repo `CLAUDE.md` now, in Milestone 5, not Milestone 3
step 1 as spec/03 §6's heading literally says ("written in step 1, kept
current").** No prior session created it during M3 step 1; the M4-handover
chain flagged this gap and assigned the catch-up to M5. Written to cover every
bullet spec/03 §6 lists: what the repo is + pointer to the wixy spec, the
`data-wx-*`/no-unbound-text rule, which file to edit for which request,
never-publish-never-deploy, pre-ship validation commands, brand/voice
guardrails (distilled from `brief.md` + `docs/DESIGN-AND-CONTENT.md` in the
wixy repo — quoted/paraphrased from those source documents directly, not
invented), and the image/media conventions (spec/02 §9 + wixy's
`tooling/downscale_photos.py`).

## Verification

`python -m builder validate` clean. Direct raw-vs-built parity check (bypassing
the committed baseline): 0 failures, 0 advisory, across text/links/images/
computed-styles/screenshots, all 9 pages, desktop + mobile. Inspected the
built `theme.css` directly — byte-identical `:root` values to the original
`site.css` block, plus the three font vars matching the exact literals removed
from `site.css`.

## What to watch for

- If `builder/schemas`-level validation for `theme.json` (spec/02 §10: "hex
  colors, known font weight strings") is ever extended, re-check this file
  against it — it wasn't hand-validated against a schema beyond what
  `theme.py`'s loader itself enforces (structural strictness only, per that
  module's own docstring).
- The CLAUDE.md's guardrail bullets are a snapshot of `brief.md`/
  `docs/DESIGN-AND-CONTENT.md` as they exist on 2026-07-09 — if either source
  document changes, the site CLAUDE.md should be checked for drift (it isn't
  auto-synced).
