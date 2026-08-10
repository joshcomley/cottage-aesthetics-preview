# Decision: header's dark overlay (decisions/00015) is desktop-only, not a general fix

## Symptom / request

After decisions/00015 shipped (a `rgba(18,12,9,.64)` background behind the fixed header
whenever it sits over the home page's photo hero, applied at every viewport width), the
owner asked explicitly for it to appear **only at desktop sizing, not mobile** — i.e. revert
mobile's header back to its original transparent-with-text-shadow look, keep desktop as
fixed.

This is a direct, explicit design instruction, not a technical bug report. 00015 already
established that mobile has the *same underlying legibility gap* as desktop (verified by
screenshot at 390px before that fix) — that finding still stands, and this decision doesn't
contradict it. It's simply a deliberate call that on mobile the original look is preferred
regardless.

## What was decided

Added one line inside the existing `@media(max-width:860px){...}` block (the same 860px
breakpoint that already switches `.nav-links`/`.menu-toggle` for mobile):

```css
header:has(~ .hero):not(.scrolled):not(.menu-open){background:none}
```

An exact mirror of 00015's selector, so it's legible at a glance as "the mobile-width undo of
that specific rule" rather than a new independent condition to reason about. `background:none`
resets to the same transparent state the header had before 00015 (confirmed against the
pre-fix computed-style probe: `background-color: rgba(0, 0, 0, 0)`).

Placed as an override in the *existing* mobile block rather than rewriting 00015's base rule
into a new `min-width` query — keeps the diff to one line, and keeps every "what's different
on mobile" rule in the one block a future reader already checks first. Source order (this
block sits after the base rule) is what makes the override win at equal specificity; no
`!important` needed.

`:not(.menu-open)` is preserved from 00015 for the same reason as before — without it, this
new mobile rule's specificity would still be capable of outranking `header.menu-open`'s cream
background in principle, even though in practice the background is `none` either way at this
width once the override applies. Keeping the exclusion is just consistency with 00015's
established pattern, not load-bearing here.

## Verification

Playwright screenshots before/after, same method as 00015:
- `index.html` mobile (390px) — reverted to the original transparent header (matches the
  pre-00015 appearance byte-for-byte in visual terms: brand wordmark faint against the light
  window/wall, same as first reported).
- `index.html` desktop (1560px) — unchanged, still has the dark overlay from 00015.

## Unrelated finding surfaced while verifying (not fixed here — out of scope)

Running the wixy repo's `builder parity` check locally against this change surfaced a large
set of failures (mismatched nav link hrefs, a gallery image reporting 0×0 natural dimensions,
console errors, ~100% screenshot diffs on `index` and `contact`) that have **nothing to do
with this CSS change** — confirmed by cloning plain `origin/main` fresh and finding the same
drift already present: `content/_global.json`'s nav hrefs are now extensionless (`/about`)
where the committed parity baseline still expects `.html`-suffixed links, and `content/
contact.json`'s content has moved on substantially since the baseline was last captured.

Root cause: a commit titled `wixy: publish v51 — Content update via Wixy editor` landed
directly on `main` (via the Wixy admin's own publish flow writing back to the site repo),
bypassing the PR-based CI gate entirely — so nothing recaptured the parity baseline for it.
The gallery image itself is fine on disk (`content/gallery.json` correctly references an
existing file); the 0×0 reading was a load-timing artifact from a now-larger gallery, not a
broken reference.

Practical consequence for this PR: the companion wixy-repo baseline recapture needed to run
against **all** default slugs (not just `index`, as decisions/00015's recapture was scoped to)
to bring the committed baseline back in sync with current `main` — otherwise this PR's CI
would fail on pre-existing drift that isn't this PR's to fix.

Left as a surfaced observation rather than something fixed in this PR: whether admin-editor
content publishes should also trigger a baseline recapture (or a lighter content-only parity
check) is a pipeline-design question bigger than a header CSS scoping change, and better
decided deliberately than as a drive-by fix here.
