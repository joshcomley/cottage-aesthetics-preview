# Milestone 4 step 3: faq.html annotation

## Context

Spec/03-site-migration.md §3 step 3, fifth page — `faq.items` (8 `<details>` Q&As).
Per the handover, `faq.items` intentionally has NO fixed JSON Schema in
`builder/schemas/` and NO `COLLECTION_RULES` entry (spec/02 §10's validation list
doesn't mention it) — not a gap to fix, confirmed again here rather than re-litigated.

## Decisions

**1. The "How do I book?" answer's inline `style="border-bottom:1px solid
var(--brass)"` on its `<a class="js-book">` link moved to a `.fbody a` rule in
`site.css`** — per spec/03 §3 step 3's own explicit instruction ("the FAQ answer's
inline underline style moves to a `.fbody a` CSS rule so the rich-lite value
sanitizes to itself"). `builder/sanitize.py`'s rich-lite allowlist for `a` only
permits `href`/`target` attributes (no `style`), so the inline style would have been
silently stripped from the bound content value on every render — spec anticipated
this exact case and named the fix directly.

**2. `sanitize_rich_lite` auto-injects `rel="noopener noreferrer"` onto every `<a>`
tag** (an nh3/ammonia security default, unconditional — not configurable via the
sanitizer's current allowlist args). Verified directly: a `<a href="#"
class="js-book">Book Now</a>` value sanitizes to itself PLUS the injected `rel`
attribute, so it is NOT "already clean" without that attribute present in the
authored JSON. Since `python -m builder validate`'s `_apply_text` reports ANY
clean-mismatch as a `not-clean` `ValidationError` (and `ValidationResult.ok` is
`not errors` — there is no advisory/blocking distinction at this layer, unlike the
parity harness's `ParityIssue.advisory`), the FAQ answer's content value includes
`rel="noopener noreferrer"` explicitly so `validate` passes clean on the first run.
Confirmed inert for this specific link (no `target` attribute, so `rel=noopener/
noreferrer` has zero visible or behavioral effect — it only matters for
`target="_blank"` links) and confirmed the parity harness's probes don't compare
`rel` attributes at all, so this has no parity implications either way — it is
purely a `validate`-cleanliness requirement.

**3. `faq.items`'s field names are `{question, answer}`.** No prior precedent to
follow (this is the first unschema'd collection annotated) — chosen for clarity
over reusing another collection's field names (e.g. rx-item's `title`/`body`) since
"question"/"answer" is unambiguous for a Q&A pair and there's no schema to keep
in sync across pages.

**4. The `<details data-wx-list-item>` list-item template needed NO
`display:contents` wrapper**, unlike treatments.html's `sections[]`/`rx.items` or
gallery's sliders/tiles. Checked directly: `.wrap{max-width:1160px;margin:0
auto;padding:0 1.6rem}` in `site.css` is a plain block container (not flex/grid,
no `nth-of-type` styling depending on this page's `<details>` elements), and the
FAQ items collection has no other bound content sharing its container (unlike
treatments' `rx.items` case, decisions/00002 point 2) — a bare wrapping `<div>`
around the list-item template renders identically to the original's unwrapped
`<details>` siblings. Not every `data-wx-list` container needs the invisible-
wrapper trick; check the actual CSS before reaching for it reflexively.

## Verification

`python -m builder validate` clean. Direct raw-vs-built parity check (bypassing the
committed baseline): 0 failures, 0 advisory, across text/links/images/computed-
styles/screenshots, all 9 pages, desktop + mobile.

## What to watch for

- Decision 2's `rel` auto-injection applies to ANY future rich-lite content
  containing an `<a>` tag on the remaining pages (contact.html's form copy is the
  next likely candidate) — check `sanitize_rich_lite(value) == value` before
  assuming a hand-authored link value is validate-clean.
- Decision 4's "check before wrapping" note generalizes: `display:contents` is a
  fix for a specific problem (flex/grid child participation, nth-of-type sibling
  counting, or DOM-order relative to un-wrapped siblings), not a default to apply
  to every new `data-wx-list` container.
