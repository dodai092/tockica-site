# Design: golden test branch, built from a real client (Vinalia Consulting)

Status: draft, pending review. Architectural. Four sub-projects, sequenced.

Revision note (v2): incorporates a self-review that found a workflow-breaking gap
(merge-conflict handling between `golden` and `main`), an internally inconsistent
sanitization plan, an under-specified repo bootstrap step, two real screenshot-script
bugs, a repo-size question, an under-decomposed sub-project B, and two content-safety
gaps in the intake work. All are addressed below; changes are called out inline as
**(v2)**.

## Context

`dodai-astrowind` main is now hardened (CONTEXT.md, SETUP.md, brand.ts, init-client,
CI gates, schema.ts) and committed. The next step from the prior session's plan was a
long-lived `golden` branch: a fully-built fictional client site, screenshotted at three
breakpoints, used as a visual-regression baseline whenever template core changes.

Antun changed the premise mid-brainstorm: build a real prospective client instead of a
fictional one, and produce a reusable "everything needed from a client" intake document
as a byproduct. The client is **Vinalia Consulting** (Natalija Brala, wine lab +
enological consulting, Zemunik Donji, Zadar County), whose project folder
(`01.Clients/Vinalia Consulting/Main/`) already has a mature, largely-confirmed brand
and content package: `COMPANY.md`, `icp-positioning.md`, a full drafted Croatian
`website-copy.md` (7 pages, StoryBrand + SEO passed), a confirmed sitemap, a Brand Style
Guide v2.0 with color/type/spacing tokens, logo SVGs, a LocalBusiness schema draft, and
Natalija's photo.

**The tension this design resolves**: a truthful Vinalia build has no blog (not in her
sitemap) and no custom web font (her brand is Arial), so it can't alone exercise the
template's blog and Fonts-API paths. Resolved (Antun's call): build Vinalia truthfully
as the real client site, then add a small synthetic fixture on the `golden` branch only
to cover the two gaps.

## Decisions made during brainstorming

- Real client, materials already in hand (not fictional, not "gather later").
- The Vinalia site is built in its **own git repo**, not on `golden` directly:
  `01.Clients/Vinalia Consulting/vinalia-site/` (new folder, own history).
- `golden` becomes a **lightly sanitized snapshot** of that build, not the live client
  repo **(v2, revised from "sanitized")**: see Sub-project C for what actually changes
  and why full sanitization was cut.
- `golden`'s blog/font gap is closed with a **small, clearly-marked synthetic fixture**
  added only on `golden` (2 short placeholder posts, one web font swap), not by giving
  Vinalia a blog she doesn't want or inventing font choices that contradict her brand
  guide.
- This session produces the spec only. Implementation (sub-projects A-D below) starts
  in a following session via `superpowers:writing-plans`, working through the stages
  called out under each sub-project.

## Sub-project A — screenshot tooling on `main`

Small and self-contained; unblocks B/C testing later.

- Add `playwright` as a devDependency (the `playwright` CLI exists globally via
  Homebrew on this machine, but the template needs its own pinned dependency so CI and
  other machines work the same way). Document `npx playwright install chromium` as a
  one-time setup step (README/SETUP.md), chromium only.
- `scripts/screenshot.mjs` (committed, Node ESM):
  - Reads a route list (a small JSON/array in the script, e.g. `golden-baselines/routes.json`
    listing every page under `src/pages/` that isn't `_examples/`).
  - Assumes `astro build` already ran; serves `./dist` with a plain static server
    (Node's `http.createServer`, or reuse `astro preview` via a spawned child process)
    and drives Playwright's Chromium.
  - Captures a full-page PNG per route, **per color scheme, per viewport** — a
    `route × {light, dark} × {375, 768, 1440}` matrix **(v2: dark mode was missing from
    the original spec despite being a stated thing golden validates)**. Dark mode in
    this template is class-based (`ApplyColorMode.astro` reads a stored preference), not
    just `prefers-color-scheme`, so the script sets it the same way the site itself
    does: `page.addInitScript(() => localStorage.setItem('theme', 'dark'))` before
    navigating for the dark pass, plain navigation for the light pass.
  - Before capturing, in addition to disabling animations/transitions, **forces every
    `intersect`-gated element to its settled state** by running
    `document.querySelectorAll('[class*="intersect"]').forEach(el =>
el.setAttribute('no-intersect', ''))` in-page **(v2: fixes a real false-diff risk)**
    — AstroWind's Tailwind config defines the `intersect` variant as `&:not([no-intersect])`
    specifically so this attribute opts an element out of the IntersectionObserver-gated
    state, so a full-page screenshot taken immediately after load doesn't catch
    below-the-fold sections mid-fade or hidden. Also waits for `document.fonts.ready`
    and network idle, so screenshots are deterministic.
  - Two modes: `node scripts/screenshot.mjs` (write/refresh `golden-baselines/`) and
    `node scripts/screenshot.mjs --check` (compare against the committed baseline with
    `pixelmatch`, new devDependency, write diff images to a **gitignored**
    `golden-baselines-diff/`, exit non-zero on any pixel difference above a small
    tolerance).
  - `npm run screenshot` / `npm run screenshot:check` scripts in `package.json`.
- `docs/golden-workflow.md` (new): the exact command sequence for testing a template
  change against golden (below), **including the merge-conflict convention** (see
  Sub-project C), linked from `SETUP.md`.
- `.gitignore`: add `golden-baselines-diff/`.
- **Repo-size note (v2)**: `golden-baselines/` will accumulate PNGs across refreshes.
  In practice this is self-limiting — git only stores a new blob for a screenshot whose
  pixels actually changed; an unaffected route/viewport/scheme produces an identical
  file on re-run and adds nothing to history. At ~9 routes × 2 schemes × 3 viewports
  (~54 files, each a simple brochure page, realistically well under 1 MB apiece), the
  baseline set itself stays small; growth over time tracks real visual changes, which
  is exactly what a regression baseline should do. No mitigation needed now; revisit
  only if `golden`'s `.git` size becomes a real nuisance.

**Workflow this enables** (documented, not run automatically):

```
git checkout golden
git merge main
# resolve any conflicts per the convention below
npm ci && npx playwright install chromium
npm run build
npm run screenshot:check
# inspect golden-baselines-diff/ for anything unexpected;
# if the change is intended, npm run screenshot to refresh baselines and commit on golden
```

`golden` never merges back to `main`.

## Sub-project B — the Vinalia client site (own repo)

Built in `01.Clients/Vinalia Consulting/vinalia-site/`, following `SETUP.md`'s own
per-client workflow (this is also the first real end-to-end test of that workflow).
Source data is everything already confirmed in the Vinalia project folder; nothing
here invents a new claim.

**Repo setup (v2, made concrete)**: `main` isn't on GitHub yet, so "Use this template"
isn't available. Instead: `git clone /Users/antunzebec/Work/dodai-astrowind vinalia-site`,
then `rm -rf .git && git init && git add -A && git commit -m "Fork from dodai-astrowind
<TEMPLATE_VERSION>"` inside the new folder — a real clone (so only tracked files come
across, no local build artifacts) with history discarded and replaced by an independent
first commit, same end state "Use this template" would produce. Record the
`TEMPLATE_VERSION` value in that first commit message per `SETUP.md` step 1.

**`init-client` risk (v2)**: the prior phase-2 testing notes flagged that the script's
interactive prompter "hangs on piped EOF" when stdin isn't a real TTY, which is exactly
the situation an agent session runs in. Don't assume `npm run init-client` can just be
invoked and piped answers at plan time. The implementation plan for B should first
re-check `scripts/init-client.mjs`'s actual input handling and either (a) confirm it
accepts a non-interactive answer file/flags, or (b) skip the script and set the same
target values by hand (`package.json`, `config.yaml`, `brand.ts` primary color, legal
placeholders, `README.md`) — same result, without depending on interactive stdin. This
is a go/no-go check for B's first stage, not a detail to discover mid-build.

**Build stages (v2, B was previously one flat description)**:

- **B1 — scaffold + brand.** Repo bootstrap above, `init-client` (or its by-hand
  equivalent), `src/brand.ts` filled from the table below, dark-mode token derivation
  done and documented (see Design Principles below), logo/photo assets placed,
  favicons regenerated. Exit check: `npm run build` succeeds with the new brand and
  placeholder nav, nothing page-specific yet.
- **B2 — pages, nav, i18n.** All seven routes created (see Pages below) with real copy
  dropped in as plain markup first (not yet componentized), `navigation.ts` and
  `config.yaml` (`i18n.language: hr`, blog off) set, AstroWind demo pages/content
  removed. Exit check: every route builds and reads correctly end to end.
  Doubles as the terms/privacy fill-in-and-flag pass.
- **B3 — client components.** Extract the repeated shapes from B2 into the 4-5
  components below (Hero, service/steps section, `PricingTable`, `ContactForm` wired
  for Netlify, `ProtocolStages`), replacing the plain markup. Exit check: pages
  unchanged visually, now built from `src/components/client/*`.
- **B4 — schema, verification, polish.** `src/schema.ts` filled, the four checks in
  Testing / Verification below all green, a pass against `impeccable`/`webapp-testing`
  for visual QA. This is also where the filled `docs/intake.md` gets written (it's a
  synthesis of already-confirmed facts, doesn't depend on the build being finished, but
  sits naturally at the end as a wrap-up deliverable).

**Brand** (`src/brand.ts`, from `Vinalia_Brand_Style_Guide_v2.0.docx` via
`website/style-guide-v2-audit.md` and `docs/DESIGN.md` in the Vinalia folder):

| Token                          | Value                                            | Source                                                                                                                                                                                                                                                                                               |
| ------------------------------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fonts.sans` / `fonts.heading` | `Arial, "Helvetica Neue", Helvetica, sans-serif` | style guide: Arial for all UI, "no exceptions for premium feel"                                                                                                                                                                                                                                      |
| `fonts.serif`                  | `Georgia, "Times New Roman", serif`              | style guide: pull-quotes only                                                                                                                                                                                                                                                                        |
| `light.primary`                | `#4A1B3C`                                        | Primary-900                                                                                                                                                                                                                                                                                          |
| `light.secondary`              | `#6B2E5A`                                        | Primary-700                                                                                                                                                                                                                                                                                          |
| `light.accent`                 | `#A88B3D`                                        | Accent-700 (the AA-safe text variant; `#C9A961`/Accent-500 is decorative-only, not a token value)                                                                                                                                                                                                    |
| `light.textHeading`            | `#4A1B3C`                                        | type scale: Display/H1/H3/H4 color                                                                                                                                                                                                                                                                   |
| `light.textDefault`            | `#444444`                                        | Neutral-700, body copy                                                                                                                                                                                                                                                                               |
| `light.textMuted`              | `#666666`                                        | Neutral-500                                                                                                                                                                                                                                                                                          |
| `light.bgPage`                 | `#F5F3F0`                                        | Cream, page background                                                                                                                                                                                                                                                                               |
| `dark.*`                       | derived in B1                                    | style guide's dark mode section is explicitly "not specified... derive by inverting lightness while preserving hue (~326°)" — a real design task, done and recorded in B1, then copied back into `docs/DESIGN.md` in the Vinalia folder per that file's own instruction to record derivations there. |

No `astro.config.ts` `fonts` entry is needed (system stack). Flag as a template
friction-log item for sub-project D: the template currently assumes every client wants
a custom web font; a system-font client should be a documented supported path, not an
undocumented one that happens to work.

**Pages** (from `marketing/website/website-copy.md`, Croatian, `i18n.language: hr`):

`/` (Homepage), `/usluge` (hub), `/usluge/laboratorijska-analiza`,
`/usluge/enolosko-savjetovanje`, `/o-nama`, `/reference`, `/kontakt`. Title tags and
meta descriptions come from the copy doc's own SEO table. Delete the AstroWind demo
content in `index/about/services/pricing/contact.astro`; these routes replace them.
`terms.md`/`privacy.md` filled from `init-client` placeholders, then flagged for a real
legal review (GDPR, EU client) before anything goes live — not part of this build.

**Client components** (ejected from the parts bin into `src/components/client/`, per
`.agents/skills/add-component.md`): a Hero-derived homepage header, a services/steps
section (the "tri isticaja" + "kako izgleda" 3-step block), a `PricingTable` built from
`COMPANY.md`'s real itemized cjenik (not a generic 3-tier SaaS pricing widget — this is
the first real test of whether `Pricing.astro` in the parts bin is even the right
starting point for a price-list business — if it isn't, build from scratch, that's an
acceptable B3 outcome), a `ContactForm` wired for Netlify Forms (`data-netlify="true"`,
hidden `form-name`, a static markup copy for build-time detection per `SETUP.md` §5),
and a `ProtocolStages` component for the Reference page's phase-by-phase breakdown.
That's 4-5 components, inside the "2-3" originally planned but justified by what the
real content actually needs.

**Structured data** (`src/schema.ts`): filled from `marketing/seo/schema-localbusiness-draft.md`
— name, url, telephone `+385 92 255 5835`, address, opening hours Mon-Fri 08:00-16:00.
Email omitted (unverified as receiving mail — do not publish it in schema, matching
that file's own instruction). `geo` and `sameAs` left blank (no coordinates pulled yet,
no social accounts live yet) — filling them with guesses would violate the project's
"never invent a fact" rule.

Note for sub-project D: the draft schema wants `@type: ["LocalBusiness",
"ProfessionalService"]`, a `founder`, `foundingDate`, and `hasOfferCatalog`. The
template's current `SchemaOrg.astro` only emits `Organization`/`LocalBusiness` with no
`ProfessionalService`, founder, or offer catalog support. Build B against what the
template supports today (don't edit core mid-build); log the gap for D as a candidate
core generalization.

**Assets**: logo SVGs (`media/logo/vinalia-logo-*`) into `src/assets/images/`,
favicons regenerated from the mark, OG image from `media/vinalia-cover.jpg` or
`social-preview.jpg`, Natalija's photo (`media/natalija-brala-photo.jpg`) on `/o-nama`.

**Explicitly out of scope for B**: sending anything to Natalija, verifying the email
address, legal review of terms/privacy, claiming the `@vinaliaconsulting` social
handles, filling `geo`/`sameAs`, deploying to Netlify. This build is template-testing
plus a ready draft for her review, not a launch.

## Sub-project C — the `golden` branch

**Sanitization, revised (v2)**: the original plan called for replacing name, phone,
email, address, _and_ photo, while keeping logo, tokens, and copy shape real — which is
incoherent (a real, identifying logo next to a fictionalized business identity) and
mostly solves a non-problem, since the name, phone, address, and pricing are already
public (Google Business Profile, printed business card, published cjenik). The only
genuinely personal asset is Natalija's photo. Revised approach: **swap the photo for a
generic placeholder image only**; everything else (name, logo, contact details,
pricing, copy) stays exactly as built in B. This is a single asset swap, not a second
parallel content pass, and removes the logo inconsistency entirely.

1. Branch `golden` off `main` (current tip, after A is merged).
2. One overlay commit copying B's built files onto `golden` as client-layer files
   (`src/brand.ts`, `src/components/client/*`, the seven pages, `src/schema.ts`,
   `src/navigation.ts`, `src/config.yaml`, assets), with the one photo swap above
   applied. Mechanically: copy the relevant paths from `vinalia-site` into a checkout
   of `golden`, don't re-type content by hand — re-typing was the original plan's
   biggest hidden cost and its biggest source of drift risk.
3. A second commit adds the **golden-only synthetic fixture**: `apps.blog.isEnabled:
true` + two short placeholder posts (clearly marked as template fixtures, not real
   Vinalia content, in their own frontmatter/body), and one `astro.config.ts` `fonts`
   entry + a `brand.fonts.*` override to exercise the custom-web-font path. A short
   `golden-baselines/README.md` explains both additions are golden-only and must never
   be copied back into a real client build.
4. `npm run build && npm run screenshot` to generate the initial baseline, committed to
   `golden-baselines/`.
5. **Merge-conflict convention (v2, previously missing entirely)**: every subsequent
   `git merge main` into `golden` will very likely conflict on the client-layer
   singleton files (`brand.ts`, `navigation.ts`, `config.yaml`, `schema.ts`) precisely
   because those are the files a client build customizes and the ones template changes
   on `main` tend to touch. Documented resolution, recorded in `docs/golden-workflow.md`:
   **take golden's version of the file by default** (`git checkout --ours <file>`),
   then **manually re-apply any new keys or structural additions** `main` introduced
   (a new `config.yaml` key, a new `brand.ts` token, a new field on `schema.ts`) into
   golden's version, using the merge conflict markers as the list of what to check —
   never take `main`'s version wholesale, since that silently reverts the client-layer
   customization the branch exists to preserve.
6. Mechanism confirmed: **overlay/copy from the client repo**, not re-implementing from
   scratch on `golden` each time. Matches the documented `git merge main` workflow,
   keeps the sanitization work to one small, mechanical step (the photo swap) instead
   of a second content pass.

## Sub-project D — feed lessons back into the template

- Copy the filled `docs/intake.md` from `vinalia-site` (see below) back as the
  worked example the task asked for, and use it to harden the blank
  `docs/intake-template.md` in this repo: check every section actually got filled
  cleanly, add any question that turned out to be missing (e.g. this project had to
  separately track "is the printed contact email actually receiving mail" — the intake
  template doesn't currently ask that).
- **Add a Messaging & Voice section to `docs/intake-template.md` (v2, new)**: Vinalia's
  build leaned heavily on things the current intake template has no place for — core
  differentiators/messaging pillars, guardrails on what not to say (e.g. never compare
  to a named competitor), real customer language, and confirmation that no anti-persona
  exists. Without a dedicated section, this kind of material has nowhere to live in the
  standard intake flow and risks getting skipped on a future, less-documented client.
- Log the two friction items found in B: (1) system-font clients aren't a documented
  path, (2) `SchemaOrg.astro` can't express `ProfessionalService`/founder/offer-catalog
  — write these into `SETUP.md` or a new ADR as candidates for a future core change,
  per this repo's hard rule ("if you think core needs a change, stop and raise it").
  Not fixed in this pass.

## The intake document (the actual ask: "something I can use in the future")

Deliverable: `vinalia-site/docs/intake.md`, filled from already-confirmed facts in
`01.Clients/Vinalia Consulting/Main/COMPANY.md`, `icp-positioning.md`, and
`website-sitemap.md` — a synthesis pass, not new discovery (Natalija's open `qna`
questions stay open; nothing here answers them). Business, goal, pages, brand, domain,
analytics/legal, and timeline sections are filled directly from the intake template's
existing structure (plus the new Messaging & Voice section from D); two fields stay
explicitly blank with a reason (analytics preference — Antun's open decision; social
handles — not yet claimed).

**Content-safety exclusion (v2, previously unstated)**: `COMPANY.md`'s Registry Record
section includes the OIB, bank account (IBAN), and SWIFT/BIC. None of that belongs in
a site-build intake doc, and the intake template doesn't ask for it. The synthesis pass
must pull only what the template's own fields call for (legal entity name, jurisdiction,
contact email, domain) and explicitly not carry over banking/registry identifiers just
because the source file happens to contain them nearby.

This filled file, plus the D pass on the blank template, together are "the document I
can use in the future": a real worked example next to a hardened blank one.

## Testing / verification

- B: `npm run build`, `npm run check`, `npm run test:links`, `npm run test:lhci` all
  green in `vinalia-site`, same bar as any client build per `SETUP.md` §7. Run at the
  end of B4, not deferred past it.
- A: `npm run screenshot` produces one PNG per `route × color-scheme × viewport` (light
  - dark, three widths); a second run with no source changes produces zero diffs under
    `--check`.
- C: `golden` passes the same four checks as B (it's still a valid Astro site), plus
  the golden-only blog/font fixture builds cleanly.

## Open decisions left for Antun (not resolved in this design)

- **Analytics vendor** (`SETUP.md` §6) — still open, as instructed.
- **Dark-mode token derivation** for Vinalia — a real design pass happens inside B1,
  not assumed here; Antun can review the derived values once produced.
- **Heading-color ambiguity**: the style guide's type scale lists heading color as
  `#4A1B3C` while its neutral-color table separately lists `#1A1A1A` as "primary text,
  headings" — B uses `#4A1B3C` (the type-scale table, more specific), flagged here in
  case Antun wants to check the docx directly.

## Sequencing

A (small, do first) -> B (large, own plan, staged B1-B4, likely multi-session) -> C
(depends on B, now a mechanical copy step not a rebuild) -> D (depends on both). This
session ends after the spec is reviewed; A's implementation plan is written next via
`superpowers:writing-plans`.
