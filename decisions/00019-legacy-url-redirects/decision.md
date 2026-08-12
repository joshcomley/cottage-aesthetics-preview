# Decision: site-owned `redirects.json` + `pages.yml` wiring for retired Wix paths

## Symptom

The 2026-08-12 search-indexing audit (wixy engine repo, workspace 00027,
`docs/search-indexing-implementation-brief.md`, Work package 2) found that four retired Wix
paths 404 on the live `cottageaesthetics.co.uk` GitHub Pages deployment: `/home`,
`/book-online`, `/cart-page`, `/english-privacy-policy`. Three have a genuine current-site
equivalent (`/home` → `/`, `/book-online` → `/treatments`, `/english-privacy-policy` →
`/policies`); `/cart-page` is unrelated Wix template cruft with no equivalent on this site and
was confirmed live-404 on purpose — it must stay a 404, not gain an alias.

GitHub Pages cannot serve a real HTTP 301, so a server-side redirect facility (this project has
none anyway — it's a static host) was never an option. The wixy engine's Work package 2 built
the actual mechanism for this — `builder/staticredirects.py`, that repo's decisions/00136 —
generating a minimal static alias page (zero-delay `meta http-equiv="refresh"` +
`link rel="canonical"`) per legacy path, opt-in via a new `--static-redirects-file <path>` CLI
flag. This entry (Work package 3, the site-repo half of the same programme) covers only what's
specific to *this* repo: the actual three-entry map and the workflow wiring that turns the flag
on. The engine mechanism itself is not duplicated here — see the wixy repo's own decision for
the validation rules, HTML shape, and rationale.

## What was decided

- New `redirects.json` at the repo root — this repo has no existing `config/`/`data/`
  directory for build-time inputs (its only top-level dirs are `content/`, `pages/`,
  `partials/`, `theme/`, `images/`, `decisions/`, `todos/`), so root is the natural home for a
  single flat JSON file consumed directly by the build command. Contains exactly:
  ```json
  {
    "/home": "/",
    "/book-online": "/treatments",
    "/english-privacy-policy": "/policies"
  }
  ```
  `/cart-page` is deliberately omitted — see Symptom above.
- `.github/workflows/pages.yml`'s build step gained one flag,
  `--static-redirects-file redirects.json`, alongside its existing `--root`, `--project`,
  `--domain`, `--indexable`, `--out` flags — nothing else in that workflow changed. `redirects.json`
  is resolved relative to the job's working directory (the site-repo checkout root, same as
  `--out _site`), matching how the existing `--project wixy/projects/ca.json` flag is already
  resolved relative to that same cwd rather than to `--root`.
- `.github/workflows/ci.yml`'s own `build` step was deliberately left untouched — this work
  package's brief scoped the edit to `pages.yml` only, and CI's build step exists to drive the
  rendered-parity check against the baseline screenshots of this site's nine real content pages,
  not to exercise the alias-page mechanism. See "What to watch for" below for the coverage gap
  this leaves.
- Verified locally (391afb13, the wixy-engine merge commit that shipped the mechanism, or later
  — `git clone`d to a throwaway location, never edited): a `python -m builder build` run with the
  exact flag set `pages.yml` now uses (mirroring its checkout layout — this repo's tree at the
  build root, the wixy engine checked out into a `wixy/` subdirectory alongside it) produces
  `home.html`, `book-online.html`, and `english-privacy-policy.html`, each with the correct
  `meta http-equiv="refresh"` target and absolute `link rel="canonical"`, no `noindex` (since
  the real deploy always passes `--indexable true`), and no `cart-page.html`. `sitemap.xml`
  still lists exactly the original nine canonical pages, no alias entries — confirming the
  engine's documented behavior (alias pages are never added to `page_contents`, so sitemap/nav
  generation exclude them automatically). Extensionless/`.html`-suffix/trailing-slash resolution
  (Invariant 33 in the wixy engine's numbering) was checked directly against
  `builder.serving.resolve_site_path` for both a real page (`/about`) and all three new aliases:
  both URL shapes resolve to the same file, a trailing slash never does, for aliases exactly
  like real pages — no special-casing needed anywhere, matching the engine decision's claim.

## Why

- The three retired paths are the ones with a real current-site destination; forwarding them
  preserves whatever inbound links/bookmarks/search-engine equity point at the old Wix URLs
  instead of dead-ending visitors and crawlers at a 404.
- `/cart-page` has no destination to forward to — aliasing it to anything would be a fabricated
  mapping, not a real equivalence, so it stays a genuine 404 exactly as before this change.
- Keeping the map and the workflow flag as the only site-repo-side change (versus reimplementing
  or duplicating any part of the engine's mechanism here) matches the engine decision's own
  Invariant 1 — the generic capability lives in `builder`, the Cottage-Aesthetics-specific data
  lives here.

## What to watch for

- **Live GitHub Pages behavior is not yet verified.** This decision (and the PR that carries it)
  only proves the build mechanism is wired correctly, using a local build against the wixy
  engine. Proof that `/home`, `/book-online`, and `/english-privacy-policy` actually resolve on
  the real public site requires this PR merged to `main`, **and then the site owner's own next
  Publish or Restore** (which is what advances `wixy-live` and re-triggers the Pages build,
  automatically picking up the new flag) — an owner-gated action no agent triggers on her
  behalf. Do not report this as "live-verified" until that has actually happened and been
  checked with a real HTTP request against `cottageaesthetics.co.uk`.
- **`ci.yml`'s build step does not pass `--static-redirects-file`**, so a future edit to
  `redirects.json` (a new entry, a typo, a bad target) gets no CI-time validation today — the
  engine's strict-reject validation (bad shape, source/target collisions, chains/loops, the
  reserved-name list) only runs during the actual Pages deploy build, which is owner-gated and
  has no PR-time gate of its own. This PR's own verification instead relied on a manual local
  build against the engine at the time of writing. A future change wanting CI-time coverage of
  redirect-map edits would need to add the same flag to `ci.yml`'s build step (and decide
  whether the parity harness's baseline should account for the alias pages) — a deliberate
  follow-up decision, not something this entry does by default, since this work package's scope
  was `pages.yml` only.
- The map's grammar is intentionally narrow (single path segment or bare `/`, no nested paths,
  no query/fragment forwarding) — see the wixy engine's `builder/staticredirects.py` and its
  decisions/00136 before assuming a future entry with a nested path or forwarded query string
  will just work; it won't, by design.
