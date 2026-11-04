# Vinalia Consulting Site Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The user wants approval before each task's implementer is dispatched (not continuous execution) — see the standing preference recorded in memory as `feedback-sdd-approval-gate`.

**Goal:** Build the real Vinalia Consulting marketing site (7 Croatian-language pages, brand,
client components, structured data) in a new, independent repo at
`/Users/antunzebec/Work/01.Clients/Vinalia Consulting/vinalia-site/`, forked from
`dodai-astrowind` and following `SETUP.md`'s own per-client workflow — this is also the
first real end-to-end test of that workflow.

**Architecture:** Fork the template by cloning it and discarding history, run
`init-client` non-interactively (verified this session: safe to pipe answers via stdin),
then work through the template's own four build stages (brand → pages → client
components → schema/verification), each ending in a real `npm run build`. All
Croatian copy comes from the client's already-drafted, already-reviewed
`website-copy.md` — no new claims are invented anywhere in this plan. Brand tokens come
from the Vinalia Brand Style Guide v2.0 (extracted into `docs/DESIGN.md` in the client's
project folder). A cookie-consent gate is added as a one-off client component so GA4 can
run legally for this EU client, per this session's decision.

**Tech Stack:** Astro 7 + Tailwind CSS v4 (inherited from the template), no new
dependencies. Croatian (`hr`) single-language site, system font stack (Arial), no
Astro Fonts API entry needed. Netlify Forms for the contact form (no server code).

**Spec:** `docs/superpowers/specs/2026-09-04-golden-branch-and-vinalia-build-design.md`,
sub-project B.

## Global Constraints

- Repo root for this build: `/Users/antunzebec/Work/01.Clients/Vinalia Consulting/vinalia-site/`
  (**not** inside `dodai-astrowind` — confirmed this session; the spec's relative path
  `01.Clients/Vinalia Consulting/vinalia-site/` is relative to `/Users/antunzebec/Work/`).
- Source material folder (read-only, never edited by this plan):
  `/Users/antunzebec/Work/01.Clients/Vinalia Consulting/Main/`.
- Never edit template core in the new repo either — same hard rule as `dodai-astrowind`'s
  own `CLAUDE.md`: `src/layouts/`, `src/utils/`, `src/components/{ui,common,blog}/`,
  `vendor/`, the config system stay untouched. All per-client work goes in
  `src/components/client/` or the designated client-layer singleton files
  (`src/brand.ts`, `src/navigation.ts`, `src/config.yaml`, `src/schema.ts`, `src/pages/*`).
- No em dashes anywhere: code comments, copy, docs, commit messages.
- Prettier: single quotes, semicolons, 120 print width, 2-space indent
  (`.prettierrc.mjs`, inherited from the fork). Every commit leaves `npm run check`
  (astro check + eslint + prettier) green; the pre-commit hook runs the fast subset
  automatically.
- Commit trailer: `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- Language: `i18n.language: hr` in `src/config.yaml`. All visible page copy is Croatian,
  taken verbatim from `marketing/website/website-copy.md` in the source folder (the
  file's own bracketed `[Note: ...]` asides are editorial, not meant to ship, and are
  never copied into page markup).
- Never invent a fact. Every price, contact detail, and claim in this plan traces to
  `COMPANY.md`, `website-copy.md`, `icp-positioning.md`, `website-sitemap.md`, or
  `marketing/seo/schema-localbusiness-draft.md` in the source folder.
- Out of scope for this build (per spec, confirmed again this session): sending anything
  to Natalija, legal review of terms/privacy, claiming the `@vinaliaconsulting` social
  handles, filling `geo` coordinates in schema, deploying to Netlify.
- Two decisions resolved this session, both binding on this plan:
  - **Analytics: GA4** (not Plausible/Fathom). Because Vinalia is an EU client, GA4 may
    only run after a visitor accepts a cookie-consent banner. Task 16 builds this banner
    as a client-layer component, since the template's core `Analytics.astro` fires GA
    unconditionally once `config.yaml`'s `googleAnalytics.id` is set and has no
    consent gate. `config.yaml`'s `googleAnalytics.id` stays `null` for this build; GA
    loads only through the consent-gated component. **No live GA4 property exists yet**
    for Vinalia (not mentioned anywhere in the source material) — the component ships
    with a clearly-labeled placeholder Measurement ID, and creating the real GA4
    property and swapping it in is a launch-time task for Antun, not part of this plan.
  - **Heading color: `#4A1B3C`** (wine purple), from the Type Scale table in
    `docs/DESIGN.md`, not `#1A1A1A` from the Neutrals table (that entry is a generic
    role label, the type scale is the per-element override).
- **Two source facts are more recent than the spec and correct it**:
  - The contact email `natalijabrala@vinaliaconsulting.com` was confirmed live and
    receiving mail on 2026-08-14 (`COMPANY.md` → Location & Service Area), which
    postdates both `website-copy.md`'s and the schema draft's "unverified" caution
    notes. This plan publishes the email everywhere the spec's source docs marked it
    as held back.
  - The 10% sample-discount line on lab-analysis pricing was confirmed resolved
    (`COMPANY.md` → Pricing: "her own cjenik uses 'uzoraka,' not 'stavki'/billable
    items"), which postdates `website-copy.md`'s note that it was pulled pending
    resolution. This plan includes the discount line.
- **Repo-hygiene addition (not in the spec, added this session)**: a straight
  `git clone` of `dodai-astrowind` brings across files that make no sense in a client
  deliverable repo: `golden-baselines/` (42 PNGs of the _template's_ demo pages),
  `docs/superpowers/` (this repo's own internal planning specs and plans), and
  `.claude/session-summaries/` (this repo's own session history). Task 1 removes these
  right after the fork, before the first commit, so the new repo's history starts clean.

---

## Task 1: Bootstrap the repo and strip template-maintenance files

**Files:**

- Create: `/Users/antunzebec/Work/01.Clients/Vinalia Consulting/vinalia-site/` (new git repo)

**Interfaces:**

- Produces: a git repo with one commit, ready for `npm install`.

- [ ] **Step 1: Clone the template**

```bash
cd "/Users/antunzebec/Work/01.Clients/Vinalia Consulting"
git clone /Users/antunzebec/Work/dodai-astrowind vinalia-site
cd vinalia-site
```

- [ ] **Step 2: Read the template version before discarding history**

```bash
cat TEMPLATE_VERSION
```

Expected output: `0.1.0` (record this exact value for the commit message in Step 5).

- [ ] **Step 3: Discard the cloned history**

```bash
rm -rf .git
git init
```

- [ ] **Step 4: Remove template-maintenance-only files (repo-hygiene addition, see Global Constraints)**

```bash
rm -rf golden-baselines golden-baselines-diff docs/superpowers .claude/session-summaries
rm -f docs/golden-workflow.md
```

Leave `scripts/screenshot.mjs` and the `screenshot`/`screenshot:check` npm scripts in
place, they are harmless dev tooling and removing them would also require editing
`package.json`'s scripts block for no benefit. Leave `CHANGELOG.md` and
`TEMPLATE_VERSION` in place, `README.md` (Step 4 of Task 2 rewrites it via
`init-client`).

- [ ] **Step 5: First commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Fork from dodai-astrowind 0.1.0

Vinalia Consulting client site, forked from the dodai-astrowind template.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 6: Verify the fork boots**

```bash
npm install
npm run dev
```

Expected: dev server starts on `localhost:4321` with the unmodified AstroWind demo
homepage. Stop the server (Ctrl+C) once confirmed.

---

## Task 2: Run `init-client` non-interactively

**Files:**

- Modify: `package.json`, `src/config.yaml`, `src/brand.ts` (primary color only),
  `src/pages/terms.md`, `src/pages/privacy.md`, `README.md`

**Interfaces:**

- Consumes: `scripts/init-client.mjs` (unmodified from the fork).
- Produces: the client-named `package.json`/`config.yaml`/`README.md`, and
  `{{...}}` placeholders in the legal pages resolved to real values (except
  `{{LAST_UPDATED}}`, which the script fills with today's date automatically).

This session confirmed `init-client.mjs` is safe to pipe: it buffers piped stdin lines
with a custom readline wrapper and returns `''` for any question left unanswered after
EOF, so it does not hang. Prompts, in order: client/site name, production domain, legal
entity name, contact email, jurisdiction, primary brand color hex, drop `_examples/`?
(y/N).

- [ ] **Step 1: Pipe the answers**

```bash
printf 'Vinalia Consulting\nvinaliaconsulting.com\nVinalia consulting, Vinski laboratorij, obrt za analize i savjetovanje, vl. Natalija Brala\nnatalijabrala@vinaliaconsulting.com\nCroatia\n#4A1B3C\ny\n' | npm run init-client
```

Legal entity name is the full registered name from `COMPANY.md` → Registry Record
(`Vinalia consulting, Vinski laboratorij, obrt za analize i savjetovanje, vl. Natalija
Brala`), not the short brand name, since this field feeds the legal pages'
`{{CLIENT_ENTITY}}` token. Primary color hex is `#4A1B3C` (Primary-900), matching
Task 3's `brand.ts` value, so the initial import in `package.json`'s description and
the placeholder color both agree before Task 3 fills in the rest.

- [ ] **Step 2: Confirm the script's own report**

Expected final output includes the "Still to do by hand" checklist (logos, fonts,
colors, navigation, page content, legal review, schema, blog) and no `! "..." not
found` warnings (those would mean a template string it expected to replace was
already gone, worth investigating before continuing).

- [ ] **Step 3: Verify `_examples/` was dropped**

```bash
ls src/pages/_examples 2>&1
```

Expected: `No such file or directory`.

- [ ] **Step 4: Verify the build still succeeds with the new name**

```bash
npm run build
```

Expected: succeeds (demo page content is still in place, only naming/metadata changed
so far).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: run init-client for Vinalia Consulting

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Fill `src/brand.ts` (colors, fonts, derived dark mode)

**Files:**

- Modify: `src/brand.ts`

**Interfaces:**

- Consumes: nothing from earlier tasks (this is the client-layer brand surface).
- Produces: `brand.light.*`, `brand.dark.*`, `brand.fonts.*`, consumed globally by
  `src/components/CustomStyles.astro` (unmodified core) as CSS custom properties.

Values below come from `docs/DESIGN.md` (Vinalia Brand Style Guide v2.0 extract) in the
source folder, table already reproduced in the spec.

Dark-mode derivation (the real design task the spec flags for B1): `CustomStyles.astro`
applies `brand.dark.primary`/`secondary`/`accent` as raw CSS custom properties used for
buttons and accents (contrast is against white/dark button text, not the page
background), while `textHeading`/`textDefault`/`textMuted`/`bgPage` are read against
`bgPage` directly. The template's own default brand keeps `primary`/`secondary`/`accent`
identical between light and dark (see the unmodified default `brand.ts` before this
task), so this build follows that established convention rather than inventing a new
one: wine primary/secondary/accent stay the same hex in both modes. Only the
background/text tokens are derived, using the style guide's own instruction (invert
lightness, preserve hue, don't drift to generic slate/zinc) applied against a plum-black
background rather than a neutral gray one, and reusing the guide's own already-defined
lighter tint (Primary-300, `#B882A8`, "decorative only" in the light-mode scale) for dark
heading text instead of inventing a new hex value from scratch.

- [ ] **Step 1: Replace the brand object**

```typescript
// Single per-client brand surface. Edit this file per client. See SETUP.md.
//
// System font stack (Arial) per the Vinalia Brand Style Guide v2.0: "used for all
// digital UI... no exceptions for premium feel." No astro.config.ts Fonts API entry
// needed. Georgia is reserved for pull-quotes only, per the same guide, not used as a
// UI token here.

export const brand = {
  fonts: {
    sans: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    heading: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
  },

  light: {
    primary: 'rgb(74 27 60)', // #4A1B3C, Primary-900, Deep Wine Purple
    secondary: 'rgb(107 46 90)', // #6B2E5A, Primary-700, Medium Wine
    accent: 'rgb(168 139 61)', // #A88B3D, Accent-700, AA-safe gold text
    textHeading: 'rgb(74 27 60)', // #4A1B3C, type-scale Display/H1/H3/H4 color
    textDefault: 'rgb(68 68 68)', // #444444, Neutral-700, body copy
    textMuted: 'rgb(102 102 102)', // #666666, Neutral-500
    bgPage: 'rgb(245 243 240)', // #F5F3F0, Cream
  },

  dark: {
    // primary/secondary/accent unchanged from light: used as button/accent
    // backgrounds, not read against bgPage, matching the template's own
    // default convention (see brand.ts before this task).
    primary: 'rgb(74 27 60)', // #4A1B3C
    secondary: 'rgb(107 46 90)', // #6B2E5A
    accent: 'rgb(168 139 61)', // #A88B3D
    // Text/background tokens derived: invert lightness, preserve the ~318deg
    // wine hue instead of drifting to generic slate/zinc. Heading text reuses
    // the style guide's own Primary-300 tint rather than a new invented hex.
    textHeading: 'rgb(184 130 168)', // #B882A8, Primary-300 (guide-defined light wine tint)
    textDefault: 'rgb(229 229 229)', // #E5E5E5, light neutral, hue-neutral per guide's grayscale neutrals
    textMuted: 'rgb(168 168 168)', // #A8A8A8, dimmer than textDefault (closer to bgPage = less emphasis on dark)
    bgPage: 'rgb(25 16 22)', // #191016, near-black plum, hue-preserving per style guide instruction
  },
} as const;
```

- [ ] **Step 2: Record the dark-mode derivation in the source folder's `docs/DESIGN.md`**

Append to the "Dark mode" note under Colors in
`/Users/antunzebec/Work/01.Clients/Vinalia Consulting/Main/docs/DESIGN.md` (per that
file's own instruction to record derivations there once confirmed with a real artifact):

```markdown
**Dark mode, confirmed 2026-09 (website build)**: `primary`/`secondary`/`accent` stay
identical to their light-mode hex values (`#4A1B3C`/`#6B2E5A`/`#A88B3D`) since they're
used as button/accent backgrounds, not read against the page background. Text/background
tokens are derived by inverting lightness while preserving the wine hue (~318deg):
`bgPage` → `#191016` (near-black plum), `textHeading` → `#B882A8` (reusing the guide's
own Primary-300 tint), `textDefault` → `#E5E5E5`, `textMuted` → `#A8A8A8`. Applied in
`vinalia-site/src/brand.ts`.
```

- [ ] **Step 3: Verify the build still succeeds**

```bash
npm run build
```

- [ ] **Step 4: Spot-check dark mode in the browser**

```bash
npm run dev
```

Open `localhost:4321`, toggle dark mode (the theme switcher in the header), confirm the
page background is a dark plum-black (not pure black or gray) and heading text reads as
a light wine pink, not white or blue. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: fill brand.ts with Vinalia's wine-purple palette and system fonts

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Place brand assets and regenerate favicons

**Files:**

- Modify: `src/assets/images/default.png`, `src/assets/images/hero-image.png` (delete),
  `src/assets/favicons/*`, `public/robots.txt` (no change needed, already permissive)
- Create: `src/assets/images/vinalia-logo.svg`, `src/assets/images/natalija-brala.webp`

**Interfaces:**

- Produces: logo/photo asset paths consumed by Task 8 (homepage), Task 9 (O nama page),
  and `Layout.astro`'s default OG-image fallback (core, unmodified).

Source files (from
`/Users/antunzebec/Work/01.Clients/Vinalia Consulting/Main/media/` and the business's
logo folder):

- `natalija-brala-photo.webp` → used on `/o-nama`.
- `vinalia-cover.jpg` (or `social-preview.jpg`, whichever is the sharper/more final of
  the two, check both) → source for the OG image.
- Logo SVG(s) from the client's logo assets.

- [ ] **Step 1: Copy the logo and photo into the new repo**

```bash
cp "/Users/antunzebec/Work/01.Clients/Vinalia Consulting/Main/media/natalija-brala-photo.webp" \
  src/assets/images/natalija-brala.webp
```

Check the actual logo SVG filename before copying (the exact filename wasn't
independently verified this session, e.g. `vinalia-logo-*.svg` under the business's
logo folder found during the prior session's search) and copy it to
`src/assets/images/vinalia-logo.svg`. If more than one logo variant exists (e.g.
light/dark background versions), copy both and note which is used where in Step 3
below.

- [ ] **Step 2: Remove the unused AstroWind demo hero image**

```bash
rm src/assets/images/hero-image.png
```

- [ ] **Step 3: Replace the OG image**

```bash
cp "/Users/antunzebec/Work/01.Clients/Vinalia Consulting/Main/media/vinalia-cover.jpg" \
  src/assets/images/default.png
```

If `vinalia-cover.jpg` isn't actually PNG-convertible cleanly or looks wrong at
1200x628 (the OG dimensions declared in `src/config.yaml`), use
`social-preview.jpg` instead, whichever one is closer to that aspect ratio. Note in
the commit message which source file was used.

- [ ] **Step 4: Regenerate favicons**

`src/assets/favicons/` needs `favicon.ico`, `favicon.svg`, and `apple-touch-icon.png`
derived from the Vinalia mark (not the AstroWind default). Use an image tool (e.g.
`sharp`, already a devDependency, or any favicon generator) to produce a 32x32 `.ico`,
a scalable `.svg` (the logo SVG itself if it reads cleanly at small sizes), and a
180x180 `apple-touch-icon.png`, all from the logo asset copied in Step 1.

- [ ] **Step 5: Build and visually confirm**

```bash
npm run build && npm run dev
```

Open `localhost:4321`, confirm the browser tab favicon is the Vinalia mark, not the
AstroWind default. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: replace template assets with Vinalia logo, photo, and OG image

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

**B1 exit check**: `npm run build` succeeds with the new brand, placeholder nav, and
Vinalia's own assets. Nothing page-specific yet (that's B2).

---

## Task 5: Set navigation and site config

**Files:**

- Modify: `src/navigation.ts`, `src/config.yaml`

**Interfaces:**

- Consumes: route paths this task defines, consumed by Task 6-9 (pages must exist at
  the paths declared here) and Task 16 (the consent banner reads `config.yaml`'s
  `analytics.vendors.googleAnalytics.id`, left `null`).
- Produces: `headerData`, `footerData` (nav), `SITE`/`i18n`/`apps.blog` config consumed
  by core layouts.

Sitemap, from `website-sitemap.md`: `/` (Homepage), `/usluge` (hub),
`/usluge/laboratorijska-analiza`, `/usluge/enolosko-savjetovanje`, `/o-nama`,
`/reference`, `/kontakt`. Dropdown nav per that file's own Navigation section: "Usluge
(dropdown: Laboratorijska analiza, Enološko savjetovanje) · O nama · Reference ·
Kontakt". AstroWind's `getPermalink` doesn't have first-class dropdown support beyond a
`links` sub-array (used elsewhere in the demo nav for similar cases) — check
`src/components/widgets/Header.astro` (core, read-only) for the exact dropdown shape it
expects before wiring this in, and match that shape exactly.

- [ ] **Step 1: Check the Header widget's dropdown link shape**

```bash
grep -n "links" src/components/widgets/Header.astro | head -20
```

Confirm whether a `links` entry can itself carry a `links: [...]` sub-array for a
dropdown (AstroWind's stock demo nav in `src/pages/_examples/` used this pattern before
it was removed in Task 2; check `git show HEAD~3:src/pages/_examples/...` or the
upstream AstroWind docs if the removed demo isn't handy) and use that exact shape.

- [ ] **Step 2: Write `src/navigation.ts`**

```typescript
import { getPermalink } from './utils/permalinks';

// Client layer: Vinalia Consulting navigation. See SETUP.md.

export const headerData = {
  links: [
    {
      text: 'Usluge',
      links: [
        { text: 'Laboratorijska analiza', href: getPermalink('/usluge/laboratorijska-analiza') },
        { text: 'Enološko savjetovanje', href: getPermalink('/usluge/enolosko-savjetovanje') },
      ],
    },
    { text: 'O nama', href: getPermalink('/o-nama') },
    { text: 'Reference', href: getPermalink('/reference') },
  ],
  actions: [{ text: 'Kontakt', href: getPermalink('/kontakt') }],
};

export const footerData = {
  links: [
    {
      title: 'Stranice',
      links: [
        { text: 'Usluge', href: getPermalink('/usluge') },
        { text: 'O nama', href: getPermalink('/o-nama') },
        { text: 'Reference', href: getPermalink('/reference') },
        { text: 'Kontakt', href: getPermalink('/kontakt') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Uvjeti korištenja', href: getPermalink('/terms') },
    { text: 'Politika privatnosti', href: getPermalink('/privacy') },
  ],
  // Social handles confirmed as @vinaliaconsulting (COMPANY.md) but accounts are not
  // yet live, claiming/verifying them is out of scope for this build. Leave empty.
  socialLinks: [],
  footNote: `
    Built by <a class="text-blue-600 underline dark:text-muted" href="https://dodai.io">Dodai</a>.
  `,
};
```

- [ ] **Step 3: Edit `src/config.yaml`**

Change these keys (leave everything else `init-client` already set in Task 2 alone):

```yaml
i18n:
  language: hr
  textDirection: ltr

apps:
  blog:
    isEnabled: false # No blog on Vinalia's sitemap.

analytics:
  vendors:
    googleAnalytics:
      id: null # Left null: GA loads only through the consent-gated component (Task 16), never unconditionally.
```

Also update `metadata.openGraph.images` if Task 4's OG image has different pixel
dimensions than the template default (1200x628); check the actual file dimensions and
correct the `width`/`height` fields if they differ.

- [ ] **Step 4: Build**

```bash
npm run build
```

Expected: succeeds (nav links point to routes that don't exist yet, that's expected,
Astro doesn't fail the build on a nav link to a future route).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: set Vinalia navigation and Croatian site config

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Homepage (`/`)

**Files:**

- Modify: `src/pages/index.astro` (replace AstroWind demo content entirely)

**Interfaces:**

- Consumes: `PageLayout` (core), plain markup only, no client components yet (B2 builds
  pages with plain markup first, B3 extracts components).
- Produces: the `/` route content that Task 11-16's components will later replace
  section-by-section without changing what's on the page.

Copy verbatim from `marketing/website/website-copy.md` → Homepage section (Hero,
Podnaslov, Kratki uvod, Tri kratka isticaja, Kako to izgleda, CTA). SEO metadata from
that file's SEO metadata table.

- [ ] **Step 1: Write the page**

```astro
---
import Layout from '~/layouts/PageLayout.astro';

const metadata = {
  title: 'Analiza vina i enološko savjetovanje',
  description:
    'Kemijsko-fizikalna analiza vina i enološko savjetovanje za vinare u Zadarskoj županiji i široj regiji. Svaka preporuka dolazi nakon analize.',
};
---

<Layout metadata={metadata}>
  <section class="py-16 md:py-24">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 text-center">
      <h1 class="text-4xl md:text-6xl font-bold leading-tight mb-6" style="color: var(--aw-color-text-heading)">
        Kemijsko-fizikalna analiza vina i savjetovanje u proizvodnji — jedna osoba, od uzorka do gotovog vina.
      </h1>
      <p class="text-xl max-w-3xl mx-auto mb-10" style="color: var(--aw-color-text-muted)">
        Vinalia Consulting kombinira vlastiti laboratorij s enološkim savjetovanjem u podrumu, za vinare u Zadarskoj
        županiji i široj regiji. Svaka preporuka dolazi tek nakon analize — nikad nagađanje, jer krivi potez u ključnom
        trenutku može koštati cijelu sezonu.
      </p>
      <a
        href="/kontakt"
        class="inline-block rounded-md px-8 py-3 font-semibold text-white"
        style="background-color: var(--aw-color-primary)"
      >
        Zatražite analizu
      </a>
    </div>
  </section>

  <section class="py-12 max-w-4xl mx-auto px-4 sm:px-6">
    <p class="text-lg" style="color: var(--aw-color-text-default)">
      Vinalia Consulting bavi se kemijsko-fizikalnim analizama vina i savjetovanjem u proizvodnji vina, uz zastupništvo
      za Dalmaciju za cijeli asortiman Vinoartisa — što znači da vinari kroz mene mogu doći i do konkretnih proizvoda iz
      tog asortimana, uz analizu i savjet, sve na jednom mjestu. Jedan od ključnih dijelova posla je i edukacija malih i
      većih proizvođača — cilj nije da vinar dobije samo kratku uputu, nego da razumije što i zašto radi u svakom koraku
      proizvodnje.
    </p>
  </section>

  <section class="py-12 max-w-6xl mx-auto px-4 sm:px-6">
    <div class="grid gap-8 md:grid-cols-3 text-center">
      <div>
        <h3 class="text-xl font-semibold mb-2" style="color: var(--aw-color-text-heading)">Analiza prije savjeta</h3>
        <p style="color: var(--aw-color-text-default)">
          Svaka preporuka proizvoda temelji se na stvarnim rezultatima, ne na pretpostavci.
        </p>
      </div>
      <div>
        <h3 class="text-xl font-semibold mb-2" style="color: var(--aw-color-text-heading)">
          Jedna osoba, cijeli proces
        </h3>
        <p style="color: var(--aw-color-text-default)">
          Pratim vaš proces od prvog uzorka do gotovog protokola, uvijek ista osoba, uvijek isti kontekst o vašem vinu.
        </p>
      </div>
      <div>
        <h3 class="text-xl font-semibold mb-2" style="color: var(--aw-color-text-heading)">Edukacija, ne samo upute</h3>
        <p style="color: var(--aw-color-text-default)">Razumijete zašto, ne samo što.</p>
      </div>
    </div>
  </section>

  <section class="py-12 max-w-5xl mx-auto px-4 sm:px-6">
    <h2 class="text-3xl font-bold text-center mb-10" style="color: var(--aw-color-text-heading)">Kako to izgleda</h2>
    <div class="grid gap-8 md:grid-cols-3">
      <div class="text-center">
        <div
          class="w-10 h-10 rounded-full text-white flex items-center justify-center mx-auto mb-4 font-bold"
          style="background-color: var(--aw-color-primary)"
        >
          1
        </div>
        <p style="color: var(--aw-color-text-default)">
          <strong>Dovezete uzorak</strong> u Zemunik Donji, kad vama odgovara.
        </p>
      </div>
      <div class="text-center">
        <div
          class="w-10 h-10 rounded-full text-white flex items-center justify-center mx-auto mb-4 font-bold"
          style="background-color: var(--aw-color-primary)"
        >
          2
        </div>
        <p style="color: var(--aw-color-text-default)">
          <strong>Dobijete rezultate</strong> — i, ako želite, konkretan protokol temeljen na njima.
        </p>
      </div>
      <div class="text-center">
        <div
          class="w-10 h-10 rounded-full text-white flex items-center justify-center mx-auto mb-4 font-bold"
          style="background-color: var(--aw-color-primary)"
        >
          3
        </div>
        <p style="color: var(--aw-color-text-default)">
          <strong>Pratim vas dalje</strong>, koliko god trebate, uvijek ista osoba.
        </p>
      </div>
    </div>
  </section>

  <section class="py-16 text-center">
    <a
      href="/kontakt"
      class="inline-block rounded-md px-8 py-3 font-semibold text-white"
      style="background-color: var(--aw-color-primary)"
    >
      Dogovorite konzultacije
    </a>
  </section>
</Layout>
```

- [ ] **Step 2: Build and view**

```bash
npm run build && npm run dev
```

Open `localhost:4321`, confirm the Croatian homepage copy renders, no leftover
AstroWind demo text. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: build Vinalia homepage with real copy

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Services hub and two service pages

**Files:**

- Modify: `src/pages/services.astro` → rename/repurpose as `src/pages/usluge.astro`
- Create: `src/pages/usluge/laboratorijska-analiza.astro`,
  `src/pages/usluge/enolosko-savjetovanje.astro`
- Delete: `src/pages/services.astro` (if not already handled by the rename), `src/pages/pricing.astro`
  (AstroWind demo page, no equivalent in Vinalia's sitemap, pricing lives inside the
  lab-analysis page per the copy doc)

**Interfaces:**

- Consumes: `PageLayout` (core).
- Produces: three routes matching `website-sitemap.md`'s URL map.

Per `website-sitemap.md`'s Internal Linking Plan: the hub links to both service pages
in its own paragraph (not just the link list), and Enološko savjetovanje links to
Reference with anchor text naming the service ("pogledajte protokol kao primjer rada"),
not "saznajte više."

- [ ] **Step 1: Delete the AstroWind demo services/pricing pages**

```bash
rm src/pages/services.astro src/pages/pricing.astro
```

- [ ] **Step 2: Create the hub page**

```astro
---
// src/pages/usluge.astro
import Layout from '~/layouts/PageLayout.astro';

const metadata = {
  title: 'Usluge — analiza i savjetovanje',
  description:
    'Pregled usluga Vinalia Consultinga: kemijsko-fizikalna analiza vina i mošta te enološko savjetovanje u podrumu, za vinare u Zadarskoj županiji.',
};
---

<Layout metadata={metadata}>
  <section class="py-16 max-w-4xl mx-auto px-4 sm:px-6">
    <h1 class="text-4xl font-bold mb-6" style="color: var(--aw-color-text-heading)">Usluge</h1>
    <p class="text-lg mb-10" style="color: var(--aw-color-text-default)">
      Vinalia Consulting kombinira laboratorijsku analizu vina i mošta s enološkim savjetovanjem u podrumu —
      <a href="/usluge/laboratorijska-analiza" class="underline" style="color: var(--aw-color-secondary)"
        >laboratorijska analiza</a
      >
      za konkretne, izmjerene rezultate, i
      <a href="/usluge/enolosko-savjetovanje" class="underline" style="color: var(--aw-color-secondary)"
        >enološko savjetovanje</a
      > za ono što s tim rezultatima napraviti dalje.
    </p>
    <div class="grid gap-8 md:grid-cols-2">
      <a
        href="/usluge/laboratorijska-analiza"
        class="block rounded-lg border p-6 hover:shadow-md transition-shadow"
        style="border-color: var(--aw-color-secondary)"
      >
        <h2 class="text-2xl font-semibold mb-2" style="color: var(--aw-color-text-heading)">
          Laboratorijska analiza vina
        </h2>
        <p style="color: var(--aw-color-text-default)">
          Kemijsko-fizikalna analiza vina i mošta — od pojedinačnih parametara do potpunih paketa.
        </p>
      </a>
      <a
        href="/usluge/enolosko-savjetovanje"
        class="block rounded-lg border p-6 hover:shadow-md transition-shadow"
        style="border-color: var(--aw-color-secondary)"
      >
        <h2 class="text-2xl font-semibold mb-2" style="color: var(--aw-color-text-heading)">Enološko savjetovanje</h2>
        <p style="color: var(--aw-color-text-default)">Savjetovanje se prilagođava potrebi klijenta, ne obrnuto.</p>
      </a>
    </div>
  </section>
</Layout>
```

- [ ] **Step 3: Create the lab-analysis page**

```astro
---
// src/pages/usluge/laboratorijska-analiza.astro
import Layout from '~/layouts/PageLayout.astro';

const metadata = {
  title: 'Laboratorijska analiza vina i mošta',
  description:
    'Kemijsko-fizikalna analiza vina i mošta u Zemuniku Donjem — pojedinačni parametri i paketi za zrelost grožđa, fermentaciju i kontrolu vina.',
};
---

<Layout metadata={metadata}>
  <nav class="max-w-4xl mx-auto px-4 sm:px-6 pt-8 text-sm" style="color: var(--aw-color-text-muted)">
    <a href="/">Početna</a> &gt; <a href="/usluge">Usluge</a> &gt; Laboratorijska analiza vina
  </nav>
  <section class="py-8 max-w-4xl mx-auto px-4 sm:px-6">
    <h1 class="text-4xl font-bold mb-6" style="color: var(--aw-color-text-heading)">Laboratorijska analiza vina</h1>
    <p class="text-lg mb-8" style="color: var(--aw-color-text-default)">
      Kemijsko-fizikalna analiza vina i mošta — od pojedinačnih parametara do potpunih paketa za praćenje zrelosti
      grožđa, fermentacije, malolaktičke fermentacije i kontrole gotovog vina.
    </p>
    <h2 class="text-2xl font-semibold mb-4" style="color: var(--aw-color-text-heading)">Cjenik (okvirno)</h2>
    <ul class="list-disc pl-6 space-y-2 mb-8" style="color: var(--aw-color-text-default)">
      <li>Pojedinačni parametri: od 3 € (npr. pH, šećer u moštu) do 22 € (npr. kalcij, ukupni bakar)</li>
      <li>Paketi analiza (zrelost grožđa, praćenje fermentacije, malolaktika, kontrola vina): 8–42 €</li>
      <li>10% popusta na narudžbe od više od 10 uzoraka</li>
      <li>Cijene su konačne (nisam u sustavu PDV-a)</li>
    </ul>
    <a
      href="/kontakt"
      class="inline-block rounded-md px-8 py-3 font-semibold text-white"
      style="background-color: var(--aw-color-primary)"
    >
      Zatražite analizu
    </a>
  </section>
</Layout>
```

- [ ] **Step 4: Create the consulting page**

```astro
---
// src/pages/usluge/enolosko-savjetovanje.astro
import Layout from '~/layouts/PageLayout.astro';

const metadata = {
  title: 'Enološko savjetovanje u vinarstvu',
  description:
    'Savjetovanje u proizvodnji vina prilagođeno vašem procesu — od analize do konkretnog protokola, za vinare u Zadarskoj županiji i široj regiji.',
};
---

<Layout metadata={metadata}>
  <nav class="max-w-4xl mx-auto px-4 sm:px-6 pt-8 text-sm" style="color: var(--aw-color-text-muted)">
    <a href="/">Početna</a> &gt; <a href="/usluge">Usluge</a> &gt; Enološko savjetovanje
  </nav>
  <section class="py-8 max-w-4xl mx-auto px-4 sm:px-6">
    <h1 class="text-4xl font-bold mb-6" style="color: var(--aw-color-text-heading)">Enološko savjetovanje</h1>
    <p class="text-lg mb-8" style="color: var(--aw-color-text-default)">
      Savjetovanje se prilagođava potrebi klijenta, ne obrnuto. Neki žele samo analizu. Neki traže preporuku proizvoda —
      uvijek tek nakon analize. Neki dolaze zbog korekcije organoleptičkih svojstava vina. Neki žele potpuno
      savjetovanje, od grožđa do boce.
    </p>
    <h2 class="text-2xl font-semibold mb-4" style="color: var(--aw-color-text-heading)">Što obuhvaća</h2>
    <ul class="list-disc pl-6 space-y-2 mb-8" style="color: var(--aw-color-text-default)">
      <li>Samo laboratorijska analiza, bez daljnjeg praćenja</li>
      <li>Analiza → konkretna preporuka proizvoda na temelju rezultata</li>
      <li>Korekcija organoleptičkih svojstava vina</li>
      <li>Potpuno savjetovanje kroz cijeli proces proizvodnje</li>
    </ul>
    <h2 class="text-2xl font-semibold mb-4" style="color: var(--aw-color-text-heading)">Granica prema vinogradu</h2>
    <p class="mb-8" style="color: var(--aw-color-text-default)">
      Fokus je pretežito na podrumu i enologiji. Jedina odluka vezana uz vinograd koju donosim izravno je vrijeme berbe;
      za sva ostala vinogradska pitanja (npr. zaštita čokota) upućujem klijenta kolegi agronomu.
    </p>
    <h2 class="text-2xl font-semibold mb-4" style="color: var(--aw-color-text-heading)">Cijena</h2>
    <p class="mb-8" style="color: var(--aw-color-text-default)">
      Savjetovanje se naplaćuje po litri gotovog vina, 0,30–0,70 €/L, ovisno o tome koliko klijent već poznaje proces
      proizvodnje i koliko je potrebna fizička prisutnost u podrumu.
    </p>
    <p class="mb-8" style="color: var(--aw-color-text-default)">
      Pogledajte
      <a href="/reference" class="underline" style="color: var(--aw-color-secondary)">protokol kao primjer rada</a>.
    </p>
    <a
      href="/kontakt"
      class="inline-block rounded-md px-8 py-3 font-semibold text-white"
      style="background-color: var(--aw-color-primary)"
    >
      Dogovorite konzultacije
    </a>
  </section>
</Layout>
```

- [ ] **Step 5: Build and check the three routes**

```bash
npm run build
```

Expected: `dist/usluge/index.html`,
`dist/usluge/laboratorijska-analiza/index.html`,
`dist/usluge/enolosko-savjetovanje/index.html` all exist.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: build Vinalia services hub and two service pages

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: O nama, Reference, Kontakt pages

**Files:**

- Modify: `src/pages/about.astro` → repurpose as `src/pages/o-nama.astro`
- Modify: `src/pages/contact.astro` → repurpose as `src/pages/kontakt.astro`
- Create: `src/pages/reference.astro`

**Interfaces:**

- Consumes: `PageLayout`, `Task 4`'s `natalija-brala.webp` asset.
- Produces: the three remaining routes from `website-sitemap.md`.

O nama copy, reordered per the `website-copy.md`'s own StoryBrand-pass note ("Zašto
raditi sa mnom" leads, founding story follows). Reference copy is the Debit protocol
case study, cleared to publish with the producer's name omitted (confirmed in
`COMPANY.md` → Clients). Kontakt uses the confirmed-live email (see Global Constraints).

- [ ] **Step 1: Rename and rewrite the About page**

```bash
git mv src/pages/about.astro src/pages/o-nama.astro
```

```astro
---
// src/pages/o-nama.astro
import Layout from '~/layouts/PageLayout.astro';
import Image from '~/components/common/Image.astro';

const metadata = {
  title: 'O nama — Natalija Brala, enologinja',
  description:
    'Natalija Brala, enologinja s 10+ godina iskustva u Istri i Dalmaciji, osnivačica Vinalia Consultinga u Zemuniku Donjem, Zadarska županija.',
};
---

<Layout metadata={metadata}>
  <section class="py-16 max-w-4xl mx-auto px-4 sm:px-6">
    <div class="grid gap-10 md:grid-cols-3 items-start mb-12">
      <div class="md:col-span-2">
        <h1 class="text-4xl font-bold mb-6" style="color: var(--aw-color-text-heading)">Zašto raditi sa mnom</h1>
        <p class="mb-4" style="color: var(--aw-color-text-default)">
          Radite izravno sa mnom, od prvog uzorka do gotovog protokola. Uvijek znam cijelu povijest vašeg vina, jer je
          pratim od početka do kraja.
        </p>
        <p class="mb-4" style="color: var(--aw-color-text-default)">
          Kemijsko-fizikalna analiza vina i savjetovanje u proizvodnji su srž onoga što radim — a edukacija je jednako
          važna kao i sama analiza. Ne dajem samo kratke upute; želim da vinar razumije što i zašto radi u svakom koraku
          proizvodnje.
        </p>
      </div>
      <Image
        src="~/assets/images/natalija-brala.webp"
        alt="Natalija Brala, enologinja, Vinalia Consulting"
        width={400}
        height={400}
        class="rounded-lg w-full"
      />
    </div>

    <h2 class="text-2xl font-semibold mb-4" style="color: var(--aw-color-text-heading)">Kako je nastala Vinalia</h2>
    <p class="mb-8" style="color: var(--aw-color-text-default)">
      Tijekom rada u laboratoriju u Istri, gledala sam rezultate koje su vinari ostvarivali zahvaljujući stručnim
      savjetima — i koliko im je to značilo. Poželjela sam jednog dana vratiti se kući, u Dalmaciju, i na isti način
      pomoći vinarima u Zadarskoj županiji i široj regiji, te sudjelovati u napretku proizvodnje vina u ovom kraju. Tako
      je nastala Vinalia Consulting.
    </p>

    <h2 class="text-2xl font-semibold mb-4" style="color: var(--aw-color-text-heading)">Zastupništvo</h2>
    <p class="mb-8" style="color: var(--aw-color-text-default)">
      Zastupnik sam za Dalmaciju za cijeli asortiman Vinoartisa, uz suradnju i s drugim dobavljačima enoloških proizvoda
      (Vason, Oenobrands, Corimpex, Lalemand).
    </p>

    <a
      href="/kontakt"
      class="inline-block rounded-md px-8 py-3 font-semibold text-white"
      style="background-color: var(--aw-color-primary)"
    >
      Zatražite analizu
    </a>
  </section>
</Layout>
```

- [ ] **Step 2: Write the Reference page**

```astro
---
// src/pages/reference.astro
import Layout from '~/layouts/PageLayout.astro';

const metadata = {
  title: 'Primjer rada — protokol Debit',
  description:
    'Primjer stvarnog protokola: enološko savjetovanje korak po korak, od muljače do prvog pretoka, za bijelo vino sorte Debit.',
};
---

<Layout metadata={metadata}>
  <section class="py-16 max-w-4xl mx-auto px-4 sm:px-6">
    <h1 class="text-4xl font-bold mb-6" style="color: var(--aw-color-text-heading)">Primjer rada — protokol Debit</h1>
    <p class="text-lg mb-8" style="color: var(--aw-color-text-default)">
      Umjesto gotovih uputa, evo stvarnog primjera kako izgleda protokol koji smo zajedno napravili za jedno bijelo vino
      sorte Debit — od muljače do prvog pretoka.
    </p>

    <h2 class="text-2xl font-semibold mb-4" style="color: var(--aw-color-text-heading)">Izazov</h2>
    <p class="mb-8" style="color: var(--aw-color-text-default)">
      Cilj je bio stabilno, čisto vrenje do kraja i očuvanje sortnih aroma kroz cijeli proces — bez oksidacije i bez
      zastoja fermentacije, jer oboje lako uništi upravo ono što čini ovo vino prepoznatljivim.
    </p>

    <h2 class="text-2xl font-semibold mb-4" style="color: var(--aw-color-text-heading)">Pristup — po fazama</h2>
    <p class="mb-4" style="color: var(--aw-color-text-default)">Svaka faza ima svoj razlog, ne samo popis proizvoda:</p>
    <ul class="list-disc pl-6 space-y-3 mb-8" style="color: var(--aw-color-text-default)">
      <li><strong>Muljača</strong> — trenutna antioksidativna zaštita mošta prije bilo čega drugog.</li>
      <li><strong>Maceracija</strong> — selektivno izvlačenje plemenitih aroma iz pokožice, bez grubih tanina.</li>
      <li>
        <strong>Preša i flotacija</strong> — nadoknada zaštite izgubljene mehaničkom obradom, uz bistrenje mošta prije fermentacije.
      </li>
      <li>
        <strong>Fermentacija</strong> — praćena u koracima (nakon inokulacije, nakon dijela potrošenog šećera, nakon vrenja,
        kod prvog pretoka), svaki s razlogom: prehrana kvasca, zaštita od stresa kvasca, zaštita od neželjenih bakterija.
      </li>
    </ul>

    <h2 class="text-2xl font-semibold mb-4" style="color: var(--aw-color-text-heading)">Zaključak</h2>
    <p class="mb-8" style="color: var(--aw-color-text-default)">
      Rezultat: čisto vrenje do kraja, bez zastoja, uz očuvane sortne arome. Ovo je primjer pristupa koji koristim sa
      svakim klijentom — analiza i razlog iza svakog koraka, ne samo gotova uputa.
    </p>

    <p class="mb-8" style="color: var(--aw-color-text-default)">
      Ovo je primjer usluge
      <a href="/usluge/enolosko-savjetovanje" class="underline" style="color: var(--aw-color-secondary)"
        >enološkog savjetovanja</a
      >.
    </p>

    <a
      href="/kontakt"
      class="inline-block rounded-md px-8 py-3 font-semibold text-white"
      style="background-color: var(--aw-color-primary)"
    >
      Zatražite savjetovanje
    </a>
  </section>
</Layout>
```

- [ ] **Step 3: Rename and rewrite the Contact page**

```bash
git mv src/pages/contact.astro src/pages/kontakt.astro
```

```astro
---
// src/pages/kontakt.astro
import Layout from '~/layouts/PageLayout.astro';

const metadata = {
  title: 'Kontakt',
  description:
    'Kontaktirajte Vinalia Consulting u Zemuniku Donjem — telefon, WhatsApp i adresa. Radno vrijeme pon–pet, 08:00–16:00.',
};
---

<Layout metadata={metadata}>
  <section class="py-16 max-w-3xl mx-auto px-4 sm:px-6">
    <h1 class="text-4xl font-bold mb-8" style="color: var(--aw-color-text-heading)">Kontakt</h1>
    <dl class="space-y-4 text-lg" style="color: var(--aw-color-text-default)">
      <div>
        <dt class="font-semibold" style="color: var(--aw-color-text-heading)">Adresa</dt>
        <dd>Ul. I 26, 23222, Zemunik Donji</dd>
      </div>
      <div>
        <dt class="font-semibold" style="color: var(--aw-color-text-heading)">Radno vrijeme</dt>
        <dd>pon–pet, 08:00–16:00 (vikendom zatvoreno)</dd>
      </div>
      <div>
        <dt class="font-semibold" style="color: var(--aw-color-text-heading)">Telefon / SMS / WhatsApp</dt>
        <dd><a href="tel:+385922555835" class="underline">092 255 5835</a></dd>
      </div>
      <div>
        <dt class="font-semibold" style="color: var(--aw-color-text-heading)">Email</dt>
        <dd>
          <a href="mailto:natalijabrala@vinaliaconsulting.com" class="underline">natalijabrala@vinaliaconsulting.com</a>
        </dd>
      </div>
    </dl>
  </section>
  <!-- The Netlify-wired contact form itself is built as a client component in Task 14
       and dropped in here once it exists (Task 14, Step 4). -->
</Layout>
```

Leave a visible placeholder comment as written above; Task 14 replaces it with the real
`<ContactForm />` import and usage, this task's job is the static page shell and
contact-details block only.

- [ ] **Step 4: Build and check all routes**

```bash
npm run build
```

Expected: `dist/o-nama/index.html`, `dist/reference/index.html`,
`dist/kontakt/index.html` all exist.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: build O nama, Reference, and Kontakt pages

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Fill terms/privacy placeholders, verify email/domain end to end

**Files:**

- Modify: `src/pages/terms.md`, `src/pages/privacy.md`

**Interfaces:**

- Consumes: nothing new (Task 2's `init-client` run already substituted the
  `{{CLIENT_ENTITY}}`, `{{CLIENT_NAME}}`, `{{SITE_DOMAIN}}`, `{{CONTACT_EMAIL}}`,
  `{{JURISDICTION}}`, `{{LAST_UPDATED}}` tokens).

- [ ] **Step 1: Diff-check the substitutions actually landed**

```bash
grep -n '{{' src/pages/terms.md src/pages/privacy.md
```

Expected: no output (no unresolved `{{...}}` tokens left). If any remain, it means
Task 2's `init-client` run left a field blank (most likely `{{CONTACT_EMAIL}}` if the
email answer was somehow skipped); fix by hand using the same values passed in Task 2
Step 1.

- [ ] **Step 2: Read both pages top to bottom**

Confirm the legal entity name, domain, and jurisdiction read correctly in context (e.g.
"the Company... refers to Vinalia consulting, Vinski laboratorij, obrt za analize i
savjetovanje, vl. Natalija Brala"). This is boilerplate content, not reviewed for GDPR
compliance, per the spec's explicit out-of-scope note, this step only checks the
mechanical substitution worked, not the legal substance.

- [ ] **Step 3: Leave the existing "Template placeholder... not legal advice" banner in place**

Do not remove it. A real legal review before launch is explicitly out of scope for this
build (per spec).

- [ ] **Step 4: Commit only if Step 1 required a fix**

If no fix was needed, skip this task's commit entirely (nothing changed beyond what
Task 2 already committed).

**B2 exit check**: all seven routes build and read correctly end to end.

```bash
npm run build
```

Expected: `dist/` contains `index.html`, `usluge/index.html`,
`usluge/laboratorijska-analiza/index.html`, `usluge/enolosko-savjetovanje/index.html`,
`o-nama/index.html`, `reference/index.html`, `kontakt/index.html`, `terms/index.html`,
`privacy/index.html`.

---

## Task 10: `Hero` client component

**Files:**

- Create: `src/components/client/Hero.astro`
- Modify: `src/pages/index.astro` (replace the plain-markup hero section with the
  component)

**Interfaces:**

- Produces: `Hero` component, `Props { title: string; subtitle: string; ctaText: string; ctaHref: string }`.

Ejects the homepage's hero section (Task 6, Step 1's first `<section>`) into a
reusable client component, per `add-component.md`'s "new" template (this doesn't start
from the widgets-bin `Hero.astro`, since that widget expects an image and AstroWind's
generic action-button API; Vinalia's hero is simpler, text-only, one CTA).

- [ ] **Step 1: Create the component**

```astro
---
// src/components/client/Hero.astro
interface Props {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
}

const { title, subtitle, ctaText, ctaHref } = Astro.props;
---

<section class="py-16 md:py-24">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 text-center">
    <h1 class="text-4xl md:text-6xl font-bold leading-tight mb-6" style="color: var(--aw-color-text-heading)">
      {title}
    </h1>
    <p class="text-xl max-w-3xl mx-auto mb-10" style="color: var(--aw-color-text-muted)">
      {subtitle}
    </p>
    <a
      href={ctaHref}
      class="inline-block rounded-md px-8 py-3 font-semibold text-white"
      style="background-color: var(--aw-color-primary)"
    >
      {ctaText}
    </a>
  </div>
</section>
```

- [ ] **Step 2: Use it on the homepage**

In `src/pages/index.astro`, add the import and replace the first `<section>` block
(the one written in Task 6, Step 1) with:

```astro
<Hero
  title="Kemijsko-fizikalna analiza vina i savjetovanje u proizvodnji — jedna osoba, od uzorka do gotovog vina."
  subtitle="Vinalia Consulting kombinira vlastiti laboratorij s enološkim savjetovanjem u podrumu, za vinare u Zadarskoj županiji i široj regiji. Svaka preporuka dolazi tek nakon analize — nikad nagađanje, jer krivi potez u ključnom trenutku može koštati cijelu sezonu."
  ctaText="Zatražite analizu"
  ctaHref="/kontakt"
/>
```

Add `import Hero from '~/components/client/Hero.astro';` to the frontmatter.

- [ ] **Step 3: Build and visually confirm unchanged**

```bash
npm run build && npm run dev
```

Open `localhost:4321`, confirm the homepage hero looks identical to before this task.
Stop the server.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor: extract homepage hero into a client component

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: `ThreeUp` (isticaji / steps) client component

**Files:**

- Create: `src/components/client/ThreeUp.astro`
- Modify: `src/pages/index.astro` (replace the "Tri kratka isticaja" and "Kako to
  izgleda" plain-markup sections)

**Interfaces:**

- Produces: `ThreeUp` component, `Props { heading?: string; numbered?: boolean; items:
{ title: string; description: string }[] }`. `numbered` switches between the
  homepage's two different three-item layouts (icon-less cards for isticaji, numbered
  circles for the process steps) without needing two separate components, since both
  are the same 3-column grid shape with only that one visual difference.

- [ ] **Step 1: Create the component**

```astro
---
// src/components/client/ThreeUp.astro
interface Props {
  heading?: string;
  numbered?: boolean;
  items: { title: string; description: string }[];
}

const { heading, numbered = false, items } = Astro.props;
---

<section class="py-12 max-w-6xl mx-auto px-4 sm:px-6">
  {
    heading && (
      <h2 class="text-3xl font-bold text-center mb-10" style="color: var(--aw-color-text-heading)">
        {heading}
      </h2>
    )
  }
  <div class="grid gap-8 md:grid-cols-3 text-center">
    {
      items.map((item, i) => (
        <div>
          {numbered && (
            <div
              class="w-10 h-10 rounded-full text-white flex items-center justify-center mx-auto mb-4 font-bold"
              style="background-color: var(--aw-color-primary)"
            >
              {i + 1}
            </div>
          )}
          <h3 class="text-xl font-semibold mb-2" style="color: var(--aw-color-text-heading)">
            {item.title}
          </h3>
          <p style="color: var(--aw-color-text-default)">{item.description}</p>
        </div>
      ))
    }
  </div>
</section>
```

- [ ] **Step 2: Use it twice on the homepage**

Replace the "Tri kratka isticaja" section with:

```astro
<ThreeUp
  items={[
    {
      title: 'Analiza prije savjeta',
      description: 'Svaka preporuka proizvoda temelji se na stvarnim rezultatima, ne na pretpostavci.',
    },
    {
      title: 'Jedna osoba, cijeli proces',
      description:
        'Pratim vaš proces od prvog uzorka do gotovog protokola, uvijek ista osoba, uvijek isti kontekst o vašem vinu.',
    },
    { title: 'Edukacija, ne samo upute', description: 'Razumijete zašto, ne samo što.' },
  ]}
/>
```

Replace the "Kako to izgleda" section with:

```astro
<ThreeUp
  heading="Kako to izgleda"
  numbered
  items={[
    { title: 'Dovezete uzorak', description: 'u Zemunik Donji, kad vama odgovara.' },
    { title: 'Dobijete rezultate', description: 'i, ako želite, konkretan protokol temeljen na njima.' },
    { title: 'Pratim vas dalje', description: 'koliko god trebate, uvijek ista osoba.' },
  ]}
/>
```

Add `import ThreeUp from '~/components/client/ThreeUp.astro';` to the frontmatter.

- [ ] **Step 3: Build and visually confirm unchanged**

```bash
npm run build && npm run dev
```

Stop the server after confirming.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor: extract homepage three-up sections into a client component

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: `PricingTable` client component

**Files:**

- Create: `src/components/client/PricingTable.astro`
- Modify: `src/pages/usluge/laboratorijska-analiza.astro` (replace the plain-markup
  price list)

**Interfaces:**

- Produces: `PricingTable` component, `Props { parameters: { name: string; method:
string; unit: string; price: string }[]; packages: { name: string; content: string;
price: string }[]; note: string }`.

This is the "acceptable B3 outcome" the spec calls out: the widgets-bin `Pricing.astro`
hardcodes a `$` symbol and a 3-tier SaaS card layout, wrong shape for a 19-row + 6-row
itemized price list in euros. Built from scratch as a real HTML table, per the style
guide's own Tables spec in `docs/DESIGN.md` (header bg `#4A1B3C`, white header text,
alternating row backgrounds, no vertical borders).

- [ ] **Step 1: Create the component**

```astro
---
// src/components/client/PricingTable.astro
// Built from scratch, not ejected from widgets/Pricing.astro: that widget hardcodes a
// "$" symbol and a 3-tier card layout, wrong shape for an itemized euro price list.
// Table styling follows docs/DESIGN.md's Tables spec (source project's style guide).
interface Props {
  parameters: { name: string; method: string; unit: string; price: string }[];
  packages: { name: string; content: string; price: string }[];
  note: string;
}

const { parameters, packages, note } = Astro.props;
---

<div class="overflow-x-auto">
  <table class="w-full text-sm border-collapse mb-8">
    <thead>
      <tr style="background-color: #4A1B3C;">
        <th class="text-left text-white font-bold px-3 py-2">Parametar</th>
        <th class="text-left text-white font-bold px-3 py-2">Metoda</th>
        <th class="text-left text-white font-bold px-3 py-2">Jedinica</th>
        <th class="text-left text-white font-bold px-3 py-2">Cijena</th>
      </tr>
    </thead>
    <tbody>
      {
        parameters.map((p, i) => (
          <tr style={`background-color: ${i % 2 === 0 ? '#F5F5F5' : '#FFFFFF'}; border-bottom: 1px solid #E8E8E8;`}>
            <td class="px-3 py-2" style="color: #1A1A1A">
              {p.name}
            </td>
            <td class="px-3 py-2" style="color: #1A1A1A">
              {p.method}
            </td>
            <td class="px-3 py-2" style="color: #1A1A1A">
              {p.unit}
            </td>
            <td class="px-3 py-2" style="color: #1A1A1A">
              {p.price}
            </td>
          </tr>
        ))
      }
    </tbody>
  </table>

  <h3 class="text-xl font-semibold mb-4" style="color: var(--aw-color-text-heading)">Paketi analiza</h3>
  <table class="w-full text-sm border-collapse mb-4">
    <thead>
      <tr style="background-color: #4A1B3C;">
        <th class="text-left text-white font-bold px-3 py-2">Paket</th>
        <th class="text-left text-white font-bold px-3 py-2">Sadržaj</th>
        <th class="text-left text-white font-bold px-3 py-2">Cijena</th>
      </tr>
    </thead>
    <tbody>
      {
        packages.map((p, i) => (
          <tr style={`background-color: ${i % 2 === 0 ? '#F5F5F5' : '#FFFFFF'}; border-bottom: 1px solid #E8E8E8;`}>
            <td class="px-3 py-2" style="color: #1A1A1A">
              {p.name}
            </td>
            <td class="px-3 py-2" style="color: #1A1A1A">
              {p.content}
            </td>
            <td class="px-3 py-2" style="color: #1A1A1A">
              {p.price}
            </td>
          </tr>
        ))
      }
    </tbody>
  </table>
  <p class="text-sm" style="color: var(--aw-color-text-muted)">{note}</p>
</div>
```

- [ ] **Step 2: Use it on the lab-analysis page**

Replace the "Cjenik (okvirno)" `<ul>` block in
`src/pages/usluge/laboratorijska-analiza.astro` with the full itemized cjenik from
`COMPANY.md` → Pricing:

```astro
<PricingTable
  parameters={[
    { name: 'Alkohol', method: 'DMA', unit: '%vol', price: '6,00 €' },
    { name: 'Reducirajući šećeri', method: 'Titracijski/rebelein', unit: 'g/L', price: '6,00 €' },
    { name: 'Reducirajući šećeri', method: 'Enzimatski', unit: 'g/L', price: '7,00 €' },
    { name: 'Šećer u moštu', method: 'Refraktometar', unit: 'Baboo', price: '3,00 €' },
    { name: 'pH', method: 'pHmetar', unit: '—', price: '3,00 €' },
    { name: 'Ukupna kiselost', method: 'Titracijski', unit: 'g/L', price: '4,00 €' },
    { name: 'Hlapiva kiselost', method: 'Enzimatski', unit: 'g/L', price: '9,00 €' },
    { name: 'Slobodni SO2', method: 'Titracijski', unit: 'mg/L', price: '5,00 €' },
    { name: 'Ukupni SO2', method: 'Titracijski', unit: 'mg/L', price: '6,00 €' },
    { name: 'Molekularni SO2', method: 'Računski', unit: 'mg/L', price: '10,00 €' },
    { name: 'L-jabučna kiselina', method: 'Enzimatski', unit: 'g/L', price: '20,00 €' },
    { name: 'L-mliječna kiselina', method: 'Enzimatski', unit: 'g/L', price: '20,00 €' },
    { name: 'Antocijani', method: 'Enzimatski', unit: 'g/L', price: '20,00 €' },
    { name: 'Ukupni polifenoli', method: 'Enzimatski', unit: 'g/L', price: '20,00 €' },
    { name: 'L.A.D. (lako asimilirajući dušik)', method: 'Enzimatski', unit: 'g/L', price: '20,00 €' },
    { name: 'Katehini', method: 'Enzimatski', unit: 'g/L', price: '20,00 €' },
    { name: 'Ukupni bakar (Cu)', method: 'Enzimatski', unit: 'mg/L', price: '22,00 €' },
    { name: 'Stabilnost bjelančevina', method: 'Bentotest', unit: 'DA/NE', price: '7,00 €' },
    { name: 'Stab. bjel. + bistrenje', method: 'Bentotest/proba bistrenja', unit: 'g/hL', price: '17,00 €' },
    { name: 'Kalcij', method: 'Enzimatski', unit: 'g/L', price: '22,00 €' },
  ]}
  packages={[
    { name: 'Analiza zrelosti grožđa (mošta)', content: 'Šećer u moštu + pH + uk. kiselina', price: '8,00 €' },
    { name: 'Analiza mošta u fermentaciji', content: 'Red. šećeri + alkohol + pH + uk. kiselina', price: '17,00 €' },
    { name: 'Analiza završetka fermentacije', content: 'Red. šećer + alkohol + uk. kiselina + pH', price: '17,00 €' },
    { name: 'Analiza malolaktike', content: 'Jabučna + mliječna + pH + uk. SO2', price: '42,00 €' },
    { name: 'Razvoj malolaktike', content: 'Jabučna + mliječna kiselina', price: '35,00 €' },
    { name: 'Kontrola vina', content: 'Organoleptička analiza i mišljenje', price: '20,00 €' },
  ]}
  note="10% popusta na narudžbe od više od 10 uzoraka. Cijene su konačne (nisam u sustavu PDV-a)."
/>
```

Add `import PricingTable from '~/components/client/PricingTable.astro';` to the
frontmatter, remove the now-unused `<ul>` block and its "Cjenik (okvirno)" `<h2>`
(the table's own headers replace it, keep the page's `<h1>` and intro paragraph above
it as-is).

- [ ] **Step 3: Build and visually confirm the table renders correctly**

```bash
npm run build && npm run dev
```

Open `localhost:4321/usluge/laboratorijska-analiza`, confirm all 19 parameter rows and
6 package rows render, header background is wine purple with white text, rows
alternate background color. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: build PricingTable component with the real itemized cjenik

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: `ContactForm` client component (Netlify Forms)

**Files:**

- Create: `src/components/client/ContactForm.astro`
- Modify: `src/pages/kontakt.astro` (drop the component in where Task 8 left the
  placeholder comment)

**Interfaces:**

- Produces: `ContactForm` component, no props (the form fields are fixed for this
  build: name, email, phone, message).

Per `SETUP.md` §5: Netlify Forms needs `data-netlify="true"` and a hidden `form-name`
input on the form, plus a static copy of the form markup somewhere in the build for
Netlify's build-time detection. Since this is a static Astro form (no JS framework),
the rendered HTML itself satisfies the static-detection requirement, there's no
separate hidden duplicate needed the way there would be with a client-side-only form
(e.g. a React form that renders nothing at build time). Confirm this holds by checking
the built `dist/kontakt/index.html` in Step 3 below actually contains the literal
`<form name="kontakt" data-netlify="true">` markup, not just a client-side mount point.

- [ ] **Step 1: Create the component**

```astro
---
// src/components/client/ContactForm.astro
// Netlify Forms: data-netlify="true" + hidden form-name input, per SETUP.md section 5.
// This is a static Astro form (no client JS), so the rendered HTML itself is the
// "static copy" Netlify's build-time form detection needs, no separate duplicate.
---

<form name="kontakt" method="POST" data-netlify="true" class="space-y-6 max-w-xl">
  <input type="hidden" name="form-name" value="kontakt" />

  <div>
    <label for="ime" class="block text-sm font-medium mb-1" style="color: var(--aw-color-text-default)"
      >Ime i prezime</label
    >
    <input
      type="text"
      name="ime"
      id="ime"
      required
      class="w-full rounded-md border px-4 py-2"
      style="border-color: var(--aw-color-text-muted)"
    />
  </div>

  <div>
    <label for="email" class="block text-sm font-medium mb-1" style="color: var(--aw-color-text-default)">Email</label>
    <input
      type="email"
      name="email"
      id="email"
      required
      class="w-full rounded-md border px-4 py-2"
      style="border-color: var(--aw-color-text-muted)"
    />
  </div>

  <div>
    <label for="telefon" class="block text-sm font-medium mb-1" style="color: var(--aw-color-text-default)"
      >Telefon (nije obavezno)</label
    >
    <input
      type="tel"
      name="telefon"
      id="telefon"
      class="w-full rounded-md border px-4 py-2"
      style="border-color: var(--aw-color-text-muted)"
    />
  </div>

  <div>
    <label for="poruka" class="block text-sm font-medium mb-1" style="color: var(--aw-color-text-default)">Poruka</label
    >
    <textarea
      name="poruka"
      id="poruka"
      rows="5"
      required
      class="w-full rounded-md border px-4 py-2"
      style="border-color: var(--aw-color-text-muted)"></textarea>
  </div>

  <button
    type="submit"
    class="inline-block rounded-md px-8 py-3 font-semibold text-white"
    style="background-color: var(--aw-color-primary)"
  >
    Pošaljite poruku
  </button>
</form>
```

- [ ] **Step 2: Drop it into the Kontakt page**

In `src/pages/kontakt.astro`, add `import ContactForm from
'~/components/client/ContactForm.astro';` and replace the placeholder comment left in
Task 8 Step 3 with:

```astro
<section class="py-8 max-w-3xl mx-auto px-4 sm:px-6">
  <h2 class="text-2xl font-semibold mb-6" style="color: var(--aw-color-text-heading)">Pošaljite upit</h2>
  <ContactForm />
</section>
```

- [ ] **Step 3: Build and confirm the static form markup is present**

```bash
npm run build
grep -o '<form name="kontakt"[^>]*data-netlify="true"' dist/kontakt/index.html
```

Expected: the grep finds a match (confirms Netlify's build-time detection will see the
form).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: build ContactForm component wired for Netlify Forms

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: `ProtocolStages` client component

**Files:**

- Create: `src/components/client/ProtocolStages.astro`
- Modify: `src/pages/reference.astro` (replace the plain-markup phase list)

**Interfaces:**

- Produces: `ProtocolStages` component, `Props { stages: { name: string; description:
string }[] }`.

- [ ] **Step 1: Create the component**

```astro
---
// src/components/client/ProtocolStages.astro
interface Props {
  stages: { name: string; description: string }[];
}

const { stages } = Astro.props;
---

<ol class="space-y-4 mb-8">
  {
    stages.map((stage, i) => (
      <li class="flex gap-4">
        <div
          class="flex-shrink-0 w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm"
          style="background-color: var(--aw-color-primary)"
        >
          {i + 1}
        </div>
        <p style="color: var(--aw-color-text-default)">
          <strong style="color: var(--aw-color-text-heading)">{stage.name}</strong> — {stage.description}
        </p>
      </li>
    ))
  }
</ol>
```

- [ ] **Step 2: Use it on the Reference page**

Replace the `<ul>` under "Pristup — po fazama" in `src/pages/reference.astro` with:

```astro
<ProtocolStages
  stages={[
    { name: 'Muljača', description: 'trenutna antioksidativna zaštita mošta prije bilo čega drugog.' },
    { name: 'Maceracija', description: 'selektivno izvlačenje plemenitih aroma iz pokožice, bez grubih tanina.' },
    {
      name: 'Preša i flotacija',
      description: 'nadoknada zaštite izgubljene mehaničkom obradom, uz bistrenje mošta prije fermentacije.',
    },
    {
      name: 'Fermentacija',
      description:
        'praćena u koracima (nakon inokulacije, nakon dijela potrošenog šećera, nakon vrenja, kod prvog pretoka), svaki s razlogom: prehrana kvasca, zaštita od stresa kvasca, zaštita od neželjenih bakterija.',
    },
  ]}
/>
```

Add `import ProtocolStages from '~/components/client/ProtocolStages.astro';` to the
frontmatter.

- [ ] **Step 3: Build and visually confirm**

```bash
npm run build && npm run dev
```

Open `localhost:4321/reference`, confirm the four numbered stages render. Stop the
server.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: build ProtocolStages component for the Reference page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: `CookieConsent` component and consent-gated GA4

**Files:**

- Create: `src/components/client/CookieConsent.astro`
- Modify: `src/layouts/PageLayout.astro` is core, **do not edit it**; instead mount the
  component from each page, or (preferred, to avoid touching all seven pages) from a
  thin per-client layout wrapper.
- Create: `src/layouts/ClientLayout.astro` is also arguably core-adjacent; instead, add
  the component directly to each of the 9 page files (`index.astro`, `usluge.astro`,
  the two service pages, `o-nama.astro`, `reference.astro`, `kontakt.astro`,
  `terms.md`/`privacy.md` use `MarkdownLayout` and don't need the banner since they
  carry no tracking-relevant content beyond what's already loaded site-wide, but for
  consistency mount it everywhere GA needs to be able to fire).

**Interfaces:**

- Produces: `CookieConsent` component, no props. Reads/writes
  `localStorage['vinalia-consent']` (`'accepted' | 'declined'`).
- Consumes: nothing from `config.yaml` (deliberately: `googleAnalytics.id` stays
  `null`, this component owns the GA Measurement ID itself, see Global Constraints).

This is the EU-compliance mechanism for the GA4 decision made this session. Because
core's `Analytics.astro` fires GA unconditionally whenever `config.yaml`'s
`googleAnalytics.id` is set, and this repo's hard rule forbids editing
`src/components/common/`, GA is instead loaded entirely from this client-layer
component, gated on an explicit accept click, with no script tag rendered at all
before that. No GA4 property exists yet for Vinalia; `GA_MEASUREMENT_ID` below is a
clearly-labeled placeholder Antun swaps for the real one once the property is created,
same category of pre-launch fill-in as the unverified fields already in `terms.md`.

- [ ] **Step 1: Create the component**

```astro
---
// src/components/client/CookieConsent.astro
// EU cookie-consent gate for GA4 (this session's analytics decision). Loaded
// independently of src/components/common/Analytics.astro (core, unmodified, and left
// unconditional-by-design), since GA must not fire before consent. config.yaml's
// analytics.vendors.googleAnalytics.id is deliberately left null, this component
// owns the Measurement ID itself, and is the ONLY path GA can load through.
---

<div
  id="cookie-consent"
  class="fixed bottom-0 inset-x-0 z-50 p-4 shadow-lg hidden"
  style="background-color: var(--aw-color-bg-page); border-top: 1px solid var(--aw-color-text-muted);"
>
  <div class="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4">
    <p class="text-sm flex-1" style="color: var(--aw-color-text-default)">
      Koristimo kolačiće za analitiku posjeta stranici. Prihvaćate li to?
    </p>
    <div class="flex gap-3 flex-shrink-0">
      <button
        id="cookie-decline"
        type="button"
        class="rounded-md px-4 py-2 text-sm font-medium border"
        style="border-color: var(--aw-color-text-muted); color: var(--aw-color-text-default);"
      >
        Odbijam
      </button>
      <button
        id="cookie-accept"
        type="button"
        class="rounded-md px-4 py-2 text-sm font-medium text-white"
        style="background-color: var(--aw-color-primary);"
      >
        Prihvaćam
      </button>
    </div>
  </div>
</div>

<script>
  // TODO before launch: replace with the real GA4 Measurement ID once the property
  // exists (none does yet for Vinalia as of this build). Placeholder, intentionally
  // invalid, so a forgotten swap fails loudly (404 on the gtag.js request) rather than
  // silently sending data to the wrong property.
  const GA_MEASUREMENT_ID = 'G-PLACEHOLDER';

  function loadGA() {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    }
    // @ts-expect-error: exposing gtag globally is the documented GA4 pattern.
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID);
  }

  const banner = document.getElementById('cookie-consent');
  const stored = localStorage.getItem('vinalia-consent');

  if (stored === 'accepted') {
    loadGA();
  } else if (stored !== 'declined') {
    banner?.classList.remove('hidden');
  }

  document.getElementById('cookie-accept')?.addEventListener('click', () => {
    localStorage.setItem('vinalia-consent', 'accepted');
    banner?.classList.add('hidden');
    loadGA();
  });

  document.getElementById('cookie-decline')?.addEventListener('click', () => {
    localStorage.setItem('vinalia-consent', 'declined');
    banner?.classList.add('hidden');
  });
</script>
```

- [ ] **Step 2: Mount it on every page**

Add `import CookieConsent from '~/components/client/CookieConsent.astro';` and
`<CookieConsent />` (placed once, right before `</Layout>`'s closing tag) to all seven
route pages: `index.astro`, `usluge.astro`, `usluge/laboratorijska-analiza.astro`,
`usluge/enolosko-savjetovanje.astro`, `o-nama.astro`, `reference.astro`,
`kontakt.astro`. Skip `terms.md`/`privacy.md` (Markdown pages using
`MarkdownLayout`, a different layout shape; if `MarkdownLayout` doesn't easily support
mounting an Astro component inline, leave those two pages without the banner, since
they're not pages a first-time visitor typically lands on and GA firing there without
consent is not the realistic risk case, unlike the seven marketing pages).

- [ ] **Step 3: Build and manually test the consent flow**

```bash
npm run build && npm run dev
```

Open `localhost:4321` in a private/incognito window (clean `localStorage`). Confirm
the banner appears at the bottom. Open browser devtools → Network tab, click
"Prihvaćam", confirm a request to `googletagmanager.com/gtag/js?id=G-PLACEHOLDER`
fires (it will 404, that's expected and correct, see the placeholder-ID comment).
Reload the page, confirm the banner does NOT reappear (consent was remembered) and the
GA script request fires again automatically without needing another click. Clear
`localStorage`, reload, click "Odbijam" instead, confirm no `googletagmanager.com`
request fires at all. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: add cookie-consent-gated GA4 loading for the EU client

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

**B3 exit check**: pages unchanged visually from B2 (Task 10-14 are refactors, they
should produce zero visible diff except Task 15, which adds the new consent banner),
now built from `src/components/client/*`.

```bash
npm run build && npm run check
```

---

## Task 16: Fill `src/schema.ts`

**Files:**

- Modify: `src/schema.ts`

**Interfaces:**

- Consumes: `SITE` from `astrowind:config` (already wired by core, unmodified).
- Produces: `organization` object, rendered by `src/components/common/SchemaOrg.astro`
  (core, unmodified).

Per the spec: build against what `src/schema.ts`'s existing shape supports today
(`logo`, `sameAs`, `telephone`, `email`, `priceRange`, `address`, `geo`,
`openingHours`), don't hand-roll a richer custom JSON-LD block. The source draft in
`marketing/seo/schema-localbusiness-draft.md` wants `@type: ["LocalBusiness",
"ProfessionalService"]`, `founder`, `foundingDate`, and `hasOfferCatalog`, none of
which the current `organization` shape or `SchemaOrg.astro` can express. That gap is
logged for sub-project D below, not worked around here.

`geo` stays blank (no coordinates pulled, per spec's explicit out-of-scope list).
`sameAs` stays blank (social accounts not live yet, claiming them is out of scope).
`email` **is** filled, per this session's correction (see Global Constraints: confirmed
live 2026-08-14, more recent than the schema draft's caution note).

- [ ] **Step 1: Fill the object**

```typescript
// Per-client structured data (schema.org). Client layer, like src/brand.ts.
//
// Left as-is, the site emits a safe Organization (name + url, plus logo/sameAs if set).
// Fill in address / telephone / geo / openingHours and it becomes a LocalBusiness, which
// is what most Dodai clients want. Empty fields are dropped, so partial data is fine.
// Rendered by src/components/common/SchemaOrg.astro. Nothing is emitted without SITE.site.
import { SITE } from 'astrowind:config';

export const organization = {
  name: SITE.name,
  url: SITE.site,

  logo: '/vinalia-logo.svg',
  sameAs: [] as string[], // @vinaliaconsulting confirmed as the intended handle (COMPANY.md), accounts not live yet, out of scope for this build.

  telephone: '+385922555835',
  email: 'natalijabrala@vinaliaconsulting.com',
  priceRange: '€€',
  address: {
    streetAddress: 'Ul. I 26',
    addressLocality: 'Zemunik Donji',
    addressRegion: 'Zadarska županija',
    postalCode: '23222',
    addressCountry: 'HR',
  },
  geo: {
    latitude: '',
    longitude: '', // Not pulled yet, per spec's out-of-scope list. Fill from GBP once available.
  },
  openingHours: ['Mo-Fr 08:00-16:00'],
};
```

Note: `logo: '/vinalia-logo.svg'` assumes Task 4 exposed the logo at that public path;
if the actual public URL differs (e.g. the file lives only in `src/assets/` and gets a
hashed build output path rather than a static `public/` path), check
`src/components/common/SchemaOrg.astro`'s `abs()` helper (core, read-only) to confirm
what kind of path it expects (an absolute path from the site root, per the type
comment in the unmodified file), and copy the logo SVG into `public/` if needed so a
stable, unhashed path exists for this field.

- [ ] **Step 2: Build and inspect the emitted JSON-LD**

```bash
npm run build
grep -A 30 'application/ld+json' dist/index.html
```

Expected: a JSON-LD block with `"@type":"LocalBusiness"` (address present upgrades it
from `Organization`), the real name/phone/email/address/hours, no `geo` or `sameAs`
keys (empty fields are dropped per `SchemaOrg.astro`'s `clean()` helper).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: fill src/schema.ts with Vinalia's confirmed LocalBusiness facts

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 17: Verification suite (build, check, links, Lighthouse)

**Files:** none (verification only, fixes applied to whatever it finds).

**Interfaces:** none.

Same bar as any client build per `SETUP.md` §7.

- [ ] **Step 1: Build**

```bash
npm run build
```

Expected: succeeds with no errors.

- [ ] **Step 2: Astro check, ESLint, Prettier**

```bash
npm run check
```

Expected: all three pass. If Prettier fails on any file touched in this plan, run
`npm run fix:prettier` and re-check. If ESLint flags the `CookieConsent.astro` inline
`<script>` (e.g. the `@ts-expect-error` comment, or `window.gtag`/`window.dataLayer`
typing), fix the specific complaint rather than suppressing the rule broadly.

- [ ] **Step 3: Broken links**

```bash
npm run test:links
```

Expected: passes (linkinator crawls `./dist`, checks internal links and asset
references). If it flags a broken internal link, most likely causes given this plan's
own page renames: a leftover `href="/services"` or `href="/pricing"` from copy-pasted
AstroWind demo markup that Task 7 should have removed, or a nav link (Task 5) pointing
to a route that got renamed differently than planned. Fix the specific link.

- [ ] **Step 4: Lighthouse CI**

```bash
npm run test:lhci
```

Expected: accessibility = 100 (hard gate), SEO and best-practices >= 95 (hard gates),
performance is a warning only. If accessibility fails, the most likely causes given
this plan's own markup: a missing `alt` on the logo/photo images (Task 4/8), or a
color-contrast failure (check any inline `style="color: ..."` combination against its
background, particularly `--aw-color-text-muted` text on `--aw-color-bg-page`, using
the browser's accessibility inspector or a contrast-checker tool). Fix the specific
element, don't lower the gate.

- [ ] **Step 5: Manual browser pass**

```bash
npm run dev
```

Walk all seven pages plus dark mode plus mobile width (resize the browser or use
devtools' device toolbar) plus the mobile nav menu (the dropdown built in Task 5).
Confirm the cookie-consent banner (Task 15) still behaves correctly after all the
other B4 changes. Stop the server.

- [ ] **Step 6: Fix anything found, then commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix: address findings from the build/check/links/lighthouse verification pass

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

Skip this commit if Steps 1-5 found nothing to fix.

---

## Task 18: Write the filled `docs/intake.md` and log the D friction items

**Files:**

- Create: `docs/intake.md` (in `vinalia-site`, copied from
  `docs/intake-template.md` and filled)

**Interfaces:** none (documentation-only task; this is the deliverable the spec calls
"something I can use in the future").

Synthesis from already-confirmed facts, per the spec: `COMPANY.md`,
`icp-positioning.md`, `website-sitemap.md`. Two fields stay explicitly blank with a
reason.

- [ ] **Step 1: Copy the template**

```bash
cp docs/intake-template.md docs/intake.md
```

- [ ] **Step 2: Fill it**

```markdown
# Client intake: Vinalia Consulting

## Business

- What the business does, in one sentence: Kemijsko-fizikalna analiza vina i
  savjetovanje u proizvodnji vina, uz zastupništvo za Dalmaciju za asortiman
  Vinoartisa.
- Who the customer is: winemakers in Zadar County and the wider region, no hard
  experience-level filter, current base is aging carryover from the owner's previous
  business (Laboratorij Grgur).
- What makes them different from competitors: analysis always precedes any
  recommendation (never guessed); education, not just instructions, is a stated core
  value; single point of contact through the whole process. Never framed as a contrast
  to named competitors, per the client's explicit guardrail (see Messaging & Voice
  below).
- Competitors / sites they like: Vinolab d.o.o. is the real direct competitor
  (national, lab + consulting + protocol at scale). Institutional labs (IJK Split,
  IPTPO Poreč, HAPIH) exist but treat advisory work as a minor add-on. None of these
  are named in any client-facing copy, per the client's explicit instruction.

## Goal of the site

- Primary action a visitor should take: contact (call, WhatsApp, or the contact form)
  to request an analysis or consultation. No existing funnel to optimize, the goal is
  generating first contact from a new prospect.
- Secondary actions: browsing the itemized price list before reaching out.
- How success is measured: not yet instrumented (see Analytics below); qualitatively,
  more first-contact inquiries than the near-zero baseline from the outdated Google
  Business Profile.

## Pages

- Required pages: Homepage, Usluge (hub), Usluge/Laboratorijska analiza,
  Usluge/Enološko savjetovanje, O nama, Reference, Kontakt. Seven total, confirmed
  final in `website-sitemap.md`.
- Blog needed? No. Not on the client's sitemap.
- Any page with special functionality: Kontakt has a Netlify-wired contact form.
  Usluge/Laboratorijska analiza has a 19-row + 6-row itemized price table (see
  `PricingTable` client component).

## Brand

- Logo files received? Yes, SVG.
- Brand colors (hex): Primary-900 `#4A1B3C`, Primary-700 `#6B2E5A`, Accent-700
  `#A88B3D`, full scale in `Vinalia_Brand_Style_Guide_v2.0.docx` / `docs/DESIGN.md`.
- Fonts / typeface: Arial (system stack) for all UI, no exceptions. Georgia reserved
  for print pull-quotes only, not used on the site.
- Photography / image assets received? Yes: Natalija's photo, a cover/social-preview
  image.
- Tone of voice notes: analysis-driven, educational (explain why, not just what),
  personal/not institutional, regionally rooted. Full detail in Messaging & Voice
  below.

## Domain and infrastructure

- Production domain: vinaliaconsulting.com (confirmed, not yet pointed at this site).
- Who controls DNS? Not established in this build; ask before launch.
- Existing site to migrate content/redirects from? None, first website for this
  business.
- Email provider: not established; the confirmed-live contact address
  (natalijabrala@vinaliaconsulting.com) is the only mail-related fact on record.

## Analytics and legal

- Analytics preference: **GA4**, decided 2026-09-04 (Antun). Because this is an EU
  client, a cookie-consent banner gates GA loading (built as a client component, see
  the implementation plan). No GA4 property exists yet, creating one and swapping in
  the real Measurement ID is a launch-time task, not done in this build.
- Legal entity name (for terms/privacy): Vinalia consulting, Vinski laboratorij, obrt
  za analize i savjetovanje, vl. Natalija Brala.
- Contact email for legal pages: natalijabrala@vinaliaconsulting.com.
- Jurisdiction: Croatia.
- Existing privacy policy / terms to reuse? None; template boilerplate used, flagged
  for real legal review before launch (GDPR, EU client), not done in this build.
- Cookie/consent requirements: GA4 requires the consent banner described above.

## Timeline

- Target launch date: not set.
- Hard deadlines / events: none on record.
- Review cycles expected: Natalija has not yet reviewed this build; nothing here has
  been sent to her (out of scope for this build, per the implementation plan).

## Messaging & Voice

_(New section, added to `docs/intake-template.md` itself in sub-project D; filled here
first as the worked example that motivated adding it.)_

- Core differentiators / messaging pillars: analysis-driven (test first, never
  guess); educational (explain why, not just what); personal, not institutional (one
  person, direct access, no hand-off); regionally rooted (Istria experience brought
  home to Dalmatia).
- Guardrails, what not to say: never compare to Vinolab or any other named competitor,
  explicitly or implicitly, even without naming them; never claim "zastupnik za
  Vason" (the representative claim applies only to Vinoartis); no client testimonials
  or named-client case studies (no consent exists, except the Ante Sladić protocol,
  which is the owner's own work product, cleared to publish with the producer's name
  omitted).
- Real customer language (for FAQ/chat-style copy, not yet used verbatim on the site
  itself): "Imam čudan miris u vinu." / "Mogu li donijeti vino na kontrolu?" / "Možeš
  li mi provjeriti šećere?" / "Donio bih vino na kontrolu, nisam ga još analizirao."
- Anti-persona: none confirmed. The owner accepts all experience levels, no fact-based
  reason to exclude any winemaker in the service area.
```

- [ ] **Step 3: Confirm no OIB/IBAN/SWIFT leaked in**

```bash
grep -iE "OIB|IBAN|SWIFT|HR46|10778410106" docs/intake.md
```

Expected: no output. The Registry Record section of `COMPANY.md` includes banking and
tax-ID identifiers that don't belong in a site-build intake doc (per the spec's
content-safety exclusion) and aren't asked for by the template's own fields.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
docs: write the filled Vinalia intake document

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

**B4 exit check**: `src/schema.ts` filled, the four checks in Task 17 all green, a
visual QA pass done, `docs/intake.md` written. Sub-project B is complete; sub-projects
C (the `golden` branch) and D (feeding lessons back into `dodai-astrowind`) are
separate follow-on work, not part of this plan.

---

## Self-review notes (from writing this plan)

- **Spec coverage**: every named deliverable in the spec's sub-project B section has a
  task: repo bootstrap (Task 1), `init-client` (Task 2), brand + dark-mode derivation
  (Task 3), assets/favicons (Task 4), nav/config (Task 5), all seven pages (Tasks 6-9),
  all "4-5" named client components (Hero, ThreeUp covering both isticaji sections,
  PricingTable, ContactForm, ProtocolStages = Tasks 10-14, five components, within the
  spec's stated range), schema (Task 16), the four verification checks (Task 17), and
  the intake document (Task 18). The GA4 + consent-banner scope (Task 15) wasn't in the
  original spec, it's new scope from this session's analytics decision, called out
  explicitly in Global Constraints rather than silently folded in.
- **Friction-log items for sub-project D, not fixed in this plan** (per the spec's own
  instruction, and this repo's hard rule against mid-build core changes): (1) a
  system-font client isn't a documented path in `SETUP.md` today (Vinalia's `brand.ts`
  in Task 3 works around it by simply not touching `astro.config.ts`, which happens to
  work but isn't documented as supported); (2) `src/schema.ts` / `SchemaOrg.astro`
  can't express `ProfessionalService`, `founder`, `foundingDate`, or
  `hasOfferCatalog`, all of which the source schema draft wants (Task 16 builds
  against what's actually supported today, per the spec); (3) a GA4-for-EU-client
  pattern (unconditional core `Analytics.astro` plus a consent gate that has to live
  entirely in the client layer) is real friction discovered in Task 15, worth
  generalizing into core once a second client needs it.
- **Placeholder scan**: the one deliberate placeholder in the whole plan is
  `GA_MEASUREMENT_ID = 'G-PLACEHOLDER'` in Task 15, which is not a "TBD" left for the
  plan's own sake, it's a real, currently-true fact (no GA4 property exists yet) encoded
  so a forgotten swap fails loudly instead of silently. Everything else uses real,
  sourced content.
