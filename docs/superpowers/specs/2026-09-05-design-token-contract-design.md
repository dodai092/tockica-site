# Design token contract (improvements program, Phase 1)

Date: 2026-09-05
Status: design approved, spec for review.
Context: `docs/superpowers/specs/2026-09-05-improvements-program.md` is not written; this is
the first phase of the improvements program discussed after Gap C. Phase 1 is the design
token foundation. Phases 2-4 (starter/forms/content, layout range, gates/process) are
separate and not covered here.

## Problem

`src/brand.ts` is the single per-client surface and it exposes only colours (7) and fonts
(3). Everything else that makes a site look like a specific brand (corner radius, button
treatment, vertical rhythm, elevation, content width) is hardcoded in template core:
`src/assets/styles/tailwind.css` (`@utility btn` uses `rounded-full border-gray-400`),
`src/components/ui/WidgetWrapper.astro` (`py-12 md:py-16 lg:py-20`, `max-w-7xl`), the
parts-bin card widgets (each a different `shadow-*` and `rounded-*`). Two clients built
from this template diverge on colour and font and are otherwise structurally identical.
A per-client build cannot change any of it without editing core, which the build rules
forbid.

## Goal

Add a small, closed set of design knobs to `brand.ts` that flow through the existing
`--aw-*` custom-property seam and drive core, so two client builds can look genuinely
different with zero core edits. Defaults reproduce today's rendering exactly.

## Scope

Five knobs. Enums, not raw values, so a build cannot produce an incoherent in-between.

```ts
// src/brand.ts  (added to the existing `brand` object)
tokens: {
  radius: 'sharp' | 'soft' | 'round' | 'pill',   // default 'soft'
  button: 'solid' | 'outline' | 'ghost',         // default 'solid'
  section: 'tight' | 'normal' | 'roomy',         // default 'normal'
  shadow: 'none' | 'soft' | 'hard',              // default 'soft'
  container: 'narrow' | 'normal' | 'wide',       // default 'normal'
}
```

Deferred to their own later passes, not in Phase 1:

- heading tracking / leading and a full type scale (widest blast radius: every headline
  component in the parts bin and blog core; least payoff per unit churn)
- motion dial (touches the intersect-animation utility and every animated section)

Not in scope: any layout primitive, any new component, `_examples/` pages.

## The five knobs: value maps and targets

`CustomStyles.astro` resolves each enum to CSS and emits it. All `var()` reads carry the
current hardcoded value as the fallback, so a missing token = today's look.

### 1. `radius`

Emits two vars (buttons want a tighter radius than cards at the same "feel"):

| enum           | `--aw-radius-btn` | `--aw-radius-card` |
| -------------- | ----------------- | ------------------ |
| sharp          | `0`               | `0`                |
| soft (default) | `0.375rem`        | `0.5rem`           |
| round          | `0.625rem`        | `0.75rem`          |
| pill           | `9999px`          | `1rem`             |

Note: today's `btn` utility is `rounded-full` (= `9999px`), NOT `0.375rem`. Default
`soft` therefore changes button radius. Decision: this is an intentional, one-time default
correction (`rounded-full` buttons are an AstroWind tell). The golden baseline is
refreshed in the same commit and the change is called out in the ADR. If the reviewer or
Antun wants byte-identical instead, set the `soft` row's `--aw-radius-btn` to `9999px`;
flagged here as the one place the "defaults reproduce today exactly" rule is knowingly
broken.

Targets:

- `src/assets/styles/tailwind.css`: `@utility btn` `rounded-full` -> `rounded-[var(--aw-radius-btn,9999px)]`
- `src/components/ui/Form.astro` (3 input rows): `rounded-lg` -> `rounded-[var(--aw-radius-card,0.5rem)]`
- Parts-bin card widgets swept in knob 4 also take `--aw-radius-card` on the same lines.

### 2. `button`

The primary action treatment. `CustomStyles.astro` sets `data-btn="<value>"` on `<html>`.
`tailwind.css` carries three rule blocks scoped to `[data-btn=...] .btn-primary`:

- `solid` (default): current `btn-primary` (filled `bg-primary text-white`).
- `outline`: transparent bg, `border-primary text-primary`, fill on hover.
- `ghost`: no border, no bg, `text-primary`, faint `bg-primary/10` on hover.

`btn` / `btn-secondary` / `btn-tertiary` unchanged. Only `btn-primary` responds.

Target: `src/assets/styles/tailwind.css` only.

### 3. `section`

Vertical padding of every page band (`WidgetWrapper`). Emits `--aw-section-py-sm/-md/-lg`:

| enum             | sm (mobile)      | md               | lg (desktop)     |
| ---------------- | ---------------- | ---------------- | ---------------- |
| tight            | `2.5rem`         | `3rem`           | `3.5rem`         |
| normal (default) | `3rem` (`py-12`) | `4rem` (`py-16`) | `5rem` (`py-20`) |
| roomy            | `4rem`           | `6rem`           | `8rem`           |

Target: `src/components/ui/WidgetWrapper.astro`: the container `div`'s
`py-12 md:py-16 lg:py-20` -> `py-[var(--aw-section-py-sm,3rem)] md:py-[var(--aw-section-py-md,4rem)] lg:py-[var(--aw-section-py-lg,5rem)]`.

### 4. `shadow`

The card elevation language. Emits `--aw-shadow-card`:

| enum           | value                          |
| -------------- | ------------------------------ |
| none           | `0 0 #0000`                    |
| soft (default) | `0 4px 30px rgb(0 0 0 / 0.08)` |
| hard           | `6px 6px 0 0 rgb(0 0 0 / 0.9)` |

Correctness fix (post-review): `none` maps to `0 0 #0000` (what Tailwind's own
`shadow-none` emits), not the literal `none`. `none` inside Tailwind v4's comma-composed
`box-shadow` list is invalid and drops the whole declaration by accident.

Targets (parts-bin card surfaces, swept to `shadow-[var(--aw-shadow-card,...)]` and
`rounded-[var(--aw-radius-card,...)]` in one pass): `Features2.astro`, `Pricing.astro`,
`Contact.astro`, `CallToAction.astro`, `Testimonials.astro`, `Content.astro` (the image),
`Steps.astro` (the image), `Features3.astro` (the image). Each currently carries its own
ad hoc `shadow-*` / `rounded-*`; after the sweep they share the two vars. Avatar / icon
`rounded-full` circles and the `Header` dropdown are NOT swept (not cards).

`dark:shadow-none` overrides on these components are kept as-is.

### 5. `container`

Max content width. Emits `--aw-container-max`:

| enum             | value                 |
| ---------------- | --------------------- |
| narrow           | `60rem`               |
| normal (default) | `80rem` (`max-w-7xl`) |
| wide             | `90rem`               |

Target: `src/components/ui/WidgetWrapper.astro`: `max-w-7xl` ->
`max-w-[var(--aw-container-max,80rem)]`.

## `CustomStyles.astro` changes

Today it builds a `css` string from `brand.light` / `brand.dark` / `brand.fonts` and
renders `<style is:inline set:html={css}>`. Add:

1. A `tokens` resolver: a plain object literal per knob mapping enum -> the value(s)
   above. `const t = brand.tokens ?? {}` with per-key `?? 'default'` so an old
   `brand.ts` without a `tokens` block still works (belt-and-braces with the `var()`
   fallbacks).
2. Append the resolved vars to the `:root` block of `css` (they are theme-independent, so
   not duplicated into `.dark`).
3. Emit the `data-btn` attribute. `CustomStyles.astro` renders in `<head>` and cannot set
   an attribute on the already-open `<html>`. Options:
   - a. a tiny inline script `document.documentElement.dataset.btn = '<value>'` (runs
     before paint, no flash for a static value; but adds a script).
   - b. `Layout.astro` reads `brand.tokens?.button` and puts `data-btn` on `<html>`
     directly (one line in core, no script). **Chosen.** `Layout.astro` already imports
     from `~/fonts` and `astrowind:config`; adding `import { brand } from '~/brand'` and
     `data-btn={brand.tokens?.button ?? 'solid'}` on the `<html>` tag is minimal and
     flash-free.

## `dev` preview routes

Astro excludes `src/pages/` dirs and files prefixed with `_` from routing entirely (that
is how `src/pages/_examples/` is kept as source-only reference). So the preview pages
cannot live under `_dev/` and still be viewable. Instead:

- `src/pages/dev/tokens.astro` — renders the resolved token set: colour swatches (light
  and dark), the three font stacks in situ, and each of the five knobs showing its
  current enum value, the CSS it resolves to, and a live example (a button, a card, a
  section spacer, a container-width ruler). Pulls from `brand` directly.
- `src/pages/dev/components.astro` — imports every parts-bin widget once with minimal
  representative props, so a restyle and the Phase 4 design gate have a single page to
  scan. Uses `PageLayout` so header and footer show too.
- Both are `noindex` (via the layout `metadata` prop) and excluded from the sitemap
  (add a static `/dev/` prefix check to the `astro.config.ts` sitemap `filter`).
- **`init-client` strips `src/pages/dev/`** in client repos, added to the existing strip
  list next to `golden-baselines/`, `docs/superpowers/`, etc. These are template-
  development tools; a client deploy never contains them, so there is no production
  concern. In the template repo they are live at `/dev/tokens` and `/dev/components`
  during `npm run dev`.
- Static pages, no build-time or runtime cost beyond their own HTML. They are not added
  to `golden-baselines/routes.json` (Phase 4 can if wanted).

## Core files touched (ADR 0004)

- `src/assets/styles/tailwind.css` — `@utility btn` radius; three `[data-btn]` rule
  blocks for `btn-primary`.
- `src/components/CustomStyles.astro` — token resolver, emit vars.
- `src/components/ui/WidgetWrapper.astro` — section padding + container width vars.
- `src/components/ui/Form.astro` — input radius var.
- `src/layouts/Layout.astro` — `data-btn` on `<html>`.
- `src/components/widgets/{Features2,Features3,Pricing,Contact,CallToAction,Testimonials,Content,Steps}.astro`
  — card radius + shadow var sweep (parts bin; edited in the template, as the parts bin
  is meant to be).

Client layer: `src/brand.ts` (the `tokens` block + JSDoc), `scripts/init-client.mjs`
(add `src/pages/dev` to the strip list), `astro.config.ts` (sitemap `filter` excludes
`/dev/`), `src/pages/dev/{tokens,components}.astro` (new).

## Verification

- `npm run check` + `npm run build` green.
- `npm run screenshot` refreshed and committed. The diff vs the prior baseline at default
  tokens is limited to two documented one-time corrections and nothing else:
  1. button radius `rounded-full` -> `0.375rem` (`soft`);
  2. card shadow and radius normalized: the parts-bin cards today each carry an ad hoc
     `shadow-*` / `rounded-*` (`shadow-xl`, `shadow`, `shadow-[0_4px_30px...]`, `rounded-md/lg/xl`);
     the sweep unifies them to the `soft` shadow (`0 4px 30px rgb(0 0 0 / 0.08)`) and
     `--aw-radius-card` (`0.5rem`). This is the point of a shadow-language knob.
     Spot-check `golden-baselines/home/light-desktop.png` shows real content. Any diff
     outside cards and buttons is a bug.
- Scratch check in a throwaway `git worktree`: set `tokens` to
  `{ radius: 'sharp', button: 'ghost', section: 'roomy', shadow: 'hard', container: 'wide' }`,
  `npm run build`, open `/dev/tokens` and `/dev/components`, confirm every knob is
  visibly reflected on the demo pages; revert.
- Set `tokens` to all defaults explicitly, confirm render matches an implicit/absent
  `tokens` block (the `?? default` path).
- ADR 0004 committed.

## Success criteria

- `brand.ts` has a `tokens` block with the five enums, each documented.
- `/dev/tokens` and `/dev/components` render, are noindex and out of the sitemap, and init-client strips them.
- With `tokens` absent or all-default, the golden baseline diff is limited to the two
  documented corrections above (button radius; card shadow/radius normalization), all
  within button and card surfaces.
- Each knob at a non-default value visibly changes the demo pages and is shown on
  `/dev/tokens`.
- No `brand.ts`-only consumer regresses (colours, fonts unchanged).
- ADR 0004 records the five knobs, the `--aw-*` var names, the `data-btn` mechanism, and
  the one intentional default change.
