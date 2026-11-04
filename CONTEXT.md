# Context

Glossary for this repo. This is an AstroWind fork used as the base template for Dodai
client websites. Terms below have precise meanings; use them consistently in code,
commits, and docs.

## Glossary

### Template core

The files reused unchanged across every client site: `src/layouts/`, `src/utils/`,
`src/components/ui/`, `src/components/common/`, `src/components/blog/`, `vendor/`, the
`astrowind:config` virtual-module system, content collections, and build/deploy config.
Editing template core during a client build is a smell: either generalise the change back
into core, or move it to a **client component**.

The files customised for every client: `src/config.yaml`, `src/brand.ts` (colour/font
values), `src/schema.ts` (structured data), the `fonts` entry in `astro.config.ts`,
`src/navigation.ts`, `src/pages/`, `src/data/post/`, and logo/image assets.

### Brand surface

`src/brand.ts`, the single file holding per-client colours, font variables, and the
`tokens` structural knobs (radius, button, section, shadow, container).
`src/components/CustomStyles.astro` reads it and renders the `--aw-*` CSS variables.
Never put brand values anywhere else.

### `_examples/`

`src/pages/_examples/` holds the original AstroWind demo pages (`homes/`, `landing/`).
The `_` prefix means Astro does not route them. Kept as design references, not shipped.

### Parts bin

`src/components/widgets/` from upstream AstroWind. Not composed directly into client
pages as-is; treated as reference implementations to copy from when building a
**client component**. Never edited in place.

### Client component

A per-client component living in `src/components/client/`. Created by ejecting a widget
from the **parts bin** and modifying it freely, or built new. This is where all
per-client design work lands, so **template core** never drifts.

## Related docs

- [SETUP.md](./SETUP.md), the per-client build workflow (Discovery, Build, Launch)
- [AGENTS.md](./AGENTS.md), AstroWind architecture and conventions
