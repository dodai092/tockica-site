# Client build rules

House rules for building a client site against this template with a written plan and
subagent-driven development. These sit on top of the generic `superpowers:writing-plans`,
`superpowers:subagent-driven-development`, and `superpowers:requesting-code-review`
skills. Read this before writing a client plan or reviewing a client branch.

Source: the Vinalia build retro, `docs/retrospectives/2026-09-05-vinalia-build-retro.md`,
and the Dodai Referrals build retro,
`docs/retrospectives/2026-09-12-referral-build-retro.md`.

## Screenshot before done

**A task that creates or edits a page, layout, or client-visible component is not
spec-compliant without a captured screenshot, described in the implementer's report.**
"Described" means naming what it shows (colors, alignment, contrast, spacing), not just
that a screenshot file exists. This is a hard gate, not an available skill a builder can
choose to skip: on the Dodai Referrals build, a broken dark-mode/contrast state, form
labels rendering centered instead of left-aligned, and a nonsensical footer line all
shipped through a per-task review, a final whole-branch review on the most capable model,
and the controller's own checks, because every one of those checks read `git diff` and
computed CSS values and none of them rendered the page. The client caught all three in
under a minute by opening it.

A task reviewer treats a UI-touching task with no screenshot evidence as a spec gap, the
same severity as a missing test, not a `⚠️ Cannot verify from diff` note to wave through.
The reviewer dispatch must include the screenshot image file itself for the reviewer to
look at, not a text description of it: a reviewer who only reads a description is still
trusting the implementer's own account of what the page looks like, the same
trust-the-report gap that let other defects through. This is separate from, and does not
replace, `impeccable`/`frontend-design`'s deeper critique pass (SETUP.md B3) or the full
`docs/quality-gates.md` rubric (B4); it is the minimum bar that makes the deeper passes
possible to skip only knowingly, never by accident.

## Plans

- **The plan's first task confirms discovery is done.** SETUP.md B2 says "do not start
  until A3's artifacts exist"; this makes that checkable. Task 1 of every client plan is a
  checklist that names the path of each required A3 artifact and confirms it is present:
  `docs/intake.md` filled, a copy source file at a stated path (or an explicit "client
  supplied copy, source = X" line in the plan), and a design direction brief. The optional
  schema draft is either linked by path or the checklist states "no schema draft needed
  for this client" with a reason. A plan whose own self-review cannot tick every required
  item is not ready to execute. On the Vinalia build the intake was written last, after
  the build; this rule stops a plan being written against a half-finished discovery.

- **Client copy never lives in the plan body.** Every price, claim, tagline, legal line,
  and contact detail goes in a source file (the client's own doc, a `content/` file, or
  `src/schema.ts` / `src/config.yaml`), and the plan refers to it by path. A task that
  needs copy says "transcribe X from `<path>` lines N to M", not a pasted block. A large
  plan is a lossy transport for text that must ship character for character; the one
  Critical defect of the Vinalia build was a corrupted copy line inside a 2300-line plan.
  A finished client plan contains zero inline copy blocks longer than a heading.

- **Every fact traces to a named source.** No invented names, dates, numbers, hours, or
  quotes. If a fact is not in a source file, the task's output is a `TODO(client)` marker,
  not a plausible guess.

- **Plan self-review checks the Files sections.** Every path listed in a task's Files
  section must be either created by that task's own steps or already present in the repo.
  The Vinalia plan named a `src/layouts/ClientLayout.astro` that no step created and that
  would have been core-adjacent anyway; the implementer had to be told to ignore it.

- **Fix source-flagged defects in the brief, not downstream.** If a client copy doc or
  design doc flags an accessibility or SEO problem (heading order, contrast on a tinted
  background), the plan fixes it in the page/brief task, not by deferring it to the
  verification pass.

## Reviews

The per-task and whole-branch reviews check code correctness and copy fidelity, and per
"Screenshot before done" above, actual rendered output for any UI-touching task. Run
the full [client quality gates](quality-gates.md) rubric and document the result with
evidence. The rubric covers accessibility, design, forms, analytics, and baseline
inspection; no separate human design review is a gate in this workflow, which makes the
screenshot rule the only thing standing between a code-correct build and one that has
never actually been looked at.

**Scale review depth to the same size signal SETUP.md A3 already uses for build scope**
("a small brochure site does not need `design-taste-frontend` and `impeccable` both
running full-weight"). A two-page microsite does not need two task
reviews plus a full whole-branch review on the most capable model for every change; a
multi-page brochure or e-commerce build does. The Dodai Referrals build ran full review
weight on a two-task plan and still missed defects a screenshot would have caught in
seconds, spending review cost on depth (a third code-reading pass) instead of on the one
check (an actual look at the page) that would have found the real problem.

## Also

- The em-dash rule binds agent-authored text only. Client-verbatim copy (approved
  taglines, legal wording, regulated claims) ships exactly as given. See the global
  `CLAUDE.md`.
- Non-English or regulated copy goes to human review, not `humanizer`.

## Retro discipline: prune, don't just accrete

Every retro after this one asks two questions, not one: what should be added, and what
got skipped under time pressure or should be cut. `SETUP.md` and this file have only ever
grown since the Vinalia retro; nothing has been removed yet, including items added from
research rather than from an actual build (see `SETUP.md`'s provenance note). A workflow
that only accretes turns into exactly the kind of bloated checklist it exists to prevent.
If a retro has no cut to propose, say so explicitly rather than silently skipping the
question. The Dodai Referrals retro proposed no cut; every rule it added traces to an
observed failure in that build, not to research.
