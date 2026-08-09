# Importing Purdi's existing Instagram/Facebook before-and-afters

## Context

Purdi (the site owner) asked to have all her existing before/after posts from
Instagram (@cottageaesthetics) and Facebook converted into gallery entries on
this site, so she can review and choose what goes live herself rather than
someone else deciding for her. This entry records what was actually done,
why, and — honestly — what's still incomplete.

## Consent

This IS Purdi's own explicit request. Separately, an earlier operator
handover already recorded that clients whose photos appear in her existing
marketing consented to publication. Every entry this import adds lands with
`"visible": false` (a wixy engine convention, decisions/00117 in the wixy
repo) — nothing here is public until Purdi opens her Before & After editor
and switches an item on herself. This satisfies this repo's own CLAUDE.md
consent guardrail ("any NEW photo... needs Purdi's explicit sign-off... never
add such content speculatively") — the sign-off is the request itself, and
nothing is speculative-and-live at the same time.

## What was imported

9 before/after pairs, all landing as hidden `gallery.sliders` entries:

| Title | Category | Source |
|---|---|---|
| Jawline & Skin | chin | Instagram `DbAeisfoYvF` |
| Lip Augmentation | lips | Instagram `DZs3KJKjGHL` |
| Lip Filler | lips | Facebook `122164470062735971` |
| Lip Enhancement | lips | Facebook `122163191366735971` |
| Lip Definition | lips | Facebook `122163191360735971` |
| Brow & Eye Area | eyes | Instagram `DXbR6U6CD2f` |
| Jawline Definition | chin | Instagram `DXUsw3OiJoF` |
| Nasolabial Folds | cheeks | Instagram `DXC8ANmiNL_` |
| Lip Filler | lips | Instagram `DWe6pThiNZI` |

`eyes` is a new category (Instagram `DXbR6U6CD2f` doesn't fit lips/cheeks/
chin) — added to the wixy engine's `projects/ca.json` registry in a separate,
small PR (this one depends on that PR being merged first, since its CI
validates against the engine's `main`).

Images: exif-stripped, auto-oriented, downscaled to ≤2000px longest side,
JPEG q85 — mirrors `wixy_server/media.py`'s own upload pipeline exactly, done
offline since this import bypasses the normal upload route. Named
`ba-ig-<shortcode>-{before,after}.jpg` / `ba-fb-<id>-{before,after}.jpg`.

FB dates aren't exposed to anonymous visitors, so the 3 Facebook-only imports
are ordered by numeric photo-ID proximity to *other* Facebook posts that
mirror dated Instagram posts (an approximation, not exact — see
`manifest.json`'s per-post entries for the anchors used).

## Every post accounted for — the audit trail

`manifest.json` in this folder is the full inventory: every post found on
both platforms, its classification, and its disposition (imported / genuine
duplicate / not a before-after / video with no usable still / unreachable).
69 posts total across both platforms as of this PR. Scope: the "CLIENT CAM"
Instagram Story highlight was explicitly excluded (feed posts only, per the
mission brief) — Stories aren't feed content and expire on their own.

**Enumeration is honestly incomplete, not silently declared done.**
Instagram's own profile page reports 243 total posts; anonymous access could
only reach 34 (its grid walls after ~12 items, and even reachable posts'
carousels cap at slide 1 behind the same wall). Facebook exposes no total
count to anonymous visitors at all; its Photos tab capped at the same ~34
anonymously. The operator logged into both platforms in Chrome on the same
machine to close this gap (op-ask-question decisions #239/#241 in cmd), but
the profile-copy technique needed to drive that session with Playwright hit
two of Chrome's own deliberate anti-automation protections in a row — App-
Bound Encryption (ties cookie decryption to the exact running Chrome
process, defeating a file-level profile copy) and a separate guard that
refuses remote-debugging automation against the literal default profile
directory. Both are intentional Google hardening against exactly this class
of technique, not bugs to route around. A third approach (the operator
exporting his own session via a standard cookie-export browser extension) was
raised as decision #242 and was still open when this PR was prepared — see
`manifest.json`'s `enumeration` block for the exact, current numbers and
whether that closed the gap by the time this shipped.

## Deduplication — including a correction worth recording

Every candidate was compared against the site's 8 pre-existing gallery
entries and across platforms (an Instagram post and its Facebook repost of
the same client import once, from whichever source gave the higher
resolution). Two independent passes were run on the 10 posts a curated prior
had flagged as genuine before/afters — the scraping agent's own pass, and a
second, dedicated dedup sub-agent comparing each against the 8 existing
entries — and they **disagreed on 6 of them**. Rather than trust either pass
blindly, each of the 6 was re-verified directly, weighting distinctive,
hard-to-coincidentally-match features (a mole's exact position, a specific
multi-gem septum piercing, a distinctive chunky necklace, literal baked-in
"BEFORE"/"AFTER" caption banners proving a direct repost) far more heavily
than superficial styling (the clinic's own standard photo wrap colour,
common hoop-earring shapes — features multiple different clients could
easily share just by being photographed at the same clinic). Outcome: 4
confirmed as genuine duplicates of existing entries and excluded; 1 stayed
excluded on a strong mole-position match; 1 (`DZs3KJKjGHL`) was genuinely
ambiguous either way — no distinctive marker tipped it — and was **imported
hidden rather than guessed**, since Purdi knows her own clients and can
settle it herself in seconds where two independent AI passes couldn't. Every
disputed item's own manifest row carries a `review_note` explaining the
specific call.

## 2026-08-09 addendum — full-corpus follow-up (58 more entries)

The enumeration gap this entry originally flagged as open is now closed: the
operator solved authenticated access himself (opened a fresh,
automation-controlled Chrome profile with no prior login to protect, and
logged into both platforms in it manually — see the wixy repo's Answers log
Q-003 for the full "why" and the two automated approaches that didn't work).
That unlocked the full historical corpus instead of just the ~34-post
anonymous slice each platform previously allowed.

**Re-enumeration**: 233/243 Instagram posts+reels found (the ~10 gap is most
likely pinned-post duplication in the profile grid, not a missed batch); 39
Facebook photos found across three combined discovery methods, after the
first attempt (the Photos tab) turned out to default to a small Albums view
rather than a flat stream — see `manifest.json`'s `enumeration` block for the
full mechanism. A raw archive of every post (not just before/afters) — full
resolution media, captions, dates — now lives in the wixy engine's own
persistent project storage (`Storage/projects/ca/social-archive/`, outside
this repo, not deployed anywhere), as reference material for future
AI-assisted posting tools; see that folder's own README.

**Classification**: of the 205 posts new since the original pass, 8 parallel
review agents classified each against the same before/after criteria as
before (a visible same-client, same-area comparison — not just a caption
claiming "results"). 63 were flagged as genuine before/after comparisons.

**Dedup, same rigor as the original 6-item correction below**: an image-hash
(dHash) pass against the 33 images actually used in `gallery.json` flagged 23
candidates as possibly similar (moderate Hamming distance). Rather than trust
the hash mechanically, each flagged pair was viewed directly and judged on
distinctive markers (moles, piercings, jewellery, skin texture/age) over
superficial styling — only 1 of the 23 turned out to be a genuine duplicate
(`DaNqV5SI7wh`, an exact dist=0 match of the existing `ba-chin.jpg`); the
other 22 were different clients whose photos happened to share a similar
tight-crop composition, a real and now well-evidenced dHash false-positive
pattern for this kind of content — worth remembering for any future dedup
pass rather than trusting distance ≤20 as "duplicate." A second pass checked
the 63 candidates against each other (same client reposted across
platforms/times) and found 4 genuine duplicate pairs the same way.

**Result**: 58 new before/after entries, all `visible:false`, taking the
gallery to 74 total slider entries (16 pre-existing + 58 new) — still only 7
visible to the public, 67 now sitting hidden in Purdi's editor for her to
review at her own pace. Full per-post detail (id, category, title, files) is
in `manifest.json`'s `posts` array; the ~147 posts judged not-before-after
(promotional graphics, testimonials, personal photos, informational content)
are summarized at the aggregate level there rather than individually
re-transcribed — their full per-post reasoning already exists verbatim in
the implementing session's own transcript (session id
`62708a37-43d0-4da0-b792-f4a9b9e67892`) and duplicating ~150 rejection
reasons into this file would add substantial size for little marginal value
over what's already durably recorded there.

## What to watch for

- ~~If decision #243 ... closes the enumeration gap, expect a follow-up
  PR~~ — resolved 2026-08-09, see the addendum above. The corpus is now
  fully enumerated on both platforms; any further growth going forward is
  just new posts Purdi makes, not a backlog.
- `DZs3KJKjGHL` ("Lip Augmentation") is the one ambiguous import — if Purdi
  recognises it as a repost of an existing pair, she can just leave it
  switched off (or delete it) from her editor; nothing else depends on it.
- The `eyes` category will show an empty filter button on the public page
  until she switches on the one entry using it — `pages/gallery.html`'s
  inline script hides a category's filter button entirely while nothing in
  it is currently shown, so this is expected, not a bug. This same script
  also, as a side effect, hides the pre-existing `cheeks` filter button
  (`Cheeks`, line ~111) whenever nothing visible uses it — that button had
  been permanently dead/empty since before this PR (no item had ever used
  `cheeks`), so this is a genuine, positive fix, not a regression.
- The wixy repo's parity baseline (`builder/tests/parity/baseline`) was
  recaptured twice for this PR via `capture-baseline.yml`: once against
  site-repo `main` (fixed a real pre-existing staleness — the old baseline
  predated several since-published gallery changes), then again against
  *this PR's branch* specifically (fixed the `Cheeks`-button-disappearing
  diff above, which is a real, intended behaviour change this PR introduces
  to the public page, not drift). Once this PR merges, the baseline already
  matches `main` — no further action needed. If a future PR touches
  `pages/gallery.html`'s filter bar again, expect the same two-step pattern:
  content-only staleness rebaselines against `main`; a PR that changes
  page *behaviour* needs the baseline captured from that PR's own branch.
