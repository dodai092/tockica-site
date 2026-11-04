# Design Token Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add five design knobs (`radius`, `button`, `section`, `shadow`, `container`) to `src/brand.ts` that flow through the `--aw-*` custom-property seam into template core, so two client builds can look structurally different with zero core edits.

**Architecture:** `brand.ts` gains a `tokens` enum block. `CustomStyles.astro` resolves each enum to CSS values and appends `--aw-*` custom properties to the inline `:root` style it already emits. `Layout.astro` stamps `data-btn` on `<html>`. Core (`tailwind.css`, `WidgetWrapper.astro`, `Form.astro`) and the parts-bin card widgets read those vars via `var(--aw-x, <current hardcoded value>)`, so an absent token = today's look. Two `/dev/*` preview routes render the resolved system; `init-client` strips them from client repos.

**Tech Stack:** Astro v7, Tailwind CSS v4 (`@theme` / `@utility` in `src/assets/styles/tailwind.css`), Playwright-based golden screenshot regression (`npm run screenshot` / `screenshot:check`).

**Spec:** `docs/superpowers/specs/2026-09-05-design-token-contract-design.md`

## Global Constraints

- This is template-repo work (branch off `main`), not a client build, so core edits are allowed. They still get ADR 0004.
- No em dashes in any authored text (code comments, JSDoc, ADR, commit messages). Use a period, comma, or "and"/"so".
- An absent or all-default `tokens` block must render identically to today EXCEPT the two documented one-time corrections: (1) button radius `rounded-full` -> `0.375rem`; (2) parts-bin card shadow and radius normalized to the `soft` language. Any golden diff outside button and card surfaces is a bug.
- Enum values and their CSS mappings are fixed by the spec's tables. Copy them verbatim.
- **Var-reference syntax (pre-flight ruling).** Tailwind v4 arbitrary values with a `var()` fallback containing commas (`shadow-[var(--x,rgba(0,0,0,0.1))]`) are fragile. Do NOT put fallbacks in utility classes. `CustomStyles.astro` (Task 1) unconditionally emits all seven vars with defaults already resolved, so a missing var cannot happen. Use Tailwind v4's bare-custom-property shorthand: `rounded-(--aw-radius-btn)`, `shadow-(--aw-shadow-card)`, `max-w-(--aw-container-max)`, `py-(--aw-section-py-sm) md:py-(--aw-section-py-md) lg:py-(--aw-section-py-lg)`, `rounded-(--aw-radius-card)`. If `npm run build` rejects that shorthand for a utility, fall back to `[var(--aw-x)]` with NO fallback value. The spec's "fallback = today's value" intent is met by Task 1 always emitting the resolved defaults.
- `radius: 'soft'` is the confirmed default (Antun confirmed the button-radius change).
- Run `npm run fix:prettier` on touched files before committing; `npm run check` runs `prettier --check`.
- Golden refresh needs Playwright Chromium (`npx playwright install chromium`, one-time). If the environment cannot run a headless browser, the implementer commits the code, writes `GOLDEN REFRESH PENDING` in its report with the reason, and does NOT block the task on `screenshot:check`. That refresh then surfaces to Antun in the final report.
- `src/pages/` entries prefixed `_` are not routed by Astro (dev or build). The preview pages therefore live at `src/pages/dev/`, not `_dev/`.

---

### Task 1: token emission layer

Adds the `tokens` block and emits the `--aw-*` vars and `data-btn`. Nothing consumes them yet, so rendering and the golden baseline are unchanged.

**Files:**

- Modify: `src/brand.ts`
- Modify: `src/components/CustomStyles.astro`
- Modify: `src/layouts/Layout.astro`

**Interfaces:**

- Produces:
  - `brand.tokens`: `{ radius: 'sharp'|'soft'|'round'|'pill', button: 'solid'|'outline'|'ghost', section: 'tight'|'normal'|'roomy', shadow: 'none'|'soft'|'hard', container: 'narrow'|'normal'|'wide' }`, all set to their defaults (`soft`/`solid`/`normal`/`soft`/`normal`) in the template `brand.ts`.
  - CSS custom properties emitted on `:root` by `CustomStyles.astro`: `--aw-radius-btn`, `--aw-radius-card`, `--aw-section-py-sm`, `--aw-section-py-md`, `--aw-section-py-lg`, `--aw-shadow-card`, `--aw-container-max`.
  - `data-btn="<brand.tokens.button>"` attribute on the `<html>` element (from `Layout.astro`).

- [ ] **Step 1: Add the `tokens` block to `src/brand.ts`**

After the `fonts` block, before `light`, add:

```ts
  /**
   * Design knobs. Enums only, so a build cannot produce an incoherent in-between.
   * Flow through src/components/CustomStyles.astro into --aw-* custom properties.
   * Preview the resolved system at /dev/tokens (npm run dev).
   *   radius     corner rounding for buttons, inputs, cards, media
   *   button     primary-action treatment: filled, outlined, or text-only
   *   section    vertical rhythm between page bands
   *   shadow     card elevation language
   *   container  max content width
   */
  tokens: {
    radius: 'soft',
    button: 'solid',
    section: 'normal',
    shadow: 'soft',
    container: 'normal',
  },
```

If `brand` is typed `as const`, that is fine, the resolver reads plain strings.

- [ ] **Step 2: Add the resolver and emit vars in `src/components/CustomStyles.astro`**

The file builds a `css` template string then renders `<style is:inline set:html={css}>`. Before the template string, add a resolver:

```ts
const t = brand.tokens ?? {};
const RADIUS = {
  sharp: { btn: '0', card: '0' },
  soft: { btn: '0.375rem', card: '0.5rem' },
  round: { btn: '0.625rem', card: '0.75rem' },
  pill: { btn: '9999px', card: '1rem' },
};
const SECTION = {
  tight: ['2.5rem', '3rem', '3.5rem'],
  normal: ['3rem', '4rem', '5rem'],
  roomy: ['4rem', '6rem', '8rem'],
};
const SHADOW = {
  none: 'none',
  soft: '0 4px 30px rgb(0 0 0 / 0.08)',
  hard: '6px 6px 0 0 rgb(0 0 0 / 0.9)',
};
const CONTAINER = { narrow: '60rem', normal: '80rem', wide: '90rem' };

const radius = RADIUS[t.radius ?? 'soft'];
const section = SECTION[t.section ?? 'normal'];
const shadowCard = SHADOW[t.shadow ?? 'soft'];
const containerMax = CONTAINER[t.container ?? 'normal'];
```

Add these lines to the `:root { ... }` block of the `css` string (after the existing `--aw-color-*` lines, before the `::selection` rule). They are ALWAYS emitted (defaults already resolved above), which is what lets the utility classes drop their fallbacks:

```
    --aw-radius-btn: ${radius.btn};
    --aw-radius-card: ${radius.card};
    --aw-section-py-sm: ${section[0]};
    --aw-section-py-md: ${section[1]};
    --aw-section-py-lg: ${section[2]};
    --aw-shadow-card: ${shadowCard};
    --aw-container-max: ${containerMax};
```

Do NOT add them to the `.dark` block. They are theme-independent.

- [ ] **Step 3: Stamp `data-btn` on `<html>` in `src/layouts/Layout.astro`**

Add `import { brand } from '~/brand';` to the frontmatter imports. Change the opening tag

```astro
<html lang={language} dir={textDirection} class="2xl:text-[20px]"></html>
```

to

```astro
<html lang={language} dir={textDirection} class="2xl:text-[20px]" data-btn={brand.tokens?.button ?? 'solid'}></html>
```

- [ ] **Step 4: Build and inspect**

Run: `npm run build`
Expected: succeeds.

Run: `node -e "const {readFileSync}=require('fs'); const h=readFileSync('dist/index.html','utf8'); console.log(h.match(/--aw-radius-btn:[^;]+;/)?.[0], h.match(/--aw-section-py-md:[^;]+;/)?.[0], h.match(/data-btn=\"[^\"]*\"/)?.[0]);"`
Expected: prints `--aw-radius-btn: 0.375rem; --aw-section-py-md: 4rem; data-btn="solid"`.

- [ ] **Step 5: Confirm no visual change**

Run: `npm run screenshot:check` (after `npm run build`)
Expected: PASS with no diffs. Nothing consumes the new vars yet.
(If Playwright is unavailable, note it per the Global Constraints and move on.)

Run: `npm run check`
Expected: passes.

- [ ] **Step 6: Commit**

```bash
npm run fix:prettier
git add src/brand.ts src/components/CustomStyles.astro src/layouts/Layout.astro
git commit -m "feat: emit design-token custom properties from brand.tokens

Adds the tokens enum block to brand.ts and emits --aw-radius-*, --aw-section-py-*,
--aw-shadow-card, --aw-container-max on :root plus data-btn on <html>. No consumers
yet, rendering unchanged.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: consume the scalar vars in core UI

Wires `WidgetWrapper` (section rhythm + container width), `Form.astro` (input radius), and the `btn` utility (button radius) to the vars. At default tokens the only rendered change is button corners.

**Files:**

- Modify: `src/components/ui/WidgetWrapper.astro`
- Modify: `src/components/ui/Form.astro`
- Modify: `src/assets/styles/tailwind.css`
- Modify: `golden-baselines/**` (refresh)

**Interfaces:**

- Consumes: the `--aw-*` vars from Task 1.
- Produces: nothing new for later tasks. Task 3 also edits `tailwind.css` (a different region) and Task 4 also touches `--aw-radius-card` (in the widgets).

- [ ] **Step 1: `WidgetWrapper.astro` section padding and container width**

In the container `div`'s `twMerge(...)` class string, replace `max-w-7xl` with `max-w-(--aw-container-max)` and `py-12 md:py-16 lg:py-20` with `py-(--aw-section-py-sm) md:py-(--aw-section-py-md) lg:py-(--aw-section-py-lg)`. Leave everything else (`relative mx-auto px-4 md:px-6 text-default intersect-*` etc.) untouched. See the var-reference syntax ruling in Global Constraints. Verify `npm run build` accepts the shorthand; if not, use `[var(--aw-container-max)]` etc. with no fallback.

- [ ] **Step 2: `Form.astro` input radius**

Three class strings contain `rounded-lg` (two `py-3 px-4 block w-full ...` inputs/textarea, one checkbox row). Replace `rounded-lg` with `rounded-(--aw-radius-card)` in all three.

- [ ] **Step 3: `tailwind.css` button radius**

In `@utility btn { @apply ... }`, replace `rounded-full` with `rounded-(--aw-radius-btn)`. `btn-primary`, `btn-secondary`, `btn-tertiary` all `@apply btn` so they inherit it. No other change in this step. If `@apply rounded-(--aw-radius-btn)` is rejected inside `@utility`, use plain CSS in that block instead: `border-radius: var(--aw-radius-btn);` alongside the `@apply` line.

- [ ] **Step 4: Build and check the diff is bounded**

Run: `npm run build && npm run check`
Expected: both pass.

Run: `npm run screenshot:check`
Expected: FAILS. Inspect `golden-baselines-diff/`: every diff must be button corners only (hero actions, CTA buttons, pricing buttons). Section spacing, container width, and form inputs must NOT differ at default tokens (their fallbacks equal today's values). If anything else differs, stop and fix.

- [ ] **Step 5: Refresh the golden baseline**

Run: `npm run build && npm run screenshot`
Then spot-check per `docs/golden-workflow.md`: open `golden-baselines/home/light-desktop.png` and one mobile shot, confirm real content and that buttons now have a small radius rather than full pill.

(If Playwright is unavailable: skip Steps 4-5, write `GOLDEN REFRESH PENDING: button-radius` in the report, commit the code anyway.)

- [ ] **Step 6: Commit**

```bash
npm run fix:prettier
git add src/components/ui/WidgetWrapper.astro src/components/ui/Form.astro src/assets/styles/tailwind.css golden-baselines
git commit -m "feat: drive section rhythm, container width, input and button radius from tokens

WidgetWrapper py/max-width, Form input radius, and the btn utility now read
--aw-* vars with today's values as fallbacks. Only rendered change at default
tokens is button corners (rounded-full to 0.375rem), an intentional one-time
correction. Golden baseline refreshed.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: button-style rules

Adds the `outline` and `ghost` treatments for `btn-primary`, scoped by `data-btn` on `<html>`. At default (`solid`) nothing changes.

**Files:**

- Modify: `src/assets/styles/tailwind.css`

**Interfaces:**

- Consumes: `data-btn` on `<html>` (Task 1), the `.btn-primary` utility (existing).
- Produces: nothing for later tasks.

- [ ] **Step 1: Add the rule blocks**

After the `@utility btn-primary { ... }` / `btn-secondary` / `btn-tertiary` definitions in `tailwind.css`, add plain CSS (not `@utility`, these are attribute-scoped overrides):

```css
/* Primary-button treatment, driven by brand.tokens.button (data-btn on <html>). */
:root[data-btn='outline'] .btn-primary {
  @apply bg-transparent text-primary border-primary hover:bg-primary hover:text-white dark:bg-transparent dark:text-primary dark:hover:bg-primary dark:hover:text-white;
}
:root[data-btn='ghost'] .btn-primary {
  @apply bg-transparent border-transparent text-primary shadow-none hover:bg-primary/10 hover:text-primary dark:bg-transparent dark:text-primary dark:hover:bg-primary/10;
}
```

`data-btn='solid'` gets no block, `btn-primary`'s own definition is the solid treatment.

- [ ] **Step 2: Verify default unchanged, non-default works**

Run: `npm run build && npm run check`
Expected: pass.

Run: `npm run screenshot:check`
Expected: PASS, no diffs (default is `solid`).

Manual: temporarily set `brand.tokens.button` to `'outline'` in `src/brand.ts`, `npm run build`, open `dist/index.html` in a browser or grep the built CSS for `[data-btn='outline']`, confirm the rule is present and the hero button would render outlined. Revert `brand.ts`.

- [ ] **Step 3: Commit**

```bash
npm run fix:prettier
git add src/assets/styles/tailwind.css
git commit -m "feat: outline and ghost primary-button treatments via data-btn

Two attribute-scoped rule blocks for .btn-primary. Default (solid) unchanged.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: card surface sweep

Normalizes the ad hoc `shadow-*` / `rounded-*` on the parts-bin card surfaces to the two card vars. This changes the golden baseline at default (card elevation and radius unify), which is the intended shadow-language behavior.

**Files:**

- Modify: `src/components/widgets/Features2.astro`
- Modify: `src/components/widgets/Features3.astro`
- Modify: `src/components/widgets/Pricing.astro`
- Modify: `src/components/widgets/Contact.astro`
- Modify: `src/components/widgets/CallToAction.astro`
- Modify: `src/components/widgets/Testimonials.astro`
- Modify: `src/components/widgets/Content.astro`
- Modify: `src/components/widgets/Steps.astro`
- Modify: `golden-baselines/**` (refresh)

**Interfaces:**

- Consumes: `--aw-shadow-card`, `--aw-radius-card` from Task 1.
- Produces: nothing for later tasks.

- [ ] **Step 1: Sweep each card surface**

For each file, on the card / framed-media element only (not avatars, not icon circles, not the `Header` dropdown), replace its radius class (`rounded`, `rounded-md`, `rounded-lg`, `rounded-xl`) with `rounded-(--aw-radius-card)` and its shadow class (`shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-[0_4px_30px_rgba(0,0,0,0.1)]`) with `shadow-(--aw-shadow-card)` (bare-custom-property shorthand, see Global Constraints; no fallback). Exact lines to touch:

- `Features2.astro`: the `.relative flex flex-col rounded-lg shadow-[0_4px_30px_rgba(0,0,0,0.1)] ...` card wrapper. Replace the `dark:shadow-[0_4px_30px_rgba(0,0,0,0.1)]` with `dark:shadow-(--aw-shadow-card)` too.
- `Features3.astro`: the two `w-full h-80 object-cover rounded-xl mx-auto bg-gray-500 shadow-lg` image blocks.
- `Pricing.astro`: the `rounded-lg backdrop-blur border ... shadow px-6 py-8` price card. (The `rounded-full bg-primary` badge is NOT a card, leave it.)
- `Contact.astro`: the `flex flex-col max-w-xl mx-auto rounded-lg backdrop-blur border ... shadow p-4` card.
- `CallToAction.astro`: the `max-w-3xl mx-auto text-center p-6 rounded-md shadow-xl dark:shadow-none ...` card. Keep `dark:shadow-none`.
- `Testimonials.astro`: the `flex flex-col p-4 md:p-6 rounded-md shadow-xl dark:shadow-none ...` card. Keep `dark:shadow-none`. The `rounded-full` avatar wrappers stay.
- `Content.astro`: the `mx-auto w-full rounded-lg bg-gray-500 shadow-lg` image. The `rounded-full bg-green-600` check icon stays.
- `Steps.astro`: the `inset-0 object-cover object-top w-full rounded-md shadow-lg md:absolute ...` image.

- [ ] **Step 2: Build and check the diff is bounded**

Run: `npm run build && npm run check`
Expected: pass.

Run: `npm run screenshot:check`
Expected: FAILS. Inspect `golden-baselines-diff/`: diffs must be confined to card and framed-image surfaces (Features2 grid, Pricing card, CTA box, Testimonials, the Content/Steps/Features3 images). Text, layout, spacing, colours unchanged. Anything else is a bug.

- [ ] **Step 3: Refresh golden**

Run: `npm run build && npm run screenshot`
Spot-check `golden-baselines/home/light-desktop.png` and `golden-baselines/about/light-desktop.png`: real content, card shadows now consistent.

(If Playwright unavailable: skip Steps 2-3, write `GOLDEN REFRESH PENDING: card sweep` in the report, commit the code.)

- [ ] **Step 4: Commit**

```bash
npm run fix:prettier
git add src/components/widgets golden-baselines
git commit -m "feat: normalize parts-bin card shadow and radius to tokens

The card surfaces each carried an ad hoc shadow-* / rounded-*. They now share
--aw-shadow-card and --aw-radius-card, so brand.tokens.shadow and .radius drive
elevation and rounding across the parts bin. Golden baseline refreshed.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: `/dev` preview routes

**Files:**

- Create: `src/pages/dev/tokens.astro`
- Create: `src/pages/dev/components.astro`
- Modify: `astro.config.ts` (sitemap filter)
- Modify: `scripts/init-client.mjs` (strip list)

**Interfaces:**

- Consumes: `brand` (for `tokens.astro`), the parts-bin widgets (for `components.astro`), `PageLayout`.
- Produces: routes `/dev/tokens`, `/dev/components` in the template repo only.

- [ ] **Step 1: `src/pages/dev/tokens.astro`**

A page using `~/layouts/PageLayout.astro` with `metadata={{ title: 'Design tokens', robots: { index: false, follow: false } }}`. Import `{ brand }` from `~/brand`. Render, in plain sections:

- Colour: for `brand.light` and `brand.dark`, a row of swatches (a `div` with `background` set inline to each value) labelled with the key and value.
- Fonts: three lines, each `style={"font-family: " + brand.fonts.x}`, showing the stack name and a pangram.
- The five knobs: for each, its current `brand.tokens.x` value, the resolved CSS (re-derive with the same maps as `CustomStyles.astro`, or read `getComputedStyle` client-side, simplest is to restate the maps in a small inline module), and a live sample:
  - radius: a `.btn-primary` button and a sample card `div` with `rounded-[var(--aw-radius-card)]`
  - button: three buttons showing solid/outline/ghost is not possible without changing `data-btn`, so just render one `.btn-primary` and label it with the current mode
  - section: two stacked bars `h-[var(--aw-section-py-md)] bg-primary/20` to visualize the rhythm
  - shadow: a card `div` with `shadow-[var(--aw-shadow-card)]`
  - container: a full-width ruler `div` with `max-w-[var(--aw-container-max)] mx-auto bg-primary/10 h-4`

Keep it functional, not designed. It is a dev tool.

- [ ] **Step 2: `src/pages/dev/components.astro`**

A page using `~/layouts/PageLayout.astro` with `metadata={{ title: 'Components', robots: { index: false, follow: false } }}`. Import each parts-bin widget (`Hero`, `Features`, `Features2`, `Features3`, `Steps`, `Steps2`, `Content`, `CallToAction`, `Stats`, `Testimonials`, `Pricing`, `FAQs`, `Contact`, `Brands`, `Note`, `Announcement`) and render each once with minimal representative props (copy prop shapes from `src/pages/_examples/` or `src/pages/index.astro`). Separate each with an `<h2>` naming the component. `Header` and `Footer` come from `PageLayout` already, do not import them again.

- [ ] **Step 3: sitemap filter in `astro.config.ts`**

The `sitemap({ filter: (page) => !noindexTaxonomyPaths.some(...) })` call: extend the predicate so a pathname starting with `/dev/` is also excluded. Simplest: `filter: (page) => { const p = new URL(page).pathname; return !p.startsWith('/dev/') && !noindexTaxonomyPaths.some((prefix) => p.startsWith(prefix)); }`.

- [ ] **Step 4: `init-client` strip list**

In `scripts/init-client.mjs`, the `for (const path of [ ... ])` strip loop: add `'src/pages/dev'`.

- [ ] **Step 5: Verify**

Run: `npm run build`
Expected: succeeds. `dist/dev/tokens/index.html` and `dist/dev/components/index.html` exist.

Run: `grep -c "/dev/" dist/sitemap-0.xml || true`
Expected: `0` (dev routes excluded from sitemap).

Run: `grep -o 'noindex' dist/dev/tokens/index.html | head -1`
Expected: `noindex` present.

Run: `node scripts/init-client.mjs --check`
Expected: `22/22 matches present`, exit 0 (strip-list change does not touch REPLACEMENTS).

Dry run the strip: `rm -rf /tmp/ic-dev && rsync -a --exclude=.git --exclude=node_modules --exclude=.superpowers --exclude=dist ./ /tmp/ic-dev/ && ln -s "$PWD/node_modules" /tmp/ic-dev/node_modules && cd /tmp/ic-dev && printf 'Acme\nacme.test\n\na@acme.test\nCroatia\n\nsystem\nn\n' | npm run init-client && test ! -d src/pages/dev && echo "dev stripped OK" && cd - && rm -rf /tmp/ic-dev`

Run: `npm run check`
Expected: passes.

- [ ] **Step 6: Commit**

```bash
npm run fix:prettier
git add src/pages/dev astro.config.ts scripts/init-client.mjs
git commit -m "feat: /dev/tokens and /dev/components preview routes

Render the resolved token system and every parts-bin widget for design review.
noindex, out of the sitemap, and stripped from client repos by init-client.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: ADR 0004 and full verification

**Files:**

- Create: `docs/adr/0004-design-token-contract.md`

- [ ] **Step 1: Non-default scratch verification**

```bash
rm -rf /tmp/tok && git worktree add --detach /tmp/tok HEAD && cd /tmp/tok && npm install --silent
```

Edit `src/brand.ts` `tokens` to `{ radius: 'sharp', button: 'ghost', section: 'roomy', shadow: 'hard', container: 'wide' }`. Then:

```bash
npm run build
node -e "const h=require('fs').readFileSync('dist/index.html','utf8'); ['--aw-radius-btn: 0;','--aw-section-py-md: 6rem;','--aw-shadow-card: 6px 6px 0 0','--aw-container-max: 90rem;','data-btn=\"ghost\"'].forEach(s=>console.log(h.includes(s)?'ok':'MISSING', s));"
```

Expected: all `ok`.

```bash
cd - && git worktree remove --force /tmp/tok
```

- [ ] **Step 2: All-default-explicit equals absent**

In a scratch copy, build once with the `tokens` block as-is (all defaults), save `dist/index.html`. Then comment out the entire `tokens` block, build again. Diff the two `index.html` files: the only expected difference is `data-btn="solid"` present vs `data-btn="solid"` still present (the `?? 'solid'` fallback), so effectively no diff. Confirm `--aw-*` vars are identical. Revert.

- [ ] **Step 3: Write ADR 0004**

`docs/adr/0004-design-token-contract.md`, matching the house style of `docs/adr/0001..0003` (`# 4. <sentence>`, `Date:`, `## Status`, `## Context`, `## Decision`, `## Consequences`). Status `Accepted (2026-09-05). Implemented in the same change.` Cover:

- Context: `brand.ts` exposed only colour and font, everything else structural was hardcoded in core, so two client sites could only differ by palette and typeface.
- Decision: five enum knobs (`radius`, `button`, `section`, `shadow`, `container`) in `brand.tokens`, resolved in `CustomStyles.astro` to `--aw-*` custom properties consumed by core and the parts bin via `var(x, <fallback>)`; `data-btn` on `<html>` for the button treatment; `/dev/tokens` + `/dev/components` preview routes stripped from client repos.
- The two intentional default changes: button radius `rounded-full` -> `0.375rem`, and card shadow/radius normalization across the parts bin. Both are one-time AstroWind-tell corrections, golden baseline refreshed.
- Consequences: a client build restyles structure with zero core edits; the parts bin now depends on the `--aw-radius-card` / `--aw-shadow-card` contract, so a widget ejected to `src/components/client/` keeps responding to the knobs unless the client CSS overrides; heading typography and motion are still hardcoded (deferred to later passes).

- [ ] **Step 4: Final checks and commit**

```bash
npm run check && npm run build
npm run screenshot:check   # PASS against the refreshed baseline (or note PENDING)
git add docs/adr/0004-design-token-contract.md
git commit -m "docs: ADR 0004 design token contract

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**

- Five knobs with value maps -> Task 1 (emission) + Task 2 (scalar consumers) + Task 3 (button rules) + Task 4 (card sweep). All spec tables copied into Task 1 Step 2 and referenced in 2/4.
- `CustomStyles.astro` resolver + `:root` only -> Task 1 Step 2.
- `data-btn` via `Layout.astro` (chosen option b) -> Task 1 Step 3.
- `/dev` routes, noindex, sitemap exclusion, `init-client` strip -> Task 5.
- ADR 0004 -> Task 6 Step 3.
- Verification (default golden bounded to buttons+cards; non-default visible; all-default == absent) -> Task 2 Step 4, Task 4 Step 2, Task 6 Steps 1-2.

**Placeholder scan:** Task 5 Step 1/2 describe the preview pages in prose rather than full code because they are throwaway dev tools with wide latitude and no logic to get wrong; prop shapes are pointed at existing files to copy. Acceptable. Everything with behavior (the resolver, the var emissions, the sweep targets) is literal.

**Type consistency:** `brand.tokens` shape identical in Task 1 Interfaces, Task 1 Step 1, Task 6 Step 1. Var names (`--aw-radius-btn/-card`, `--aw-section-py-sm/-md/-lg`, `--aw-shadow-card`, `--aw-container-max`) identical across Tasks 1, 2, 4, 5, 6. `data-btn` values (`solid`/`outline`/`ghost`) consistent Tasks 1, 3.

**Ordering:** Task 1 must land first (emission). Tasks 2, 3, 4 each consume Task 1 and are independent of each other, but 2 and 4 both refresh the golden baseline so run them in order (2 then 4) to keep each task's `screenshot:check` meaningful; 3 is a no-op on the baseline. Task 5 independent of 2/3/4 (needs only Task 1). Task 6 last.
