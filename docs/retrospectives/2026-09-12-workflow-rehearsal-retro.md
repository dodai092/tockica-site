# Retrospective: workflow rehearsal build (not a real client)

Date: 2026-09-12
Scope: a deliberate end-to-end rehearsal of `SETUP.md` against a fictional target, run
to validate a batch of same-day workflow additions before trusting them on a real client.
Not a client build; nothing here shipped or was shown to anyone.

## What this was

A full local-only site was built through A2 (synthetic intake) -> A3 (design brief) ->
B1-B4 (build, verify) against a real local business's public identity (name, address,
phone; found via Google Maps and the Croatian business registry), used only as a
realistic stand-in. The business was never contacted, the site was never deployed, no
GitHub repo was created, and the local folder was deleted after the rehearsal. Everything
beyond the public facts (services, prices, copy, design) was invented and labeled as
such in the rehearsal's own `docs/intake.md`.

Deliberately not rehearsed: full `subagent-driven-development` (built directly instead,
to keep token/time cost bounded), a real client discovery interview, NAP-vs-GBP
cross-checking, email deliverability, deploy/DNS/cutover (C2-C6), and WAVE (substituted
with a shorter manual keyboard/focus pass via Playwright).

## Bottom line

Nine real, reproducible defects were found by actually running the pipeline, not by
reading the docs. All nine are fixed in this repo as of commit `7ac669b`. The pattern
worth remembering: every one of them was invisible until two previously-separate,
individually-correct pieces were exercised together for the first time (a doc-writing
session's edits vs. the linter that checks them; a new CI script vs. the test that
asserts its exact name; a documented client-layer step vs. the mechanical guard meant to
stop a different kind of edit).

## What went well (keep)

1. **The mechanical guards did their job.** The pre-commit core-edit guard genuinely
   blocked a commit (astro.config.ts) partway through the rehearsal. It was blocking the
   wrong thing (see below), but the fact that it fired at all, on a fresh local repo,
   with nobody reviewing, is the guard working as designed.
2. **The Lighthouse a11y gate caught two real, unrelated contrast failures** in colors
   picked with a real design-taste skill and what felt like reasonable judgment. Reading
   a rule ("check button contrast") is not the same as having verified it; the automated
   gate is what actually caught it, twice.
3. **A visual screenshot check caught something no automated gate could**: leftover
   English demo testimonials and FAQ content, invisible in any diff review of the pages
   actually edited, since the collections render conditionally and were never looked at.

## Findings, fixed this session

1. **`init-client.mjs` duplicated a numbered line in every forked `CLAUDE.md`.** The
   `from` match only covered 4 of the original file's 5 numbered items; the unmatched
   5th line survived untouched next to the replacement's own re-added copy of it.
2. **`SETUP.md` claimed `docs/golden-workflow.md` gets stripped by `init-client`; it
   never did.** A real, pre-existing test (`init-client-visual-baseline.test.mjs`)
   already asserted the opposite, correct behavior. The doc was wrong, not the code;
   fixed the doc, and stripped `SETUP.v1.md` instead (a file with no reason to reach a
   client repo).
3. **The pristine template failed its own `npm run check`** after earlier edits this
   session to `SETUP.md`/`go-live.md` left them prettier-noncompliant. Nobody had run
   `npm run check` against the template itself since making those edits.
4. **`tests/quality-gates.test.mjs` hardcoded the `verify` script string** and wasn't
   updated when `test:meta` was added earlier the same session. Same root cause as #3:
   a change and the thing that verifies it, made at different times, never cross-checked.
5. **`tests/starter-page-boundary.test.mjs` hardcoded `about.astro` by name.** `SETUP.md`
   itself instructs deleting starter pages a client doesn't need. Every real client build
   that follows that instruction would have permanently failed this CI gate. Now
   glob-based over whatever pages actually exist.
6. **`tests/analytics-events.browser.mjs` never dismissed the cookie-consent banner**
   before clicking page content. `CookieConsent` is "not wired in by default," so this
   test always passed until this rehearsal actually wired it in per B1d for an EU client,
   the exact case the template documents as the common one for Croatian clients. Fixed
   by dismissing the banner first if present; harmless no-op when it isn't mounted.
7. **The pre-commit core guard blocked `astro.config.ts` wholesale**, while `SETUP.md`
   B1c has every custom-typeface client (the common case, not the exception) edit that
   file's `fonts` array. First real attempt to follow that documented step got blocked by
   a mechanism meant to catch something else entirely. Fixed to allow edits confined to
   the `fonts` array only; tested both directions (font-only change allowed, an
   `integrations`-adjacent change still blocked).
8. **`src/content/{testimonials,faqs,team}.yaml` ship real demo content** and render
   conditionally, so they're easy to miss: nothing in the B1c checklist mentioned them.
   Caught only by actually looking at a screenshot. Added to the checklist.
9. **Client-layer components hardcode Tailwind demo colors** (`Note.astro`'s
   `bg-blue-50`, and the homepage's own copied `bg-blue-50` slot) instead of deriving
   from brand tokens. Invisible with any palette that happens to include blue; visible
   immediately with this rehearsal's rose/sage palette. Fixed the two instances hit; not
   audited across every widget (see Not done, below).

## New content added this session, not yet battle-tested

The NAP/GBP question, the canonical-host mechanical check, INP/AVIF/CLS guidance, the
WCAG 2.2 specifics, email deliverability, and the post-launch monitoring step all trace
to research (see `SETUP.md`'s own provenance note), not to an observed failure. This
rehearsal exercised the NAP question's shape and the canonical-host check's mechanics,
but not against a real client with a real GBP listing or a real domain to typo. Weight
these lower than the items above in a future retro if something needs to be cut.

## Not done (need their own cycle)

- **Audit every parts-bin/client-layer widget for hardcoded Tailwind colors**, not just
  the two hit by this rehearsal's palette. A systematic pass, not a rehearsal-sized task.
- **A real dark-mode Lighthouse/contrast pass.** This session's color fixes for dark mode
  were hand-computed, not gate-verified; nothing in `npm run verify` tests dark mode at
  all.
- **Full `subagent-driven-development` was not exercised.** This rehearsal built directly
  to keep cost down, which means the actual per-task-implementer-plus-reviewer mechanism,
  the part of the workflow with the most real, layered process around it, is still only
  validated by the one real client build (Vinalia) from before this session.
- **NAP-vs-GBP and email-deliverability checks were exercised only mechanically**, never
  against a real GBP listing or real DNS records.

## Recommendation

The next real client build is the next real test. Specifically watch whether: the
`fonts`-array carve-out in the pre-commit guard holds up on a real custom-typeface build,
the B1c content-collections checklist item actually gets followed, and whether
`ui-ux-pro-max`/`image-to-code-skill` (added earlier this session, never actually
exercised, not even in this rehearsal) turn out to be worth their place in A3.
