# Decision: `gallery.categories` becomes an admin-managed collection

## Symptom

The operator: "now we have another issue she needs to be able to manage the category names
on the before and after edit them add new ones that sort of thing." The gallery filter's 4
categories (`Lips`/`Cheeks`/`Chin & Jaw`/`Eyes & Brows`) were hardcoded twice — once in
`pages/gallery.html`'s `#gfilter` buttons, once in the wixy engine registry's `cat` field
`options` array — neither editable by Purdi without a developer shipping a template/registry
change.

## What was decided

The wixy engine (companion PR, wixy repo decisions/00124) gained a generic `optionsFrom`
capability: a `choice` field can now resolve its options live from another admin-managed
collection instead of a static list. This repo's two changes:

**Content** (`content/gallery.json`) — a new `gallery.categories` array, seeded EXACTLY from
the 4 pre-existing hardcoded values (`{"value": "lips", "label": "Lips"}` etc.), so nothing
currently tagged breaks. `gallery.sliders.cat`/`gallery.tiles.cat` keep their existing stored
values unchanged — only where the registry says their DROPDOWN options come from has changed
(the wixy-repo side of this PR).

**Template** (`pages/gallery.html`) — `#gfilter`'s 5 hardcoded `<button>`s become one
hardcoded "All" button (kept — it has no corresponding data item, it means "no filter") plus
a templated block:
```html
<div class="gfilter reveal" id="gfilter" data-wx-list="gallery.categories">
  <button class="active" data-cat="all">All</button>
  <button data-wx-list-item data-wx-attr="data-cat:.value" data-wx=".label">Category</button>
</div>
```
Verified this renders functionally identically to the original hardcoded markup: a
BeautifulSoup parse of a real build plus a real headed-browser screenshot and click-through
(clicking "Cheeks" correctly filtered to only cheeks items). `_expand_list`
(`builder/bindings.py`, wixy repo) only extracts+replaces the ONE `data-wx-list-item`
template element and leaves siblings — the "All" button — untouched, then appends the real
items after it, so the fixed "All" button surviving as a sibling of a `data-wx-list` block is
a supported, tested pattern, not a coincidence.

## What to watch for

- Any future addition/removal/rename in `gallery.categories` (via the admin UI) takes effect
  on the public filter buttons at the next publish, with no template change needed — that's
  the entire point of this change. If a NEW category is added, existing gallery items keep
  whatever `cat` value they already have; nothing re-tags them automatically.
- If `#gfilter`'s "All" button ever needs to become data-driven too (e.g. its label becomes
  editable), it cannot simply join the `data-wx-list-item` block — see decisions/00124 (wixy
  repo) for why: it has no corresponding `gallery.categories` item, and the filtering JS
  keys off `data-cat="all"` specifically, not any collection value.
