# Feed Lessons Back Into The Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The user wants approval before each task's implementer is dispatched (not continuous execution), see the standing preference recorded in memory as `feedback-sdd-approval-gate`.

**Goal:** Close out sub-project D of the golden-branch design: harden the blank intake
template against the real Vinalia Consulting build, fix a real pre-existing accessibility
gate failure exposed by that build, and log two template-core friction items as documented
candidates for future work (not fixed now, per this repo's own hard rule).

**Architecture:** Four independent tasks, no shared state between them. Task 1 rewrites
`docs/intake-template.md` using the already-filled `vinalia-site/docs/intake.md` as the
worked example (read-only source, never edited). Task 2 fixes a color-contrast violation
in two template-core files on `main`, verified with `npm run test:lhci`. Task 3 brings
that same fix onto the `golden` branch via cherry-pick, so `golden`'s own `test:lhci` gate
goes green too, without merging `golden` into `main` or vice versa. Task 4 adds a new ADR
documenting the two friction items found during the Vinalia build (system-font clients,
`SchemaOrg.astro`'s missing `ProfessionalService`/founder/offer-catalog support) as
candidates for future core generalization, per `CLAUDE.md`'s "if you think core needs a
change, stop and raise it."

**Tech Stack:** No new dependencies. Uses the existing `npm run check` / `npm run
test:lhci` verification gates already wired into CI and the pre-commit hook.

**Spec:** `docs/superpowers/specs/2026-09-04-golden-branch-and-vinalia-build-design.md`,
Sub-project D ("feed lessons back into the template"). Sub-projects A (screenshot
tooling), B (the Vinalia build, own repo at
`/Users/antunzebec/Work/01.Clients/Vinalia Consulting/vinalia-site/`), and C (the `golden`
branch, 5 commits on `dodai-astrowind` ending `93a5190`) are all already complete.

## Global Constraints

- Task 1 only touches `docs/intake-template.md` in this repo. The source file,
  `/Users/antunzebec/Work/01.Clients/Vinalia Consulting/vinalia-site/docs/intake.md`, is
  read-only reference material for this plan, never edit it, it belongs to the separate
  `vinalia-site` repo.
- Task 2's fix lands on `main`. `src/components/blog/Headline.astro` and
  `src/components/common/SocialShare.astro` are template core
  (`src/components/{ui,common,blog}/`, per `CLAUDE.md`'s hard rules), but editing them
  here is correct: this plan's whole purpose is fixing a template-core defect, which is
  exactly the case `CLAUDE.md` carves out ("if you think core needs a change, stop and
  raise it", this task is that raise, already agreed via the plan, now executed).
- Task 3's fix lands on `golden` via `git cherry-pick`, never `git merge main` into
  `golden` and never merging `golden` into `main`. Per the spec and
  `docs/golden-workflow.md`, `golden` is permanent and never merges into `main`; bringing
  an isolated, non-client-layer core fix onto `golden` is exactly the case
  `docs/golden-workflow.md`'s merge-conflict convention exists for, but a single
  self-contained commit that touches no client-layer singleton file (`brand.ts`,
  `navigation.ts`, `config.yaml`, `schema.ts`) cherry-picks cleanly without needing that
  convention at all.
- No em dashes anywhere: code comments, copy, docs, commit messages.
- Prettier: single quotes, semicolons, 120 print width, 2-space indent
  (`.prettierrc.mjs`). Every commit on `main` leaves `npm run check` (astro check + eslint
  - prettier) green; the pre-commit hook runs the fast subset automatically.
- Commit trailer: `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- Verification is `npm run build` / `npm run check` / `npm run test:lhci`, matching the
  bar `SETUP.md` §7 sets for any change, not a unit-test framework (this repo has none).

---

## Task 1: Harden `docs/intake-template.md` against the filled Vinalia intake

**Files:**

- Modify: `docs/intake-template.md`
- Read-only reference (never modified):
  `/Users/antunzebec/Work/01.Clients/Vinalia Consulting/vinalia-site/docs/intake.md`

**Interfaces:**

- Consumes: nothing from other tasks in this plan (independent).
- Produces: a hardened `docs/intake-template.md` for the next client intake to copy, per
  its own header instruction ("Copy this file to `docs/intake.md` per project").

- [ ] **Step 1: Read both files side by side**

```bash
cat docs/intake-template.md
cat "/Users/antunzebec/Work/01.Clients/Vinalia Consulting/vinalia-site/docs/intake.md"
```

Confirm every section in the template (Business, Goal of the site, Pages, Brand, Domain
and infrastructure, Analytics and legal, Timeline) has a corresponding filled section in
the Vinalia intake, and note any question the Vinalia build had to track that the
template doesn't currently ask. Two are already known from the last session: (a) whether
the printed/public contact email is actually receiving mail, tracked ad hoc in Vinalia's
"Email provider" line ("the confirmed-live contact address... is the only mail-related
fact on record"); (b) whether any anti-persona exists (tracked in Vinalia's new
Messaging & Voice section, Step 3 below).

- [ ] **Step 2: Add the missing "email actually receiving mail" question to the Domain
      and infrastructure section**

In `docs/intake-template.md`, change:

```markdown
## Domain and infrastructure

- Production domain:
- Who controls DNS? (registrar, access?):
- Existing site to migrate content/redirects from?:
- Email provider (matters for SPF/DNS if we touch records):
```

to:

```markdown
## Domain and infrastructure

- Production domain:
- Who controls DNS? (registrar, access?):
- Existing site to migrate content/redirects from?:
- Email provider (matters for SPF/DNS if we touch records):
- Is the contact email printed on marketing materials actually receiving mail?
  (confirm, don't assume, before publishing it in schema/contact pages):
```

- [ ] **Step 3: Add the new Messaging & Voice section**

Vinalia's build needed core differentiators, guardrails on what not to say, real
customer language, and an anti-persona check, none of which the template currently has a
place for. In `docs/intake-template.md`, insert a new section directly after `## Brand`
and before `## Domain and infrastructure`:

```markdown
## Messaging & Voice

- Core differentiators / messaging pillars (what makes this business worth choosing,
  in the client's own terms):
- Guardrails, what not to say (named competitors to never reference, claims that don't
  apply, anything the client has explicitly ruled out):
- Real customer language (actual phrases/questions customers use, for FAQ/chat-style
  copy, not necessarily used verbatim on the site):
- Anti-persona (is there anyone this business does NOT want as a customer, and why? If
  none, confirm that explicitly rather than leaving it blank):
```

- [ ] **Step 4: Verify the template still reads cleanly end to end**

```bash
cat docs/intake-template.md
```

Expected: the file still opens with the `# Client intake: {{CLIENT_NAME}}` header and
its "fill this with the client" instruction, sections run Business, Goal of the site,
Pages, Brand, Messaging & Voice, Domain and infrastructure, Analytics and legal,
Timeline in that order, and the new Messaging & Voice section's four bullets are
present.

- [ ] **Step 5: Run the repo's doc-safe check**

```bash
npm run check:prettier
```

Expected: passes (Markdown is in Prettier's scope per `.prettierrc.mjs`'s file coverage
in this repo). If it fails on this file, run `npx prettier -w docs/intake-template.md`
and re-check.

- [ ] **Step 6: Commit**

```bash
git add docs/intake-template.md
git commit -m "$(cat <<'EOF'
Harden intake-template.md using the filled Vinalia intake as a worked example

Adds a question about whether a printed contact email actually receives
mail (tracked ad hoc during the Vinalia build, no place for it before now)
and a new Messaging & Voice section (core differentiators, guardrails on
what not to say, real customer language, anti-persona), all needed during
that build and missing from the template until now.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Fix the color-contrast accessibility violation on `main`

**Files:**

- Modify: `src/components/blog/Headline.astro:9`
- Modify: `src/components/common/SocialShare.astro:14`

**Interfaces:**

- Consumes: nothing from other tasks in this plan (independent).
- Produces: a `main` commit fixing the `test:lhci` accessibility gate failure, which
  Task 3 cherry-picks onto `golden`.

**Background:** `npm run test:lhci` fails on the `golden` branch with an accessibility
score of 0.95 (the gate requires 1.0, per `lighthouserc.cjs`'s `'categories:accessibility':
['error', { minScore: 1 }]`) on `/blog/` and `/golden-fixture-post-one/`. The violation is
a WCAG color-contrast failure in two template-core files, confirmed pre-existing (predates
the Vinalia build and the `golden` branch, present in the original AstroWind fork) and only
now exposed because `golden` is the first branch to run `test:lhci` against real blog
routes:

- `Headline.astro:9`'s subtitle uses `text-gray-500` (`#6B7280`) on a white light-mode
  background at `text-xl` (20px) `font-medium` (weight 500). Neither the size nor the
  weight qualifies for WCAG's "large text" 3:1 exception (large text needs either >=24px
  regular or >=18.66px **bold**, i.e. weight >=700), so it needs the normal-text 4.5:1
  minimum. `#6B7280` on white is approximately 3.56:1, below that minimum.
- `SocialShare.astro:14`'s "Share:" label uses `text-slate-500` (`#64748B`) on the same
  white background, at default body size with `font-bold`. `#64748B` on white is
  approximately 4.07:1, also below 4.5:1 (the bold weight doesn't help here since the
  text is well under the 18.66px large-text size threshold).

Both files' `dark:` variants (`dark:text-slate-400` in both cases) already pass
comfortably against the dark theme's near-black background, so only the light-mode
classes need to change.

- [ ] **Step 1: Change `Headline.astro`'s subtitle color one step darker**

In `src/components/blog/Headline.astro`, line 9, change:

```astro
<div class="mt-2 md:mt-3 mx-auto text-xl text-gray-500 dark:text-slate-400 font-medium" set:html={subtitle} />
```

to:

```astro
<div class="mt-2 md:mt-3 mx-auto text-xl text-gray-600 dark:text-slate-400 font-medium" set:html={subtitle} />
```

(`text-gray-600` is `#4B5563`, approximately 5.33:1 on white, clearing 4.5:1.)

- [ ] **Step 2: Change `SocialShare.astro`'s "Share:" label color one step darker**

In `src/components/common/SocialShare.astro`, line 14, change:

```astro
<span class="align-super font-bold text-slate-500 dark:text-slate-400">Share:</span>
```

to:

```astro
<span class="align-super font-bold text-slate-600 dark:text-slate-400">Share:</span>
```

(`text-slate-600` is `#475569`, approximately 6.14:1 on white, clearing 4.5:1.)

- [ ] **Step 3: Build and check**

```bash
npm run build
npm run check
```

Expected: both succeed, no visual regression in the class names themselves (only the
shade number changed, same Tailwind color family).

- [ ] **Step 4: Run the accessibility gate directly**

```bash
npm run test:lhci
```

Expected: passes, including `categories:accessibility` at 1.0. This repo's own
`src/pages` don't currently include a blog route on `main` (blog is off by default per
`config.yaml`), so this run confirms the fix doesn't regress anything already being
checked; Task 3's cherry-pick onto `golden` is what actually re-exercises `/blog/` and
`/golden-fixture-post-one/` against the fix.

- [ ] **Step 5: Commit**

```bash
git add src/components/blog/Headline.astro src/components/common/SocialShare.astro
git commit -m "$(cat <<'EOF'
Fix color-contrast accessibility violation in Headline and SocialShare

Headline.astro's subtitle (text-gray-500, ~3.56:1 on white) and
SocialShare.astro's "Share:" label (text-slate-500, ~4.07:1 on white)
both fell short of WCAG's 4.5:1 minimum for normal-size text. Neither is
large enough or bold enough (>=24px regular or >=18.66px bold) to qualify
for the 3:1 large-text exception. One shade darker each (gray-600,
slate-600) clears 4.5:1 without changing the visual family.

Pre-existing since the original AstroWind fork, only exposed once the
golden branch started running test:lhci against real blog routes
(/blog/, /golden-fixture-post-one/), where it dropped the accessibility
score to 0.95 against a gate requiring 1.0.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Bring the accessibility fix onto `golden`

**Files:**

- Modify (via cherry-pick, same two files as Task 2):
  `src/components/blog/Headline.astro`, `src/components/common/SocialShare.astro`

**Interfaces:**

- Consumes: the commit created in Task 2 (must be committed on `main` before this task
  starts; if Task 2 hasn't been dispatched or reviewed yet, this task blocks on it).
- Produces: a `golden` branch that passes `npm run test:lhci` at 1.0 accessibility,
  matching the same bar every other branch is held to.

- [ ] **Step 1: Confirm the working tree is clean, then switch to `golden`**

```bash
cd /Users/antunzebec/Work/dodai-astrowind
git status --short   # must be clean
git checkout golden
```

- [ ] **Step 2: Find Task 2's commit hash on `main`**

```bash
git log main --oneline -5
```

Note the hash of the "Fix color-contrast accessibility violation in Headline and
SocialShare" commit from Task 2.

- [ ] **Step 3: Cherry-pick it onto `golden`**

```bash
git cherry-pick <task-2-commit-hash>
```

Expected: applies cleanly with no conflicts. This commit touches only
`src/components/blog/Headline.astro` and `src/components/common/SocialShare.astro`,
neither a client-layer singleton file (`brand.ts`, `navigation.ts`, `config.yaml`,
`schema.ts`) nor anything `golden`'s own overlay commits (per
`docs/superpowers/plans/2026-09-05-golden-branch.md`) touched, so no part of
`docs/golden-workflow.md`'s merge-conflict convention is needed here.

If it does conflict (meaning something on `golden` diverged in these two files since
this plan was written), resolve by keeping Task 2's contrast fix (`text-gray-600`,
`text-slate-600`) and re-applying any unrelated change `golden` had made to the same
file on top of it, then `git cherry-pick --continue`.

- [ ] **Step 4: Build and check**

```bash
npm run build
npm run check
```

Expected: both succeed.

- [ ] **Step 5: Run the full four-check bar, confirming the actual gate that was failing
      now passes**

```bash
npm run build
npm run check
npm run test:links
npm run test:lhci
```

Expected: all four pass, specifically `categories:accessibility` at 1.0 across every
route including `/blog/` and `/golden-fixture-post-one/`, the two routes the session
summary recorded as failing at 0.95 before this fix.

- [ ] **Step 6: Confirm `golden` still has not been merged into `main`, and vice versa**

```bash
git log main..golden --oneline
git merge-base --is-ancestor golden main && echo "ERROR: golden is merged into main" || echo "OK: golden not merged into main"
```

Expected: the first command lists `golden`'s commits (including the new cherry-picked
one); the second prints `OK: golden not merged into main`. The cherry-pick step above
creates a new commit on `golden` with its own hash, it does not merge branches.

- [ ] **Step 7: Return to `main`**

```bash
git checkout main
```

No commit needed on `main` in this task, Task 2 already committed the fix there; this
task's own commit lives on `golden` via the cherry-pick in Step 3.

---

## Task 4: Log the two template-core friction items as an ADR

**Files:**

- Create: `docs/adr/0002-system-fonts-and-professional-service-schema.md`

**Interfaces:**

- Consumes: nothing from other tasks in this plan (independent).
- Produces: a documented, not-yet-fixed candidate for future core work, following this
  repo's existing ADR format (see `docs/adr/0001-template-repo-and-eject-widgets.md`) and
  its hard rule that a needed core change gets raised, not silently edited.

**Background:** the Vinalia build (sub-project B) surfaced two gaps between what the
template supports today and what a real client needed:

1. **System-font clients aren't a documented supported path.** Vinalia's brand guide
   specifies Arial for all UI, "no exceptions for premium feel." The build worked (no
   `astro.config.ts` `fonts` entry needed, `brand.ts`'s `fonts.*` pointed straight at the
   system stack), but this path exists only because it happens to work, not because
   `SETUP.md` documents it as a supported client shape. The template's setup steps (see
   `SETUP.md` §2, the `astro.config.ts fonts` -> `brand.fonts.*` step) assume every
   client wants a custom web font.
2. **`SchemaOrg.astro` can't express `ProfessionalService`, a founder, or an offer
   catalog.** Vinalia's structured-data draft
   (`marketing/seo/schema-localbusiness-draft.md` in the Vinalia project folder) wanted
   `@type: ["LocalBusiness", "ProfessionalService"]`, a `founder` field, a
   `foundingDate`, and `hasOfferCatalog` for the itemized price list. The template's
   `SchemaOrg.astro` today only emits `Organization`/`LocalBusiness` with none of those
   fields. B was built against what the template supports now (not editing core
   mid-build, per `CLAUDE.md`), so Vinalia's real site is currently missing this
   richer structured data.

- [ ] **Step 1: Read the existing ADR for format**

```bash
cat docs/adr/0001-template-repo-and-eject-widgets.md
```

Confirm the section order: title, Date, Status, Context, Decision, Consequences.

- [ ] **Step 2: Write the new ADR**

Create `docs/adr/0002-system-fonts-and-professional-service-schema.md`:

```markdown
# 2. System-font clients and richer LocalBusiness schema are undocumented gaps

Date: 2026-09-05

## Status

Proposed

## Context

The Vinalia Consulting build (the first real client site built against this template,
see `docs/superpowers/specs/2026-09-04-golden-branch-and-vinalia-build-design.md`,
sub-project B) surfaced two gaps between what the template documents as supported and
what it actually needed to handle:

1. **System-font clients.** Vinalia's brand guide specifies Arial for all UI, "no
   exceptions for premium feel." No custom web font, no `astro.config.ts` `fonts` entry.
   The build worked without one, `brand.ts`'s `fonts.*` pointed at the system stack
   directly, but `SETUP.md` §2's checklist step ("`astro.config.ts` `fonts`: client
   typeface; then point `brand.fonts.*` at its `cssVariable`") reads as a required step
   for every client, not an optional one. This is a real client shape the template
   handles correctly today, but only by accident of `brand.ts` not enforcing anything,
   not because the path is documented or tested.
2. **`SchemaOrg.astro`'s structured-data coverage.** Vinalia's confirmed structured-data
   draft (`marketing/seo/schema-localbusiness-draft.md` in the client's own project
   folder) specifies `@type: ["LocalBusiness", "ProfessionalService"]`, a `founder`
   field, `foundingDate`, and `hasOfferCatalog` for its itemized price list, none of
   which `SchemaOrg.astro` currently emits. Vinalia's built site (and the `golden`
   branch, which overlays it) ships with only `Organization`/`LocalBusiness` schema as a
   result, a real gap between what a service-business client needs for SEO and what the
   template currently produces.

Per `CLAUDE.md`'s hard rule ("If you think core needs a change, stop and raise it, don't
just edit"), neither gap was fixed during the Vinalia build; both are logged here as
candidates instead.

## Decision

Not yet decided. This ADR records the two gaps as candidates for a future core change;
it does not implement either. Options for each, to be picked up in a later session:

1. **System fonts**: document a "system-font client" as an explicitly supported path in
   `SETUP.md` §2 (skip the `astro.config.ts fonts` step, point `brand.fonts.*` straight
   at the system stack), rather than leaving it as an implicit side effect of `brand.ts`
   accepting any CSS font-family string.
2. **Schema**: generalize `SchemaOrg.astro` to accept an array of `@type` values, an
   optional `founder`/`foundingDate`, and an optional `hasOfferCatalog`, sourced from
   `src/schema.ts` the same way its current fields are, so a client with a confirmed
   structured-data draft like Vinalia's can express it without a core edit mid-build.

## Consequences

- Until decided, `SETUP.md` continues to read as if every client needs a custom web
  font, and `SchemaOrg.astro` continues to under-serve service businesses that want
  `ProfessionalService` schema, a founder credit, or an offer catalog.
- Vinalia's own site (`vinalia-site` repo) and the `golden` branch's overlay of it both
  currently ship without `ProfessionalService`/founder/offer-catalog schema as a direct
  consequence; revisiting this ADR is also the trigger to backfill that site once
  `SchemaOrg.astro` supports it.
- No template-core files are touched by this ADR itself. See
  `docs/superpowers/specs/2026-09-04-golden-branch-and-vinalia-build-design.md`,
  Sub-project B, for the full source material behind both gaps.
```

- [ ] **Step 3: Verify Prettier is happy with the new file**

```bash
npm run check:prettier
```

Expected: passes. If not, run `npx prettier -w docs/adr/0002-system-fonts-and-professional-service-schema.md` and re-check.

- [ ] **Step 4: Commit**

```bash
git add docs/adr/0002-system-fonts-and-professional-service-schema.md
git commit -m "$(cat <<'EOF'
Log system-font clients and ProfessionalService schema as ADR candidates

Records two friction items from the Vinalia Consulting build (system-font
clients aren't a documented supported path; SchemaOrg.astro can't express
ProfessionalService/founder/offer-catalog) as a Proposed ADR, per this
repo's hard rule to raise needed core changes rather than edit core
mid-build. Neither gap is fixed by this commit.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Final check: sub-project D complete

- [ ] **Confirm all four tasks landed where intended**

```bash
git log main --oneline -5
git log golden --oneline -3
ls docs/adr/
```

Expected: `main` has Task 1's intake-template commit, Task 2's accessibility-fix commit,
and Task 4's ADR commit (order may vary depending on dispatch order, since all three are
independent); `golden`'s tip is Task 3's cherry-pick of Task 2's fix; `docs/adr/` has both
`0001-template-repo-and-eject-widgets.md` and
`0002-system-fonts-and-professional-service-schema.md`.
