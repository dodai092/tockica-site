# Retrospective: the Vinalia Consulting build (sub-project B)

Date: 2026-09-05
Scope: how the first real client build against this template actually went, and what
that says about the per-client process. Not a list of template code fixes.

Sources: the two build session summaries
(`.claude/session-summaries/2026-09-04-221207-f50c.md`, `2026-09-05-012712-4c81.md`),
the implementation plan (`docs/superpowers/plans/2026-09-04-vinalia-site-build.md`),
`vinalia-site`'s git history, its shipped `src/components/client/*` /
`src/schema.ts` / `src/config.yaml`, its `docs/intake.md` and `docs/go-live.md`, ADR
0002, and `SETUP.md` / `docs/intake-template.md` as they stand.

---

## Bottom line

The build shipped seven working pages with no fabricated facts and no core edits, which
is the bar. Three changes would have the most leverage on the next build:

1. **Client copy comes out of the plan document.** It goes in a referenced source
   file; implementers copy from source, never from the plan. The one Critical defect
   this build produced came from a corrupted copy line inside a 2300-line plan.
2. **A mechanical guard blocks core edits in client repos.** Three edits to core or
   copy-locked text were attempted and caught only because a reviewer looked.
3. **The final-review checklist gets a compliance and conversion-UX pass.** Lighthouse
   does not catch a missing consent checkbox, a missing form success page, or Google
   Consent Mode v2. The build's own final review missed all three (see the punch list
   in the appendix).

## Decisions this retro depends on (resolve before acting on the recommendations)

- **Is the `SETUP.md` §4 skill pipeline the intended process, or is "write a plan,
  run SDD" the process?** The build followed the second. The two docs describe
  different workflows.
- **Analytics: commit to a no-banner vendor (Plausible/Fathom) as the default, or
  invest in a correct, reusable EU-consent recipe?** The current hand-built GA4
  consent component is not Consent Mode v2 compliant.
- **Is a mechanical core-edit guard in client repos worth the setup cost?**

---

## What went well (keep)

1. **Fact-traceability rule.** The plan required every price, claim, and contact
   detail to trace to a named source file, and forbade inventing facts. Nothing
   fabricated shipped. Make this a standing constraint on every client plan.

2. **SDD with a per-task approval gate and fresh subagents.** 18 tasks, one
   implementer plus one independent reviewer each, approval before each dispatch. The
   per-task review caught bad edits early (see friction 2, which is the cost side of
   the same coin).

3. **Model tiering.** Haiku for pure transcription, Sonnet for judgment (asset
   selection, dark-mode derivation, review). No visible quality loss on the
   transcription work.

4. **Two-layer review.** Per-task reviewers plus a final whole-branch Opus pass. The
   final pass caught a Critical copy defect the per-task reviews missed, plus 14
   Important/Minor items. It earned its keep, and it still had blind spots (bottom
   line item 3).

5. **Parts-bin / client-component separation held.** No core edit shipped. `Hero` was
   built fresh rather than composed from the widget-bin `Hero`, exactly as CONTEXT.md
   intends. All five client components landed in `src/components/client/`. This held
   only because reviewers caught three attempts to break it (friction 2).

6. **Decisions resolved before execution.** GA4 vs Plausible and the heading color
   were settled in the plan-writing session, not mid-build.

7. **The golden branch paid off.** The tinted-`bgPage` contrast regression only
   reproduces against a non-white background; golden is what surfaced it.

---

## Friction, ranked by cost incurred vs cost to prevent

### Critical

**1. Verbatim client copy embedded in the plan document.**
The Critical final-review defect traced to a corrupted line in the plan itself: the
plan carried the client's Croatian copy inline across 2300 lines, an implementer
transcribed the corrupted version, and only the whole-branch review caught it. A large
plan doc is a lossy transport for content that must ship character-for-character.
_Cost to prevent: keep client copy in a source file, reference it by path._

**2. Core-edit and copy-lock violations relied entirely on review to catch.**
Three attempts: `astro.config.ts` (Task 13), client copy (Task 14), and a second copy
edit traced to the corrupted plan line. All caught, none shipped. There is no
mechanical guard that fails a client-repo commit touching `src/layouts/`,
`src/utils/`, `src/components/{ui,common,blog}/`, `vendor/`, or the config system. The
Task 13 edit was also a _misdiagnosis_: the implementer thought Netlify form detection
needed an `astro.config.ts` change; it did not.
_Cost to prevent: a pre-commit hook or CI check in client repos._

**3. The final-review checklist has no compliance or conversion-UX pass.**
The review checked code correctness, copy fidelity, and a11y via Lighthouse. It did
not catch: no privacy-consent checkbox on the PII-collecting contact form, no form
success page, no Google Consent Mode v2 in the cookie component. See the appendix.
These are launch blockers on an EU client's single primary CTA, and the process has
no step that would find them.
_Cost to prevent: add a named section to the review skill / go-live checklist._

### High

**4. `SETUP.md` describes the workflow three different ways.**
The §2 by-hand reinit checklist, the §4 skill pipeline table, and the actual method
(plan + SDD). The build followed the third. The §4 pipeline (storybrand ->
copywriting -> design-taste-frontend -> frontend-design -> impeccable ->
avoid-ai-writing) was effectively not run: the client brought finished, approved copy,
so Message and Copy collapsed to "transcribe from source," and design / polish /
AI-cleanup were folded into plan tasks or deferred to human review. The doc does not
say which description is authoritative.

**5. `init-client` gaps, each needing a manual workaround.**

- **System-font clients.** §2 reads as if every client needs an `astro.config.ts`
  `fonts` entry. Vinalia uses Arial. The build worked only because `brand.ts` enforces
  nothing. (ADR 0002, open.)
- **Client repo self-identity.** `CLAUDE.md`, `CONTEXT.md`, `SETUP.md`, `AGENTS.md` in
  the fork still described themselves as the dodai-astrowind template. Fixed by hand
  (`e4d4a0b`); the template still ships this.
- **Repo hygiene.** A plain fork carries `golden-baselines/`, `docs/superpowers/`,
  `.claude/session-summaries/` into the client repo. The plan added a manual `rm` step
  (Task 1).
- **favicon.ico.** The init-generated `.ico` was not a valid multi-size container and
  had to be regenerated (`01a2e94`).

**6. The GA4-for-EU pattern was hand-built in the client layer and is still wrong.**
Core `Analytics.astro` fires GA unconditionally once `config.yaml` has an ID and
cannot be edited, so the entire consent mechanism lives in `CookieConsent.astro` with
`googleAnalytics.id` left `null`. It is undocumented, untested, will be re-invented for
the next EU client, and it is missing Consent Mode v2 (appendix). `SETUP.md` §6 still
lists the analytics vendor as an open decision.

### Medium

**7. The no-em-dash rule collided with approved client copy.**
Five em dashes in the client's verbatim-approved copy forced a mid-build ruling (rule
binds agent-authored text, not client-verbatim), and the ruling had to be reconfirmed
the next session. State the carve-out once, where the rule lives.

**8. Plan self-review missed a phantom file.**
Task 15's Files section named `src/layouts/ClientLayout.astro`; its steps never create
it and it would be core-adjacent anyway. The implementer had to be told to ignore the
line. Plan self-review does not check that every path in a Files section is either
created by that task or already exists.

**9. Accessibility and SEO issues flagged in source docs were deferred, not fixed in
the brief.**
The homepage brief skipped `<h1>` to `<h3>` with no `<h2>`; the client's own copy doc
flagged it. The plan carried the gap forward to the Task 17 verification pass instead
of fixing the brief markup. Same pattern with tinted-background contrast.

**10. Legal pages have no path to "done."**
Terms and privacy shipped as boilerplate with a "not legal advice" banner and a
launch-gate note. The intake asks "existing privacy policy to reuse?" but has no
branch for "client has none and needs a real one," which is the common case.

### Low

**11. `SchemaOrg.astro` under-serves service businesses.**
Vinalia's confirmed structured-data draft wants
`@type: ["LocalBusiness", "ProfessionalService"]`, `founder`, `foundingDate`,
`hasOfferCatalog`. None is expressible, so the site ships plain `LocalBusiness`. (ADR
0002, open.)

**12. Intake was reverse-engineered at the end.**
`docs/intake-template.md` says "Fill this with the client before starting." Vinalia's
was written as Task 18 from facts gathered in a separate engagement. Fine here, but
nothing documents the "discovery already happened elsewhere" path.

---

## Recommendations

### Status (2026-09-05, acted on this session)

Done:

- **C** (system-font path). `Layout.astro` now maps over `src/fonts.ts` instead of a
  hardcoded `--font-inter` line; `SETUP.md` §2 documents custom-typeface and
  system-font branches; ADR 0002 item 1 marked resolved.
- **D**, repo hygiene half. `init-client.mjs` now strips `golden-baselines/`,
  `docs/superpowers/`, `docs/retrospectives/`, `docs/golden-workflow.md`,
  `.claude/session-summaries/`. The self-identity rewrite was already in `init-client`.
- **E** (compliance + conversion-UX checklist). Added as `SETUP.md` §7 item 6.
- **F** (em-dash carve-out). Stated in the global rule.
- **G** (legal-pages decision point). `SETUP.md` §2 legal item + `go-live.md`.
- Intake additions: all five landed in `docs/intake-template.md`.
- The whole punch list below is fixed in `vinalia-site` (branch `launch-fixes`), plus
  a favicon-size and OG-image-weight fix found along the way. Item 1 was scoped down:
  the gate is opt-in, so the fix was to signal consent explicitly on accept, not a
  full default-denied Consent Mode dance.

Not done (need their own cycle or your call):

- **A / H**: both touch the `superpowers:writing-plans` plugin skill. Left alone.
- **B** full workflow reconciliation: §4 now has a framing paragraph, but §2 and §4
  are still separate sections. A real single-numbered-workflow rewrite is a judgment
  call for you.
- ADR candidates 1 (core-edit guard), 2 (consent-capable core `Analytics`), 4
  (richer `SchemaOrg`), and the client-layer layout seam.

### Status (2026-09-05, later cleanup run)

Done since the above:

- ADR candidate 1: `.githooks/pre-commit` blocks core edits in client repos, gated on a
  `.template-repo` marker `init-client` strips (commit `f7864ee`).
- ADR candidate 2: core `Analytics.astro` is consent-capable via
  `analytics.vendors.googleAnalytics.requireConsent`; exposes `window.awAnalytics`
  (`7726b31`). Reference banner: `src/components/client/CookieConsent.astro`.
- ADR candidate 4 / ADR 0002 item 2: `SchemaOrg.astro` emits `@type` array, `founder`,
  `foundingDate`, `hasOfferCatalog` from `src/schema.ts` (`7acedae`). ADR 0002 now
  Accepted.
- Client-layer layout seam: `src/components/client/GlobalEmbeds.astro`, rendered once by
  core `Layout.astro` at end of `<body>`. Kills friction 8 (phantom `ClientLayout`) and
  gives `CookieConsent` a mount point (`8a06547`).
- **A / H** and the review half of **E**: captured in `docs/client-build-rules.md`
  (repo-local, no plugin change), referenced from `CLAUDE.md` / `AGENTS.md` / `SETUP.md`
  §4 (`bf367d8`).
- Logo/favicon brand bug: `Logo.astro` renders `brand.logo.image`; `Favicons.astro`
  drops the hardcoded `#8D46E7` mask-icon (`0c26897`).
- **B** (single-workflow rewrite). `SETUP.md` is now one three-arc workflow (Discovery,
  Build, Launch); the old §2 checklist is step B1c and the §4 skill table is prose
  sub-bullets on A3/B3/B4/C1. Design:
  docs/superpowers/specs/2026-09-05-setup-single-workflow-design.md.

Still open: Backfilling `vinalia-site`'s `src/schema.ts` with `founder` / `foundingDate` / `hasOfferCatalog` once those facts are confirmed with the client.

### Do now (doc edits, no core change)

| #   | Change                                                                                                                                                                         | Artifact                                                                | Done when                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Client copy lives in a source file referenced by path; plans instruct implementers to copy from source, not from the plan body                                                 | plan-authoring guidance / `superpowers:writing-plans` house rules       | A client plan contains zero inline copy blocks longer than a heading                                                                                        |
| B   | Reconcile the three workflow descriptions into one; map the §4 skills to phases of the real method; mark which phases collapse when the client brings finished copy            | `SETUP.md` §2 and §4                                                    | `SETUP.md` has one numbered workflow, and §4 is a sub-section of it, not a parallel table (done 2026-09-05)                                                 |
| C   | Add a "system-font client" branch: skip the `astro.config.ts fonts` step, point `brand.fonts.*` at a system stack                                                              | `SETUP.md` §2, `scripts/init-client.mjs` prompt                         | `init-client` does not prompt for a font unconditionally; §2 has an explicit no-web-font path                                                               |
| D   | Fold repo hygiene and client-repo self-identity rewrite into `init-client`                                                                                                     | `scripts/init-client.mjs`                                               | A fresh fork after `init-client` has no `golden-baselines/`, `docs/superpowers/`, `.claude/session-summaries/`, and no doc self-identifying as the template |
| E   | Add a compliance + conversion-UX section to the review checklist: form consent, form success state, Consent Mode v2, focus-visible, footer (not floating) cookie-settings link | `superpowers:requesting-code-review` house rules / `docs/go-live.md` §3 | The checklist names each item and the final review reports on them                                                                                          |
| F   | State the em-dash carve-out (agent-authored text only, not client-verbatim) once                                                                                               | wherever the rule is defined (global `CLAUDE.md`)                       | The rule text names the exception                                                                                                                           |
| G   | Add a legal-pages decision point: reuse / client supplies reviewed text / boilerplate gated on external review, with boilerplate always a launch blocker                       | `SETUP.md`, `docs/go-live.md`                                           | `go-live.md` blocks cutover until legal pages are marked reviewed                                                                                           |
| H   | Plan self-review checks that every Files-section path is created by that task or already exists                                                                                | `superpowers:writing-plans` self-review section                         | The self-review checklist has this line                                                                                                                     |

### ADR candidates (core change, own cycle)

1. Mechanical core-edit guard for client repos (pre-commit hook + CI). New.
2. Consent-capable core `Analytics.astro`, or a documented Consent Mode v2 client-layer
   recipe. Extends the `SETUP.md` §6 open decision.
3. System-font client path. ADR 0002, open.
4. Richer `SchemaOrg.astro` (`@type` array, `founder`, `foundingDate`,
   `hasOfferCatalog`). ADR 0002, open.

### Intake template additions

- "Has the client already drafted and approved copy? Where does it live?" Determines
  whether the build authors or transcribes, which changes the plan shape.
- "Any verbatim-locked text (approved taglines, legal copy, regulated claims)?" so the
  editing passes (no em dashes, humanizer, avoid-ai-writing) know what is off-limits
  before they run.
- "Structured-data / schema draft from the client?"
- "Discovery done here, or already completed in a prior engagement?" with a pointer.
- Promote DNS control to a required field, not "establish before launch." It was
  unanswered through the whole build.
- Keep the email-deliverability question added in sub-project D; it caught a real thing
  here.

### Parts-bin / client-component pattern

The copy-from-bin, never-edit-in-place discipline held and needs no change. Two
additions:

- The mechanical guard above (also ADR candidate 1).
- Sanction a client-layer layout seam. Task 15 wanted a `ClientLayout` wrapper to
  avoid mounting `CookieConsent` on seven pages and was blocked as core-adjacent. A
  blessed client-layer layout file the rules permit would remove that friction and the
  phantom-file confusion.

---

## Appendix: `vinalia-site` launch punch list

Separate from the process retro. These are defects in the shipped build, found by
reading `src/components/client/` after the fact. None were caught by the build's final
review. **All fixed 2026-09-05 on `vinalia-site` branch `launch-fixes`** (see the
"prepare for launch" plan, `docs/superpowers/plans/2026-09-05-vinalia-launch-fixes.md`).

**CookieConsent.astro**

1. **No Google Consent Mode v2.** The component calls `gtag('config', ID)` with
   storage defaulted to granted. GA4 for EEA traffic needs `analytics_storage`,
   `ad_storage`, `ad_user_data`, `ad_personalization` defaulted to `denied` and
   updated to `granted` on accept. As written, EU visitor data may not process and the
   consent gate is not actually compliant. Highest-priority item on this list.
2. **Floating "Postavke kolačića" link** is `position: fixed; bottom; left` on every
   page, permanently overlapping content. Move it to the footer.
3. **No focus management or `aria-live`** when the banner appears. Add `role="dialog"`
   or an `aria-live` region and move focus to the accept button.
4. **`G-PLACEHOLDER` fails silently** (`gtag/js` returns 200 for any ID). Add a CI
   grep that fails the build if `G-PLACEHOLDER` is still present, or gate it behind an
   env var.

**ContactForm.astro**

5. **No success page.** Native Netlify POST, no `action`, no `/success` route. A real
   submission lands the user on Netlify's generic unstyled success page. Add a styled
   `/hvala` (or `/success`) route and point `action` at it, or switch to an AJAX
   submit with an inline confirmation.
6. **No privacy-consent checkbox or notice.** An EU form collecting name, email,
   phone, and free text needs an explicit "I agree to the privacy policy" checkbox or
   at minimum an inline notice linking `/privacy` next to the submit button.
7. **No visible `:focus-visible` styling** on inputs or the submit button; the custom
   border styles partly override the browser default. Add a focus ring.

**General**

8. Confirm `config.yaml` `metadata.robots.index` and `site.site` are the final
   production values before cutover (already in `go-live.md`, restated here because
   the fix-wave commit touched `config.yaml`).
