# Decision: retire the non-functional contact form, promote Call/Email

## Symptom

The operator: "I don't believe [the contact form] would be wired up to anything...
without exposing a key in JavaScript." The premise (GitHub Pages) was checked and found
wrong — this site runs on the real Wixy engine, a Python backend — but the underlying
concern was right anyway: the form was never wired to real email delivery.
`content/contact.json`'s own `form.thanksText` said as much: "(Demo preview: live email
delivery is wired up when the site goes live.)" That never happened. Building real
server-side email delivery was possible but disproportionate for this site (a new
unauthenticated public endpoint, SMTP credentials, spam/abuse protection) — the
operator's own fallback matched exactly: clear phone/email/address instead of a form
that goes nowhere.

## What was decided

`pages/contact.html`'s form (name/email/phone/message/consent checkbox, a fake
client-side-only "Thank you") is removed entirely. The page's remaining "Get in touch"
column keeps everything the existing info block already had (address, parking note,
hours, socials, Book Online) — none of that was ever the problem — and adds two
prominent CALL/EMAIL cards at the top using the SAME `@phone`/`@email` bindings the
plain text links below already used; nothing new was invented, they're just given
visual priority now that they're the page's primary action rather than a fallback next
to a broken form. `content/contact.json`'s now-dead `form.*`/`formIntro.*` keys and
`site.css`'s now-unused `.cform` rules are removed too — a proper cleanup, not left as
orphaned dead content. `pageHero.tag`'s "Send a message, call, or book online" (a stale
reference to the removed form) is now "Call, email, or book online."

Companion wixy-repo change (decisions/00127): a new Settings > Contact admin tab, so the
site owner can edit phone/email/address in one discoverable place instead of needing to
know she can click the text directly on a live page (the mechanism already worked, it
just had no dedicated home).

## What to watch for

- `@phone`/`@email`/`@address` are already a single shared source (`content/_global.json`)
  every page referencing them uses — this change didn't alter that, only the Contact
  page's presentation. Any future page needing these should reference the same globals,
  never hardcode a fresh copy.
- If a genuine contact-FORM need arises later (real submissions landing somewhere, not
  just click-to-call/email), that's a materially different, security-sensitive feature —
  a fresh design pass, not a reason to revisit this decision, which was scoped to "the
  form currently does nothing and shouldn't pretend to."
- **The "Symptom" section's GitHub Pages premise-check was correct when written, but a
  parallel feature (decisions/00013, this repo) landed on `main` moments later that makes
  it easy to misread in hindsight.** At investigation time, `ca.cinnamons.uk` served from
  the real Wixy/Python backend with no GitHub Pages involvement at all — "found wrong" was
  accurate. Immediately after, the operator's own separate go-live request added a genuine
  GitHub Pages deploy on the owner's public domain, mirroring whatever's published via the
  server-owned `wixy-live` ref. Both statements are simultaneously true: the ADMIN/editing
  surface and `ca.cinnamons.uk` still run the real backend (so a server-side form was never
  actually ruled out on technical grounds); the PUBLIC custom domain is, separately, static
  GitHub Pages output (so a form posting to nothing would have been exposed there too,
  reinforcing rather than undermining this decision). Don't read a future "wait, isn't this
  GitHub Pages now?" as contradicting this entry.
