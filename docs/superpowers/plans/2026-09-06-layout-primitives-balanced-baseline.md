# Layout Primitives and Balanced Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the template a zero-diff balanced layout vocabulary and move the five starter pages off direct parts-bin widget imports.

**Architecture:** `CustomStyles.astro` emits four fixed balanced CSS variables. Tailwind exposes semantic width, gap, and gutter utilities that consume those variables. Client-layer copies of the widgets used by the starter pages adopt only role-equivalent utilities, then the starter pages switch their imports to those copies. `src/brand.ts` remains unchanged.

**Tech Stack:** Astro 7, TypeScript, Tailwind CSS v4 custom utilities, Node built-in test runner, Playwright golden screenshots, Lighthouse CI.

**Spec:** `docs/superpowers/specs/2026-09-06-layout-primitives-art-direction-design.md`

## Global Constraints

- Do not start implementation until `phase2-cleanup` is merged into `main`; create or rebase the implementation branch from that resulting `main`.
- Do not inspect, copy from, modify, merge, or commit the `phase2-cleanup` worktree directly.
- Do not modify `src/brand.ts`, the Phase 1 token maps, or the Phase 2 collections, forms, thank-you route, OG route, sitemap rules, or Lighthouse matrix.
- `src/components/widgets/` remains the unchanged parts bin. The five starter pages must import their maintained copies from `src/components/client/`.
- `WidgetWrapper.astro` keeps its current `px-4 md:px-6` behaviour. The new `layout-gutter` utility is only for copied hero and note components and resolves to `px-4 sm:px-6`.
- Default rendering must have no intentional visual change. `npm run screenshot:check` must pass against the existing committed baseline. Do not refresh `golden-baselines/` in this work.
- Run `npm run build` before `npm run test:links`, `npm run screenshot:check`, or browser checks. Run `npm run test:lhci` only after a successful build.
- Use no em dashes in authored copy, comments, commit messages, or documentation.

---

## File map

| File | Responsibility |
| --- | --- |
| `src/components/CustomStyles.astro` | Emits the fixed balanced layout variables. |
| `src/assets/styles/tailwind.css` | Defines `layout-page`, `layout-reading`, `layout-media`, `layout-grid`, and `layout-gutter`. |
| `tests/layout-contract.test.mjs` | Locks the variable values and utility names. |
| `src/components/client/{Hero,HeroText,Note,Features,Features2,Features3,Steps,Steps2,Content,Testimonials,FAQs,CallToAction,Pricing}.astro` | Client-owned copies of the 13 widgets used by starter pages. |
| `tests/starter-page-boundary.test.mjs` | Prevents the five starter pages from returning to direct parts-bin imports. |
| `src/pages/{index,about,services,pricing,contact}.astro` | Imports the client-owned component copies, preserving existing props and slots. |

### Task 1: Create the balanced layout contract

**Files:**
- Create: `tests/layout-contract.test.mjs`
- Modify: `src/components/CustomStyles.astro`
- Modify: `src/assets/styles/tailwind.css`

**Interfaces:**
- Consumes: Phase 1's `--aw-container-max` emitted by `src/components/CustomStyles.astro`.
- Produces: `--aw-layout-page-max`, `--aw-layout-reading-max`, `--aw-layout-media-max`, `--aw-layout-grid-gap`, plus the five Tailwind layout utilities.

- [ ] **Step 1: Confirm the cleanup merge and the baseline are ready**

Run:

```bash
git fetch origin
git log --oneline --decorate -5 main
git status --short --branch
npm ci
npm run build
npm run check
npm run screenshot:check
```

Expected: `main` contains the merged Phase 2 cleanup, the working tree is clean before this task, and the existing build, checks, and screenshot comparison pass. Stop and resolve a failed baseline before editing Phase 3 files.

- [ ] **Step 2: Write the failing layout-contract test**

Create `tests/layout-contract.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('balanced layout variables and utilities remain defined', async () => {
  const [styles, utilities] = await Promise.all([
    read('src/components/CustomStyles.astro'),
    read('src/assets/styles/tailwind.css'),
  ]);

  assert.match(styles, /--aw-layout-page-max: var\(--aw-container-max\);/);
  assert.match(styles, /--aw-layout-reading-max: 48rem;/);
  assert.match(styles, /--aw-layout-media-max: 64rem;/);
  assert.match(styles, /--aw-layout-grid-gap: 2rem;/);

  for (const utility of ['layout-page', 'layout-reading', 'layout-media', 'layout-grid', 'layout-gutter']) {
    assert.match(utilities, new RegExp(`@utility ${utility} \\{`));
  }
});
```

- [ ] **Step 3: Run the test to confirm it fails**

Run:

```bash
node --test tests/layout-contract.test.mjs
```

Expected: FAIL because the four `--aw-layout-*` declarations and utilities do not exist yet.

- [ ] **Step 4: Emit the balanced variables**

In the `:root` block of `src/components/CustomStyles.astro`, immediately after `--aw-container-max`, add:

```astro
    --aw-layout-page-max: var(--aw-container-max);
    --aw-layout-reading-max: 48rem;
    --aw-layout-media-max: 64rem;
    --aw-layout-grid-gap: 2rem;
```

Do not add `brand.artDirection`, an `ArtDirectionPreset` type, or any new `brand.ts` import.

- [ ] **Step 5: Define the utilities**

Append these utilities after the existing `text-muted` utility in `src/assets/styles/tailwind.css`:

```css
@utility layout-page {
  @apply mx-auto max-w-(--aw-layout-page-max);
}

@utility layout-reading {
  @apply mx-auto max-w-(--aw-layout-reading-max);
}

@utility layout-media {
  @apply mx-auto max-w-(--aw-layout-media-max);
}

@utility layout-grid {
  gap: var(--aw-layout-grid-gap);
}

@utility layout-gutter {
  @apply px-4 sm:px-6;
}
```

- [ ] **Step 6: Run the contract test and static checks**

Run:

```bash
node --test tests/layout-contract.test.mjs
npm run check
npm run build
```

Expected: all commands pass. Do not proceed if Tailwind does not generate a utility or Astro reports an invalid class.

- [ ] **Step 7: Commit the contract**

```bash
git add src/components/CustomStyles.astro src/assets/styles/tailwind.css tests/layout-contract.test.mjs
git commit -m "feat: add balanced layout primitives"
```

### Task 2: Copy starter-page widgets into the client layer

**Files:**
- Create: `src/components/client/Hero.astro`
- Create: `src/components/client/HeroText.astro`
- Create: `src/components/client/Note.astro`
- Create: `src/components/client/Features.astro`
- Create: `src/components/client/Features2.astro`
- Create: `src/components/client/Features3.astro`
- Create: `src/components/client/Steps.astro`
- Create: `src/components/client/Steps2.astro`
- Create: `src/components/client/Content.astro`
- Create: `src/components/client/Testimonials.astro`
- Create: `src/components/client/FAQs.astro`
- Create: `src/components/client/CallToAction.astro`
- Create: `src/components/client/Pricing.astro`
- Create: `tests/client-layout-roles.test.mjs`

**Interfaces:**
- Consumes: the five utilities from Task 1, the original widget props, slots, imports, and Phase 1 token variables.
- Produces: client-owned components with unchanged public props and slots, plus role-equivalent balanced layout classes.

- [ ] **Step 1: Write the failing client-layout test**

Create `tests/client-layout-roles.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { access, readFile } from 'node:fs/promises';

const files = [
  'Hero', 'HeroText', 'Note', 'Features', 'Features2', 'Features3', 'Steps',
  'Steps2', 'Content', 'Testimonials', 'FAQs', 'CallToAction', 'Pricing',
];
const url = (path) => new URL(`../${path}`, import.meta.url);

test('starter-page widgets are client-owned and use balanced layout roles', async () => {
  await Promise.all(files.map((name) => access(url(`src/components/client/${name}.astro`))));
  const [hero, heroText, features2, content, faqs, callToAction, pricing] = await Promise.all(
    ['Hero', 'HeroText', 'Features2', 'Content', 'FAQs', 'CallToAction', 'Pricing'].map((name) =>
      readFile(url(`src/components/client/${name}.astro`), 'utf8')
    )
  );
  assert.match(hero, /layout-page layout-gutter/);
  assert.match(hero, /layout-reading/);
  assert.match(hero, /layout-media/);
  assert.match(heroText, /layout-page layout-gutter/);
  assert.match(features2, /layout-page/);
  assert.match(content, /layout-page/);
  assert.match(faqs, /layout-page/);
  assert.match(callToAction, /layout-reading/);
  assert.match(pricing, /layout-page/);
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run:

```bash
node --test tests/client-layout-roles.test.mjs
```

Expected: FAIL because no copied client components exist.

- [ ] **Step 3: Copy the parts-bin source without changing its interface**

Run:

```bash
for name in Hero HeroText Note Features Features2 Features3 Steps Steps2 Content Testimonials FAQs CallToAction Pricing; do
  cp "src/components/widgets/$name.astro" "src/components/client/$name.astro"
done
```

Keep every copied component's imports, props, slots, animation classes, image behaviour, and card token references intact. Do not modify the source widgets.

- [ ] **Step 4: Apply only exact-value role replacements in the copies**

Make these replacements, retaining any component-specific classes not named below:

```text
Hero.astro:
  max-w-7xl mx-auto px-4 sm:px-6 -> layout-page layout-gutter
  max-w-5xl mx-auto -> layout-media
  max-w-3xl mx-auto -> layout-reading
  m-auto max-w-5xl -> m-auto layout-media

HeroText.astro:
  max-w-7xl mx-auto px-4 sm:px-6 -> layout-page layout-gutter
  max-w-5xl mx-auto -> layout-media
  max-w-3xl mx-auto -> layout-reading

Note.astro:
  px-4 sm:px-6 -> layout-gutter

Features.astro:
  gap-8 -> layout-grid, while retaining md:gap-y-12

Features2.astro, Content.astro, FAQs.astro, Pricing.astro:
  root container max-w-7xl mx-auto -> layout-page

CallToAction.astro:
  inner max-w-3xl mx-auto -> layout-reading
```

Leave `max-w-4xl`, `max-w-5xl`, and `max-w-6xl` instances that do not match a named role unchanged. Leave specialised `gap-4`, `gap-6`, `md:gap-y-12`, `gap-x-12`, and price-card layout classes unchanged. `Features3`, `Steps`, `Steps2`, and `Testimonials` are copied without a role-class change because their current width or gap does not match a balanced role exactly.

- [ ] **Step 5: Run the component test and compile check**

Run:

```bash
node --test tests/client-layout-roles.test.mjs
npm run check
npm run build
```

Expected: all commands pass. The copied files preserve their public Astro interfaces, so no page import needs to change yet for this task to compile.

- [ ] **Step 6: Commit the client-layer components**

```bash
git add src/components/client tests/client-layout-roles.test.mjs
git commit -m "feat: move starter widgets into client layer"
```

### Task 3: Point starter pages at client-owned widgets

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/pages/about.astro`
- Modify: `src/pages/services.astro`
- Modify: `src/pages/pricing.astro`
- Modify: `src/pages/contact.astro`
- Create: `tests/starter-page-boundary.test.mjs`

**Interfaces:**
- Consumes: the identically named client components from Task 2.
- Produces: five starter pages with unchanged content, props, slots, metadata, and collection loading, but no `~/components/widgets/` imports.

- [ ] **Step 1: Write the failing import-boundary test**

Create `tests/starter-page-boundary.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const pages = ['index.astro', 'about.astro', 'services.astro', 'pricing.astro', 'contact.astro'];
const read = (page) => readFile(new URL(`../src/pages/${page}`, import.meta.url), 'utf8');

test('starter pages do not import parts-bin widgets', async () => {
  for (const page of pages) {
    const source = await read(page);
    assert.doesNotMatch(source, /~\/components\/widgets\//, page);
  }
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run:

```bash
node --test tests/starter-page-boundary.test.mjs
```

Expected: FAIL for every page because each currently imports at least one parts-bin widget.

- [ ] **Step 3: Replace imports without changing usage**

In each page, change only the import root from `~/components/widgets/` to `~/components/client/` for these components:

```text
index.astro: Hero, Note, Features, Steps, Content, Testimonials, FAQs, CallToAction
about.astro: Features2, Features3, Hero, Steps2
services.astro: CallToAction, Content, Features2, Hero
pricing.astro: HeroText, Pricing, FAQs, CallToAction
contact.astro: HeroText, Features2
```

Keep `ContactForm` importing from `~/components/client/ContactForm.astro`. Do not alter page metadata, placeholder image markup, collection queries, copy, JSX, slots, or component props.

- [ ] **Step 4: Run boundary, type, and build checks**

Run:

```bash
node --test tests/layout-contract.test.mjs tests/client-layout-roles.test.mjs tests/starter-page-boundary.test.mjs
npm run check
npm run build
```

Expected: all three contract tests pass, Astro reports no diagnostics, and the production build finishes.

- [ ] **Step 5: Commit page-boundary migration**

```bash
git add src/pages tests/starter-page-boundary.test.mjs
git commit -m "refactor: use client widgets on starter pages"
```

### Task 4: Prove the zero-diff baseline and Phase 2 regression gates

**Files:**
- Test only: no source or baseline files should change.

**Interfaces:**
- Consumes: the completed layout contract, client widgets, starter-page import boundary, existing screenshot baselines, Phase 2 form and OG routes.
- Produces: a verified implementation report with no committed screenshot changes.

- [ ] **Step 1: Run the complete automated gate**

Run:

```bash
npm run check
npm run build
npm run test:links
npm run screenshot:check
npm run test:lhci
```

Expected: every command exits 0. `npm run screenshot:check` reports that all screenshots match `golden-baselines/`. If it writes a file under `golden-baselines-diff/`, inspect it, correct the source change causing the difference, then rerun the command. Do not regenerate the baseline.

- [ ] **Step 2: Inspect the resolved layout values in the browser**

Run:

```bash
npm run dev
```

At desktop and mobile widths, inspect a starter-page hero, a section heading, hero media, a `Features` grid, and the pricing grid. In DevTools, verify:

```text
--aw-layout-page-max = var(--aw-container-max)
--aw-layout-reading-max = 48rem
--aw-layout-media-max = 64rem
--aw-layout-grid-gap = 2rem
```

Confirm that no page has horizontal overflow, the mobile menu opens and closes, light and dark mode retain their existing appearance, and the copied components render the same visible content as before.

- [ ] **Step 3: Smoke-test Phase 2 paths**

In the built preview, submit the starter contact form and confirm `/thank-you/` is styled and noindex. Open `/og/home.png`, `/og/about.png`, `/og/services.png`, `/og/pricing.png`, and `/og/contact.png`; confirm each returns its card image. No Phase 3 file should modify these paths.

- [ ] **Step 4: Confirm repository boundaries**

Run:

```bash
! rg -n "~/components/widgets/" src/pages/{index,about,services,pricing,contact}.astro
git diff main...HEAD -- src/brand.ts src/components/widgets src/layouts src/utils src/components/common src/components/ui src/components/blog vendor
git status --short
```

Expected: `rg` prints no matches. The diff command prints no changed files in the listed forbidden areas. `git status` is clean except for ignored `golden-baselines-diff/` output, which must not be staged.

- [ ] **Step 5: Leave the verification task uncommitted**

Do not create a source, screenshot, baseline, or report commit in this task. Leave the branch at the Task 3 commit and record the passing commands in the delivery note.

## Plan self-review

| Spec requirement | Plan coverage |
| --- | --- |
| Four balanced variables and five utilities | Task 1 |
| Phase 1 container remains the page-width source | Task 1 contract assertion and variable value |
| Fixed hero and note gutter; `WidgetWrapper` unchanged | Global constraints and Task 2 class mapping |
| Thirteen exact client-layer widget copies | Task 2 |
| Five starter pages no longer import the parts bin | Task 3 |
| No `brand.ts` change and no selectable preset | Global constraints and Task 1 |
| Default zero-diff visual output | Task 4 screenshot gate |
| Phase 2 forms, thank-you, and OG smoke checks | Task 4 |
| Wait for `phase2-cleanup` merge | Global constraints and Task 1 preflight |

The plan uses the same names in tests, copied components, and page imports. It contains no baseline refresh step and no Phase 2 modification.
