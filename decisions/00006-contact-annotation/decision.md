# Milestone 4 step 3: contact.html annotation

## Context

Spec/03-site-migration.md §3 step 3, seventh page. The handover flagged the
contact form specifically as needing judgment: its page-local submit-handler
script isn't part of `site.js`'s shared behavior inventory (spec/03 §4 doesn't
mention it), so — like gallery/reviews' page-local scripts — the question was
which of its strings are content vs. unavoidably JS-only, decided independently
here.

## Decisions

**1. Contact info block reuses `@address`/`@phone`/`@phoneHref`/`@email`/
`@emailHref`/`@hours`/`@social.*` verbatim from index.html's contact-teaser** — no
new global keys needed, exact same binding pattern (including the two-binding-per-
element trick: `data-wx-href="@phoneHref" data-wx="@phone"` on one `<a>`, setting
href and text independently via two separate `data-wx-*` attributes on the same
element — confirmed this is how index.html already does it, not a new mechanism).

**2. Every form label, the textarea's placeholder, the consent checkbox's text,
and the post-submit "thanks" message are all bound content** — labels/placeholder/
consent via new `form.*` keys; the demo-preview thanks text via `form.thanksText`.
Reasoned per the "every text node a human might want to change" rule cited in the
handover: all of these are real copy Purdi might reasonably want to reword,
including the thanks message's parenthetical about live email delivery not yet
being wired up (arguably the MOST likely string on this page to need an edit,
once that's no longer true).

**3. The submit button's label ("Send message") stays static**, matching
decisions/00001 decision 3's established CTA-button-text precedent exactly (same
category as "Book Now"/"Enquire" — this isn't a new judgment call, just applying
the existing rule).

**4. The inline validation script's `alert('Please add your name, email and tick
consent so I can reply.')` message stays a hardcoded JS string — it CANNOT be
content-bound.** Unlike every other page-local script string encountered so far
(all of which were building or setting DOM element content, which `data-wx-*`
targets), an `alert()` call's argument is never rendered into the DOM at all —
there is no element for a binding attribute to attach to. This is a hard technical
limit, not a judgment call to weigh: `site.js`'s "must not contain any content
strings" rule (spec/03 §4) applies to markup-rendering; a script's own internal
control-flow string with no DOM binding mechanism available is a different
category, same reasoning already implicitly applied to gallery's/faq's
structural JS (CSS selectors, comparison logic) which also stayed hardcoded.

**5. The Google Maps `<iframe src="...">` stays a static URL, not modeled as a
bound field.** It's derived from the same address already in `@address`, so
there's a theoretical drift risk if the clinic ever relocates, but: (a) spec
doesn't mention a map-URL content key anywhere, (b) `data-wx-href`/`data-wx-attr`
have no string-templating to COMPOSE a maps query URL from `@address` (same "no
attribute interpolation" limitation as the gallery aria-label case, decisions/00003
point 3), and (c) pre-composing a full second copy of the address as one opaque
URL value would itself be a second source of truth no better than the current
static one. If the address ever needs to change, updating this iframe's `src` is
a template-level edit at that time, same footing as any other structural change.

## Verification

`python -m builder validate` clean. Direct raw-vs-built parity check (bypassing the
committed baseline): 0 failures, 0 advisory, across text/links/images/computed-
styles/screenshots, all 9 pages, desktop + mobile.

## What to watch for

- Decision 4's "no DOM element, no binding" rule is the general test for whether a
  script string can be content-bound at all — apply it before spending time
  designing a content key for a string that turns out to be JS-only by
  construction.
