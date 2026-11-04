# 2. System-font clients and richer LocalBusiness schema are undocumented gaps

Date: 2026-09-05

## Status

Accepted (2026-09-05). Item 1 (system fonts) is resolved: `Layout.astro` now renders
one `<Font preload />` per entry in `src/fonts.ts` (client layer) instead of a
hardcoded `--font-inter` line, so a system-font client sets `fonts: []` in
`astro.config.ts` and leaves `src/fonts.ts` empty. `SETUP.md` §2 documents both the
custom-typeface and system-font paths. Item 2 is resolved: `SchemaOrg.astro` now reads
`additionalType` (a `@type` array), `founder`, `foundingDate`, and `offerCatalog`
(emitted as `hasOfferCatalog`) from `src/schema.ts`, so a client with a confirmed
structured-data draft like Vinalia's can express it without a core edit. Backfilling
Vinalia's live site with the richer schema is a separate follow-up.

## Context

The Vinalia Consulting build (the first real client site built against this template,
see `docs/superpowers/specs/2026-09-04-golden-branch-and-vinalia-build-design.md`,
sub-project B) surfaced two gaps between what the template documents as supported and
what it actually needed to handle:

1. **System-font clients.** Vinalia's brand guide specifies Arial for all UI, "no
   exceptions for premium feel." No custom web font, no `astro.config.ts` `fonts` entry.
   The build worked without one, `brand.ts`'s `fonts.*` pointed at the system stack
   directly, but `SETUP.md` §2's checklist step ("`astro.config.ts` `fonts`: client
   typeface; then point `brand.fonts.*` at its `cssVariable`") reads as a required step
   for every client, not an optional one. This is a real client shape the template
   handles correctly today, but only by accident of `brand.ts` not enforcing anything,
   not because the path is documented or tested.
2. **`SchemaOrg.astro`'s structured-data coverage.** Vinalia's confirmed structured-data
   draft (`marketing/seo/schema-localbusiness-draft.md` in the client's own project
   folder) specifies `@type: ["LocalBusiness", "ProfessionalService"]`, a `founder`
   field, `foundingDate`, and `hasOfferCatalog` for its itemized price list, none of
   which `SchemaOrg.astro` currently emits. Vinalia's built site (and the `golden`
   branch, which overlays it) ships with only `Organization`/`LocalBusiness` schema as a
   result, a real gap between what a service-business client needs for SEO and what the
   template currently produces.

Per `CLAUDE.md`'s hard rule ("If you think core needs a change, stop and raise it, don't
just edit"), neither gap was fixed during the Vinalia build; both are logged here as
candidates instead.

## Decision

Not yet decided. This ADR records the two gaps as candidates for a future core change;
it does not implement either. Options for each, to be picked up in a later session:

1. **System fonts**: document a "system-font client" as an explicitly supported path in
   `SETUP.md` §2 (skip the `astro.config.ts fonts` step, point `brand.fonts.*` straight
   at the system stack), rather than leaving it as an implicit side effect of `brand.ts`
   accepting any CSS font-family string.
2. **Schema**: generalize `SchemaOrg.astro` to accept an array of `@type` values, an
   optional `founder`/`foundingDate`, and an optional `hasOfferCatalog`, sourced from
   `src/schema.ts` the same way its current fields are, so a client with a confirmed
   structured-data draft like Vinalia's can express it without a core edit mid-build.

## Consequences

- Until decided, `SETUP.md` continues to read as if every client needs a custom web
  font, and `SchemaOrg.astro` continues to under-serve service businesses that want
  `ProfessionalService` schema, a founder credit, or an offer catalog.
- Vinalia's own site (`vinalia-site` repo) and the `golden` branch's overlay of it both
  currently ship without `ProfessionalService`/founder/offer-catalog schema as a direct
  consequence; revisiting this ADR is also the trigger to backfill that site once
  `SchemaOrg.astro` supports it.
- No template-core files are touched by this ADR itself. See
  `docs/superpowers/specs/2026-09-04-golden-branch-and-vinalia-build-design.md`,
  Sub-project B, for the full source material behind both gaps.
