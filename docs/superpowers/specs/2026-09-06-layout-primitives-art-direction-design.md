# Layout primitives and the balanced baseline, Phase 3

Date: 2026-09-06

Status: design approved. Implementation requires review of this spec and the companion plan after `phase2-cleanup` merges.

## Problem

Phase 1 centralised five structural decisions in `brand.tokens`: radius, button treatment, section rhythm, card elevation, and the default container width. The contract does not reach most parts-bin widgets because they pass their own `max-w-*` value to `WidgetWrapper`, where Tailwind merge correctly makes that local value win. Reading widths, grid gaps, media widths, and horizontal gutters also remain repeated as widget-level Tailwind choices.

A client build must not edit template core. It needs a small layout vocabulary that client components can consume. The vocabulary must preserve the existing balanced presentation before the template earns any differentiated art-direction preset.

## Goal

Add a minimal reusable layout contract whose only value set is the balanced baseline. It preserves the current template's ordinary proportions.

Phase 3 deliberately does not add `brand.artDirection`. A single value is not a useful client choice, and a one-member union would create configuration churn without a visual decision. A later phase may add a closed `brand.artDirection.preset` union only when it introduces at least one approved differentiated preset with a documented value map and visual baseline.

## Decisions

### 1. Establish a balanced baseline before adding presets

`balanced` is the documented baseline, not a `brand.ts` selector. A later preset must be a real compositional alternative, not a synonym for default values.

No future preset may control palette or typeface. `brand.light`, `brand.dark`, and `brand.fonts` remain direct client choices. The five Phase 1 token enums retain their meanings and precedence. A future preset may supply layout-role variables only. It must never silently change a client's radius, button, section, shadow, or container selection.

### 2. Use semantic layout roles

The reusable contract has four roles. They replace repeated width, gap, and gutter choices only where the existing component is using that role. They do not turn every Tailwind value into a token.

| Role | Resolved custom property | Balanced value | Use |
| --- | --- | --- | --- |
| page | `--aw-layout-page-max` | `var(--aw-container-max)` | Full page-band and multi-column section shell |
| reading | `--aw-layout-reading-max` | `48rem` | Prose, centred section headings, FAQs, form-adjacent copy |
| media | `--aw-layout-media-max` | `64rem` | Hero images, image-led content, controlled media breakout |
| grid gap | `--aw-layout-grid-gap` | `2rem` | Standard card, proof, and service grids |

Horizontal padding for the copied hero and note components remains their established `px-4 sm:px-6` gutter. It is a fixed shared `layout-gutter` utility, not a fifth configurable layout role. `WidgetWrapper` keeps its existing `px-4 md:px-6` behaviour and is outside this migration. Vertical band spacing remains exclusively Phase 1's `section` token.

The page role delegates its maximum width to Phase 1's `container` token. This avoids a competing global-width knob. The reading and media roles are intentionally fixed at the balanced baseline because they describe content composition rather than general site scale.

### 3. Keep the contract at the CSS-variable seam

`src/components/CustomStyles.astro` emits the four balanced layout-role variables on `:root`, beside the existing `--aw-*` variables. It does not read a new brand configuration field in Phase 3.

`src/assets/styles/tailwind.css` exposes concise layout utilities that consume those variables. Components use a semantic utility or shared client primitive instead of locally selecting `max-w-3xl`, `max-w-5xl`, `max-w-7xl`, `gap-8`, or the standard horizontal gutter for the same role.

The resolver must emit all four properties unconditionally. The values become the later preset seam without making the Phase 3 default depend on a new `brand.ts` field.

### 4. Client components own composition

Template core may provide the resolver and generic layout utilities during template maintenance. Client builds compose those utilities only from `src/components/client/` and client pages.

`tailwind.css` supplies the primitive utilities. Client-layer copies of the starter-page widgets own their composition and use the page, reading, media, grid-gap, and gutter primitives. They keep the existing widget props and slots, and accept class overrides only where the copied widget already accepts them. A bespoke section can use an explicit class override in the client layer, which is the documented escape hatch rather than a new brand token.

The migration targets are exact: copy `Hero`, `HeroText`, `Note`, `Features`, `Features2`, `Features3`, `Steps`, `Steps2`, `Content`, `Testimonials`, `FAQs`, `CallToAction`, and `Pricing` from `src/components/widgets/` to `src/components/client/`. The five starter pages then import these client-layer copies. `ContactForm` is already a client component and is not copied. The copies retain balanced markup and behaviour before replacing only role-equivalent width, gap, and gutter classes. No client build composes a widget directly from `src/components/widgets/`.

### 5. Default appearance is the regression baseline

The layout contract resolves to the existing ordinary values:

- page shell follows the current Phase 1 container selection, which is `normal` by default
- reading measure remains the common `max-w-3xl` value
- media measure remains the common `max-w-5xl` value
- standard grid gap remains `gap-8`
- copied hero and note gutters remain `px-4 sm:px-6`
- vertical section padding remains Phase 1 `section: 'normal'`

The Phase 3 change must not alter colour, fonts, buttons, radii, shadows, header behaviour, form semantics, OG generation, or starter-page copy.

## File boundaries

| Area | Phase 3 responsibility |
| --- | --- |
| `src/brand.ts` | No Phase 3 change. It retains ownership of the Phase 1 token contract. |
| `src/components/CustomStyles.astro` | Emit the four balanced layout-role variables. |
| `src/assets/styles/tailwind.css` | Define the generic layout utilities that read the variables. No client-specific styling. |
| `src/components/client/` | Own copies of the 13 named starter-page widgets and their layout-role composition. |
| `src/pages/` | Replace the 13 parts-bin imports with the matching client-layer copies. |
| `src/components/widgets/` | Unchanged reference implementations. |

Out of bounds: `src/layouts/`, `src/utils/`, `src/components/common/`, `src/components/ui/`, `src/components/blog/`, `vendor/`, and the configuration system. A client build does not edit them. The template implementation may not add a second configuration surface outside `src/brand.ts`.

## Non-goals

- `brand.artDirection`, `editorial`, `commercial`, or any other selectable preset
- palette, font, type-scale, letter-spacing, leading, or motion presets
- raw brand controls for every width, gap, margin, breakpoint, or grid column count
- a layout builder, per-page JSON configuration, or a CMS
- changing the Phase 1 five-token maps or their precedence
- rebuilding every existing widget or example page
- changes to Phase 2 content collections, forms, thank-you flow, OG route, sitemap rules, or Lighthouse matrix

## Merge and sequencing risk

`phase2-cleanup` is in progress. Phase 3 planning may proceed now, but implementation must start only after that branch has merged into `main`, as agreed. This plan no longer changes `src/brand.ts`, but it must still begin from the cleanup's final starter pages and test suite.

Before implementation, rebase or create the Phase 3 implementation branch from the post-merge `main`, then inspect the final `src/components/CustomStyles.astro`, all five starter pages, and Phase 2 tests. Do not copy changes from, modify, or merge the `phase2-cleanup` worktree directly. The likely conflict zone is the starter-page imports and markup; `CustomStyles.astro` is a secondary risk if cleanup adjusts token resolution.

## Verification gates

1. Type and formatter gate: `npm run check` passes with no `brand.ts` change.
2. Build gate: `npm run build` passes. Then run `npm run test:links` and `npm run test:lhci` against that build.
3. Resolver values: capture the computed four layout variables. They must equal the specified balanced values and the page role must resolve through the current `--aw-container-max` value.
4. Visual regression: run `npm run screenshot:check` after the build. It must report no visual diff from the committed baseline. Do not refresh the baseline for this migration. Check homepage, all five starter pages, `/dev/tokens`, `/dev/components`, blog list and post when enabled, light mode, dark mode, desktop, and mobile menu.
5. Browser layout pass: confirm a page shell, reading block, media block, and grid each render at their specified balanced value at mobile and desktop widths. Confirm no horizontal overflow.
6. Boundary review: verify changed client composition comes from `src/components/client/`; template core boundaries remain untouched by any client-build task.
7. Phase 2 regression: submit the starter contact form, inspect `/thank-you/`, and open a generated per-page OG image. These are smoke checks because Phase 3 must not alter their code paths.

## Success criteria

- `brand.ts` remains unchanged and continues to own the Phase 1 token contract.
- `balanced` is a documented, visual-regression-tested baseline rather than a misleading one-value selector.
- Four layout roles and one fixed gutter utility remove the repeated role-equivalent width, gap, and gutter choices from the 13 named client-layer widget copies.
- Phase 1 keeps ownership of global container scale and vertical section rhythm.
- Client components can select the layout roles without core edits during a client build.
- Default visual output has no intentional change.
- Implementation begins only after `phase2-cleanup` is merged and the verification gates are runnable from the resulting `main`.
