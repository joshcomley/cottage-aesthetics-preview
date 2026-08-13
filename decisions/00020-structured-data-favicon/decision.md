# Decision: `_global.json.business` block + favicon files/links for Brief WP3

## Symptom

The 2026-08-12 search-indexing audit (Brief Work package 3,
`docs/search-indexing-implementation-brief.md` in the wixy repo) found no JSON-LD structured
data anywhere on `cottageaesthetics.co.uk`, and no favicon (`/favicon.ico` returned `404`). The
brief asked for a `WebSite` node, an accurate `LocalBusiness`-family node "sourced from the site
repository," and a stable favicon — leaving the mechanism and the exact Schema.org subtype open.

The mechanism and the real-world-fact judgment calls (which `@type`s are defensible, how the
address should be structured) were ruled separately, in the wixy engine repo, by the fable
architecture consult (relation `152f1a9f`, confidence 0.85) and recorded there as
decisions/00139. This entry covers only what's specific to *this* repo: authoring the ruled
`business` block, designing/producing the favicon files, and wiring the per-page `<link>` tags.

## What was decided

**`content/_global.json` gained a top-level `business` block** (inserted in this file's existing
alphabetical key order — after `brand`, before `email` — and reusing its existing
`json.dumps(..., indent=2, sort_keys=True)` formatting convention exactly, confirmed by
round-tripping the file through that exact call before editing and diffing byte-for-byte against
the original):
```json
"business": {
  "address": {
    "addressCountry": "GB",
    "addressLocality": "Kidderminster",
    "postalCode": "DY10 4JA",
    "streetAddress": "8 Walton Road, Hartlebury"
  },
  "types": ["HealthAndBeautyBusiness", "MedicalBusiness"]
}
```
Every value here is ruled by the wixy-side consult, not authored fresh in this repo:
`addressLocality` is "Kidderminster" (Royal Mail post-town convention) rather than "Hartlebury"
(the village the street line also names); no `addressRegion` is invented; the dual `@type`
resolves the tension between Purdi's NMC registration/medical framing and the actual
cosmetic/aesthetic (not diagnostic) treatments on offer, after `MedicalClinic`/`DaySpa`/
`BeautySalon` alone were each individually falsified against the real facts. `phone`, `email`,
`social`, and `hours` — all of which the wixy engine's `builder/structureddata.py` reads
directly to build `telephone`/`email`/`sameAs`/`openingHoursSpecification` — already existed in
this file and were deliberately left untouched, never duplicated.

**Favicon**: three new files at the repo root —
- `favicon.svg` — the exact SVG the peer wixy-engine session designed and visually verified
  beforehand (artifact reviewed pre-implementation): a three-petal botanical form built from
  three overlapping ellipses in this project's own `theme.json` colours (`olive #6E7357`,
  `clay #B26E4A`, `olive-deep #565B43`, confirmed against `theme/theme.json` directly, not taken
  on trust) on a `cream #F1E8D9` disc — deliberately not a shrunk `Pinyon Script` wordmark, which
  the brief itself flagged as illegible at 16px.
- `favicon.ico` — multi-resolution (16×16, 32×32, 48×48), rendered from that SVG via a headed
  Playwright Chromium screenshot at 2048×2048 (transparent background preserved) then
  downsampled with Pillow (`Image.save(..., format="ICO", sizes=[...])`).
- `apple-touch-icon.png` — 180×180, the same source image flattened onto a solid `#F1E8D9`
  background (not left transparent) since iOS ignores alpha on touch icons.

All three were extracted and visually inspected — including the *actual* embedded 16px/32px/48px
`.ico` frames, not just the pre-encoding source render — before being committed; none of this
was shipped unseen.

**Per-page `<link>` tags**, hand-authored in all nine `pages/*.html` templates (the ruled
decision: mechanics generic in the engine, but the tags themselves are site-repo work, the same
posture `theme.css`'s own `<link rel="stylesheet">` already has), inserted immediately after the
existing `site.css` link:
```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```
Root-absolute hrefs (matching the exact snippet specified), not the bare-relative form
`theme.css` itself uses — functionally identical on this flat, single-level site (every relative
href resolves to the same `/​<name>` URL either way), but the absolute form is the standard,
depth-independent way to declare a favicon and was given as exact code to use, not just a
convention to infer. Not added to the two auto-generated output categories that aren't page
templates at all: `404.html` and the three WP2 static-redirect alias pages
(`home.html`/`book-online.html`/`english-privacy-policy.html`) — browsers already fall back to
`/favicon.ico` by default on any page with no explicit `<link>`, so this is a scope boundary, not
a gap.

**Verified locally** against the wixy engine at `feat/structured-data-favicon` (commit
`8783844`, not yet merged there — see "What to watch for"): `validate` reports zero
`structured-data-drift` warnings (independently confirmed by running the module's own substring
check against this file's actual `address` text before relying on it); `build --indexable true`
emits a `<script type="application/ld+json">` on `index.html` only, containing both the
`WebSite` node and the `LocalBusiness`-family node with the correct `@type` array, `address` as
a full structured `PostalAddress` (not degraded to the plain-string fallback), `sameAs` with both
social URLs, and `openingHoursSpecification` with exactly 5 entries (Monday/Tuesday/Thursday/
Friday/Saturday — Wednesday and Sunday correctly absent, since they're `closed`); all three
favicon files land in the build output; all nine real pages' rendered `<head>` carry the three
`<link>` tags; `sitemap.xml` is unaffected (still exactly the original 9 URLs).

## Why

- Authoring `business.address` once, by hand, rather than having the engine parse it from the
  free-text `_global.json.address` display string, is a deliberate, empirically-grounded choice
  (wixy decisions/00139): that display string's shape has already drifted once in this exact
  project's history (an array, in an earlier version, to today's `<br>`-joined string), so no
  parser written against today's shape could be trusted to survive the next drift. The
  substring drift-check this repo's `validate` now runs is the safety net for that, not a
  substitute for getting the authored value right in the first place.
- A generic engine mechanism gated on the existing `--indexable true` flag (Inv 35's own
  `sitemap.xml` precedent — nothing here-repo-specific needed to change in `pages.yml`/`ci.yml`)
  keeps this repo's side of the work to exactly what only this repo can supply: real addressing
  facts, brand colours, and per-page markup.

## What to watch for

- **This PR may sit unmerged for a while, same pattern as WP2 (decisions/00019).** wixy PR #204
  (the engine mechanism this depends on) is not yet merged — it's blocked on an infra fault in
  the audit-gate spawn path, unrelated to this content. Verifying against the branch commit
  directly (as this entry describes) rather than waiting for merge is the established pattern;
  this PR should still merge on its own CI once opened, since `ci.yml`'s own wixy checkout
  tracks the upstream default branch and will pick up PR #204 automatically once *it* merges.
- **The favicon needs Purdi's own visual sign-off before any Publish actually ships it** — that
  approval is not this session's (or the wixy-engine session's) to grant. The original design
  artifact, produced and already visually verified by the wixy-engine session before this PR
  existed, should be shared with her directly:
  https://claude.ai/code/artifact/ba89d011-5461-49f3-b6e8-846bc9b19e07
- **Named falsifiers from the wixy-side ruling** (repeated here since this repo is where the
  underlying facts would actually change): if the site's own copy ever drops the medical framing
  (NMC registration, medical indemnity, "nurse-led"), the `MedicalBusiness` half of the dual
  `@type` stops being defensible and `business.types` should be revisited. If Purdi's actual
  Google Business Profile listing ever splits the address differently, re-author
  `business.address` to match that authoritative source, not this decision's own choice.
- If `_global.json.address`'s visible text is ever edited, re-check that `business.address`'s
  `streetAddress`/`addressLocality`/`postalCode` still appear as substrings of it (HTML-stripped)
  — `python -m builder validate` will surface a `structured-data-drift` warning if not, but it's
  non-blocking, so it's easy to miss without deliberately checking.
