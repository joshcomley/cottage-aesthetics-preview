# Decision: bind the Contact map's iframe src to @mapSrc

## Symptom

The operator, after decisions/00014 shipped the Call/Email cards: "it should update the
map." `pages/contact.html`'s Google Maps iframe had the address hard-coded in its `src`
(`https://www.google.com/maps?q=8+Walton+Cottage,...&output=embed`) — editing the address
anywhere (including the new wixy Settings > Contact tab from decisions/00014) changed the
displayed text everywhere but left the map pointing at the old location forever, with no
error anywhere to surface it.

## What was decided

`iframe.src` is now bound: `data-wx-attr="src:@mapSrc"` alongside the existing static `src="…"`
(kept as the pre-build placeholder text, exactly what a raw/unbuilt view of the template
shows — the builder overwrites it, same convention every other bound attribute in this repo
already follows). `@mapSrc` is a DERIVED key the wixy engine's admin now maintains
(decisions/00129) — the address is the map source by default; an optional pin placed in the
new Contact tab's map picker overrides it. Nothing in this repo computes the derivation;
`content/_global.json` just carries whatever the engine last derived, the same as every other
`_global`-sourced value.

## What was decided — the `_global.json` migration

Two new keys added, seeded so the FIRST publish is visually identical to before: `mapCoords:
""` (no pin — matches the "address is the default" behavior) and `mapSrc` seeded with the
EXACT current hard-coded URL string (byte-for-byte, not the engine's own derivation — the
derivation's output differs in two harmless, documented ways: comma normalization and
percent- vs `+`-encoding, see decisions/00129's "what to watch for") — so nothing visibly
changes until the owner actually touches the Contact tab. Confirmed via a local build: the
built `contact.html`'s `src` resolves to the identical string modulo HTML's own `&` ->
`&amp;` entity-escaping (expected, not a regression). Both keys are now REQUIRED (`Inv 3`: a
bound key missing from `_global.json` is a hard `BuildError`) — this repo's `_global.json`
must never drop `mapCoords`/`mapSrc` going forward.

## What was decided — sequencing

The wixy engine's PR generalizing the href scheme-injection guard to `data-wx-attr`'s
URL-bearing attributes (`src`/`href`/`action`/`formaction`/`xlink:href` — decisions/00129)
merges BEFORE this repo's `src:@mapSrc` binding goes live, so the guard exists before
anything could depend on its absence — matching this project's established schema-before-
content ordering discipline.

## What to watch for

- `mapSrc`'s value is entirely engine-derived; never hand-edit it directly in this repo — a
  hand-edit would just be overwritten the next time the owner edits her address or pin in
  the admin, and would drift from what the derivation actually produces.
- If the parity baseline needs a fresh capture for the `contact` page after this lands, use
  the established `capture-baseline.yml` two-step (dispatch against this branch's tip) —
  local validation + a local build both confirmed the rendered output is unchanged, so this
  should not be needed, but flagging the mechanism per this project's own established
  practice regardless.
