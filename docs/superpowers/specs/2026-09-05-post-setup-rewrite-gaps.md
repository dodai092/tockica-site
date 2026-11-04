# Follow-up tasks after the SETUP.md single-workflow rewrite

Date: 2026-09-05
Status: scoped, not started. Each is its own brainstorm -> spec -> plan cycle.

The SETUP.md rewrite (retro item B, merged to `main` 2026-09-05) closed the
"three unreconciled workflow descriptions" problem at the documentation level. It
deliberately left two gaps, re-derived from this session's workflow mapping, and one
carried over from the Vinalia retro. They are listed here so they do not float.

---

## Gap B: the discovery-to-plan handoff has no enforced gate

**DONE 2026-09-05 (option 1).** `docs/client-build-rules.md` now opens with a "the plan's
first task confirms discovery is done" house rule: Task 1 of every client plan is a
checklist naming the path of each required A3 artifact (`docs/intake.md`, copy source,
design brief; schema draft linked or explicitly waived), and a plan that cannot tick
every required item fails its own self-review. `SETUP.md` B2's house-rules parenthetical
was updated to match. No plugin-skill change. Rest of this section is the original
scoping, kept for context.

**Problem.** SETUP.md step B2 now says "do not start until A3's artifacts exist"
(`docs/intake.md`, a copy source file or explicit "client supplied copy" pointer, a
design direction brief, an optional schema draft). That is a sentence, not a gate.
On the Vinalia build the intake was written as the last task, after the build. Nothing
stops a plan from being written against a half-finished discovery.

**Why it matters.** The §4 skill pipeline was skippable on Vinalia precisely because no
step checked its outputs existed. A plan written without the design brief or a settled
copy-source decision produces tasks that guess, and the guesses surface in the
whole-branch review instead of before the plan.

**Scope options (pick one during brainstorm):**

1. A house-rule line in `docs/client-build-rules.md`: "the plan's own first task is a
   checklist confirming each A3 artifact exists at a named path; a plan whose self-review
   cannot tick all four is not ready to execute." Cheapest. No tooling.
2. `init-client` (or a small separate script) scaffolds empty `docs/intake.md`,
   `docs/design-brief.md`, `docs/copy-source.md` from stubs, so "the file is still the
   stub" is a visible signal. Couples to Gap C.
3. A `superpowers:writing-plans` change so plan self-review has an explicit
   "inputs exist" step. Touches the plugin skill; the retro already parked plugin-skill
   changes (items A / H) as "left alone". Least preferred for that reason.

**Recommendation to carry in:** option 1, with option 2's stubs if Gap C is done first.
Do not touch the plugin skill.

**Done when:** a client plan cannot pass its own self-review without confirming the
four discovery artifacts exist at named paths, and `client-build-rules.md` states this.

---

## Gap C: `init-client` hands off an untracked manual checklist

**DONE 2026-09-05.** `scripts/init-client.mjs` now prompts for font mode (custom or
system, default system): on a system run it rewrites `src/brand.ts` font stacks,
sets `astro.config.ts` to `fonts: []`, and empties `src/fonts.ts` `preloadFonts`.
It scaffolds `docs/intake.md` and `docs/handoff.md` from their `-template` sources
and emits `docs/reinit-checklist.md` (B1c brand/asset plus B1d analytics items as a
GitHub task list, client name and jurisdiction interpolated, font row pre-ticked on
a system run). Every verbatim doc/config match is collected in one `REPLACEMENTS`
table, and `node scripts/init-client.mjs --check` verifies all 22 `from` literals
are still present (exits 0 with "not a template repo" in a client repo); it is
wired into `npm run check` via `check:init`, so a doc reword that breaks a match
fails the commit that made it. The `CONTEXT.md` "Related docs" SETUP.md pointer is
corrected in client repos. ADR 0003
(`docs/adr/0003-init-client-scaffolding-and-string-guard.md`) records the
decisions. Plan: `docs/superpowers/plans/2026-09-05-init-client-scaffolding.md`.
Spec: `docs/superpowers/specs/2026-09-05-init-client-scaffolding-design.md`.

**Problem.** After `npm run init-client`, SETUP.md step B1c is a ten-plus item manual
list (colours, font mode, `navigation.ts`, logos, favicons, favicon.ico regeneration, OG
image, `robots.txt` / `_headers`, blog toggle, `schema.ts`, `ui.theme`). Nothing tracks
which items are done. Half-done items (fonts wired but no `--font-heading` rule; favicon
regenerated but not a valid multi-size container) surface only in the B4 verification
pass. `init-client` also tells the operator to copy `docs/intake-template.md`,
`docs/go-live.md`, `docs/handoff-template.md` into place by hand.

**Why it matters.** This is the single largest "easy to half-do" surface in the whole
workflow, and it sits right at the start where a missed item costs the most downstream.

**Scope (all three, one plan):**

1. **Emit a checklist file.** `init-client` writes `docs/reinit-checklist.md` from step
   B1c's items as `- [ ]` lines, committed with the first commit. The operator checks
   items off; the B4 review reads it.
2. **Scaffold the three working docs.** `init-client` copies `intake-template.md` ->
   `docs/intake.md`, `go-live.md` (already non-template) is left, `handoff-template.md`
   -> `docs/handoff.md`, and reports it, instead of printing "copy these by hand".
   (Check: `go-live.md` has no `-template` suffix today; confirm the intended pattern.)
3. **Prompt for font mode.** `init-client` currently prompts only for the primary
   colour. Add a "custom web font or system stack? [system]" prompt. For "system", write
   a system stack into `brand.fonts.*` and leave `astro.config.ts` `fonts: []` and
   `src/fonts.ts` empty, so B1c's font item is not a blank guess. For "custom", leave
   the current placeholders and keep the B1c instruction.

**Watch out:** `init-client`'s self-identity `replaceInFile` calls pattern-match doc text
verbatim and broke once already (commit `3a08f2d`). Any new templated content it writes
should match on the smallest stable substring, and the plan should add a static check
that every `from` literal is a substring of its target file. Consider a test.

**Done when:** a fresh fork after `init-client` has `docs/reinit-checklist.md`,
`docs/intake.md`, `docs/handoff.md` in place; the font-mode prompt runs; and a
`from`-string-coverage check guards the self-identity rewrites.

**ADR:** this is a core change (`scripts/init-client.mjs` plus possibly a test). Worth an
ADR entry extending ADR 0001 or a new one.

---

## Carried over: legal pages have no path to "done" for "client needs a new policy"

From Vinalia retro friction item 10. SETUP.md A2 has the decision point (client supplies
reviewed text / reuse an existing policy / ship boilerplate gated on external review) and
C3 keeps "legal reviewed and approved" as a hard gate. Neither describes the procedure
when the client has no policy and needs one, which the retro calls the common case.
Smallest useful version: a paragraph in `docs/go-live.md` naming who owns getting a
reviewed policy (client's counsel, or a paid template service), that boilerplate never
ships un-reviewed to an EU client, and that this blocks C4. Not a core change.

---

## Also noted (pre-existing, smallest of the three)

`init-client` rewrites `CLAUDE.md` and `AGENTS.md` to drop the `SETUP.md` "read in this
order" pointer, but not `CONTEXT.md:46` ("Related docs -> SETUP.md"). In a client repo
`CONTEXT.md` still points to `SETUP.md` while the other two do not. `SETUP.md` survives
in the client repo (only its heading is rewritten), so nothing breaks; it is a wording
mismatch. Fold into the Gap C plan.
