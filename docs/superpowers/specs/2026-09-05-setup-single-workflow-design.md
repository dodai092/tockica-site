# SETUP.md single-workflow rewrite (retro item B)

Date: 2026-09-05
Status: design, approved for planning
Scope: rewrite `SETUP.md` into one client-build workflow. Documentation only, no code, no
changes to `scripts/init-client.mjs`, `.githooks/`, or any skill.

Source: `docs/retrospectives/2026-09-05-vinalia-build-retro.md` item B ("Reconcile the
three workflow descriptions into one; map the §4 skills to phases of the real method;
mark which phases collapse when the client brings finished copy"), plus this session's
workflow mapping.

---

## Problem

`SETUP.md` describes the client-build process three ways that were never reconciled:

- **§2**, a by-hand reinit checklist.
- **§4**, a skill-pipeline table (storybrand -> copywriting -> design-taste-frontend ->
  frontend-design -> impeccable -> avoid-ai-writing).
- **The real method**, "write a plan, run subagent-driven development", stated only in
  §4's framing paragraph and in `docs/client-build-rules.md`.

The one real client build (Vinalia) followed the third. The §4 pipeline was effectively
not run: the client brought approved copy, so the Message and Copy phases collapsed to
transcription, and design / polish / AI-cleanup were folded into plan tasks or deferred
to human review. Nothing in the doc says which description is authoritative or how the
pieces relate.

Consequence for build #2: no single ordered path. The person starting has a manual
checklist, a skill menu, and a method scattered across two documents.

## Goal

`SETUP.md` has one workflow organised as three arcs (Discovery, Build, Launch) with
numbered steps under each. The §4 skills appear as sub-bullets on the steps where they
run, not as a parallel table. The points where steps collapse (client brought approved
copy; discovery already done in a prior engagement) are marked. No content is deleted; it
is reordered onto the spine.

The spine is a **dependency order, not a schedule**. In practice arc A and step B1 (repo
creation) interleave: a client's brand colour feeds `init-client`, discovery may finish
after the repo exists. The doc states this once so it does not read as rigid.

**Boundary with `docs/client-build-rules.md`:** `SETUP.md` owns the sequence.
`client-build-rules.md` owns the plan-authoring and review house rules. Steps B2 and B4
link to it; they do not restate it. This is the deliberate fix for "the method is
scattered across two documents": one sequence doc, one rules doc, with a named division.

Out of scope (each becomes an ADR candidate or a tracked task, listed in "Known
remaining gaps" below, not left floating):

- Gap B: a real discovery-to-plan gate as tooling or a plan-authoring house rule, beyond
  the doc-level statement in steps A3 / B2 of this rewrite.
- Gap C: `init-client.mjs` scaffolding `docs/intake.md` / `docs/go-live.md` /
  `docs/handoff.md`, emitting a reinit checklist file, prompting for font mode.
- The full "client has no legal policy and needs one" procedure. Step A2 keeps the
  decision point and step C3 keeps the hard gate; the procedure itself is a known gap.

---

## The workflow (target state)

Three arcs. Each step states what it produces, the driving doc or skill, what is
automated vs manual, and where it collapses.

### Arc A: Discovery

| Step | Name                    | Produces                                                                                                                    | Driven by                                                                                               |
| ---- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| A1   | Engagement start        | commercial agreement (outside the repo)                                                                                     | none                                                                                                    |
| A2   | Discovery and intake    | `docs/intake.md` filled; copy status known; verbatim-locked text identified; DNS owner; legal path chosen                   | `docs/intake-template.md`, `superpowers:brainstorming`                                                  |
| A3   | Prepare the plan inputs | a copy source file at a named path (or "client supplied copy, source = X"); a design direction brief; optional schema draft | `storybrand-messaging`, `marketing-skills:copywriting` (+ `customer-research`), `design-taste-frontend` |

A2 is a full client interview; A3 is running each skill and saving its output into
`docs/`. Neither is automated. A2 collapses to "link the prior material, confirm the
copy / verbatim / DNS answers are captured" when discovery happened in a prior
engagement.

### Arc B: Build

| Step | Name                    | Produces                                                                                                     | Driven by                                                                                                                                                            |
| ---- | ----------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1   | Create and reinitialise | client repo: brand surface, config, legal placeholders, self-identity docs rewritten, core-edit guard armed  | SETUP step B1, `npm run init-client`                                                                                                                                 |
| B2   | Write the build plan    | numbered task plan, copy referenced by path, every Files-section path created by its task or already present | `superpowers:writing-plans` + `docs/client-build-rules.md`                                                                                                           |
| B3   | Build                   | client components in `src/components/client/`, pages, `schema.ts`, `config.yaml`                             | `superpowers:subagent-driven-development`; in-step `frontend-design`, `impeccable`, repo `.agents/skills/{add-page,add-component,styling,add-blog-post}`             |
| B4   | Verify                  | build green; browser pass; compliance and conversion-UX pass; whole-branch review                            | SETUP step B4 checklist, `run`, `webapp-testing`, whole-branch Opus review, `docs/client-build-rules.md` review checklist, `avoid-ai-writing` on build-authored text |

**B1 has internal structure** (this is where the current §2 wall-of-checklist would
otherwise just relocate):

- **B1a. Create the repo.** "Use this template", clone, `npm install`, `npm run dev` to
  confirm boot. Record the `TEMPLATE_VERSION` value in the first commit message.
- **B1b. Run `init-client`.** Rewrites `package.json`, `src/config.yaml`, brand primary
  colour, legal placeholders, `README.md`; strips template-maintenance files; rewrites
  the CLAUDE / CONTEXT / AGENTS / SETUP self-identity text; drops `.template-repo` so
  `.githooks/pre-commit` arms.
- **B1c. Manual brand and asset checklist.** secondary / accent / text / bg colours;
  font mode (custom typeface vs system stack); `navigation.ts`; logos, favicons,
  favicon.ico regeneration, OG image; `robots.txt` / `_headers`; blog toggle;
  `schema.ts`; `ui.theme`.
- **B1d. Analytics config.** GA4 is settled (see content change 3). Set
  `analytics.vendors.googleAnalytics.id`; add `requireConsent: true` for an EU client
  and mount `src/components/client/CookieConsent.astro` from
  `src/components/client/GlobalEmbeds.astro`.

B2 opens with: **do not start until A3's artifacts exist** (`docs/intake.md`, a copy
source file or explicit "client supplied copy" pointer, a design brief). B3 is task
execution: one implementer plus one reviewer subagent per task, approval gate before
each dispatch, Haiku for transcription and Sonnet for judgment.
`.githooks/pre-commit` and CI (build / check / links / lhci) run automatically.

### Arc C: Launch

| Step | Name                         | Produces                                                    | Driven by                           |
| ---- | ---------------------------- | ----------------------------------------------------------- | ----------------------------------- |
| C1   | Ship                         | commit + push to the client repo                            | `git-pushing`                       |
| C2   | Deploy                       | site live on `*.netlify.app`                                | SETUP step C2, `docs/go-live.md` §1 |
| C3   | Client review and pre-launch | written client sign-off; the pre-launch checklist passed    | `docs/go-live.md` §2 to §3          |
| C4   | Cutover                      | production domain live, cert provisioned, sitemap submitted | `docs/go-live.md` §4 to §5          |
| C5   | Handoff                      | `docs/handoff.md` sent to the client                        | `docs/handoff-template.md`          |

C2's manual part is the Netlify site setup plus the contact-form markup gotcha
(`data-netlify="true"`, hidden `form-name`, a static copy of the form markup for
build-time detection). C3 is: password-protect Netlify, send the URL, get written
sign-off, run the checklist (`site.site` final, favicons / OG / logos, robots index,
legal reviewed and approved, real contact-form submission test, schema filled, 404, real
GA4 id receiving hits). C4 records the launch date and `TEMPLATE_VERSION` again in the
repo.

### Collapse: client brought finished, approved copy (Vinalia's actual path)

- A2 still runs; the copy-status answer flips the downstream shape.
- A3 drops `storybrand-messaging` and most of `copywriting`. Both become "transcribe
  verbatim from the client source file into a `content/` file at a named path."
- B2 tasks become transcription tasks (Haiku), each stating "transcribe X from `<path>`
  lines N to M", never a pasted block.
- B4: `avoid-ai-writing` runs only against build-authored text. Non-English or regulated
  copy goes to human review instead of the automated pass.
- `design-taste-frontend`, B3, polish, and all of B4's verification stay full-weight.

---

## Document structure (target `SETUP.md`)

```
# Building a client site from this template

<intro: 2 sentences. one workflow, three arcs, optional collapses.
 the spine is a dependency order not a schedule.
 pointer to CONTEXT.md / AGENTS.md / docs/client-build-rules.md,
 with the one-line boundary: SETUP owns the sequence, client-build-rules
 owns the plan/review house rules.>

## The workflow at a glance
  <the three arcs, each with its steps as one line:
   A2 Discovery and intake  ->  produces: docs/intake.md  ->  driven by: ...
   then the two collapse notes (approved copy; prior discovery).>

## Short path: client brings finished, approved copy
  <blockquote callout, the 5 collapse bullets above. each affected step
   below links back here instead of re-explaining.>

## Worked example: the Vinalia build
  <3 to 5 lines. which steps ran, which collapsed, where the copy
   source lived, what was deferred to human review. makes the collapse
   concrete for build #2.>

## Arc A: Discovery
### A1. Engagement start
### A2. Discovery and intake
      <keeps the legal decision point: client supplies reviewed text /
       reuse an existing policy / ship boilerplate gated on external
       review (path c always a launch blocker). one added line for
       "client has none and needs one".>
### A3. Prepare the plan inputs
      <old §4 skills as prose sub-bullets at the point each runs.
       names the required output artifacts.>

## Arc B: Build
### B1. Create and reinitialise the repo
      #### B1a Create the repo   (incl. record TEMPLATE_VERSION in first commit)
      #### B1b Run init-client
      #### B1c Manual brand and asset checklist   (old §2 hand items)
      #### B1d Analytics config   (old §6, GA4 stated as settled)
### B2. Write the build plan
      <opens with: do not start until A3's artifacts exist. links to
       client-build-rules.md, does not restate it.>
### B3. Build
      <absorbs old §3 design/build rules: client/ only, copy from the
       parts bin, brand.ts only, GlobalEmbeds.astro for global mounts.>
### B4. Verify
      <old §7 pre-launch verification verbatim, plus the compliance /
       conversion-UX checklist already in §7.6. links to
       client-build-rules.md review checklist.>

## Arc C: Launch
### C1. Ship
### C2. Deploy            <old §5, plus the Netlify Forms markup gotcha>
### C3. Client review and pre-launch gates
### C4. Cutover
### C5. Handoff

## Appendix: testing a template-core change
      <old §8, unchanged. keeps the docs/golden-workflow.md pointer and
       the playwright install note.>

## Bilingual (HR + EN)
      <kept from old §6: out of scope, single language per site.>
```

## Mapping of current sections to the new structure

Every current subsection must land somewhere. The implementation includes a check that
walks this table.

| Current                                      | Goes to                                                                                                                                                                                                     |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §1 Create the repo                           | B1a (incl. the `TEMPLATE_VERSION`-in-first-commit step)                                                                                                                                                     |
| §2 Reinit (init-client behaviour)            | B1b                                                                                                                                                                                                         |
| §2 Reinit (the "finish by hand" list)        | B1c                                                                                                                                                                                                         |
| §2 legal decision point                      | A2                                                                                                                                                                                                          |
| §2 discovery / launch / handoff doc pointers | A2 (intake), C3 (go-live), C5 (handoff)                                                                                                                                                                     |
| §3 Design + build rules                      | B3                                                                                                                                                                                                          |
| §4 skill pipeline table                      | A3 sub-bullets (storybrand, copywriting, customer-research, design-taste-frontend); B3 (frontend-design, impeccable, repo `.agents/skills/*`); B4 (avoid-ai-writing, run, webapp-testing); C1 (git-pushing) |
| §4 "plan + SDD" framing paragraph            | B2 and B3                                                                                                                                                                                                   |
| §4 scale-to-project-size + collapse note     | "Short path" callout + the per-arc collapse notes                                                                                                                                                           |
| §5 Deploy                                    | C2                                                                                                                                                                                                          |
| §6 analytics (decided)                       | B1d, stated as settled                                                                                                                                                                                      |
| §6 analytics `dist/` verification            | B4                                                                                                                                                                                                          |
| §6 bilingual out-of-scope                    | "Bilingual" section, kept                                                                                                                                                                                   |
| §7 Pre-launch verification 1 to 5            | B4                                                                                                                                                                                                          |
| §7 item 6 compliance / conversion-UX         | B4 (already present, kept verbatim)                                                                                                                                                                         |
| §7 CI / pre-commit note                      | B4                                                                                                                                                                                                          |
| §8 Testing a template-core change            | Appendix, unchanged                                                                                                                                                                                         |

## Content changes beyond reordering

1. **One order.** The spine is the single source of sequence, expressed as three arcs.
   §2's checklist becomes B1c; §4's skills become sub-bullets on A3 / B3 / B4 / C1.

2. **A3 names its output artifacts** (doc-level part of Gap B): a copy source file at a
   stated path or an explicit "client supplied copy, source = X"; a design direction
   brief; an optional schema draft. `docs/intake.md` comes from A2. B2 opens with "do
   not start until these exist."

3. **Analytics is no longer an open decision.** The current §6 still calls the vendor
   open. B1d states GA4 as settled, points at `analytics.vendors.googleAnalytics.id` /
   `requireConsent` and the `src/components/client/CookieConsent.astro` reference banner.
   The "bilingual out of scope, single language per site" note is kept as its own
   section.

4. **The approved-copy collapse is written once**, in the callout, and shown concrete in
   the worked example. Affected steps link back to it.

5. **Legal pages.** A2 keeps the decision point. C3 keeps "legal reviewed and approved"
   as a hard gate. One line added to A2: "if the client has no policy and needs one, that
   is external counsel or a reviewed template, and it blocks cutover." The full procedure
   is a known remaining gap, not designed here.

6. **`client-build-rules.md` boundary stated.** The intro names the division; B2 and B4
   link to it and do not duplicate its content.

7. **Worked example added.** A short Vinalia trace: which steps ran, which collapsed,
   where the copy source lived, what went to human review.

8. **No code changes.** `init-client.mjs`, `.githooks/`, and the skills are untouched.

## Success criteria

- `SETUP.md` has one workflow (three arcs, numbered steps). No parallel skill table.
- Retro item B "done when" is met: one numbered workflow, §4 content is a sub-section of
  it, not a parallel table.
- Every skill named in the current §4 table appears in the new doc on the step where it
  runs. Checked against the mapping table row for §4.
- Every current subsection §1 to §8 has a destination in the mapping table, and the
  implementation includes a walk of that table confirming each landed. This replaces the
  unverifiable "no information is lost".
- Both collapse conditions (approved copy; prior discovery) are marked, and the worked
  example shows the approved-copy path concretely.
- The analytics vendor is stated as settled, not open.
- The `TEMPLATE_VERSION` recording step survives (B1a and C4).
- The spine is stated to be a dependency order, not a schedule.
- `npm run check` passes (Prettier formats the Markdown).
- `docs/retrospectives/2026-09-05-vinalia-build-retro.md`: item B moves from "Still open"
  to "Done", with a pointer to the rewritten `SETUP.md`.

## Known remaining gaps after this rewrite

Tracked, not floating. Each is scoped as its own task or ADR after this spec.

- **Gap B (tooling / house rule).** A real gate: B2 cannot start without A3's artifacts.
  Candidate home: a `superpowers:writing-plans` house-rule line in
  `client-build-rules.md`, or an `init-client` scaffold that creates empty A3 artifact
  files.
- **Gap C (`init-client`).** Scaffold `docs/intake.md` / `docs/go-live.md` /
  `docs/handoff.md` from their templates; emit a `docs/reinit-checklist.md` from B1c;
  prompt for font mode (custom vs system) so B1c is not a blank guess. ADR candidate.
- **Legal.** The procedure for "client has no policy and needs one". Currently only a
  decision point (A2) and a gate (C3).
