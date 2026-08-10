# cottage-aesthetics-preview — Cottage Aesthetics site content

This repo is **content + structure only** for `ca.cinnamons.uk` — served by
**Wixy**, a self-hosted, MIT-licensed CMS engine (`joshcomley/wixy` on GitHub,
or your own fork of it). The wixy repo's `spec/02-content-model.md` is the
binding contract for everything here (`data-wx-*` bindings, content JSON
shapes, theme, validation rules). Read it before making structural changes;
this file is orientation, not a substitute.

## What's here

- `pages/*.html` — page templates, `data-wx-*` annotated. Structure/markup
  only; copy lives elsewhere (see below).
- `partials/*.html` — header/footer/booking-modal, shared across pages,
  injected by the builder at each page's `<!-- wx:partial NAME -->` marker.
- `content/*.json` — all editable copy, one file per page slug plus
  `_global.json` (brand, nav, footer, hours, booking URL, phone/email/social).
- `theme/theme.json` — colors, shadow, and the three font roles. The builder
  generates `theme.css` and the Google Fonts `<link>` from this at build
  time — never hand-edit either of those.
- `site.css` / `site.js` — shared styles/behavior across every page. `site.js`
  must never contain content strings (spec/03 §4). Some pages also carry a
  page-local `<style>`/`<script>` block for page-specific concerns.
- `images/` — canonical media (spec/02 §9).
- `decisions/` — every non-obvious judgment call made while building this
  content model, in date order. Read the relevant entries before touching a
  page for the first time; don't re-litigate a decision already recorded here.

## Which file to edit for which request

- "Change this wording" → the relevant `content/<slug>.json` (or
  `_global.json` for brand/nav/footer/hours/contact details).
- "Add/reorder/remove a treatment card, review, FAQ entry, gallery item" → the
  matching collection array inside `content/<slug>.json` (spec/02 §6 lists the
  fixed collection keys). A gallery item (`gallery.sliders`/`gallery.tiles`)
  MAY carry `"visible": false` — absent or `true` means shown; `false` hides
  it from the public page while it stays visible (dimmed, with a "Hidden"
  chip) in the owner's Before & After editor, until she switches it on
  herself (wixy repo decisions/00117). **Never strip this key** when editing
  an item for another reason — an accidental whole-array rewrite that drops
  it silently re-publishes something she deliberately kept off the site.
- "Change a color or font" → `theme/theme.json` only.
- "Add a new page or section, or change layout/structure" → `pages/*.html` —
  more involved; needs new `data-wx-*` bindings wired to a matching content
  key, and should follow the patterns already established on similar pages.
- "Fix the slider/filter/lightbox/booking-modal/nav behavior" → `site.js` (or
  a page's own `<script>` block for page-local behavior).

## The binding rule (strict)

Every user-visible text node must be bound via `data-wx-*` (spec/02 §2)
UNLESS it's established template chrome — CTA button labels, decorative
glyphs, a few other precedents recorded in `decisions/00001` point 3. A
`data-wx` text binding replaces an element's **entire** innerHTML — if an
element mixes bound content with something else (a nested tag, trailing
punctuation, a sibling that needs its own binding), that needs splitting into
separate elements or moving into the JSON value itself; `decisions/00003` and
`00005` record two real examples of getting this right.

## Never publish, never deploy — this repo cannot touch the live site

Agents ship changes to this repo's `main` only: branch → PR → CI green →
merge. **Merging to `main` does not affect `ca.cinnamons.uk`, and it does
not affect the public custom domain either** — the site owner presses
Publish (or Restore) inside the Wixy admin UI, which pins a specific commit
SHA and only then updates both live surfaces. Never attempt to trigger a
publish, and never claim a change is "live" just because it merged here.

The site also deploys to **GitHub Pages** on the owner's own domain
(`.github/workflows/pages.yml`), gated by the `WIXY_PUBLIC_DOMAIN` repository
variable. That workflow deliberately does **not** trigger on pushes to
`main` — it triggers only on pushes to `refs/heads/wixy-live`, a branch the
Wixy server (never an agent, never a human pushing by hand) force-pushes to
at the end of every successful Publish or Restore. This keeps the exact same
guarantee as `ca.cinnamons.uk`: merging content here is never itself a
deploy, on either surface. **Never push to `wixy-live` by hand, and never
run the Pages workflow's `workflow_dispatch` trigger to "ship" content** —
if the public domain needs updating for a reason other than an owner
Publish/Restore (for example, a one-off recovery), that is an operational
decision, not something to do while doing ordinary content work here. See
wixy repo decisions/00126 for the full design and this repo's own
`decisions/00013`.

## Before shipping

- `python -m builder validate --root . --project projects/ca.json` (run from
  a wixy repo checkout) must be clean.
- CI (`ci.yml`) runs `validate` + `build` + the rendered-parity check against
  the wixy repo's committed baseline on every PR — required for merge, never
  bypass it.
- Preview locally: `python -m builder serve --root . --project
  projects/ca.json` (from a wixy checkout).

## Brand & content guardrails

- Tone: calm, understated, reassuring — never sales-driven, glamorous or
  trendy. British English throughout.
- Prescription-only treatment pricing (Botox®, Relfydess®, Vitamin B12) must
  stay **at least two clicks from the homepage** — never surface it directly
  on the homepage or in primary nav.
- **Client photos and reviews are consented content.** The existing gallery
  before/after images and Google reviews were captured/published with the
  owner's knowledge. Any NEW photo or review needs Purdi's explicit sign-off
  recorded in the chat before it's added to this repo — never add such
  content speculatively, or pull it in from a draft/demo source without that
  sign-off.

## Images

- Canonical images live in `images/` (published at `/images/<name>`, per
  spec/02 §9). Oversized images must be downscaled before commit — the wixy
  repo's `tooling/downscale_photos.py` is the reference tool for this today;
  once the media upload pipeline ships (a later milestone) the admin UI
  handles downscaling automatically on upload.
