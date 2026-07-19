# Cottage Aesthetics — site content

This repo holds the content and structure for **[ca.cinnamons.uk](https://ca.cinnamons.uk)**,
a nurse-led aesthetics clinic in Hartlebury. It is built and served by
[**Wixy**](https://github.com/joshcomley/wixy), an MIT-licensed, self-hosted CMS engine — this repo
carries no server or build code, just templates (`pages/`, `partials/`), copy (`content/*.json`),
theme (`theme/theme.json`), and static assets (`site.css`, `site.js`, `images/`).

Live site: **https://ca.cinnamons.uk**. This repo previously published a preview via GitHub
Pages during the migration into Wixy's content model; that workflow has been retired now that
the real site is live — the old `github.io` Pages URL is intentionally stale and no longer
updates.

## Editing

- The site owner edits content live at `ca.cinnamons.uk/admin` (Wixy's visual editor) and
  presses **Publish** to go live — publishing commits straight to this repo's `main` and tags
  it `wixy-publish-vN`.
- AI/agent changes ship the normal way: branch → PR → CI green → merge to `main`. **Merging
  here never touches the live site** — only a Publish from the admin does. See `CLAUDE.md` for
  the full AI-lane contract (binding rules, brand guardrails, what to edit for which request).
- CI (`.github/workflows/ci.yml`) validates and builds against the wixy repo's builder and runs
  the rendered-parity check on every PR — required for merge.

## Structure & spec

See `CLAUDE.md` in this repo for orientation, and the wixy repo's `spec/02-content-model.md` for
the binding contract everything here follows.
