# Decision: GitHub Pages deploy workflow, triggered by `wixy-live` not `main`

## Symptom

The operator: "We are going to be going live with the Wix Published Cottage Aesthetics
website... hosted using GitHub Pages with a custom domain we own." This repo is public and
already had GitHub Pages *enabled* (a leftover from an earlier preview deployment, serving a
stale build with no workflow behind it) but no deploy mechanism of its own.

The full design rationale — why this can't simply build `main` on every push, what
`refs/heads/wixy-live` is, the `WIXY_PUBLIC_DOMAIN` variable, and the pre-workflow-sha restore
edge — is recorded once, in the wixy engine repo's **decisions/00126**, not duplicated here.
This entry covers what's specific to *this* repo: the workflow file itself and the
`CLAUDE.md` guardrail update.

## What was decided

`.github/workflows/pages.yml` triggers on `push: branches: [wixy-live]` plus
`workflow_dispatch` — never on `push: branches: [main]`, unlike this repo's own `ci.yml`. It
checks out `ref: wixy-live` (always, for both triggers — a manual dispatch must still build
whatever the server most recently mirrored, not whatever `main` happens to be at the time),
checks out the wixy engine using the exact same fork-aware pattern `ci.yml` already uses
(`vars.WIXY_ENGINE_REPO` / `secrets.WIXY_DEPLOY_KEY`, kept byte-identical on purpose so the
two workflows' engine-checkout behavior can never drift apart), then runs `builder validate`
+ `builder build --domain "$WIXY_PUBLIC_DOMAIN" --indexable true` before
`upload-pages-artifact` + `deploy-pages`.

A third job, `not-configured`, runs (and succeeds) exactly when `WIXY_PUBLIC_DOMAIN` is unset
— printing an explanation to the job summary instead of silently doing nothing or failing.
This matters because the repo is public: a fork inherits this workflow immediately, and it
must not attempt (and fail) a Pages deploy with no domain configured.

**Action versions** (`actions/checkout@v7`, `actions/setup-python@v7`,
`actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`) were checked against each
action's own GitHub releases at the time of writing rather than copied from `ci.yml`'s older
pins (`@v4`/`@v5`) — `ci.yml` itself wasn't touched, so the two workflows now intentionally
pin different majors for the actions they share; this is a pre-existing-file-untouched
tradeoff, not an inconsistency to "fix" by bumping `ci.yml` in the same change.

## What was decided — `CLAUDE.md`

The "Never publish, never deploy" section is extended, not replaced: it already established
that merging to `main` never touches `ca.cinnamons.uk`; it now also says the same is true of
the public custom domain, explains that `wixy-live` is server-only-written, and tells agents
explicitly never to push that ref by hand or manually dispatch the Pages workflow "to ship
content." Getting this wrong would reintroduce exactly the consent-guardrail gap the original
section existed to close.

## What to watch for

- If `ci.yml` is ever upgraded to newer action majors, consider bringing `pages.yml` back in
  sync at the same time (or vice versa) — nothing enforces the two staying aligned.
- A future contributor reading only this repo's `ci.yml` could reasonably assume "CI green on
  `main`" is the full release story; the `CLAUDE.md` update above is what corrects that
  assumption for a human, but nothing here machine-enforces it — the wixy engine's own
  invariant 32 (server-only writer of `wixy-live`) is the actual enforcement point.
