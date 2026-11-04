# Golden Branch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The user wants approval before each task's implementer is dispatched (not continuous execution) — see the standing preference recorded in memory as `feedback-sdd-approval-gate`.

**Goal:** Create a long-lived `golden` branch on `dodai-astrowind` holding a real, built
client site (the finished Vinalia Consulting build) plus a small synthetic fixture, used
as a Playwright screenshot baseline to catch visual regressions whenever template core
changes.

**Architecture:** Branch `golden` off `main`. One commit mechanically overlays the
already-built Vinalia Consulting client-layer files (brand, nav, config, schema, client
components, the seven real pages, legal pages, logos/favicons) from the separate
`vinalia-site` repo onto `golden`, with Natalija's photo swapped for a generated
placeholder (the only sanitization needed, per the spec's revised v2 approach — name,
logo, contact details, pricing, and copy all stay real and are already public). A second
commit adds a golden-only synthetic fixture (blog enabled with two clearly-marked
placeholder posts, `brand.ts` fonts overridden to the template's Fonts-API font) to
exercise the two template paths a real, blogless, system-font client can't cover on its
own. A third commit regenerates the screenshot baseline for golden's real route set using
the screenshot tooling built in sub-project A (`scripts/screenshot.mjs`, already on
`main`). `golden` never merges back into `main`.

**Tech Stack:** No new dependencies (`vinalia-site` and `main` have identical
`package.json` dependencies, confirmed this session). Uses the existing Playwright +
pixelmatch screenshot tooling and `sharp` (already a transitive dependency via Astro's
image pipeline) for a one-off placeholder-image generation script.

**Spec:** `docs/superpowers/specs/2026-09-04-golden-branch-and-vinalia-build-design.md`,
Sub-project C ("the `golden` branch"), plus the C-relevant parts of "Testing /
verification" and "Sequencing". Sub-projects A (screenshot tooling) and B (the Vinalia
build) are both already complete: A is merged on `main`, B's finished output is commit
`26728b3` on `main` in the separate repo
`/Users/antunzebec/Work/01.Clients/Vinalia Consulting/vinalia-site/` (own git history, no
remote).

## Global Constraints

- All work in this plan happens in `dodai-astrowind` (this repo), on a new `golden`
  branch created from `main`. Never merge `golden` back into `main`.
- Source repo (read-only, never edited by this plan):
  `/Users/antunzebec/Work/01.Clients/Vinalia Consulting/vinalia-site/`. Copy files out of
  it with `cp`, never `git` operations against it, and never touch its `.git/`.
- The only sanitization is the photo swap (spec v2, revised from a broader plan). Every
  other fact copied from `vinalia-site` (name, logo, phone, address, pricing, copy) stays
  exactly as built, since it is already public (Google Business Profile, business card,
  published price list).
- Golden-only additions (blog fixture, font override) must be unambiguously marked as
  template fixtures, not real Vinalia content, in their own frontmatter/body/comments —
  per the spec, so nobody mistakes them for a second content pass on the real site.
- Never edit template core (`src/layouts/`, `src/utils/`, `src/components/{ui,common,blog}/`,
  `vendor/`, the config system) as part of this plan. This plan only touches client-layer
  files (`src/brand.ts`, `src/navigation.ts`, `src/config.yaml`, `src/schema.ts`,
  `src/pages/*`, `src/components/client/*`, `src/assets/images/*`, `src/assets/favicons/*`,
  `src/data/post/*`) and the screenshot baseline (`golden-baselines/`).
- No em dashes anywhere: code comments, copy, docs, commit messages.
- Prettier: single quotes, semicolons, 120 print width, 2-space indent
  (`.prettierrc.mjs`). Every commit leaves `npm run check` (astro check + eslint +
  prettier) green; the pre-commit hook runs the fast subset automatically.
- Commit trailer: `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- Merge-conflict convention for future `git merge main` into `golden` is already written
  in `docs/golden-workflow.md` (take golden's version of client-layer singleton files by
  default, manually re-apply new keys/fields `main` introduced). This plan does not
  rewrite that doc, only verifies in Task 4 that it still matches reality after this
  plan's changes.
- Verification throughout is `npm run build` / `npm run check` (astro check + eslint +
  prettier), not unit tests — this repo has no test framework, matching the pattern used
  in the Vinalia build plan (`docs/superpowers/plans/2026-09-04-vinalia-site-build.md`).

---

## Task 1: Branch `golden` and overlay the Vinalia Consulting client layer

**Files:**

- Create branch: `golden` (from `main`)
- Delete: `src/pages/about.astro`, `src/pages/contact.astro`, `src/pages/pricing.astro`,
  `src/pages/services.astro`, `src/pages/_examples/` (AstroWind template-default pages
  that Vinalia's real routes replace)
- Modify (overwritten with `vinalia-site`'s versions): `src/brand.ts`,
  `src/navigation.ts`, `src/config.yaml`, `src/schema.ts`
- Create: `src/pages/index.astro`, `src/pages/usluge.astro`,
  `src/pages/usluge/enolosko-savjetovanje.astro`,
  `src/pages/usluge/laboratorijska-analiza.astro`, `src/pages/o-nama.astro`,
  `src/pages/reference.astro`, `src/pages/kontakt.astro`, `src/pages/terms.md`,
  `src/pages/privacy.md` (overwriting the template-default `index.astro`, `terms.md`,
  `privacy.md`; the rest are new files/paths)
- Create: `src/components/client/{Hero,PricingTable,ProtocolStages,ThreeUp,ContactForm,CookieConsent}.astro`
- Modify (overwritten): `src/assets/images/default.png`
- Create: `src/assets/images/vinalia-logo.svg`, `src/assets/images/natalija-brala.webp`
  (placeholder, see Step 5)
- Modify (overwritten): `src/assets/favicons/{favicon.ico,favicon.svg,apple-touch-icon.png}`

**Interfaces:**

- Produces: a `golden` branch whose working tree is the real Vinalia Consulting site
  (minus Natalija's actual photo), ready for Task 2's fixture and Task 3's baseline.

- [ ] **Step 1: Create the branch**

```bash
cd /Users/antunzebec/Work/dodai-astrowind
git status --short   # must be clean before branching
git checkout -b golden main
```

- [ ] **Step 2: Remove the template-default pages Vinalia's real routes replace**

```bash
rm -f src/pages/about.astro src/pages/contact.astro src/pages/pricing.astro src/pages/services.astro
rm -rf src/pages/_examples
```

- [ ] **Step 3: Copy the client-layer singleton files, pages, components, and schema
      from `vinalia-site`**

```bash
SRC="/Users/antunzebec/Work/01.Clients/Vinalia Consulting/vinalia-site"

cp "$SRC/src/brand.ts" src/brand.ts
cp "$SRC/src/navigation.ts" src/navigation.ts
cp "$SRC/src/config.yaml" src/config.yaml
cp "$SRC/src/schema.ts" src/schema.ts

cp "$SRC/src/pages/index.astro" src/pages/index.astro
cp "$SRC/src/pages/usluge.astro" src/pages/usluge.astro
mkdir -p src/pages/usluge
cp "$SRC/src/pages/usluge/enolosko-savjetovanje.astro" src/pages/usluge/enolosko-savjetovanje.astro
cp "$SRC/src/pages/usluge/laboratorijska-analiza.astro" src/pages/usluge/laboratorijska-analiza.astro
cp "$SRC/src/pages/o-nama.astro" src/pages/o-nama.astro
cp "$SRC/src/pages/reference.astro" src/pages/reference.astro
cp "$SRC/src/pages/kontakt.astro" src/pages/kontakt.astro
cp "$SRC/src/pages/terms.md" src/pages/terms.md
cp "$SRC/src/pages/privacy.md" src/pages/privacy.md

cp "$SRC/src/components/client/Hero.astro" src/components/client/Hero.astro
cp "$SRC/src/components/client/PricingTable.astro" src/components/client/PricingTable.astro
cp "$SRC/src/components/client/ProtocolStages.astro" src/components/client/ProtocolStages.astro
cp "$SRC/src/components/client/ThreeUp.astro" src/components/client/ThreeUp.astro
cp "$SRC/src/components/client/ContactForm.astro" src/components/client/ContactForm.astro
cp "$SRC/src/components/client/CookieConsent.astro" src/components/client/CookieConsent.astro

cp "$SRC/src/assets/images/default.png" src/assets/images/default.png
cp "$SRC/src/assets/images/vinalia-logo.svg" src/assets/images/vinalia-logo.svg
cp "$SRC/src/assets/images/natalija-brala.webp" src/assets/images/natalija-brala.webp

cp "$SRC/src/assets/favicons/favicon.ico" src/assets/favicons/favicon.ico
cp "$SRC/src/assets/favicons/favicon.svg" src/assets/favicons/favicon.svg
cp "$SRC/src/assets/favicons/apple-touch-icon.png" src/assets/favicons/apple-touch-icon.png
```

`src/components/client/README.md` and `public/robots.txt` / `public/_headers` are
confirmed identical between the two repos this session (byte-for-byte), so they are not
touched.

- [ ] **Step 4: Verify the real photo is in place before swapping it**

```bash
file src/assets/images/natalija-brala.webp
```

Expected: a valid WebP image, matching what Step 3 just copied. This confirms the copy
worked before Step 5 overwrites it.

- [ ] **Step 5: Generate a placeholder image and swap it in**

Natalija's real photo is the only asset the spec calls out as needing sanitization
(everything else copied in Step 3 is already public). Generate a neutral silhouette
placeholder at the same dimensions (951x960) and overwrite the file in place, so no page
code needs to change:

```bash
node -e "
const sharp = require('sharp');
const svg = \`
<svg xmlns='http://www.w3.org/2000/svg' width='951' height='960'>
  <rect width='951' height='960' fill='#D9D5D0'/>
  <circle cx='475' cy='380' r='170' fill='#B8B2AA'/>
  <path d='M 155 960 Q 475 640 795 960 Z' fill='#B8B2AA'/>
</svg>
\`;
sharp(Buffer.from(svg)).webp().toFile('src/assets/images/natalija-brala.webp')
  .then(() => console.log('placeholder written'))
  .catch((err) => { console.error(err); process.exit(1); });
"
file src/assets/images/natalija-brala.webp
```

Expected: `placeholder written`, and `file` reports a WebP image at 951x960.

- [ ] **Step 6: Build and check**

```bash
npm run build
npm run check
```

Expected: both succeed. `npm run build` should show all of Vinalia's real routes
(`/`, `/usluge`, `/usluge/enolosko-savjetovanje`, `/usluge/laboratorijska-analiza`,
`/o-nama`, `/reference`, `/kontakt`, `/terms`, `/privacy`) and no reference to
`/about`, `/contact`, `/pricing`, or `/services`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Overlay the Vinalia Consulting build onto golden

Copies the finished client-layer files from the vinalia-site repo (brand,
nav, config, schema, client components, real pages, legal pages, logo,
favicons) onto the golden branch, with Natalija's photo swapped for a
generated placeholder. Everything else (name, contact details, pricing,
copy) stays real, since it is already public.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Add the golden-only blog and font fixture

**Files:**

- Modify: `src/config.yaml` (`apps.blog.isEnabled: true`)
- Modify: `src/brand.ts` (fonts override only)
- Create: `src/data/post/golden-fixture-post-one.md`,
  `src/data/post/golden-fixture-post-two.md`
- Create: `golden-baselines/README.md`

**Interfaces:**

- Consumes: `src/brand.ts` written in Task 1 (Vinalia's wine-purple color tokens; this
  task only touches the `fonts` key).
- Produces: a working `/blog` list route and two published post routes, exercising the
  template's blog and Fonts-API paths on `golden` without touching the real,
  blogless, system-font `vinalia-site` repo.

- [ ] **Step 1: Enable the blog**

In `src/config.yaml`, change:

```yaml
apps:
  blog:
    isEnabled: false # Client layer: set true when the client wants a blog. See SETUP.md.
```

to:

```yaml
apps:
  blog:
    isEnabled: true # Golden-only fixture: exercises the blog path. Real Vinalia site keeps this false.
```

- [ ] **Step 2: Add the first placeholder post**

Create `src/data/post/golden-fixture-post-one.md`:

```markdown
---
publishDate: 2026-01-10T00:00:00Z
title: 'Golden fixture post one'
excerpt: 'Placeholder post added only on the golden branch to exercise the blog listing and post-detail templates. Not real Vinalia Consulting content.'
draft: false
category: golden-fixture
tags:
  - golden-fixture
  - template-test
---

This post exists only on the `golden` branch. It is not real Vinalia Consulting
content, it exists to give the template's blog list and post-detail layouts something
to render for the screenshot baseline. Do not copy this file into a real client build.

## Why this exists

The real Vinalia Consulting site has no blog (not in the client's sitemap), so it can't
exercise the template's blog rendering paths on its own. `golden` adds this fixture so a
template-core change to blog layouts still gets caught by the screenshot baseline.
```

- [ ] **Step 3: Add the second placeholder post**

Create `src/data/post/golden-fixture-post-two.md`:

```markdown
---
publishDate: 2026-01-15T00:00:00Z
title: 'Golden fixture post two'
excerpt: 'Second placeholder post, golden-branch only, exercising the blog list pagination and related-posts paths.'
draft: false
category: golden-fixture
tags:
  - golden-fixture
  - template-test
---

A second golden-only fixture post, alongside `golden-fixture-post-one.md`. Two posts
are enough to exercise the blog list, a post-detail page, and the related-posts block
without inventing a larger fake content library. Not real Vinalia Consulting content.
```

- [ ] **Step 4: Override the font tokens only, on top of Vinalia's real color tokens**

In `src/brand.ts`, change the `fonts` block from:

```ts
export const brand = {
  fonts: {
    sans: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    heading: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
  },
```

to:

```ts
export const brand = {
  // Golden-only override: the real Vinalia Consulting site uses a system font stack
  // (Arial), which can't exercise the template's Fonts API path on its own. golden
  // overrides fonts.* to the Inter web font already configured in astro.config.ts
  // (inherited unchanged from main, not overlaid by Task 1) so a template-core change
  // to font loading still shows up in the screenshot baseline. Color tokens below are
  // untouched, still Vinalia's real brand.
  fonts: {
    sans: 'var(--font-inter)',
    serif: 'var(--font-inter)',
    heading: 'var(--font-inter)',
  },
```

Leave the `light` and `dark` color blocks in `src/brand.ts` exactly as Task 1 copied
them.

- [ ] **Step 5: Document the fixture**

Create `golden-baselines/README.md`:

```markdown
# Golden baselines

Screenshot baseline for the `golden` branch, generated by `scripts/screenshot.mjs`. See
`docs/golden-workflow.md` for the full workflow.

`golden` is the real, built Vinalia Consulting site (see the overlay commit) plus two
golden-only additions neither present in the real client site nor ever meant to be:

- The blog (`apps.blog.isEnabled: true` in `src/config.yaml`, two posts in
  `src/data/post/golden-fixture-post-{one,two}.md`), enabled here only to exercise the
  template's blog rendering paths, which the real, blogless Vinalia site can't cover.
- `src/brand.ts`'s `fonts.*` overridden to the Inter web font (`var(--font-inter)`),
  here only to exercise the Fonts API path, which the real, system-font Vinalia site
  can't cover.

Never copy either addition into a real client build.
```

- [ ] **Step 6: Build and check**

```bash
npm run build
npm run check
```

Expected: both succeed. Check `dist/blog/index.html` exists and both fixture posts
appear in `dist/`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Add golden-only blog and font fixture

Enables the blog with two clearly-marked placeholder posts and overrides
brand.ts fonts.* to the Fonts API font, exercising two template paths the
real, blogless, system-font Vinalia site can't cover on its own. Neither
addition belongs in a real client build.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Regenerate the screenshot baseline for golden's route set

**Files:**

- Modify: `golden-baselines/routes.json`
- Delete: `golden-baselines/{about,contact,pricing,services}/` (stale, routes no longer
  exist on `golden`)
- Create/modify: `golden-baselines/{home,usluge,usluge-enolosko-savjetovanje,usluge-laboratorijska-analiza,o-nama,reference,kontakt,privacy,terms,blog,golden-fixture-post-one}/*.png`

**Interfaces:**

- Consumes: `scripts/screenshot.mjs` (unmodified, merged in sub-project A), the built
  `golden` branch from Tasks 1-2.
- Produces: the committed screenshot baseline future `git merge main` runs will check
  against, per `docs/golden-workflow.md`.

- [ ] **Step 1: Update the route list**

Replace the contents of `golden-baselines/routes.json` with golden's real routes (seven
Vinalia pages, the two legal pages, the blog list, and one fixture post to exercise the
post-detail template):

```json
[
  "/",
  "/usluge",
  "/usluge/laboratorijska-analiza",
  "/usluge/enolosko-savjetovanje",
  "/o-nama",
  "/reference",
  "/kontakt",
  "/privacy",
  "/terms",
  "/blog",
  "/golden-fixture-post-one"
]
```

- [ ] **Step 2: Remove stale baseline folders for routes that no longer exist**

```bash
rm -rf golden-baselines/about golden-baselines/contact golden-baselines/pricing golden-baselines/services
```

- [ ] **Step 3: One-time Playwright setup (skip if already installed on this machine)**

```bash
npx playwright install chromium
```

- [ ] **Step 4: Build and generate the baseline**

```bash
npm run build
npm run screenshot
```

Expected: one folder per route under `golden-baselines/` (per the route-to-slug mapping
in `scripts/screenshot.mjs`: `/` -> `home`, `/usluge/laboratorijska-analiza` ->
`usluge-laboratorijska-analiza`, etc.), each with six PNGs
(`{light,dark}-{mobile,tablet,desktop}.png`).

- [ ] **Step 5: Verify determinism**

```bash
npm run build
npm run screenshot:check
```

Expected: exits 0, reports zero pixel differences across every route/scheme/viewport,
proving the just-written baseline is reproducible.

- [ ] **Step 6: Visually spot-check, per `docs/golden-workflow.md`'s own instruction**

Open `golden-baselines/home/light-desktop.png` and one other route's mobile shot (e.g.
`golden-baselines/kontakt/light-mobile.png`). Confirm both show real page content (the
Vinalia homepage and contact page), not a blank or near-blank image. This catches a tool
bug (e.g. every intersect-gated section rendering fully transparent) that would still
pass Step 5's byte-determinism check.

- [ ] **Step 7: Commit the baseline on its own**

```bash
git add golden-baselines/
git commit -m "$(cat <<'EOF'
Generate the initial golden screenshot baseline

Regenerates golden-baselines/ for golden's real route set (Vinalia's seven
pages, legal pages, and the golden-only blog fixture), replacing the
stale template-default baseline copied over from main. Spot-checked
visually per docs/golden-workflow.md.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Full verification pass and workflow-doc accuracy check

**Files:**

- Modify (only if drift found): `docs/golden-workflow.md`

**Interfaces:**

- Consumes: the finished `golden` branch from Tasks 1-3.
- Produces: confirmation that `golden` passes the same bar as any client build, and that
  its own workflow documentation still matches reality.

- [ ] **Step 1: Run the same four checks a client build requires**

```bash
npm run build
npm run check
npm run test:links
npm run test:lhci
```

Expected: all four pass. `test:links` needs `dist/` from the build in Step 1's first
command; `test:lhci` builds and serves internally per `lighthouserc.cjs`.

- [ ] **Step 2: Confirm the golden-only fixture builds cleanly end to end**

```bash
grep -r "golden-fixture" dist/ -l | head -5
```

Expected: at least the two fixture posts' rendered HTML and the blog list page appear
in the match list, confirming the fixture is actually present in the built output, not
just in source.

- [ ] **Step 3: Re-read `docs/golden-workflow.md` against what this plan actually did**

Read the file in full and check each claim against Tasks 1-3:

- "Merge-conflict convention" lists `src/brand.ts`, `src/navigation.ts`,
  `src/config.yaml`, `src/schema.ts` as the files `golden` overrides. Confirm this
  still matches the exact file list Task 1 copied (it does; no new client-layer
  singleton files were introduced).
- "Routes" says the route list lives in `golden-baselines/routes.json`, updated by hand
  when pages are added or removed. Confirm this still matches Task 3's process (it
  does).
- The `## Testing a template-core change against golden` command block should still
  work verbatim against the branch as built. Confirm the commands are still accurate
  (`git checkout golden`, `git merge main`, `npm ci && npx playwright install
chromium`, `npm run build`, `npm run screenshot:check`).

If any claim has drifted, fix it in `docs/golden-workflow.md` and note what changed. If
nothing has drifted, no file changes are needed for this step.

- [ ] **Step 4: Commit any doc fixes (skip if Step 3 found no drift)**

```bash
git add docs/golden-workflow.md
git commit -m "$(cat <<'EOF'
Fix golden-workflow.md drift found during golden branch verification

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Confirm `golden` has not been merged into `main`**

```bash
git log main..golden --oneline
git merge-base --is-ancestor golden main && echo "ERROR: golden is merged into main" || echo "OK: golden not merged into main"
```

Expected: the first command lists golden's commits (the ones from Tasks 1-4); the
second prints `OK: golden not merged into main`.
