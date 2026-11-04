# Building a client site from this template

This repo is a GitHub **template repo**. Each client site is a fresh repo created from it
with independent history, then built through one workflow of three arcs (Discovery, Build,
Launch), with numbered steps under each. Some steps collapse when the client brings
finished copy or discovery already happened elsewhere; the arcs are a **dependency order,
not a schedule** (arc A and step B1 routinely interleave, since a brand colour feeds
`init-client` while discovery may finish after the repo exists).

This workflow is for a **new** client site. Migrating or relaunching an existing live site
onto this template is a different job: start from `redesign-existing-projects` instead of
A3's fresh-build design direction, since the constraint is preserving what already works,
not inventing a new direction.

See [CONTEXT.md](./CONTEXT.md) for the vocabulary and [AGENTS.md](./AGENTS.md) for
AstroWind architecture. Boundary with
[`docs/client-build-rules.md`](./docs/client-build-rules.md): this file owns the
**sequence**; `client-build-rules.md` owns the **plan-authoring and review house rules**.
Steps B2 and B4 link to it and do not restate it.

## The workflow at a glance

**Arc A: Discovery**

- **A1. Engagement start** -> produces: commercial agreement (outside the repo) -> driven
  by: none
- **A2. Discovery and intake** -> produces: `docs/intake.md` filled, copy status known,
  verbatim-locked text identified, DNS owner, legal path chosen -> driven by:
  `docs/intake-template.md`, `superpowers:brainstorming`
- **A3. Prepare the plan inputs** -> produces: a copy source file at a named path (or
  "client supplied copy, source = X"), a design direction brief, an optional schema draft
  -> driven by: `storybrand-messaging`, `marketing-skills:copywriting` (+
  `marketing-skills:customer-research`), `design-taste-frontend`, `ui-ux-pro-max
  --design-system`

**Arc B: Build**

- **B1. Create and reinitialise the repo** -> produces: client repo with brand surface,
  config, legal placeholders, self-identity docs rewritten, core-edit guard armed ->
  driven by: this file's step B1, `npm run init-client`
- **B2. Write the build plan** -> produces: a numbered task plan, copy referenced by path
  -> driven by: `superpowers:writing-plans`, `docs/client-build-rules.md`
- **B3. Build** -> produces: client components in `src/components/client/`, pages,
  `schema.ts`, `config.yaml` -> driven by: `superpowers:subagent-driven-development`,
  `frontend-design`, `impeccable`, the repo `.agents/skills/*`
- **B4. Verify** -> produces: build green, browser pass, compliance and conversion-UX
  pass, whole-branch review -> driven by: this file's step B4 checklist, `run`,
  `webapp-testing`, `docs/client-build-rules.md` review checklist, `humanizer` on
  build-authored text

**Arc C: Launch**

- **C1. Ship** -> produces: commit + push to the client repo -> driven by: `git commit` +
  `git push`
- **C2. Deploy** -> produces: site live on `*.netlify.app` -> driven by: this file's step
  C2, `docs/go-live.md` §1
- **C3. Client review and pre-launch gates** -> produces: written client sign-off, the
  pre-launch checklist passed -> driven by: `docs/go-live.md` §2 to §3
- **C4. Cutover** -> produces: production domain live, cert provisioned, sitemap submitted
  -> driven by: `docs/go-live.md` §4 to §5
- **C5. Handoff** -> produces: `docs/handoff.md` sent to the client -> driven by:
  `docs/handoff-template.md`

**Where steps collapse:**

- **Client brings finished, approved copy.** A3's message and copy work drops to
  transcription; see the "Short path" callout below.
- **Discovery already done in a prior engagement.** A2 collapses to "link the prior
  material, confirm the copy / verbatim / DNS / legal answers are captured."

## Short path: client brings finished, approved copy

> This is Vinalia's actual path. When the client hands over copy they have written and
> signed off on:
>
> - **A2 still runs.** The copy-status answer flips the shape of everything downstream.
> - **A3 drops `storybrand-messaging` and most of `marketing-skills:copywriting`.** Both
>   become "transcribe verbatim from the client source file into a `content/` file at a
>   named path."
> - **B2 tasks become transcription tasks** (Haiku), each stating "transcribe X from
>   `<path>` lines N to M", never a pasted block.
> - **B4: `humanizer` runs only against build-authored text.** Non-English or
>   regulated copy goes to human review instead of the automated pass.
> - **`design-taste-frontend`, B3, polish, and all of B4's verification stay
>   full-weight.**

## Worked example: the Vinalia build

- **A2 ran**, but out of order: the facts were gathered in a prior engagement and the
  intake was written up afterward.
- **A3 collapsed.** The client brought approved Croatian copy, so `storybrand-messaging`
  and `marketing-skills:copywriting` were skipped and the copy was referenced by source
  file path.
- **B2 and B3 ran as transcription-heavy tasks** with a per-task review (one implementer
  plus one independent reviewer subagent each, approval gate before each dispatch).
- **B4 ran full-weight.** The whole-branch review caught a Critical copy defect that the
  per-task reviews had missed.
- The non-English copy went to **human review, not `humanizer`**.

## Arc A: Discovery

### A1. Engagement start

The commercial agreement is signed. This happens outside the repo; nothing here depends
on it beyond "do not start B1 without it."

### A2. Discovery and intake

Copy `docs/intake-template.md` to `docs/intake.md` and fill it in with the client. It
feeds `superpowers:brainstorming` (discovery) and the copywriting phase. A2 is a full
client interview and is not automated. It establishes: what the site is for, the page
list, the primary action, brand assets, whether the client has drafted and approved copy
(and where the source file lives), any verbatim-locked text, a schema draft if any, and
who controls DNS.

If discovery already happened in a prior engagement, A2 collapses to linking that
material and confirming the copy, verbatim-locked, DNS, and legal answers are captured.

**Legal decision point.** Read `src/pages/terms.md` and `src/pages/privacy.md`. Pick one
path and record it in `docs/go-live.md`:

- (a) client supplies reviewed text,
- (b) reuse an existing policy,
- (c) ship the boilerplate and gate cutover on external legal review (GDPR for EU).

Path (c) is always a launch blocker, never a default-and-forget. If the client has no
policy and needs one, that is external counsel or a reviewed template, and it blocks
cutover.

### A3. Prepare the plan inputs

Run each skill and save its output into `docs/`. None of this is automated. Scale to
project size: a 3-page brochure site does not need customer research or a full polish
pass.

- **`storybrand-messaging`** -> the core narrative and one-liner. Skipped when the client
  brings approved copy.
- **`marketing-skills:copywriting`** (+ **`marketing-skills:customer-research`** if the
  client supplied research) -> page copy. Reduced to transcription when the client brings
  approved copy.
- **`design-taste-frontend`** -> the visual language / anti-slop brief (direction only).
  Runs full-weight regardless of the copy path.
- **`ui-ux-pro-max --design-system`** -> concrete starting tokens (palette, type pairing,
  spacing scale) once `design-taste-frontend` has set the direction. Local CSV lookup, no
  network calls; fold its output into the design direction brief rather than treating it
  as a separate artifact.
- If the client supplied a reference site or screenshot instead of (or alongside) a
  written brief, `image-to-code-skill` (uninstalled; vet before first use) converts it
  into a starting point instead of hand-describing it in prose.

**Required output artifacts before B2 can start:**

- a copy source file at a stated path, or an explicit "client supplied copy, source = X",
- a design direction brief,
- an optional schema draft.

`docs/intake.md` comes from A2.

## Arc B: Build

### B1. Create and reinitialise the repo

#### B1a. Create the repo

1. GitHub -> this repo -> **Use this template** -> new private repo `client-x-site`.
2. `git clone` it, `npm install`, `npm run dev` to confirm it boots.
3. Record the template version: copy the `TEMPLATE_VERSION` value into the new repo's
   first commit message, so you know what base it was built from.

#### B1b. Run `init-client`

Run `npm run init-client` and answer the prompts (client name, domain, legal entity,
contact email, jurisdiction, primary brand colour, whether to drop `_examples/`).

It rewrites `package.json`, `src/config.yaml`, `src/brand.ts` (primary colour only), the
legal-page placeholders, and `README.md`. It strips template-maintenance files
(`golden-baselines/`, `docs/superpowers/`, `docs/retrospectives/`,
`docs/golden-workflow.md`, `.claude/session-summaries/`). It rewrites the CLAUDE /
CONTEXT / AGENTS / SETUP self-identity text so the fork no longer describes itself as the
template. It drops the `.template-repo` marker so `.githooks/pre-commit` arms and blocks
core edits in the client repo.

#### B1c. Manual brand and asset checklist

`init-client` emits this list as `docs/reinit-checklist.md`; tick items there as you go.
This section stays the explained canonical version.

- [ ] `src/brand.ts`: secondary / accent / text / background colours (design phase).
- [ ] `src/brand.ts` `tokens`: the 5 structural knobs (radius, button, section, shadow,
      container). Enums only. Preview the resolved system at `/dev/tokens` (`npm run dev`).
- [ ] Fonts. **Custom typeface:** add each family to `astro.config.ts` `fonts`
      (self-hosted + subset via Astro's Fonts API; include `latin-ext` for
      Croatian/Slavic diacritics), list its `cssVariable` in `src/fonts.ts` to preload
      it, and point `brand.fonts.*` at that variable. **System-font client:** set
      `fonts: []` in `astro.config.ts`, leave `src/fonts.ts` `preloadFonts` empty, and
      point `brand.fonts.*` straight at a system stack. Nothing is fetched or preloaded
      in that case. If headings need a different face, they already read `--font-heading`;
      add an `h1..h6 { font-family: var(--font-heading) }` base rule in `tailwind.css`
      (AstroWind ships none).
- [ ] `src/navigation.ts`: real header/footer nav (currently a placeholder).
- [ ] Logos / assets: replace files in `public/` and `src/assets/images/`; regenerate
      favicons in `src/assets/favicons/` (confirm `favicon.ico` is a valid multi-size
      container); replace `src/assets/images/default.png` (OG image).
- [ ] Logo: drop the logo file in `src/assets/images/`, then set `brand.logo.image` /
      `brand.logo.alt` in `src/brand.ts` (uncomment the import at the top). Set
      `brand.logo.ogPath` to the project-root-relative raster path, such as
      `./src/assets/images/logo.png`, for generated OG cards.
- [ ] `public/robots.txt`, `public/_headers`: check.
- [ ] Blog: leave `apps.blog.isEnabled: false` unless the client wants one. If on,
      replace `src/data/post/example-post.mdx`.
- [ ] Content pages: `src/pages/{index,about,services,pricing,contact}.astro` still hold
      AstroWind demo content; replaced in B3, not by hand here.
- [ ] `src/schema.ts`: fill address / phone / hours if the client is a local business
      (upgrades the JSON-LD to `LocalBusiness`).
- [ ] `ui.theme` in `config.yaml` if the client wants a fixed light/dark mode.

#### B1d. Analytics config

**Analytics vendor: GA4. This is settled.** Set the Measurement ID in `src/config.yaml`
-> `analytics.vendors.googleAnalytics.id`.

For an **EU / GDPR client**, also set `requireConsent: true` there. Core `Analytics.astro`
then defines Consent Mode (everything denied) up front, does not load `gtag/js`, and
exposes `window.awAnalytics.{grant,deny,status}`. Adapt
`src/components/client/CookieConsent.astro` (copy, `/cookies` link) and render it from
`src/components/client/GlobalEmbeds.astro`. GA loads only after the visitor accepts.

### B2. Write the build plan

**Do not start until A3's artifacts exist**: `docs/intake.md`, a copy source file or an
explicit "client supplied copy" pointer, and a design brief.

Write the plan with `superpowers:writing-plans`. Before writing it, read
[`docs/client-build-rules.md`](./docs/client-build-rules.md) for the plan house rules
(the plan's first task confirms each A3 artifact exists at a named path, client copy never
in the plan body, every fact traces to a named source, Files-section paths checked,
source-flagged defects fixed in the brief). Those rules are not restated here.

### B3. Build

Run the plan task-by-task with `superpowers:subagent-driven-development`: one implementer
plus one independent reviewer subagent per task, an approval gate before each dispatch,
Haiku for transcription and Sonnet for judgment. `.githooks/pre-commit` and CI
(build / check / links / lhci) run automatically.

Build rules:

- All per-client design work goes in `src/components/client/`. Copy from the parts bin
  (`src/components/widgets/`) as a starting point; never edit the parts bin or template
  core.
- Brand colours and fonts come only from `src/brand.ts`.
- Site-wide client embeds (cookie banner, chat widget, extra pixels) go in
  `src/components/client/GlobalEmbeds.astro`. Core `Layout.astro` renders it once at the
  end of `<body>`. It is the only sanctioned way to inject something on every page.
- If you need a change in template core, generalise it properly or make it a client
  component; do not just edit core.
- Contact forms: copy `src/components/client/ContactForm.astro`; the pattern and the
  non-Netlify swap-ins are in [`docs/forms.md`](./docs/forms.md).

Skills used in-step: `frontend-design` (client components + pages built to the brief),
`impeccable` (critique + fixes: type, spacing, hierarchy, motion, responsive, a11y),
`ui-ux-pro-max --domain <accessibility|forms|touch|performance>` (checklist-driven pass
alongside `impeccable`'s broader critique), and the repo `.agents/skills/`: `add-page`,
`add-component`, `styling`, `add-blog-post` (how this template wants pages / components /
styles added). Conditional: `dataviz` if the site has charts or stat tiles;
`emil-design-eng` for motion-heavy builds only.

### B4. Verify

1. `npm run build` succeeds.
2. `npm run check` passes (astro check + ESLint + Prettier).
3. `npm run test:links` passes (broken internal links / assets).
4. `npm run test:lhci` passes (performance >= 0.90, accessibility 1.00, best-practices >= 0.95,
   SEO >= 0.95 for public routes).
   - If `src/brand.ts` sets `light.bgPage` to anything other than white, re-run this
     check. Template-core text colours are only validated against white; colours that
     pass on white can fail on a tinted background. Example: Vinalia's cream `bgPage`
     (#F5F3F0) dropped these colours' contrast from 4.8:1 to 4.3:1 (below the 4.5:1
     minimum). Fixed by darkening one Tailwind shade each (text-gray-500 to
     text-gray-600, text-slate-500 to text-slate-600), per commit 6d56f9b.
5. Browser: homepage, blog (if enabled), dark mode, mobile menu. Use `run` and
   `webapp-testing`.
6. Analytics `dist/` check: with `requireConsent: true`, the initial HTML in `dist/` must not
   contain `googletagmanager.com/gtag/js`.

Complete the [client quality gates](docs/quality-gates.md), then attach the review record and cited evidence before B4 is marked complete.

CI (`.github/workflows/actions.yaml`) runs the portable gates: build, check, test:quality,
test:routes, test:analytics, test:links, and test:lhci. See
[client quality gates](docs/quality-gates.md) section 1 for the full local sequence and CI
split. A pre-commit hook (`.githooks/pre-commit`, wired by `npm install`, armed in client
repos once `init-client` drops `.template-repo`) runs the fast subset and blocks core
edits; bypass with `git commit --no-verify`.

## Arc C: Launch

### C1. Ship

Commit and push to the client repo.

### C2. Deploy

Default is **Netlify**. `netlify.toml` is at the repo root. Alternate targets are in
[`deploy/`](./deploy/README.md). Follow `docs/go-live.md` §1 for the Netlify site setup.

Contact form: Netlify Forms needs `data-netlify="true"` and a hidden `form-name` input on
the form, plus a static copy of the form markup for Netlify's build-time detection.
Without both, the form 404s on submit.

### C3. Client review and pre-launch gates

Follow `docs/go-live.md` §2 to §3. Password-protect the Netlify site, send the
`*.netlify.app` URL plus password, get written sign-off on content and design, then run
the pre-launch checklist: `site.site` is the final production domain; favicons / OG /
logos are the client's; `robots.txt` and `metadata.robots.index` allow indexing; legal
pages reviewed and approved by the client; a real contact-form submission arrives;
`src/schema.ts` filled for a local business; 404 renders; `config.yaml` has the real GA4
id and the preview receives hits (after accepting, for an EU client).

### C4. Cutover

Follow `docs/go-live.md` §4 to §5: add the custom domain, set the DNS records without
touching `MX` / `TXT`, let Netlify provision the certificate, remove the site password,
confirm both apex and `www` resolve with the right redirect direction, and submit the
sitemap in Google Search Console. Record the launch date and the `TEMPLATE_VERSION` value
in the repo.

### C5. Handoff

Fill in `docs/handoff-template.md`, copy it to `docs/handoff.md`, and send it to the
client.

## Appendix: testing a template-core change

Before changing anything in `src/layouts/`, `src/utils/`,
`src/components/{ui,common,blog}/`, or the config system, test the change against a real
built site: see [docs/golden-workflow.md](./docs/golden-workflow.md). One-time setup:
`npx playwright install chromium` (Chromium only; the `playwright` package itself is
already a devDependency).

## Bilingual (HR + EN)

Out of scope for now. Single language per site. Revisit if a client needs it; AstroWind's
i18n would need testing and a documented pattern.
