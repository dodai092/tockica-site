# 5. Starter content, a forms pattern, and per-page OG images

Date: 2026-09-06

## Status

Accepted (2026-09-06). Implemented across the Phase 2 SDD run.

## Context

Four gaps sat in the same seam: what a client build starts from and how content
reaches a page.

- `src/pages/{index,about,services,pricing,contact}.astro` shipped AstroWind
  marketing copy: Lorem Ipsum, "Beautiful Website Templates", a fake Miami
  address, Unsplash hero URLs. Every build deleted it by hand.
- `src/components/ui/Form.astro` rendered a bare `<form>` with no action, no
  submit handling, no success page, and no provider wired anywhere. The B4
  compliance check (consent checkbox plus styled success page) had nothing to
  check against.
- `src/config.yaml` pointed every page at one `src/assets/images/default.png`, so
  every shared link from a client site looked identical.
- Only the `post` collection existed. Services, team bios, testimonials, and FAQs
  were object literals inside `.astro` files, so client copy had no traceable
  location for the "every fact traces to a named source" build rule.

Phases 3 and 4 (layout primitives, art-direction presets, the design and perf
gates, per-client visual regression, event taxonomy) are separate and remain
conversation-only.

## Decision

### 1. Four optional content collections

`src/content.config.ts` gains four `file()`-loader collections, each backed by a
single YAML file in `src/content/`:

This is a deliberate deviation from the Part 1 spec, which described a `glob`
loader over `src/content/<name>/` directories of seed files. One YAML file per
collection is simpler: emptying one file to `[]` beats clearing a directory.

- `services`: `title`, `summary`, `icon?`, `order?`
- `team`: `name`, `role`, `bio?`, `image?`, `order?`
- `testimonials`: `quote`, `name`, `role?`, `company?`, `image?`
- `faqs`: `question`, `answer`, `order?`

Optional by design. `astro check` is green with each file populated with seeds and
again with each set to `[]`. A build that keeps its copy inline is not forced to
adopt them; a build that uses them gets types and schema validation. Each file
ships with 2-3 neutral seed entries (industry-free copy). `init-client` leaves the
seeds in place and `docs/reinit-checklist.md` carries a line to replace or empty
them.

Page-section content beyond these four kinds stays inline. A bespoke-per-client
build is not a CMS, and a collection for page-level copy is explicitly out of
scope.

### 2. Neutral starter pages

The five marketing pages are rewritten to short neutral copy. Every block a build
must revisit carries a visible `REPLACE:` marker and an `<!-- REPLACE ... -->`
comment pointing at `docs/intake.md`. The widget composition per page is kept as
the reference layout. The `services`, `testimonials`, `team`, and `faqs` sections
render from their collections and each still renders correctly when its collection
is empty (the section is omitted, except the services grid which falls back to one
placeholder item).

Unsplash hero URLs are replaced by a local `src/assets/images/placeholder-hero.svg`.
This template disables SVG processing and the parts-bin widgets hardcode
`format="webp"`, so the SVG is passed to the widgets as an inline `<img>` string
through their existing `typeof image === 'string'` branch rather than as an
`image={{ src, alt }}` object. This is a client-layer workaround, not a core
change.

Old page versions are not moved to `_examples/`. Git history is the record, and
the AstroWind `_examples/homes` and `_examples/landing` demos still cover "show me
a full page".

### 3. Forms pattern

`src/components/client/ContactForm.astro` is the reference implementation: Netlify
Forms (`data-netlify`, `netlify-honeypot`, hidden `bot-field` and `form-name`),
name / email / message fields, a required privacy-consent checkbox linking to
`/privacy`, and `action="/thank-you/"`. It is styled by copying the parts-bin
`Contact` / `Form` markup, including the `--aw-radius-card` / `--aw-shadow-card`
token classes, not by importing core. `src/pages/thank-you.astro` is a styled
`noindex` success page. `contact.astro` renders `ContactForm` so Netlify's
build-time HTML scan detects the form out of the box.

The template does not ship `public/__forms.html`. `docs/forms.md` documents it as
a manual add only for forms that render solely behind interaction. `docs/forms.md`
carries the full pattern: the detection caveat, spam handling (honeypot ships,
reCAPTCHA opt-in), non-Netlify provider swaps, and the two B4 hard requirements.
`SETUP.md` B3 and B4 cross-reference it.

Core `src/components/ui/Form.astro` and `src/components/widgets/Contact.astro` are
not touched. The forms pattern stays entirely in `src/components/client/` and
`src/pages/`.

### 4. Per-page OG images

`astro-og-canvas` (0.13.x) is added as a dependency. `src/pages/og/[...route].ts`
uses `OGImageRoute` to generate a branded 1200x630 card per static marketing page,
from an explicit manifest (`home`, `about`, `services`, `pricing`, `contact`,
`thank-you`), each supplying a title and description. `getImageOptions` reads
`brand.light.*` colours (card background, primary border strip, heading and muted
text), uses the local Noto Sans asset at `src/assets/fonts/NotoSans-Regular.ttf`,
and includes the optional raster logo configured by `brand.logo.ogPath`, a
project-root-relative path. Each page sets `metadata.openGraph.images` to its
`/og/<key>.png`.
`src/assets/images/default.png` stays as the site-wide fallback for any page not
in the manifest. `astro.config.ts` is not touched; the endpoint form needs no
integration line in this version.

Core `src/utils/images.ts` `adaptOpenGraphImages` gained a guard: a root-relative
URL that does not resolve to a `src/assets/images` file (a generated route, or any
`public/` image) is passed through as an absolute URL prefixed with `Astro.site`,
keeping its declared width and height, instead of being fed to Sharp `getImage`.
Without the guard the declared 630 height was silently replaced by the
`OG_HEIGHT` fallback constant. This is a scoped generalization of an existing
limitation; the `~/assets/images` path, including `default.png`, is unaffected.

The formerly deferred card inputs are now implemented:

- `brand.logo.ogPath` supplies an optional raster logo from a project-root-relative
  filesystem path, while `brand.logo.image` remains the imported UI logo.
- The card uses the committed local Noto Sans asset, so the OG renderer does not
  fetch a font at build time.

One deferral remains:

- Blog-post OG images are deferred. The blog is off by default and per-post cards
  would need a change in the core `[...blog]` layout.

### 5. LHCI matrix

`lighthouserc.cjs` is converted from `assert.assertions` to `assert.assertMatrix`
with two non-overlapping entries so the `categories:seo` gate is dropped for the
`noindex` routes (`/dev/*`, `/thank-you/`) and kept for the marketing pages. This
also cleared a pre-existing red gate on the `/dev/` pages.

## Consequences

- A client build has a neutral but real starting point for the five content pages,
  a copy-and-wire forms pattern that satisfies B4, per-page branded OG images at
  build, and typed collections for structured copy. Defaults stay coherent and
  nothing forces a build to adopt the collections.
- `src/content.config.ts` and `src/utils/images.ts` are now core surfaces this
  phase edited. The `images.ts` guard is load-bearing for every generated-route or
  `public/` OG image; a future change there must preserve the pass-through.
- The OG card uses the committed local Noto Sans asset and optional configured raster
  logo, so the renderer does not need a build-time font fetch and can include the
  client logo when `brand.logo.ogPath` is set.
- `init-client` strips `src/pages/dev/` (including the `/dev/og` preview) and
  `docs/superpowers/`, so the preview route and planning docs never ship.
- The four collections cover services, team, testimonials, and FAQs only. Any
  other structured section stays an inline literal until a later phase decides
  otherwise.
