# Phase 2 cleanup pass implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the deferred Phase 2 OG and LHCI gaps while replacing Inter with Noto Sans across the active template.

**Architecture:** Noto Sans becomes the active Astro Fonts API family and the same regular TTF is read directly by `astro-og-canvas`. The OG route receives the separate filesystem logo path from the brand surface. LHCI uses an explicit static-route list, while its existing assertion matrix decides which routes receive the SEO assertion.

**Tech Stack:** Astro 7 Fonts API, TypeScript, astro-og-canvas, Lighthouse CI, Sharp, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-06-phase-2-cleanup-design.md`

## Global constraints

- Template maintenance only. The allowed core edits are `src/brand.ts` and `src/utils/images.ts`; keep each minimal.
- Do not edit `src/components/widgets/`.
- Use Noto Sans, never Inter, in active template source. Historical ADRs, plans, session summaries, and retrospectives remain unchanged.
- Commit `NotoSans-Regular.ttf` and its OFL license under `src/assets/fonts/` from the official Noto Fonts source.
- `brand.logo.ogPath` is an empty-string default and a project-root-relative raster file path when configured.
- Keep the current `assertMatrix` score thresholds and noindex SEO exception unchanged.
- Do not push. Each task ends with a focused check and a commit.

## File map

- `astro.config.ts`: active Astro Fonts API registration.
- `src/fonts.ts`: active preload variable list.
- `src/brand.ts`: default font variables and the new OG-logo path contract.
- `scripts/init-client.mjs`: source literals used by `init-client --check` and generated client checklist.
- `src/assets/fonts/NotoSans-Regular.ttf`, `src/assets/fonts/OFL.txt`: local OG renderer input and license.
- `src/pages/og/[...route].ts`: local font, Noto Sans family selection, conditional bounded logo.
- `src/utils/images.ts`: 1200x630 Sharp default.
- `lighthouserc.cjs`: explicit static page collection URLs.
- `SETUP.md`, `docs/adr/0005-starter-content-forms-og.md`: client workflow and architecture record.
- `golden-baselines/**`: changed only if screenshot comparison reports a difference.

### Task 1: Replace the active default font with Noto Sans

**Files:**
- Create: `src/assets/fonts/NotoSans-Regular.ttf`
- Create: `src/assets/fonts/OFL.txt`
- Modify: `astro.config.ts`
- Modify: `src/fonts.ts`
- Modify: `src/brand.ts`
- Modify: `scripts/init-client.mjs`

**Interfaces:**
- Produces: Astro CSS variable `--font-noto-sans`, used by `src/fonts.ts` and all three `brand.fonts` defaults.
- Produces: matching `REPLACEMENTS` source literals so `npm run check:init` remains authoritative.

- [ ] **Step 1: Record the baseline font contract.**

Run:

```bash
rg -n "Inter|font-inter" astro.config.ts src/brand.ts src/fonts.ts scripts/init-client.mjs
npm run check:init
```

Expected: active source references Inter and `init-client --check` reports all source matches present.

- [ ] **Step 2: Add the licensed local font files.**

Download Noto Sans Regular TTF and OFL text from the official Noto Fonts repository. Save the font as `src/assets/fonts/NotoSans-Regular.ttf` and the unmodified license as `src/assets/fonts/OFL.txt`. Verify the font parses:

```bash
file src/assets/fonts/NotoSans-Regular.ttf
rg -n "SIL Open Font License" src/assets/fonts/OFL.txt
```

Expected: the font is a TrueType font and the license identifies the SIL Open Font License.

- [ ] **Step 3: Change only the active default-font contract.**

In `astro.config.ts`, replace the Inter Fonts API entry with:

```ts
{
  provider: fontProviders.fontsource(),
  name: 'Noto Sans',
  cssVariable: '--font-noto-sans',
  weights: ['100 900'],
  styles: ['normal'],
  subsets: ['latin'],
  fallbacks: ['sans-serif'],
}
```

Update the adjacent comment to name Noto Sans and `--font-noto-sans`. In `src/fonts.ts`, set:

```ts
export const preloadFonts: string[] = ['--font-noto-sans'];
```

In `src/brand.ts`, replace all three `var(--font-inter)` defaults with `var(--font-noto-sans)` and correct the introductory comment. In `scripts/init-client.mjs`, update every `REPLACEMENTS` `from` literal that describes the current default source from Inter / `--font-inter` to Noto Sans / `--font-noto-sans`. Leave the generated system-font replacement values unchanged.

- [ ] **Step 4: Verify the migration.**

Run:

```bash
npm run check:init
npm run check
rg -n -i "inter|font-inter" astro.config.ts src/brand.ts src/fonts.ts scripts/init-client.mjs
```

Expected: both checks pass and the final search has no output.

- [ ] **Step 5: Commit Task 1.**

```bash
git add astro.config.ts src/fonts.ts src/brand.ts scripts/init-client.mjs src/assets/fonts/NotoSans-Regular.ttf src/assets/fonts/OFL.txt
git commit -m "feat: replace template Inter defaults with Noto Sans"
```

### Task 2: Make OG cards local-font and client-logo aware

**Files:**
- Modify: `src/brand.ts`
- Modify: `src/pages/og/[...route].ts`

**Interfaces:**
- Consumes: `brand.logo.ogPath: string`, with `''` meaning no card logo.
- Consumes: `src/assets/fonts/NotoSans-Regular.ttf` from Task 1.
- Produces: cards rendered with local Noto Sans and an optional `logo: { path, size: [240] }`.

- [ ] **Step 1: Capture the current endpoint behavior.**

Run:

```bash
rm -rf node_modules/.astro-og-canvas
npm run build
file dist/og/home.png
```

Expected: the baseline uses the renderer default font source and produces a 1200x630 PNG.

- [ ] **Step 2: Add the brand input.**

Add this field beside `image` and `alt` in `brand.logo`:

```ts
ogPath: '', // project-root-relative raster logo path for generated OG cards
```

Do not change the existing UI-logo behavior.

- [ ] **Step 3: Wire the local font and conditional logo.**

Pass the top-level option:

```ts
fonts: ['./src/assets/fonts/NotoSans-Regular.ttf'],
```

Set both title and description options to `families: ['Noto Sans']`, retaining their current colors. Before returning image options, derive the logo once:

```ts
const logo = brand.logo.ogPath ? { path: brand.logo.ogPath, size: [240] as [number] } : undefined;
```

Then include `logo` in the returned options. Replace the stale no-logo comment with a short explanation of `ogPath`.

- [ ] **Step 4: Verify the default and configured behavior.**

Run the OG renderer directly with network requests blocked, then run the Astro integration build:

```bash
node --input-type=module -e "import { generateOpenGraphImage } from 'astro-og-canvas'; globalThis.fetch = () => { throw new Error('network disabled'); }; const image = await generateOpenGraphImage({ title: 'Local font check', fonts: ['./src/assets/fonts/NotoSans-Regular.ttf'], font: { title: { families: ['Noto Sans'] }, description: { families: ['Noto Sans'] } }, cacheDir: false }); await import('node:fs/promises').then(({ writeFile }) => writeFile('/private/tmp/phase2-og-local-font.png', image));"
file /private/tmp/phase2-og-local-font.png
npm run build
file dist/og/home.png
```

Expected: the direct renderer completes without calling `fetch`, and both images are 1200x630.

For a temporary focused check only, set `brand.logo.ogPath` to `./src/assets/images/default.png`, rebuild, and inspect `dist/og/home.png` with the OG preview or a local image viewer. Confirm the logo appears above the text and is bounded to 240px wide. Restore `ogPath: ''`, rebuild, and confirm the default card has no logo.

- [ ] **Step 5: Commit Task 2.**

```bash
git add src/brand.ts src/pages/og/[...route].ts
git commit -m "feat: add local-font OG cards with client logos"
```

### Task 3: Cover every static template route in LHCI

**Files:**
- Modify: `lighthouserc.cjs`

**Interfaces:**
- Produces: `collect.url` with eleven paths served from `staticDistDir`.
- Preserves: existing `assert.assertMatrix` patterns and thresholds.

- [ ] **Step 1: Show the incomplete baseline.**

Run after a build:

```bash
npm run test:lhci | tee /private/tmp/phase2-lhci-before.log
rg -n "pricing|services|thank-you" /private/tmp/phase2-lhci-before.log
```

Expected: the output does not show all three routes as audited.

- [ ] **Step 2: Add the explicit URL list.**

Inside `ci.collect`, retain `staticDistDir` and `numberOfRuns`, then add:

```js
url: [
  '/',
  '/about/',
  '/services/',
  '/pricing/',
  '/contact/',
  '/privacy/',
  '/terms/',
  '/thank-you/',
  '/dev/components/',
  '/dev/og/',
  '/dev/tokens/',
],
```

Update the comment to say the explicit list, not autodiscovery, controls coverage. Do not alter the two `matchingUrlPattern` values or score thresholds.

- [ ] **Step 3: Verify coverage and assertions.**

Run:

```bash
npm run build
npm run test:lhci | tee /private/tmp/phase2-lhci-after.log
```

Expected: output shows one Lighthouse run for each listed path. Marketing and legal routes retain SEO assertions. `/thank-you/` and `/dev/` routes pass without an SEO assertion.

- [ ] **Step 4: Commit Task 3.**

```bash
git add lighthouserc.cjs
git commit -m "test: cover all static template routes in LHCI"
```

### Task 4: Align the Sharp OG crop and update the client contract

**Files:**
- Modify: `src/utils/images.ts`
- Modify: `SETUP.md`
- Modify: `scripts/init-client.mjs`
- Modify: `docs/adr/0005-starter-content-forms-og.md`

**Interfaces:**
- Produces: `OG_HEIGHT = 630` for optimized local Open Graph images.
- Produces: client instructions for `brand.logo.image`, `brand.logo.alt`, and `brand.logo.ogPath`.

- [ ] **Step 1: Confirm the pre-change local-image dimensions.**

Run a production build and inspect the optimized default image:

```bash
npm run build
find dist/_astro -name 'default.*.jpg' -print -exec file {} \;
```

Expected: the optimized local default OG image is 1200x626.

- [ ] **Step 2: Make the narrow code change.**

In `src/utils/images.ts`, change only:

```ts
const OG_HEIGHT = 630;
```

Keep the generated root-relative URL pass-through and its declared-dimension behavior unchanged.

- [ ] **Step 3: Update workflow and ADR text.**

In SETUP B1c, extend the logo checklist entry to include `logo.ogPath`, using the exact project-root-relative raster path contract. Update the matching generated `docs/reinit-checklist.md` row in `scripts/init-client.mjs`.

In ADR 0005, replace the logo and remote-font deferrals with completion notes, update the OG-image decision to name Noto Sans and the local asset, and change the consequences so they no longer claim a build-time Fontsource fetch or a logo-free card. Leave the blog-post OG deferral intact.

- [ ] **Step 4: Verify dimensions and script integrity.**

Run:

```bash
npm run build
find dist/_astro -name 'default.*.jpg' -print -exec file {} \;
npm run check:init
npm run check
```

Expected: the default optimized image is 1200x630 and both checks pass.

- [ ] **Step 5: Commit Task 4.**

```bash
git add src/utils/images.ts SETUP.md scripts/init-client.mjs docs/adr/0005-starter-content-forms-og.md
git commit -m "fix: align OG dimensions and document card assets"
```

### Task 5: Refresh only changed baselines and run all merge gates

**Files:**
- Modify if needed: `golden-baselines/**`

**Interfaces:**
- Consumes: all completed cleanup changes.
- Produces: verified green build artifacts and baselines that match the rendered template.

- [ ] **Step 1: Check visual baselines before refreshing anything.**

Run:

```bash
npm run build
npm run screenshot:check
```

Expected: either all screenshots match, or the command reports exact changed files under `golden-baselines-diff/`.

- [ ] **Step 2: Review differences and refresh only when justified.**

If screenshot check reports differences, inspect every changed image in `golden-baselines-diff/`. Refresh with `npm run screenshot` only if every difference is explained by the Noto Sans migration or 1200x630 crop. Re-run `npm run screenshot:check` afterward. If the first check passes, do not modify baselines.

- [ ] **Step 3: Run the required merge gates in order.**

```bash
npm run build
npm run check
npm run test:links
npm run test:lhci
npm run screenshot:check
```

Expected: every command exits 0.

- [ ] **Step 4: Confirm scope and active-font removal.**

Run:

```bash
git diff main...HEAD --check
rg -n -i "inter|font-inter" astro.config.ts src scripts/init-client.mjs SETUP.md AGENTS.md CLAUDE.md CONTEXT.md || true
git status --short
```

Expected: no active Inter references, no whitespace errors, and only intentional baseline changes remain.

- [ ] **Step 5: Commit Task 5 if baselines changed.**

```bash
git add golden-baselines
git commit -m "test: refresh template visual baselines"
```

If no baseline file changed, make no commit for this task.

## Plan self-review

- Scope coverage: Task 1 replaces active Inter defaults and adds the licensed local font. Task 2 wires the font and optional bounded logo into OG cards. Task 3 covers all static pages in LHCI. Task 4 aligns the Sharp crop and updates the workflow and ADR. Task 5 performs visual review and all required gates.
- No placeholders: every task identifies its files, commands, expected result, and commit boundary.
- Consistency: `--font-noto-sans`, `NotoSans-Regular.ttf`, `Noto Sans`, `brand.logo.ogPath`, `size: [240]`, `OG_HEIGHT = 630`, and the eleven LHCI paths use the same names throughout.
