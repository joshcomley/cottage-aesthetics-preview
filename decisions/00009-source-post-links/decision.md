# Decision: source-post links on the before/after gallery

## Symptom

The operator: "we need to have links back to the original Facebook and/or Instagram posts in
the imported before/afters." decisions/00008 imported 67 real posts as hidden gallery
entries; none of them (nor the 7 items that predate that import) carried any link back to
where they came from.

## What was decided

The wixy engine (companion PR, wixy repo decisions/00120) gained a new `url` admin field
kind and a `gallery.sliders.sourceUrl` schema field. This repo's two changes:

**Template** (`pages/gallery.html`) — each slider's `<figcaption>` gains a small link:
```html
<a class="cap-source" data-wx-if=".sourceUrl" data-wx-href=".sourceUrl" target="_blank" rel="noopener">View original post &#8599;</a>
```
Styled `.cap-source` to match the existing `.cap-sub` idiom (small, uppercase, Jost
sans-serif) but in `--olive` with an underline, so it visibly reads as a tappable link rather
than the purely descriptive `.cap-sub` text next to it. **`data-wx-if` here is load-bearing,
not optional polish** — see decisions/00120 in the wixy repo for the full trace through
`builder/bindings.py`: a `data-wx-if` key that's genuinely ABSENT (not just falsy) raises a
hard `BuildError` in publish mode, so this only works because every single slider item is
guaranteed to carry a `sourceUrl` key (below), never left unset.

**Data backfill** (`content/gallery.json`) — every one of the 74 current `gallery.sliders`
items now carries `sourceUrl`, joined against decisions/00008's own `manifest.json`:
- 66 matched by exact before+after filename pair.
- 1 matched by extracting the Instagram shortcode from whichever side of the pair still
  carried its original `ba-ig-<shortcode>-`/`ba-fb-<id>-` filename (some items have since
  been through the admin's aligner, which re-uploads a new content-hashed filename for one or
  both sides) and looking that id up in the manifest directly.
- The remaining 7 got `sourceUrl: ""` deliberately, not a guess: 2 are the ORIGINAL
  hand-curated items that predate decisions/00008's import entirely; the other 5 were added
  later, one at a time, via the admin's own wizard using already-uploaded raw files with
  generic filenames (confirmed via `git log -S`/`git show` archaeology on this file's own
  history — each is a pure addition, never a modification of an existing manifest-tracked
  item) — never part of the tracked import, so there is no source URL to recover for them.

A `(title, sub, cat)` caption-based fallback was tried FIRST and rejected after it produced
confirmed false positives (multiple unrelated gallery items sharing the same generic
auto-assigned caption all resolving to one single manifest post) — full reasoning in the
wixy repo's decisions/00120, not duplicated here.

Final tally — 67 real links, 7 empty — exactly matches decisions/00008's own count of 67
tracked imports, the strongest signal the join is complete rather than partial.

## A cross-repo CI dependency, hit and fixed while shipping this

This repo's own `validate-build-parity` CI job always checks out the WIXY ENGINE's
**upstream default branch** (`.github/workflows/ci.yml`'s `actions/checkout` step, `repository:
${{ vars.WIXY_ENGINE_REPO || 'joshcomley/wixy' }}`) — not any particular PR branch there. The
`gallery-slider.schema.json` that `sourceUrl` needed (`additionalProperties: false`, so an
undeclared key is a hard validation error, not a silent pass-through) lives in THAT engine
repo, not this one. Concretely: this PR's own CI failed first with 74 `unexpected property
'sourceUrl'` errors, because the companion wixy PR (#164, decisions/00120) hadn't merged to
wixy's `main` yet — the schema `validate` step was running against the OLD schema. **The
correct order is the wixy engine PR first, merged, THEN this one** (or a re-run of this repo's
CI once the engine PR lands) — not "either order, they're independent," which was my own
first assumption and was wrong. The admin FIELD KIND registry (`AdminFieldKind`) genuinely
IS irrelevant to this build path (`validate`/`build`/`parity` never touch it) — only the JSON
SCHEMA file tripped this, a narrower dependency than "the whole engine PR" but still real.

## What to watch for

- Any future addition to `gallery.sliders` — by the admin wizard, a bulk import, or hand
  edit — automatically gets `sourceUrl: ""` for free (the wixy engine's `blankItem()` now
  defaults `url`-kind fields the same way as `text`), so this invariant (every item always
  carries the key) should hold without further action. If a future engine change ever
  regresses that default, `data-wx-if` will fail LOUDLY at publish time (a `BuildError`), not
  silently — that's the intended fail-fast behaviour, not a bug to route around.
- If a future import round adds MORE tracked posts, prefer joining by id/shortcode (as done
  here) over caption text — see decisions/00120 for exactly why the caption approach failed.
