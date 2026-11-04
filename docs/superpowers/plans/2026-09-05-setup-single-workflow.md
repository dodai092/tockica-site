# SETUP.md Single-Workflow Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `SETUP.md` into one client-build workflow (three arcs: Discovery, Build, Launch) so the template has a single ordered path instead of three unreconciled descriptions.

**Architecture:** Pure documentation change. `SETUP.md` is reorganised onto a three-arc spine; the current §2 checklist becomes step B1c, the current §4 skill table dissolves into prose sub-bullets on the steps where each skill runs. Two supporting files get stale cross-references corrected and the retro's open-item status flipped. No code, no `init-client.mjs` / `.githooks/` / skill changes.

**Tech Stack:** Markdown, Prettier (via `npm run check`), git.

**Spec:** `docs/superpowers/specs/2026-09-05-setup-single-workflow-design.md`

## Global Constraints

- No em dashes anywhere in authored text (global `CLAUDE.md` rule). Use a period, comma, or "and"/"so".
- Documentation change. The rewrite also desynced `scripts/init-client.mjs`'s verbatim self-identity string matches and three stale `SETUP.md` pointers (`src/config.yaml`, `src/components/client/README.md`, `README.md`), repaired in commit `3a08f2d` after the whole-branch review flagged it. `.githooks/` and all skills stay untouched.
- No information from the current `SETUP.md` §1 to §8 is dropped. Every current subsection has a destination in the spec's "Mapping of current sections to the new structure" table; the rewrite must place each one there.
- The analytics vendor is GA4, settled. The rewrite states it as settled, not as an open decision. Do not re-pitch Plausible/Fathom.
- `client-build-rules.md` is not duplicated into `SETUP.md`. Steps B2 and B4 link to it.
- Prettier formats the Markdown: `npm run check` must pass after every commit (or `npx prettier --write` on the changed file before committing).
- Do not push `origin/main`. Work stays on the `setup-single-workflow` branch.

---

### Task 1: Rewrite SETUP.md into the three-arc workflow

**Files:**

- Modify (full rewrite): `SETUP.md`
- Read for source content: current `SETUP.md` (git show `HEAD:SETUP.md` if already edited), `docs/superpowers/specs/2026-09-05-setup-single-workflow-design.md`, `docs/client-build-rules.md`, `docs/go-live.md`, `docs/intake-template.md`, `docs/handoff-template.md`
- Read for the Vinalia worked example: `docs/retrospectives/2026-09-05-vinalia-build-retro.md` (friction item 4, the "what went well" list, the appendix)

**Interfaces:**

- Consumes: the spec's "Document structure (target `SETUP.md`)" block and its "Mapping of current sections to the new structure" table. Follow that structure exactly.
- Produces: the rewritten `SETUP.md`. Task 2 relies on its section anchors: `## Arc A: Discovery`, `## Arc B: Build`, `## Arc C: Launch`, and the top-of-file intro paragraph naming the `client-build-rules.md` boundary.

- [ ] **Step 1: Capture the current SETUP.md content as the source-of-truth mapping input**

Run: `git show HEAD:SETUP.md > /tmp/setup-old.md` (the working copy may already be mid-edit; `HEAD` on this branch is still the pre-rewrite version).
Then build a checklist file listing every current subsection heading (§1 through §8, plus their sub-bullets that carry unique content: the fonts custom-vs-system branch, the legal decision point, the Netlify Forms gotcha, the tinted-`bgPage` contrast note, the CI/pre-commit note, the analytics `dist/` verification, the bilingual note).
Write it to `/tmp/setup-coverage.md` as `- [ ] §N.x <topic> -> <target step>` lines, target taken from the spec's mapping table.

- [ ] **Step 2: Write the rewritten SETUP.md**

Produce the full file following the spec's "Document structure" block. Section order, exactly:

1. `# Building a client site from this template` + 2-sentence intro (one workflow, three arcs, optional collapses; spine is a dependency order not a schedule; pointer to `CONTEXT.md` / `AGENTS.md` / `docs/client-build-rules.md` with the one-line boundary: SETUP owns the sequence, `client-build-rules.md` owns the plan/review house rules).
2. `## The workflow at a glance`, the three arcs, each step one line: `**A2. Discovery and intake** -> produces: docs/intake.md filled -> driven by: docs/intake-template.md, superpowers:brainstorming`. End with the two collapse notes (approved copy; prior discovery).
3. `## Short path: client brings finished, approved copy`, a blockquote callout with the 5 collapse bullets from the spec's "Collapse" section.
4. `## Worked example: the Vinalia build`, 3 to 5 lines: A2 ran (facts gathered in a prior engagement, intake written up after), A3 collapsed (client brought approved Croatian copy, `storybrand` and `copywriting` skipped, source file referenced by path), B2/B3 ran as transcription-heavy tasks with per-task review, B4 ran full-weight and its whole-branch review caught a Critical copy defect, non-English copy went to human review not `avoid-ai-writing`. Keep it factual, no praise language.
5. `## Arc A: Discovery` with `### A1. Engagement start`, `### A2. Discovery and intake` (keep the legal decision point verbatim in substance: client supplies reviewed text / reuse an existing policy / ship boilerplate gated on external review, path (c) always a launch blocker; add one line: "if the client has no policy and needs one, that is external counsel or a reviewed template, and it blocks cutover"), `### A3. Prepare the plan inputs` (the §4 skills `storybrand-messaging`, `marketing-skills:copywriting`, `marketing-skills:customer-research`, `design-taste-frontend` as prose sub-bullets at the point each runs; name the required output artifacts: a copy source file at a stated path or explicit "client supplied copy, source = X", a design direction brief, an optional schema draft).
6. `## Arc B: Build` with `### B1. Create and reinitialise the repo` containing `#### B1a` (Use this template, clone, `npm install`, `npm run dev`, record `TEMPLATE_VERSION` in the first commit message), `#### B1b` (what `init-client` does, from the spec), `#### B1c` (the current §2 "finish by hand" list verbatim in substance: secondary/accent/text/bg colours; fonts custom-typeface vs system-stack branch, both paths, kept in full; `navigation.ts`; logos, favicons, favicon.ico regeneration, `default.png` OG image; `robots.txt` / `_headers`; blog toggle; `schema.ts`; `ui.theme`), `#### B1d` (analytics: GA4 settled, set `analytics.vendors.googleAnalytics.id`, `requireConsent: true` for EU + mount `CookieConsent.astro` from `GlobalEmbeds.astro`). Then `### B2. Write the build plan` (opens with "do not start until A3's artifacts exist"; links to `docs/client-build-rules.md` for plan house rules, does not restate them), `### B3. Build` (absorbs current §3: all per-client work in `src/components/client/`, copy from the parts bin never edit it, brand values only in `src/brand.ts`, global mounts only via `GlobalEmbeds.astro`; names `superpowers:subagent-driven-development`, `frontend-design`, `impeccable`, the repo `.agents/skills/*`), `### B4. Verify` (current §7 items 1 to 6 verbatim including the tinted-`bgPage` contrast note and the compliance/conversion-UX checklist; the analytics `dist/` check; the CI + pre-commit note; links to the `client-build-rules.md` review checklist; `avoid-ai-writing` on build-authored text only).
7. `## Arc C: Launch` with `### C1. Ship` (`git-pushing`), `### C2. Deploy` (current §5: Netlify default, `netlify.toml`, `deploy/` alternates, the Netlify Forms markup gotcha verbatim), `### C3. Client review and pre-launch gates` (pointer to `docs/go-live.md` §2 to §3, the checklist summary), `### C4. Cutover` (pointer to `docs/go-live.md` §4 to §5, records launch date + `TEMPLATE_VERSION`), `### C5. Handoff` (pointer to `docs/handoff-template.md`).
8. `## Appendix: testing a template-core change`, current §8 verbatim (the `docs/golden-workflow.md` pointer, the `npx playwright install chromium` note).
9. `## Bilingual (HR + EN)`, current §6 bilingual note verbatim: out of scope, single language per site, revisit if a client needs it.

Do not paste `client-build-rules.md` content. Do not invent procedure the current doc does not have (legal "client needs a policy" stays a one-liner, not a procedure).

- [ ] **Step 3: Walk the coverage checklist**

Open `/tmp/setup-coverage.md`. For each line, confirm the topic actually appears at its target step in the new `SETUP.md`. Check off each line. If any topic has no home, add it to the correct step now. The fonts custom-vs-system branch and the Netlify Forms gotcha are the two most likely to get compressed away; confirm both are present in full.

- [ ] **Step 4: Em-dash and skill-coverage scan**

Run: `grep -n "—" SETUP.md`. Expected: no output.
Run: `grep -nE "storybrand-messaging|copywriting|customer-research|design-taste-frontend|frontend-design|impeccable|avoid-ai-writing|subagent-driven-development|writing-plans|git-pushing|webapp-testing" SETUP.md`. Expected: every skill from the current §4 table appears at least once.

- [ ] **Step 5: Format and check**

Run: `npx prettier --write SETUP.md && npm run check`
Expected: Prettier reports the file formatted, `npm run check` passes (0 errors).

- [ ] **Step 6: Commit**

```bash
git add SETUP.md
git commit -m "docs: rewrite SETUP.md into one three-arc client workflow (retro item B)"
```

---

### Task 2: Fix stale cross-references and close retro item B

**Files:**

- Modify: `CLAUDE.md` (root of `dodai-astrowind`, the project instructions file), the line describing `SETUP.md`
- Modify: `CONTEXT.md:46`, the "Related docs" bullet for `SETUP.md`
- Modify: `AGENTS.md`, the "Dodai template rules" pointer to `SETUP.md` if it describes SETUP's shape
- Modify: `docs/retrospectives/2026-09-05-vinalia-build-retro.md`, the "Still open" line for item B

**Interfaces:**

- Consumes: Task 1's rewritten `SETUP.md` and its section anchors.
- Produces: nothing downstream. This is the last task.

- [ ] **Step 1: Update the SETUP.md descriptions**

In `dodai-astrowind/CLAUDE.md`, the pointer currently reads (or similar): `[SETUP.md](./SETUP.md), the per-client workflow (reinit checklist + skill pipeline)`. Change the parenthetical to `the per-client build workflow (one workflow: Discovery, Build, Launch)`.
In `CONTEXT.md:46`: same change to `- [SETUP.md](./SETUP.md), the per-client build workflow (Discovery, Build, Launch)`.
In `AGENTS.md`: if the SETUP pointer describes it as "reinit checklist + skill pipeline" or "the per-client workflow", align the wording the same way. If it is a bare link, leave it.

Run: `grep -rn "reinit checklist + skill pipeline\|reinit checklist" CLAUDE.md CONTEXT.md AGENTS.md`, expected: no output after the edits.

- [ ] **Step 2: Flip retro item B to Done**

In `docs/retrospectives/2026-09-05-vinalia-build-retro.md`, find the "Still open" line in the "Status (2026-09-05, later cleanup run)" section that reads `Still open: **B** (single-workflow rewrite of SETUP.md §2 + §4), and backfilling ...`.
Move item B out of "Still open": add a bullet under "Done since the above:" reading:
`- **B** (single-workflow rewrite). SETUP.md is now one three-arc workflow (Discovery, Build, Launch); the old §2 checklist is step B1c and the §4 skill table is prose sub-bullets on A3/B3/B4/C1. Design: docs/superpowers/specs/2026-09-05-setup-single-workflow-design.md.`
Leave the schema backfill as the only remaining "Still open" item.
Also update the "Do now" table row B: change its "Done when" cell or add a trailing ` (done 2026-09-05)` marker so the table is not contradicted by the status section.

- [ ] **Step 3: Check**

Run: `npx prettier --write CLAUDE.md CONTEXT.md AGENTS.md docs/retrospectives/2026-09-05-vinalia-build-retro.md && npm run check`
Expected: `npm run check` passes.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md CONTEXT.md AGENTS.md docs/retrospectives/2026-09-05-vinalia-build-retro.md
git commit -m "docs: point cross-refs at the rewritten SETUP.md, close retro item B"
```

---

## Self-Review

**1. Spec coverage:**

- Spec "Document structure" block -> Task 1 Step 2 reproduces it section by section.
- Spec "Mapping of current sections" table -> Task 1 Steps 1 and 3 build and walk a coverage checklist from it.
- Spec content changes 1 to 8 -> change 1 (one order): Task 1 Step 2 structure. Change 2 (A3 artifacts): Step 2 item 5. Change 3 (analytics settled): Step 2 item 6 B1d + Global Constraints. Change 4 (collapse written once + worked example): Step 2 items 3 and 4. Change 5 (legal one-liner): Step 2 item 5. Change 6 (`client-build-rules.md` boundary): Step 2 item 1 + Global Constraints. Change 7 (worked example): Step 2 item 4. Change 8 (no code): Global Constraints.
- Spec success criterion "TEMPLATE_VERSION survives" -> Task 1 Step 2 items 6 (B1a) and 7 (C4).
- Spec success criterion "item B moves to Done" -> Task 2 Step 2.
- Spec success criterion "dependency order not a schedule" -> Task 1 Step 2 item 1.

**2. Placeholder scan:** No "TBD"/"TODO"/"handle edge cases" in the steps. Task 1 Step 2 spells out every section rather than saying "follow the spec". The one deliberate deferral (legal procedure) is explicitly scoped out in Global Constraints and the spec.

**3. Type consistency:** No code types. Section anchors are consistent: `## Arc A: Discovery` / `## Arc B: Build` / `## Arc C: Launch` and `### A2.` / `### B1c` style used identically in Task 1 Step 2 and Task 2. Step ids (A1-A3, B1-B4, B1a-B1d, C1-C5) match the spec's workflow tables.
