# Decision: content migrated to clean-URL hrefs; legacy `.html` links tolerated

## Symptom

Follow-on from the GitHub Pages go-live (decisions/00013): the operator asked whether the
`.html` suffix could be dropped from every public URL. The full design — why `page_url` now
emits `/<slug>` instead of `/<slug>.html`, the zero-redirect strategy (GitHub Pages itself
can't redirect, so the server mirrors Pages rather than diverging from it), and the
trailing-slash-is-404 contract — is recorded once, in the wixy engine repo's
**decisions/00128**, not duplicated here. This entry covers what's specific to *this* repo:
the content migration.

## What was decided

Every internal href in this repo's own content/templates was migrated from a relative
`<slug>.html` (or, for the header logo, `index.html`) shape to a root-absolute clean URL
(`/<slug>`, `/` for home):

- `content/_global.json` — all 8 footer links (`explore`/`visit` columns).
- `pages/about.html`, `aftercare.html`, `faq.html`, `policies.html` — the "Contact Purdi"/"Ask
  Purdi" CTA (`href="contact.html"` → `href="/contact"`).
- `pages/index.html` — the hero "View Treatments" button, the "View the full treatment menu"
  CTA, and the "Read more reviews" link.
- `pages/treatments.html` — three same-page-anchor CTAs (`href="index.html#contact"` →
  `href="/#contact"`; the header, the "Enquire" button, and the closing CTA strip all carry
  one each — the wixy-side brief that scoped this migration undercounted this at two, found by
  re-grepping `content/ pages/ partials/ site.js` exhaustively rather than trusting that count).
- `partials/header.html` — the brand/logo link (`href="index.html"` → `href="/"`), likewise not
  in that original scoped list; the site's own logo pointing home is exactly the kind of link a
  shape-only grep for the word "contact"/specific slugs would miss, which is why the exhaustive
  re-grep step matters more than the starting checklist.

This is a **migration**, not a new validation rule — `builder/schemas/footer-link.schema.json`
and `nav-extra.schema.json` (checked before this migration, per the wixy-side decision) place
no shape constraint on `href`, only `type: string`. An owner-typed or not-yet-republished
`<slug>.html` link anywhere in this content would keep resolving exactly as it does today;
nothing here depends on every href being clean, it's just the new house style going forward.

Verified against a real `python -m builder validate` + `build` (using the wixy engine's
clean-URL changes) before this PR was opened: zero validation errors, and the built pages'
`href="..."` attributes (excluding `data-wx-href` binding-name attributes, which are a
different thing and unaffected) all carry the migrated shape.

## What to watch for

- **Never treat "shape-migrate every literal `.html` string" as a search-and-replace across
  this whole repo without re-grepping first** — `site.js`'s own comment referencing
  `partials/{footer,booking-modal}.html` (real filenames on disk, never URLs) is exactly the
  kind of false positive a blind replace would corrupt.
- New internal links added to this content going forward should use the clean, root-absolute
  shape (`/<slug>`) — the house style now, even though the legacy shape still works.
