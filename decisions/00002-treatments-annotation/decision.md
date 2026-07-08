# Milestone 4 step 3: treatments.html annotation

## Context

Spec/03-site-migration.md §3 step 3, third page in the specified order — the most
structurally complex page in the migration (nested `sections[].cards` collection, a
second and independent `rx.items` collection, and the alternating-background
inline-style-to-CSS conversion). This required several judgment calls beyond straight
annotation.

## Decisions

**1. "Start Here" (the free-consultation card) IS section 1 of 5, not a standalone
intro.** The handover left this an open question. Counting the real page: Start
Here (1 card) + Microneedling (2) + Skin Boosters (2) + Polynucleotides (2) + Dermal
Fillers (5) = 12 cards across 5 `<section class="cat treat">` blocks — matches
spec/02 §6's "5 category sections → 12 tcards" exactly. All 5 share identical DOM
shape (`section.cat.treat > .wrap > h2 + p.sub + .tgrid`), confirming they share one
`data-wx-list-item` template as spec/02 §6 requires.

**2. `sections[]` and `rx.items` each need their OWN dedicated `data-wx-list`
container, never sharing an element with non-list sibling bindings.** Caught before
shipping: `_expand_list` (`builder/bindings.py`) returns immediately after expanding
a list, so any OTHER `data-wx-*` binding on the SAME element — or bindings on
non-list-item siblings that happen to share that element as their container — never
gets applied. The prescription section's h2/sub/`.rx-note` (real bound content) sit
BEFORE the 3 rx accordions inside the same `.wrap.rx-wrap` div in the raw markup, so
wrapping `data-wx-list="rx.items"` around the whole `.wrap.rx-wrap` would have
silently dropped `rx.title`/`rx.sub`/`rx.note`'s bindings. Fix: gave `rx.items` its
OWN inner wrapper (`<div class="rx-list" data-wx-list="rx.items" style="display:
contents">`, containing ONLY the 3 accordions) nested inside `.wrap.rx-wrap`
alongside the h2/sub/note as plain siblings — same `display:contents` invisible-
wrapper technique as decisions/00001's nav-list fix, applied for a different reason
(scalar+list mixing, not DOM-order). `sections[]` didn't have this problem (its
`.cat-sections` wrapper contains ONLY the 5 section items, nothing else), but the
same rule applies generally: **when introducing a `data-wx-list` wrapper, audit
whether the original markup had ANY other bound content sharing that container —
if so, split the list into its own inner wrapper.**

**3. Alternating section backgrounds use a `.cat-sections .cat:nth-of-type(even)`
rule, scoped to the new `.cat-sections` wrapper — not a bare `.cat:nth-of-type`.**
The prescription section also carries class `cat` (though not `treat`) and sits as
a sibling of `.cat-sections` under `<body>`. An unscoped `.cat:nth-of-type(even)`
selector counts ALL `<section>`-tag siblings under a shared parent regardless of
class, which would have put the prescription section at position 2 among body's
section-tag children (page-hero, prescription, endcta) — even — incorrectly
applying `--cream-2` to it (it explicitly wants `--cream`, matching its current
inline style, left untouched since it's a one-off outside the alternating
collection). Descendant-scoping the selector to `.cat-sections` confines
`:nth-of-type` counting to just the 5 real category sections, reproducing the
original 1(cream)/2(cream-2)/3(cream)/4(cream-2)/5(cream) pattern exactly.

**4. `&nbsp;` stays as the literal entity text in JSON content values — not a raw
Unicode NBSP character.** The rx price lines (`Full Face — £330 &nbsp;·&nbsp; Three
Areas — £220`) use `&nbsp;` around the middot in the raw markup, presumably to
prevent line-wrapping inside the price badge at narrow (mobile) widths — a real
rendering behavior, not decorative, and treatments.html is one of the two
mobile-screenshot-captured pages (spec's baseline recipe: `mobile_slugs=
"index,treatments"`), so getting this wrong risked an actual pixel diff. Verified
directly rather than assumed: `builder.sanitize.sanitize_rich_lite` round-trips the
entity-text form to itself unchanged, but round-trips a literal `\xa0` character
BACK to the `&nbsp;` entity form (nh3 always re-serializes NBSP as the named
entity) — so writing the raw character in JSON would trip the `is_already_clean`
"not-clean" validation warning, while writing `&nbsp;` verbatim (matching the
source exactly) is already clean. Same reasoning applies to `&amp;` (already used
in index.json) — both entities are stable round-trip forms, unlike numeric/named
entities for characters nh3 doesn't consider special (e.g. `&#x27;` for an
apostrophe does NOT round-trip; a plain `'` character does).

**5. The prescription section's own `style="background:var(--cream)"` was left
untouched**, not converted to a class. Spec/03 §3 step 3 only calls out
*alternating* backgrounds for conversion; this section is a one-off outside the
`sections[]` collection and its explicit value already equals the page's default —
converting it wasn't in scope and touching it added no value.

**6. rx accordions' "Enquire" link (`href="index.html#contact"`) and the tcard
"Enquire" fallback both stay static template markup**, per decisions/00001 decision
3's precedent (CTA text/hrefs are template chrome, not content) — confirmed the
same cross-page href pattern already existed in the raw markup for both.

## Verification

Direct raw-vs-built parity check (bypassing the committed baseline, same method as
decisions/00001): 0 failures, 0 advisory, across text/links/images/computed-styles/
screenshots, all 9 pages, both desktop and mobile variants (mobile explicitly
covers this page).

## What to watch for

- Decision 2's audit ("does this container have other bound siblings?") applies to
  every remaining collection page — check before wrapping, not after a validation
  failure surfaces it.
- Decision 4's entity round-trip fact matters again wherever a future page's copy
  needs a non-breaking space or similar rendering-affecting entity (checked
  empirically via `sanitize_rich_lite(value) == value`, not assumed).
