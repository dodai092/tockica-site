# Phase 2 cleanup pass design

## Goal

Close the four small, deferred Phase 2 gaps without expanding the template's client-build scope.

## Scope

1. Add `brand.logo.ogPath` as a separate optional filesystem-path string for the
   generated OG-card renderer. It stays separate from `logo.image`, which is an
   Astro `ImageMetadata` import used by the site UI. Its value is a project-root-relative
   raster path such as `./src/assets/images/logo.png`. An empty string keeps the
   template card logo-free.
2. Replace Inter with Noto Sans throughout the template's current font configuration:
   Astro's Fonts API entry, preload list, default `brand.fonts` variables, and the
   exact source strings that `scripts/init-client.mjs` rewrites for a system-font
   client. Commit Noto Sans Regular `.ttf` and its OFL license under `src/assets/fonts/`.
   Pass the
   font's project-root-relative path through the top-level `fonts` option of
   `OGImageRoute`, and set both card text styles to the parsed `Noto Sans` family. The
   current card uses normal weight only, so no additional weight file is needed. This
   removes the renderer's fallback network fetch.
3. Give LHCI an explicit URL list for every static template page: `/`, `/about/`,
   `/services/`, `/pricing/`, `/contact/`, `/privacy/`, `/terms/`, `/thank-you/`,
   `/dev/components/`, `/dev/og/`, and `/dev/tokens/`. Keep the current two-entry
   assertion matrix: noindex routes do not have an SEO assertion, all other listed
   routes do.
4. Set `OG_HEIGHT` in `src/utils/images.ts` to `630`, matching generated OG cards
   and the Open Graph 1200x630 convention. The existing pass-through for generated
   root-relative OG routes remains unchanged.
5. Update `SETUP.md`, the generated reinitialisation checklist in
   `scripts/init-client.mjs`, and ADR 0005 so the client workflow and architecture
   record match the completed cleanup.

## Core-change record

This is template maintenance, not a client build. It makes two minimal core edits:

- `src/brand.ts`: exposes the needed client brand input.
- `src/utils/images.ts`: corrects the shared default image height.

It also changes the template's default typeface from Inter to Noto Sans in the
configuration and client-facing brand surface. No template-core layout, widget, or
client-page behavior changes.

## Design

`src/pages/og/[...route].ts` adds `fonts: ['./src/assets/fonts/NotoSans-Regular.ttf']`
to `OGImageRoute`. Its title and description styles set `families: ['Noto Sans']`, which
matches the family parsed from the committed file. When `brand.logo.ogPath` is non-empty,
the route supplies `logo: { path: brand.logo.ogPath, size: [240] }` in
`getImageOptions`. The fixed width preserves the source aspect ratio and prevents a
large client asset from displacing the text.

`lighthouserc.cjs` supplies `collect.url` entries rather than relying on
`staticDistDir` discovery. Its matching patterns remain the authority for which
assertions apply to each route.

`astro.config.ts` registers Noto Sans under `--font-noto-sans`; `src/fonts.ts` preloads
that variable; and `src/brand.ts` points `sans`, `serif`, and `heading` at it. The
`REPLACEMENTS` entries in `scripts/init-client.mjs` use the same current literals, so
`npm run check:init` continues to guard the script's source matches. Historical ADRs,
plans, session summaries, and retrospectives retain Inter references as records of
past decisions rather than claims about the active template.

`SETUP.md` and the generated reinitialisation checklist tell clients to set
`brand.logo.image`, `brand.logo.alt`, and `brand.logo.ogPath` when they add a site
logo. ADR 0005 records these formerly deferred items as completed and keeps blog-post
OG cards deferred.

## Verification

- Inspect `astro-og-canvas`'s generated images after clearing its image cache, proving
  the local Noto Sans font is loaded without a request to `api.fontsource.org`. This check
  isolates the OG renderer from Astro's separate Fonts API behavior.
- Inspect generated OG output for 1200x630 dimensions. In a focused temporary
  verification fixture, set `brand.logo.ogPath` to a raster logo, confirm it renders
  at the bounded width, then restore the template default before committing.
- Confirm LHCI reports each of the eleven explicit URLs.
- Verify no active template source files reference `Inter` or `--font-inter`; exclude
  historical planning and retrospective records from this check.
- Run the required merge gates:
  `npm run build`, `npm run check`, `npm run test:links`, `npm run test:lhci`, and
  `npm run screenshot:check`.
- Refresh only golden baseline files that differ after the 626-to-630 Sharp crop.

## Non-goals

- Blog-post OG cards.
- A generic image-path abstraction or alternate analytics vendor.
- Changes to OG card copy, layout, or the normal site logo component.
