# Template changelog

Version of the template a client site was built from is recorded in `TEMPLATE_VERSION`.
When you change template core, bump the version here and in that file.

## Unreleased

- `npm run init-client`: interactive reinit script (`scripts/init-client.mjs`). Rewrites
  `package.json`, `config.yaml`, `brand.ts` primary color, `README.md`, and fills the
  legal-page placeholders.
- `src/pages/terms.md` and `privacy.md` converted to placeholder templates (`{{...}}`
  tokens) with a "not legal advice" banner.
- CI quality gates in `.github/workflows/actions.yaml`: shared route coverage,
  `npm run test:links` (linkinator, broken internal links), and three-run Lighthouse CI
  hard gates (performance >= 90, a11y = 100, SEO / best-practices >= 95). SEO >= 0.95
  applies to public routes only; noindex and dev routes skip the SEO category. Config in
  `quality-routes.json`, `lighthouserc.cjs`, and `linkinator.config.json`.
- Pre-commit hook (`.githooks/pre-commit`, wired via the `prepare` script) running
  `astro check` + Prettier.
- Removed the `Blog` link from the placeholder `navigation.ts` (add back when the blog is
  on); fixed a non-descriptive CTA link on the demo About page.
- `.github/dependabot.yml`: weekly npm + github-actions updates, grouped.
- Structured data: `src/schema.ts` (per-client, client layer) + `SchemaOrg.astro` rendered
  in `Layout.astro`. Emits `Organization` by default, `LocalBusiness` once an address is set.
  No output without `site.site`.
- Doc templates in `docs/`: `intake-template.md`, `handoff-template.md`, `go-live.md`.

## 0.1.0 (2026-09-04)

Initial Dodai template, forked from AstroWind.

- Added `CONTEXT.md` (vocabulary) and `SETUP.md` (per-client workflow).
- Established the parts-bin / `src/components/client/` split; core is off-limits per build.
- Single brand surface: `src/brand.ts` (colors + fonts), read by `CustomStyles.astro`.
- Blog off by default (`apps.blog.isEnabled: false`).
- Netlify is the default deploy target. Vercel / Docker / nginx moved to `deploy/`.
- Removed the bundled Decap CMS (`public/decapcms/`).
- AstroWind demo pages (`homes/`, `landing/`) moved to `src/pages/_examples/` (not routed).
- Blog demo posts trimmed to one draft reference (`src/data/post/example-post.mdx`).
- Reset `src/navigation.ts` and `README.md`; renamed the npm package.
- Blanked the AstroWind promo `Announcement` bar; it renders nothing until a client fills it.
- Header RSS link now shows only when the blog is enabled (`PageLayout.astro`).
- Pinned `.nvmrc` to `22.22.3`.
