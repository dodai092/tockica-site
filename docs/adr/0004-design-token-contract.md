# 4. A five-knob design token contract in brand.ts drives structural style

Date: 2026-09-05

## Status

Accepted (2026-09-05). Implemented in the same change.

## Context

`src/brand.ts` was the single per-client brand surface, but it only exposed colour
(`light.*`, `dark.*`) and font family (`fonts.*`). Everything else that gives a site its
visual character was hardcoded in template core: button corner radius in `tailwind.css`,
section vertical rhythm in `WidgetWrapper.astro`, input radius in `Form.astro`, card
elevation and rounding across the parts-bin card widgets, and the content container
width. Two client sites built from this template could therefore differ only by palette
and typeface. Any real structural change meant editing core, which the `CLAUDE.md` hard
rule forbids during a client build.

## Decision

1. **Five enum knobs in `brand.tokens`**: `radius`, `button`, `section`, `shadow`,
   `container`. Enums only, each with a fixed value map, so a build cannot produce an
   incoherent in-between state.

2. **Resolved in `CustomStyles.astro`**: the component maps each knob to `--aw-*` custom
   properties emitted on `:root` (`--aw-radius-btn`, `--aw-radius-card`,
   `--aw-section-py-sm/-md/-lg`, `--aw-shadow-card`, `--aw-container-max`). Core consumers
   (`tailwind.css`, `WidgetWrapper.astro`, `Form.astro`) and the parts-bin card widgets
   read them through the Tailwind v4 `(--var)` shorthand with no fallback. That is safe
   because `CustomStyles.astro` emits all seven `--aw-*` properties unconditionally on
   `:root` with defaults already resolved in the frontmatter, so the variable is never
   absent in a page that renders `Layout.astro`.

   The `tokens` block and every key in it are optional. `src/brand.ts` exports a
   `BrandTokens` type with all-optional keys and writes the literal as
   `tokens: { ... } satisfies BrandTokens`, so a client can delete the block or any key
   and `astro check` stays green, gets autocomplete on the enums, and sees a typo like
   `radius: 'sofft'` flagged on the line they edited rather than deep in core. The
   resolver's `brand.tokens ?? {}` and per-knob `?? '<default>'` guards handle the
   omitted keys, so an absent block produces the same output as spelling out every
   default.

3. **`data-btn` on `<html>`**: the button treatment cannot be expressed as a single
   custom property, so `Layout.astro` sets `data-btn={brand.tokens?.button ?? 'solid'}`
   and `tailwind.css` carries the `solid` / `outline` / `ghost` rules keyed off that
   attribute.

4. **Preview routes**: `/dev/tokens` and `/dev/components` render the resolved system for
   review during a build. `scripts/init-client.mjs` strips `src/pages/dev/` from a client
   repo, so these never ship.

### Two intentional default changes

Landing this contract corrected two AstroWind tells in the default output, both one-time
and both folded into the golden baseline:

- **Button radius**: the default primary button was `rounded-full` (`9999px`). The `soft`
  radius default now resolves `--aw-radius-btn` to `0.375rem`, a conventional control
  radius.
- **Card shadow and radius**: the parts-bin card widgets used ad hoc shadow and rounding
  values. They now all read `--aw-radius-card` and `--aw-shadow-card`, normalizing the
  parts bin onto the same contract.

The golden baseline was refreshed to capture both.

## Consequences

- A client build restyles structure (corner language, section rhythm, card elevation,
  container width, button treatment) by editing `brand.tokens` alone, with zero core
  edits.
- The parts-bin card widgets now depend on the `--aw-radius-card` / `--aw-shadow-card`
  contract. A widget ejected to `src/components/client/` keeps responding to the knobs
  unless the client CSS overrides those properties.
- The `container` knob drives `WidgetWrapper`'s default container width, which reaches the
  hero and text bands, `Features3`, `Note`, `Announcement` and the blog layouts. It does
  NOT reach the parts-bin widgets that pass their own `containerClass` max-width (most of
  `Features*`, `Steps*`, `Pricing`, `Contact`, `FAQs`, `Stats`, `Testimonials`, `Brands`,
  `CallToAction`); tailwind-merge keeps the widget's own class. Widening those is a
  deferred layout-primitive pass.
- Some surfaces outside the parts-bin card set keep ad hoc shadow and radius values (hero
  images, blog `GridItem` / `ListItem` / `SinglePost` cards). A client with a blog who
  sets `shadow: 'hard'` gets a partly-converted site until a later pass.
- The `[data-btn]` rule blocks in `tailwind.css` are unlayered attribute overrides
  (matching the existing `#header.scroll` house pattern), so in `outline` / `ghost` mode
  they outrank per-element utility classes on `.btn-primary`.
- `/dev/tokens` reads `brand.tokens` directly and will error if the block is deleted
  rather than left at defaults. This only affects the preview route during a build, and
  `init-client` removes it from client repos, so it is not a shipped-site concern.
- Heading typography and motion are still hardcoded in core. They are deferred to later
  passes and are not part of this contract.
