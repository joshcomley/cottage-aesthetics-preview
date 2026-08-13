# Decision: four treatment landing pages (Brief WP5), reuse-only sourcing, hub-not-nav

## Symptom

Brief Work package 5 (`docs/search-indexing-implementation-brief.md`, wixy repo) identified
that `/treatments` covers every treatment in one page, but there's no dedicated, deep-linkable
page per treatment for search queries like "microneedling Hartlebury" to land on. The brief's
own recommended first set: `/microneedling`, `/skin-boosters`, `/polynucleotides`,
`/dermal-fillers` — explicitly gated on real clinical-content review risk ("carries the
greatest content/clinical review burden" of the whole programme) and requiring every new
assertion about candidacy, qualifications, safety, or outcomes to be sourced, not invented.

## What was decided

**Four new pages, deliberately not in top nav** (`meta.inNav: false` on all four,
`meta.navOrder: 0` since unused) — the existing `/treatments` catalogue stays the single hub;
each new page is reached via a contextual "Learn more →" link from its matching catalogue
section, matching the brief's own steer ("a treatment hub with contextual links is likely
cleaner than four extra top-level nav items").

**Every fact reused, nothing invented.** Card meta/price/course/body copy for all 9 option
cards across the 4 pages is copied verbatim from the already-published `content/treatments.json`
(the exact same sections: Microneedling, Skin Boosters, Polynucleotides, Dermal Fillers). FAQ
answers reuse `content/faq.json`'s existing general answers verbatim, or with the treatment
name substituted into "Will X hurt?" — same underlying claim, not a new one. The qualifications
claim used identically on all 4 pages ("a Registered Nurse with the NMC") is sourced directly
from `content/about.json`'s `creds.item1` ("Registered with the Nursing & Midwifery Council
(NMC)") — checked directly against that file, not assumed from the brief's own framing. The
aftercare paraphrase is a condensed, faithful summary of `content/aftercare.json`'s
`first24h`/`followingDays` items — checked directly, not assumed. Dermal fillers' intro
philosophy line ("never to change who you are... enhance what makes you uniquely you") is a
close paraphrase of `content/about.json`'s own `philosophy.body2` — same source, confirmed by
direct comparison. The only genuinely new sentences are non-clinical connective copy and one
"how many sessions" FAQ per page, built only from the price/course fields already on
`treatments.json` — no new candidacy, contraindication, longevity, or outcome claim anywhere.

**Same template shape for all 4 pages**: hero → intro → options grid → consultation/safety
blurb → aftercare blurb + link → FAQ → CTA strip. Reuses `.tgrid`/`.tcard`/`.page-hero`/
`.prose`/`.cta-strip`/`.faq`/`.fbody` — all already global in `site.css`, confirmed by direct
grep before relying on it (not just taken on trust) — plus a small page-local `.cat`/`.course`
rule set copied from `treatments.html`'s own existing local style (also not global, confirmed
the same way).

**`.creds` promoted from `about.html`'s page-local style into `site.css`.** It was previously
page-local to `about.html` only (confirmed by grep — not actually global despite looking like
a natural candidate for it). Since this PR brings its total usage to 5 pages, duplicating the
one-line rule (`background:var(--cream-2)`) into 4 more page-local style blocks would be the
wrong call — promoted the single shared declaration to `site.css` instead, left `about.html`'s
own `.creds .wrap`/`.creds ul`/`.creds li`/media-query rules alone (genuinely specific to its
checklist grid, not reused here).

**`detailUrl` mechanism**: an optional field on 4 of the 5 `sections` array entries in
`content/treatments.json` (not "Start Here", which correctly has no detail page). A new
`data-wx-if=".detailUrl"` link in `treatments.html`, styled with a small new page-local
`.sub-link` rule (a plain text link — olive/clay, no button chrome — `.btn-link` didn't
already exist despite looking like it should, confirmed by grep; kept minimal per the brief's
own "don't over-design it" steer rather than inventing a new global button variant).

**Draft-flag banner added to all 4 pages — beyond the original content package, my own
addition.** This repo already has an established, visible on-page convention for exactly this
situation (`.draft-flag`, global in `site.css`, used identically on `aftercare.html`/
`faq.html`/`policies.html` for "not yet reviewed by owner" content) — found by checking how
those three pages actually handle draft content, not assumed. Given this whole package is
explicitly gated on Purdi's clinical review before Publish, using the same durable, in-Wixy-
preview-visible mechanism this repo already relies on is more robust than a PR-description-only
checklist she might not see. Flagged here explicitly since it wasn't in the original template.

## Verification — two real bugs found and fixed, not just "looked right"

Running `python -m builder validate` and `build` against the current wixy engine caught two
genuine defects before they reached a PR, both root-caused rather than worked around:

1. **`&` in `consultation.eyebrow` ("Safety & suitability") failed the `not-clean` check** —
   `builder/bindings.py`'s text-binding path checks whether the JSON value's own
   `sanitize_rich_lite()` output differs from what's stored; a raw ampersand sanitizes to
   `&amp;`, which differs, so it's flagged. This repo already has this exact convention
   documented (`content/treatments.json`'s own `"Facial Rebalancing &amp; Rejuvenation"`,
   this repo's `CLAUDE.md` referencing decisions/00075: "Category labels containing an
   ampersand must be stored pre-escaped") — fixed by storing `&amp;` in all 4 JSON files
   (matching the existing convention exactly) and the corresponding template fallback text.
2. **`data-wx-if=".detailUrl"` on the "Start Here" section crashed the build entirely** — not
   a validate warning, an unhandled `BuildError` that aborted `build_site`. Root cause: a
   `data-wx-if` key that is genuinely *absent* (not just falsy) raises hard in publish mode —
   documented precedent already existed in this repo's own decisions/00009 ("a `data-wx-if`
   key that's genuinely ABSENT... raises a hard `BuildError`... only works because every
   single item is guaranteed to carry the key"), which is exactly what "Start Here" violated
   by design (it was deliberately given no link). Fixed by giving "Start Here" an explicit
   `"detailUrl": ""` (present-but-empty, mirroring the existing `.course` field's own
   precedent for "this card has none") rather than omitting the key.

Both fixes verified: `validate` reports zero errors/warnings; `build` completes cleanly.

Further checks, all run against the actual build output rather than assumed from the source:
- All 4 new pages carry a unique `<title>`, `<meta name="description">`, `<h1>`, and absolute
  `<link rel="canonical">` (checked directly, not assumed from the template).
- `sitemap.xml` correctly lists all 4 new URLs alongside the original 9 (13 total).
- The site nav (`.nav-links`, checked via BeautifulSoup, not a fragile text grep) contains only
  the original 6 entries — none of the 4 new pages leak into it, confirming `inNav: false`
  actually holds end-to-end.
- `treatments.html`'s 4 new "Learn more →" links resolve to the correct 4 URLs; "Start Here"
  correctly has none.
- Visual screenshots (desktop 1280px and mobile 390px, a fresh page and the hub's linked
  section) confirm clean, correctly-styled rendering — the promoted `.creds` background, the
  card grid, and the new hub link all render exactly as intended, no layout breakage.

## What to watch for

- **The wixy-side parity baseline will need recapturing from this PR's own branch before its
  own CI is fully green — this is expected, not a bug.** Running the existing parity check
  (unchanged `--slugs` list; the 4 new pages have no prior baseline to compare against and
  aren't added to it) correctly flags `treatments/text` and `treatments/links` as real,
  non-advisory failures: the page's text and link set genuinely changed (4 new "Learn more"
  links + surrounding text), and the committed baseline predates this PR. This matches this
  repo's own established precedent exactly (decisions/00008's "two-step" pattern: content-only
  drift rebaselines against `main`, but a PR that changes page *behaviour* needs the baseline
  captured from that PR's own branch) — no wixy engine *code* change is needed, only a
  baseline *recapture*, which is a wixy-engine-repo action this session cannot perform itself.
- **This PR is a draft, gated on Purdi's review — not ready to Publish under any
  circumstance.** The owner checklist (every new/expanded assertion, per page) is in the PR
  description, and every new page carries an on-page `draft-flag` banner she'll see in Wixy's
  own preview. Neither this session nor the wixy-engine session presses Publish or Restore —
  that gate belongs to her alone.
- If a future treatment page is added the same way, remember the `data-wx-if` absent-key trap
  above — always give the "no link" case an explicit empty value, never omit the key.
