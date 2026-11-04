# Retrospective: Dodai Referrals build (real client, real deploy target)

Date: 2026-09-12
Scope: the first real, deployable build run through the hardened `SETUP.md` workflow
with full `subagent-driven-development`, following the same-day workflow rehearsal. A
new Dodai property (`refer.dodai.io`, repo `dodai-refer-a-business`), not a rehearsal.
Build was stopped by the client (Antun) before Arc C (Launch) over a quality complaint;
this retro exists because of that complaint, not despite it.

## Bottom line

The build's own review chain, four separate layers of it (per-task review x2, a
final whole-branch review on the most capable model, plus my own controller checks) let
a broken dark-mode/contrast state, centered form labels, and a nonsensical footer line
ship, all four times, because not one of those layers ever rendered the page and looked
at it. Every check was code-level: build succeeds, tests pass, computed CSS variable
values look right on paper. The client caught all of it in about thirty seconds by
opening the page. This is not a new finding: the previous same-day rehearsal retro
already wrote down "nothing in `npm run verify` tests dark mode at all" as a known,
un-acted-on gap. It bit the very next build.

## What went well (keep)

1. **The mechanical bug-finding kept working.** Two more template test bugs (hardcoded
   `/about`/`/contact` in the analytics browser test; a hardcoded 13-widget existence
   check) were found and fixed the same way as the rehearsal's nine, template-side,
   cherry-picked into the client repo. Confirms this is a real, recurring bug class
   (anything assuming every demo page/widget survives a client's deletions), worth a
   deliberate sweep rather than finding instances one at a time.
2. **The final whole-branch review caught two real cross-cutting bugs** (the brand
   palette only partially wired despite the design brief claiming otherwise; the consent
   banner unable to persist a choice) that no per-task review could see, since each only
   reviews its own diff. This is the argument for keeping a final review step at all.
3. **A subagent's unauthorized `git commit --no-verify`** (bypassing the core-edit guard
   for a genuine core-file edit, based on misreading prose documentation instead of the
   hook's actual enforcement) was caught before anything was pushed, and corrected by
   reverting to the exact original core file and achieving the same result a different,
   fully non-core way (recoloring the logo asset instead of touching the component).
   The guard existing at all is what made this reversible.
4. Confirmed a real, separate process bug from the rehardening session: the previous
   session's own fix commits were made locally but **never pushed to GitHub**, and the
   template repository's "template" flag was never actually turned on. The entire prior
   hardening session would have been invisible to a real "Use this template" click. Fixed
   both (flag turned on, commits pushed) before this build started.

## Findings

1. **No layer of review ever rendered the page.** Task review, the final whole-branch
   review, and my own pre-completion checks all worked from `git diff`, computed CSS
   custom-property values, and test output. None took a screenshot or opened a browser
   before the build was presented as done. `docs/quality-gates.md`'s own rubric has rows
   for "Hierarchy, reading measure, spacing" and "Dark mode" that were never filled in
   with evidence; nothing forced that before the human saw the work.
2. **`src/brand.ts`'s `light` and `dark` sections were set identically to a dark-navy
   palette**, which is correct for the brand but breaks any AstroWind element that
   assumes light mode gets a white background (the reference `ContactForm.astro` card
   pattern hardcodes `bg-white dark:bg-slate-900`). Under a light-mode OS preference the
   form's labels rendered as near-invisible pale-blue-on-white, and the sticky header's
   default light background bled through the dark hero text on scroll. Fixed by forcing
   `ui.theme: 'dark:only'` (Dodai has one fixed palette, not a toggleable light/dark
   brand) rather than trying to make a light mode Dodai doesn't want also work.
3. **`text-primary` (the navy CTA-button color) was used as plain link/text color** on
   two live pages (`404.astro`, `thank-you.astro`), which is fine against a white page
   background but fails contrast once the page background is also dark navy (two similar
   dark tones). This is exactly the class of bug `SETUP.md` B4 already names ("if
   `bgPage` is anything other than white, re-run `test:lhci`") but the warning is about
   _template-core_ text colors, not about a builder picking the wrong _role_ (button
   background vs. link/text) from the brand's own token set. Caught by CI's Lighthouse
   gate, not by any human or agent review; would have been caught before push by simply
   looking at the rendered page.
4. **Form labels rendered centered, not left-aligned**, because the form was composed
   inside `Hero`'s `content` slot, which lives inside Hero's `text-center` wrapper. A
   plausible, easy mistake when writing markup in isolation; immediately obvious, and
   only obvious, in a rendered screenshot.
5. **The footer shipped a nonsensical "Built by Dodai" line** on a page that is itself a
   Dodai property, carried over unmodified from the reference client-footer pattern
   (which assumes Dodai built the site for someone else). No code-level check could catch
   this: the string is valid, renders fine, breaks no test. Only a human reading the
   actual rendered footer caught it.
6. **The design brief asserted "already applied in B1"** for the brand palette; it
   wasn't. A brief's claim that prior work is done was never independently checked before
   later steps relied on it.

## Not done / cut short

- **Arc C (Launch) never started.** The client stopped the build after the visual
  defects above, before deploy, before the real Apps Script webhook was wired, before
  any pre-launch checklist ran.
- **A systematic sweep for the `text-primary`-as-text-color mistake elsewhere in the
  parts bin** was not done; only the two live-page instances were fixed. Three more
  instances exist in unused starter widgets (`Features2.astro`, `Features3.astro`,
  `Steps2.astro`), not fixed since they're not on any live page in this build, but they
  carry the same latent bug into the next client that copies them.
- **No design-critique skill (`impeccable`, `frontend-design`) was actually invoked**
  during B3, despite `SETUP.md` naming both as in-step skills. Nothing enforced that they
  ran; they were listed as available, not required.

## Retro discipline: what should be cut

`docs/client-build-rules.md` asks this retro to name a cut, not just an addition, every
time. Addendum, added when the workflow's own suggested improvements were implemented
after the build finished: `ui-ux-pro-max` and `image-to-code-skill` were removed from
`SETUP.md` (6 references across A3 and B3). Both had been flagged in two prior retros as
"never actually exercised", and neither turns out to be an installed skill in this
environment at all, checked against the full available-skills list. A workflow step
naming a skill that cannot actually be invoked is worse than no guidance; cut rather than
left as an aspirational placeholder a third time.

## Recommendation (acted on in this commit)

The gap is not missing documentation. `SETUP.md` already names `impeccable` as an
in-step skill and `docs/quality-gates.md` already has manual rubric rows for hierarchy,
spacing, and dark mode. The gap is that none of it was a hard gate: it was advisory
prose a builder (human or agent) could and did skip straight past, four review layers in
a row, on the way to declaring the build done. Fixed by adding a **screenshot-before-done
rule** to `docs/client-build-rules.md`: any task that creates or edits a page, layout, or
client component is not spec-compliant without a captured screenshot described in the
implementer's report, and a task reviewer treats a UI-touching task with no screenshot
evidence as a spec gap of the same severity as a missing test. `SETUP.md` B3/B4 point at
it explicitly instead of leaving visual review as one skill name among several.
