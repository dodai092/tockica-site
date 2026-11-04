# AstroWind Agent Instructions

## Project Overview

This repo is the **Dodai website template**, a fork of AstroWind: a static website
template built with **Astro v7** and **Tailwind CSS v4**, optimized for performance, SEO,
and accessibility.

**Stack:** Astro v7 | Tailwind CSS v4 | TypeScript 5.9 | MDX | Sharp

## Dodai template rules

Read [CONTEXT.md](./CONTEXT.md) for the exact meaning of the terms below,
[SETUP.md](./SETUP.md) for the per-client build workflow (one workflow: Discovery, Build, Launch),
[docs/client-build-rules.md](./docs/client-build-rules.md) before writing a client plan
or reviewing a client branch, and [docs/quality-gates.md](./docs/quality-gates.md) for the
canonical client quality-gate policy (gate order, thresholds, route coverage, review rubric).

- **Template core** is never edited during a client build: `src/layouts/`, `src/utils/`,
  `src/components/{ui,common,blog}/`, `vendor/`, the config system.
- `src/components/widgets/` is a **parts bin**. Copy from it into `src/components/client/`
  and modify there. Never edit a widget in place; never compose one directly into a
  client page.
- All per-client design work lives in `src/components/client/`.
- Site-wide client embeds (cookie banner, chat widget, pixels) go in
  `src/components/client/GlobalEmbeds.astro`, which core `Layout.astro` renders once at
  the end of `<body>`. Do not add global mounts to `src/layouts/`.
- The blog is off by default (`apps.blog.isEnabled: false`). Turn it on per client.
- Full AstroWind demo pages are kept in `src/pages/_examples/` (not routed) for reference.
- Default deploy target is Netlify. Other targets live in `deploy/`.
- Brand colors, fonts, and structural tokens: edit `src/brand.ts` only.

## Quick Reference

| Command           | Purpose                             |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start dev server at localhost:4321  |
| `npm run build`   | Production build to `./dist/`       |
| `npm run preview` | Preview production build locally    |
| `npm run check`   | Run astro check + ESLint + Prettier |
| `npm run fix`     | Auto-fix ESLint + Prettier issues   |

**Node.js requirement:** >= 22.22.3 (matches `package.json` `engines`)

## Architecture

### Directory Structure

```
src/
  assets/styles/tailwind.css   # Tailwind v4 config (themes, utilities, plugins)
  components/
    common/        # CORE. Shared: Image, Metadata, Analytics, ToggleTheme
    ui/            # CORE. Primitives: Button, Form, Headline, Timeline, WidgetWrapper
    widgets/       # PARTS BIN. Copy from here into client/, never edit or use directly
    client/        # Per-client components (this is where client design work goes)
    blog/          # CORE. Blog: SinglePost, List, Pagination, Tags
    CustomStyles.astro  # CORE. Renders brand CSS variables (values live in src/brand.ts)
  brand.ts             # Per-client brand surface: colors + fonts + tokens (structural knobs)
  schema.ts            # Per-client structured data (Organization / LocalBusiness)
  content.config.ts    # CORE. Content Collections schema
  data/post/           # Blog posts (.md, .mdx)
  layouts/             # CORE. Layout.astro, PageLayout.astro, MarkdownLayout.astro
  pages/               # File-based routing (_examples/ = AstroWind demos, not routed)
  utils/               # CORE. blog.ts, images.ts, permalinks.ts, frontmatter.ts
  config.yaml          # Site configuration (loaded as virtual module)
  navigation.ts        # Per-client navigation structure
  types.d.ts           # TypeScript type definitions
vendor/integration/    # Custom Astro integration for config loading
```

### Path Aliases

Use `~/` to import from `src/`:

```typescript
import Image from '~/components/common/Image.astro';
import { SITE } from 'astrowind:config';
```

### Configuration System

Site config lives in `src/config.yaml` and is loaded as a Vite virtual module `astrowind:config` by the custom integration in `vendor/integration/`. Exports: `SITE`, `I18N`, `METADATA`, `APP_BLOG`, `UI`, `ANALYTICS`.

## Tailwind CSS v4

Configuration is CSS-first in `src/assets/styles/tailwind.css`:

- **Theme tokens:** `@theme { --color-primary: var(--aw-color-primary); ... }`
- **Custom utilities:** `@utility bg-page { ... }`
- **Dark mode:** Class-based via `@variant dark (&:where(.dark, .dark *))`
- **Plugins:** `@plugin "@tailwindcss/typography"`
- **Custom variant:** `@custom-variant intersect (&:not([no-intersect]))`

Brand color/font values live in `src/brand.ts` (light/dark), along with the `tokens` structural knobs (radius, button, section, shadow, container). `src/components/CustomStyles.astro` reads that file and renders the `--aw-*` CSS variables. Edit `src/brand.ts`, not the component.

The Vite plugin `@tailwindcss/vite` is configured in `astro.config.ts` (not as an Astro integration).

### Class Merging

Components use `twMerge` from `tailwind-merge` v3 for conditional class composition.

## Content Collections

Defined in `src/content.config.ts` using Astro's Content Layer API with `glob()` loader. Posts are in `src/data/post/` as `.md` or `.mdx` files.

Post frontmatter: `title` (required), `publishDate`, `updateDate`, `draft`, `excerpt`, `image`, `category`, `tags`, `author`, `metadata`.

## Component Patterns

- Props extend interfaces from `~/types`
- Use `class:list` for conditional classes
- Use `twMerge()` when accepting className overrides
- Use named slots for layout composition
- Widget components accept standardized props (see `~/types`)

## Image Handling

`src/components/common/Image.astro` supports:

- Local images via `astro:assets` (optimized by Sharp)
- Remote images via Unpic CDN
- Allowed domains (for providers Unpic can't detect, processed by Sharp): `cdn.pixabay.com`

Hero images use `loading="eager"` and `fetchpriority="high"`.

## Fonts

Fonts are handled by Astro's native **Fonts API**, configured in `astro.config.ts` under the `fonts` key (provider, family, `cssVariable`) and injected via the `<Font />` component in `src/layouts/Layout.astro`. Astro self-hosts, subsets, preloads, and generates metric-adjusted fallbacks. To change the typeface, edit the `fonts` entry in `astro.config.ts` and point `brand.fonts.*` in `src/brand.ts` at the new `cssVariable`.

## Third-party Scripts (Partytown)

`@astrojs/partytown` is wired as an **opt-in** in `astro.config.ts`, gated behind `const hasExternalScripts = false`. Set it to `true` to offload third-party scripts (e.g. Google Analytics via `analytics.vendors.googleAnalytics.partytown`) to a web worker. It is disabled by default so the base template ships no external scripts.

## Content Security Policy

Astro's native CSP is intentionally **not** enabled in this version: it is incompatible with `<ClientRouter />` view transitions (shipped on by default) and would break the arbitrary third-party scripts a template user typically adds. CSP is deferred to AstroWind v2, where the component model (and optional SSR) make it clean and opt-in.

## Verification Checklist

After changes, always verify:

1. `npm run build` succeeds
2. `npm run check` passes (astro check + ESLint + Prettier)
3. `npm run test:links` passes (run after a build)
4. `npm run test:lhci` passes (run after a build; a11y = 100, SEO / best-practices >= 95)
5. Visual check in browser: homepage, blog, dark mode, mobile menu
