# Starter content, forms pattern, OG images (improvements program, Phase 2)

Date: 2026-09-06
Status: design approved, spec for review.
Context: second phase of the improvements program. Phase 1 (the design token contract,
ADR 0004) is done and FF-merged to local `main`. Phases 3 (layout primitives,
art-direction presets) and 4 (design gate, perf hard gate, per-client visual regression,
a11y checklist, event taxonomy, doc consolidation) are separate and not covered here.

Ships as one SDD run, task-by-task, approval gate before each dispatch.

## Problem

Four gaps, all in the same seam (what a client build starts from and how content reaches
a page):

1. **Demo content in the shipped pages.** `src/pages/{index,about,services,pricing,contact}.astro`
   still carry AstroWind marketing copy: Lorem Ipsum, "Beautiful Website Templates", a
   fake "1234 Lorem Ipsum St, Miami, EEUU" address, Unsplash hero URLs. A build deletes
   all of it by hand. `reinit-checklist.md` already flags this as a B3 job with no
   scaffold to work from.
2. **Forms do not submit.** `src/components/ui/Form.astro` renders a bare `<form>` with no
   `action`, no method, no submit handling, no success page. No provider is wired
   anywhere. Every build reinvents this, and the B4 compliance check (consent checkbox +
   styled success page) has nothing to check against.
3. **One OG image per site.** `src/config.yaml` points every page at
   `src/assets/images/default.png`. No per-page image, so every shared link from a client
   site looks identical.
4. **No home for structured copy.** Only the `post` collection exists. Services, team
   bios, testimonials and FAQs are hardcoded as object literals inside `.astro` files, so
   client copy has no traceable location and the build rule "every fact traces to a named
   source" has nowhere to land it.

## Goal

Give a client build a neutral but real starting point for the five content pages, a
copy-and-wire forms pattern that satisfies the compliance check, per-page branded OG
images generated at build, and optional typed collections that give structured copy a
home. Defaults stay coherent; nothing here forces a build to adopt the collections.

## Scope

### Part 1 — Light content collections

Add four collections to `src/content.config.ts`, each a `glob` loader over
`src/content/<name>/` with a small zod schema:

```
services:     title, summary, icon (opt), order (opt)
team:         name, role, bio (opt), image (opt), order (opt)
testimonials: quote, name, role (opt), company (opt), image (opt)
faqs:         question, answer, order (opt)
```

- Every collection tolerates zero entries. A build that hardcodes is not forced to use
  them; a build that uses them gets types and `astro check` validation.
- Seed each collection with 2-3 neutral entries (generic role/industry-free copy, marked
  with a leading `# REPLACE` comment or an `_seed` filename prefix).
- `scripts/init-client.mjs` leaves the seeds in place. `reinit-checklist.md` gets one
  line: "replace or delete `src/content/{services,team,testimonials,faqs}` seeds".
- New **ADR 0005** records the content-model contract: what the collections are, that
  they are optional, that seeds ship and the client clears them, and that page-section
  content beyond these four kinds stays inline by design (a bespoke-per-client build is
  not a CMS).

Not in scope: a collection for page-level copy, any admin UI, wiring collections into
`_examples/`.

### Part 2 — Neutral starter pages

Rewrite `src/pages/{index,about,services,pricing,contact}.astro`:

- Keep the widget composition per page (which parts-bin widgets, in what order). The
  value is the reference layout.
- Replace every demo string with short neutral copy (a plain declarative sentence, no
  fake company, no Lorem). Mark each block a build must revisit with
  `<!-- REPLACE: one-line note on what belongs here -->`.
- `services.astro` renders from the `services` collection; the testimonials section
  (wherever it appears) renders from `testimonials`; `about.astro` team section from
  `team`; the FAQ section from `faqs`. These pages are the worked demonstration that the
  collections resolve. Each still renders correctly when its collection is empty (guard
  with `collection.length ? … : null` or fall back to a short inline list).
- Replace Unsplash hero URLs with one neutral local placeholder in
  `src/assets/images/` (a plain low-contrast abstract or a solid brand-tinted panel),
  referenced by the pages that currently set a hero `image`.
- Old page versions are not moved to `_examples/`; git history is the record. The
  AstroWind `_examples/homes` and `_examples/landing` demos already cover "show me a
  full page".
- `reinit-checklist.md` "Content pages" line updated to point at the new scaffold rather
  than "still hold AstroWind demo content".

### Part 3 — Forms pattern (Netlify Forms, client layer only)

- New `src/components/client/ContactForm.astro`: a reference implementation, not wired
  into any page's core path. Carries `data-netlify="true"`,
  `netlify-honeypot="bot-field"`, a hidden `bot-field`, a hidden `form-name`, the fields
  from the current `contact.astro` (name, email, message), a **required** privacy-consent
  checkbox whose label links to `/privacy`, and `action="/thank-you/"`. Styled by copying
  the parts-bin `Contact` / `Form` markup, not by importing core.
- New `src/pages/thank-you.astro`: a neutral styled success page (hero + short
  confirmation + link home), built from parts-bin widgets. The client restyles it in B3.
- Netlify static-form detection: document that Netlify scans built HTML at deploy, so the
  form must be present in a built page. `contact.astro` renders `ContactForm` (so the
  detection works out of the box); the doc notes the `public/__forms.html` stub as the
  fallback for forms that only appear behind interaction.
- New `docs/forms.md` (or a section in `docs/go-live.md`, implementer's call at Task
  time, prefer a short standalone `docs/forms.md`): the pattern, the detection caveat,
  spam handling (honeypot ships; reCAPTCHA noted as opt-in), and the two hard
  requirements already in B4 (consent checkbox, styled success page not the host's
  generic one). `SETUP.md` B3/B4 cross-reference it.
- Core `src/components/ui/Form.astro` and `src/components/widgets/Contact.astro` are not
  touched.

### Part 4 — OG images (astro-og-canvas, build-time)

- Add `astro-og-canvas` as a dependency.
- New `src/pages/og/[...route].ts` using `OGImageRoute`: a branded 1200x630 card template
  that reads `brand.light.primary` / `brand.light.bgPage` / `brand.fonts` and
  `brand.logo` for colour, type and mark. No headless browser (astro-og-canvas renders
  with resvg/satori-style canvas, build-time only).
- Source pages from a small explicit manifest of the static marketing routes
  (`/`, `/about`, `/services`, `/pricing`, `/contact`, `/thank-you`), each supplying a
  title and description string. Not derived from page frontmatter (the pages don't export
  it in a collectible shape).
- Each of the five pages sets `metadata.openGraph.images` to its generated
  `/og/<route>.png`. `src/assets/images/default.png` stays as the site-wide fallback for
  any page not in the manifest.
- **Core touch (raised):** core `src/utils/images.ts` `adaptOpenGraphImages` runs Sharp
  `getImage` on every `openGraph.images` URL. A generated route PNG (and, already, any
  `public/`-dir image) is not an `ImageMetadata` Sharp can reprocess. Add a guard: a
  root-relative URL that does not resolve to a `src/assets/images` file is passed through
  as an absolute URL (prefixed with `Astro.site`) with its declared width/height, no
  Sharp. This is a scoped generalization of an existing limitation, not new behavior for
  the asset-backed path. `default.png` (a `~/assets/images` path) is unaffected.
- Blog-post OG images are **deferred**: the blog is off by default, and per-post images
  would need a change in core `[...blog]` layout. Note this in ADR 0005 (or a one-line
  ADR of its own) and in `docs/`.
- `scripts/init-client.mjs`: the route reads `brand.ts`, so it works after reinit with no
  change. `reinit-checklist.md` gets one line: "verify `/og/<route>.png` renders with the
  client's brand (`npm run dev`, open the route)".
- Optional (drop if it adds a task): a `/dev/og` preview route listing the generated
  cards, matching the `/dev/tokens` pattern, stripped by `init-client`.

## Open flags (carried into implementation)

1. **`astro-og-canvas` compatibility.** Task 1 verifies it builds and produces a valid
   PNG under this repo's Astro version and the `astro-compress` / `sitemap` integration
   set. If it does not build cleanly, Part 4 falls back to: keep `default.png`, add a
   documented low-friction per-page override (`metadata.openGraph.images` with a short
   `docs/` note and a `reinit-checklist.md` line), and record the downgrade in the spec
   and ADR. The other three parts are unaffected.
2. **Golden baseline refresh.** Parts 1-2 change the rendered appearance of all five
   pages. A dedicated task runs `npm run screenshot` to refresh the golden baseline and
   commits it as its own commit, after the page rewrites and before the final review
   (same pattern as Phase 1's re-encode).
3. **`_examples/` untouched.** If a build wants the old rich pages back, they are in git
   history. Confirmed, not a flag to resolve, listed so review does not re-raise it.

## Success criteria

- `npm run build`, `npm run check` (astro check + ESLint + Prettier + `check:init`),
  `npm run test:links`, `npm run test:lhci` (a11y 100, SEO/BP >= 95) all green.
- `astro check` is green with `src/content/*` collections **empty** and again with the
  **seeds present**.
- After a scratch `npm run init-client` run: the five pages carry no AstroWind demo
  strings (`grep` for "Lorem", "template", "Miami" is clean), `/og/<route>.png` renders
  1200x630 with the scratch client's primary colour, and `reinit-checklist.md` contains
  the two new lines.
- `/contact` renders `ContactForm` with a required consent checkbox linked to `/privacy`
  and `action="/thank-you/"`; `/thank-you/` renders as a styled page, not a 404 and not a
  bare host page.
- This is template work, so editing core is allowed where justified (Part 1 edits
  `src/content.config.ts`; Part 4 adds an `astro.config.ts` integration line and a guard
  in `src/utils/images.ts`). Each
  such edit is raised at Task time before it is made: Part 1 edits
  `src/content.config.ts`; Part 4 may add an `astro.config.ts` integration line and adds
  the `adaptOpenGraphImages` guard in `src/utils/images.ts` described above. The **forms
  pattern is the exception**: it stays entirely in `src/components/client/` and
  `src/pages/`, with `src/components/ui/Form.astro` and
  `src/components/widgets/Contact.astro` provably unchanged in `git diff`. Nothing in
  Phase 2 edits `src/layouts/`, `src/components/{ui,common,blog}/`, or `vendor/`.
- Golden baseline updated and committed; `npm run screenshot:check` passes against it.
- ADR 0005 written in the house style of ADR 0001-0004.
- `SETUP.md`, `reinit-checklist.md` (via `scripts/init-client.mjs`), and the new
  `docs/forms.md` reflect the four additions.

## Task shape (for the plan)

Rough sequence, to be detailed by `superpowers:writing-plans`:

1. Spike + scaffold: verify `astro-og-canvas` builds; add the four collections + schemas +
   seeds; `astro check` both ways.
2. OG route + branded template + manifest + per-page `openGraph.images`; fallback path if
   Task 1's spike failed.
3. `ContactForm.astro` + `thank-you.astro` + `docs/forms.md` + `SETUP.md` cross-refs.
4. Rewrite the five pages to neutral copy, wire the collection-backed sections, swap the
   hero image.
5. Golden baseline refresh (own commit).
6. `init-client` reinit-checklist lines; ADR 0005; scratch `init-client` verification;
   final whole-branch review.
