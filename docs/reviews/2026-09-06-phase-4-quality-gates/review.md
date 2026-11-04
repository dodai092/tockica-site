# Phase 4 quality review: Dodai AstroWind template

**Verdict: PASS.** All 13 applicable manual rubric criteria pass, the automated
gate's real stages pass, and one criterion is not applicable. The sitemap defect
found by the original review (the `noindex` route `/thank-you` appeared in the
built sitemap) was fixed under an owner-authorized scoped exception to the "no
core edits" rule, commit `47d2ade`, and re-verified. Both loose ends are now
closed: the `src/pages/thank-you.astro` widget-import finding was resolved
post-merge in `0ff243d`, and the Lighthouse-scope exception was closed on
2026-09-07 by a full 33-run matrix on the post-merge head (0 assertion failures,
every gated category at median 1.00 bar `/dev/og/` performance 0.98), run after
the CI Lighthouse `--no-sandbox` fix (`2014552`).

This is a template-maintenance review (no client), run against the production
build and preview of the `phase4-quality-gates` worktree.

## Metadata

| Field                                            | Value                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reviewed source commit                           | Rubric assessed at `b84209e` ("docs: fix quality policy and links per review") built state, review record at `728c417`. The branch head then advanced by one authorized fix, `47d2ade` ("fix: exclude noindex routes from the sitemap"); the "Noindex/dev metadata and sitemap exclusion" row was re-verified at `47d2ade`. No other row was re-assessed. |
| Working-tree state                               | Dirty, non-source only: ` M .claude/session-summaries/INDEX.md`, `?? .claude/session-summaries/2026-09-07-140800-4f7a.md` (both pre-existing, unrelated to Phase 4), plus `?? docs/reviews/` (this review's own evidence tree, committed by this task). No source, config, or test file is dirty.                                                         |
| UTC run time                                     | Rubric preview pass 2026-09-07T12:45:14Z. Automated gate captured by Task 5a on 2026-09-07 at approx 12:35Z (from `evidence/commands/verify.txt` mtime 2026-09-07T12:35:30Z; the sampled Lighthouse reports are timestamped 12:37Z to 12:39Z). Post-review sitemap remediation (`47d2ade`) verified 2026-09-07, commit authored 2026-09-07T13:25:29Z.     |
| Manifest hash (SHA-256 of `quality-routes.json`) | `d2de466ffc21ce2950c8571087d3f037ba325317c3d024d7da6318ca9db88bb4`                                                                                                                                                                                                                                                                                        |
| Lockfile hash (SHA-256 of `package-lock.json`)   | `eb27c092f84aae9794e6f1b80d477ba1fdbde3fa253a9c3fa7d8dd7d66a1811d`                                                                                                                                                                                                                                                                                        |
| Node.js                                          | v26.7.0                                                                                                                                                                                                                                                                                                                                                   |
| Playwright                                       | 1.62.1                                                                                                                                                                                                                                                                                                                                                    |
| Browser / renderer                               | Chromium "Google Chrome for Testing 151.0.7922.34" (Playwright 1.62.1)                                                                                                                                                                                                                                                                                    |
| LHCI                                             | 0.15.1                                                                                                                                                                                                                                                                                                                                                    |
| npm / package manager                            | npm 11.19.0 (Node 26.7.0)                                                                                                                                                                                                                                                                                                                                 |
| OS / architecture                                | darwin / arm64 (local hard gate; CI subset runs ubuntu-24.04 / Node 22.22.3)                                                                                                                                                                                                                                                                              |
| Baseline commit (approved screenshots)           | `bf6f45018432822e0180052fa2a92dd91a18eebc`                                                                                                                                                                                                                                                                                                                |

### Commands run and observed exit codes

| Command                        | Exit         | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run build`                | 0            | 12 pages built. Pre-existing benign warnings: `[astro-icon] Failed to load icons from "src/icons": ENOENT` (no `src/icons/` dir); `/rss.xml (file not created, response body was empty)` (blog disabled).                                                                                                                                                                                                                                                                                                           |
| `npm run check`                | 0            | astro-check 0 errors / 0 warnings / 1 hint (unused `require` in `tests/quality-gates.test.mjs:9`), eslint clean, prettier clean, init-client 22/22.                                                                                                                                                                                                                                                                                                                                                                 |
| `npm run test:quality`         | 0            | tests 9 / pass 9 / fail 0.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `npm run test:routes`          | 0            | "Quality route manifest covers the production HTML inventory."                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `npm run test:analytics`       | 0            | pass 7 / fail 0 (inside `verify` and standalone). No EPERM.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `npm run test:links`           | 0            | "Successfully scanned 16 links", no broken links.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `npm run test:lhci`            | 0 (inferred) | **Sampled, not the full 33-run matrix.** See Automated gate + Exceptions. `lhci autorun --numberOfRuns=1` on `/`, `/contact/`, `/thank-you/`, `/dev/components/`; `assertion-results.json` = `[]` (0 failed assertions). Exit 0 is inferred, not directly observed: the `tee` pipeline in Task 5a lost `PIPESTATUS`, but the empty assertion-results file, "Done running autorun." with no error, and an isolated follow-up `lhci autorun` returning `$? = 0` all agree. This matches how the 5a report phrases it. |
| `npm run screenshot:check`     | 0            | All 66 shots match `golden-baselines/`. No `golden-baselines-diff/` produced.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `git diff --check`             | 0            | Clean (no whitespace errors, no conflict markers).                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `git diff --check main...HEAD` | 0            | Clean.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

No stage required the sandbox to be disabled.

### Post-review remediation

| Commit    | What                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `47d2ade` | "fix: exclude noindex routes from the sitemap" (authored 2026-09-07T13:25:29Z). Owner-authorized scoped exception to the "no core edits" rule. Edits the `@astrojs/sitemap` `filter` in `astro.config.ts` to also drop routes classified `noindex` or `dev` in `quality-routes.json` (read directly, tolerant of an empty manifest for client repos). Re-verified: a clean `npm run build` produces `dist/sitemap-0.xml` with 7 public `<loc>` entries and no `/thank-you`, no `/dev/*`. |
| `0ff243d` | "fix: use the client-layer HeroText on the thank-you page" (post-merge). Resolves Finding 2. `src/pages/thank-you.astro` now imports `~/components/client/HeroText.astro` like every other starter page instead of the parts-bin widget; `tests/starter-page-boundary.test.mjs` extended to cover `thank-you.astro`. Rendered output pixel-identical (`screenshot:check` 66/66).                                                                                                         |

## Automated gate

**Ran fully, real gates, all exit 0:** `build`, `check`, `test:quality` (9/9),
`test:routes`, `test:analytics` (7/7), `test:links`, `screenshot:check` (66/66).
(`test:lhci` also completed with no error, but its exit code is inferred rather
than directly observed, see the note in the commands table and under Lighthouse
below.)
Machine evidence: [`evidence/commands/verify.txt`](evidence/commands/verify.txt),
[`evidence/commands/test-analytics.txt`](evidence/commands/test-analytics.txt),
[`evidence/commands/screenshot-check.txt`](evidence/commands/screenshot-check.txt),
[`evidence/environment.json`](evidence/environment.json),
[`evidence/analytics/events.json`](evidence/analytics/events.json).

**Lighthouse: SAMPLED, not exhaustive.** At the user's mid-task direction the
full 33-run matrix (11 routes × 3 runs) was **not** executed. What ran:

- A reduced `lhci autorun --numberOfRuns=1` over 4 representative routes: `/`
  (public/heavy), `/contact/` (public + form), `/thank-you/` (noindex),
  `/dev/components/` (dev). All derived assertions green; every gated category
  median **1.00** (perf 1.00, a11y 1.00, best-practices 1.00, seo 1.00 on the two
  public routes). Reports:
  [`evidence/lighthouse/`](evidence/lighthouse/),
  [`evidence/commands/test-lhci-sampled.txt`](evidence/commands/test-lhci-sampled.txt).
  Sub-threshold SEO on `/thank-you/` (0.66) and `/dev/components/` (0.69) is
  expected and ungated, because the config only asserts SEO for `kind === 'public'`.
- A partial full-config run (`numberOfRuns=3`) on `/`, `/about/`, `/services/`
  was started inside `verify`, then SIGTERM-terminated per the scope change. Its
  9 preserved reports all score **1.00** in every category including SEO:
  [`evidence/lighthouse/interrupted-full-run/`](evidence/lighthouse/interrupted-full-run/).

This is recorded as a scope **exception** (below), not a full-matrix pass. Every
Lighthouse number actually observed is at the ceiling, well above the thresholds
(perf 0.90, a11y 1.00, bp 0.95, seo 0.95); no route approached a floor.

**Blog:** disabled in `src/config.yaml`. No blog routes exist in `dist/`, none in
the route manifest, `/rss.xml` is intentionally empty. No blog review was
performed because there is no blog. This is recorded truthfully, not as a passing
blog review.

## Manual rubric

Route classes inspected via `astro preview` (127.0.0.1:4325) driven with
Playwright 1.62.1 / Chrome for Testing 151, at 375 / 768 / 1440 widths in light
and dark, plus DOM audits over every built route:

- Public: `/`, `/about`, `/services`, `/pricing`, `/contact`, `/privacy`, `/terms`
- noindex: `/thank-you`
- dev: `/dev/components`, `/dev/og`, `/dev/tokens`
- error document: `dist/404.html` (`/404`)

(Preview serves paths without a trailing slash; `trailingSlash: 'never'`.)

| Criterion                                                      | Status         | Evidence and finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Absence reason or exception owner/reason/expiry/follow-up                                             |
| -------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Hierarchy, reading measure, spacing                            | pass           | `screenshot:check` 66/66 match ([`evidence/commands/screenshot-check.txt`](evidence/commands/screenshot-check.txt)). Cited captures: [`evidence/screenshots/home-http-1440-dark.png`](evidence/screenshots/home-http-1440-dark.png), [`evidence/screenshots/contact-http-375-light-form-consent.png`](evidence/screenshots/contact-http-375-light-form-consent.png), [`evidence/screenshots/thank-you-http-1440-light-success.png`](evidence/screenshots/thank-you-http-1440-light-success.png). Single constrained content measure, consistent vertical rhythm on all classes.                                                                                                                                                                                                                                                                                                                                 |                                                                                                       |
| Responsive layout, overflow, image crops, tap targets          | pass           | DOM layout audit at 375px on all 12 routes: `documentElement.scrollWidth - 375 = 0`, zero elements overflowing the viewport. `screenshot:check` covers 375/768/1440 × light/dark, 66/66. Finding (minor, not blocking): 9 interactive elements on `/contact` render below 24×24 CSS px (footer icon links + theme toggle), flagged against WCAG 2.5.8 (AA, advisory) target-size. Pre-existing AstroWind footer, unchanged by Phase 4.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |                                                                                                       |
| Dark mode                                                      | pass           | [`evidence/screenshots/home-http-1440-dark.png`](evidence/screenshots/home-http-1440-dark.png): `body` background `rgb(3, 6, 32)`, readable contrast, no unstyled regions. `screenshot:check` includes 33 dark-scheme shots, all match.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |                                                                                                       |
| Keyboard traversal and visible focus                           | pass           | Tab traversal on `/` and `/contact`: focus reaches logo, menu toggle, nav links, CTA, all form fields and the submit button in DOM order; every focused element shows a visible ring (`outline-style: auto`, UA focus ring; CTA also carries a `box-shadow` ring). `/404` "Back to homepage" link is focusable with a visible ring. Finding (minor): the template ships no skip-to-content link; nav is short and `main`/`nav`/`footer` landmarks are present on all content pages.                                                                                                                                                                                                                                                                                                                                                                                                                             |                                                                                                       |
| Modal/banner escape and footer cookie settings                 | not applicable | The template starter ships no cookie-consent banner, no consent modal, and no "cookie settings" footer control. The analytics bridge _supports_ a `window.awAnalytics` consent gate but no consent UI is bundled. GA4 + consent UI is per-client Launch-phase wiring (`docs/go-live.md`). Nothing to escape or revoke in the shipped starter.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Feature absent from the template starter by design; added per client at Launch.                       |
| Heading order, landmarks, labels, form errors                  | pass           | DOM audit across all 12 routes: exactly one `h1` on every public page and on `/thank-you`; no skipped heading levels anywhere; `main` + `nav` + `footer` landmarks present on all content pages. `/contact` form: `name`, `email`, `message`, `consent` each have an explicit `<label for>`; the Netlify honeypot `bot-field` is wrapped in a visually-hidden label; all four user fields are `required`, so native browser validation surfaces errors. Findings (minor, acceptable): `dist/404.html` leads with `h2` and has no `main`/`nav`/`footer` (Astro minimal error doc; policy checks 404 for appearance + keyboard only); `/dev/components` has 3 `h1` (component-sample harness, dev-only).                                                                                                                                                                                                          |                                                                                                       |
| 200% zoom, reduced motion, contrast                            | pass           | Reflow: no horizontal scrollbar at 375px CSS width on any route (audit above), a stricter narrow-viewport reflow test than 200% zoom of a 1440 layout (~720 CSS px). Note: browser zoom itself was not exercised; the 375px no-overflow result plus Lighthouse contrast were used as the proxy for this row. Reduced motion: the only large or continuous motion is CSS `scroll-behavior: smooth`, correctly gated behind `@media (prefers-reduced-motion: no-preference)` via the `motion-safe:` variant (`dist/_astro/Layout.*.css`). No JS-driven scroll-reveal or `matchMedia` motion code is present in the build, so there is nothing further to suppress. Contrast: Lighthouse accessibility (which runs `color-contrast`) = 1.00 on all 4 sampled routes and on `/`, `/about`, `/services` in the partial full run.                                                                                     |                                                                                                       |
| Form privacy notice or required consent                        | pass           | `/contact` form has a `required` consent checkbox labelled "I agree to the privacy policy." with the phrase "privacy policy" linking to `/privacy`. Visible in [`evidence/screenshots/contact-http-375-light-form-consent.png`](evidence/screenshots/contact-http-375-light-form-consent.png); confirmed in the form DOM audit (`input#consent[type=checkbox][required]`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |                                                                                                       |
| Styled success state and confirmed delivery evidence           | pass           | [`evidence/screenshots/thank-you-http-1440-light-success.png`](evidence/screenshots/thank-you-http-1440-light-success.png): `/thank-you` renders a styled hero success state ("Thank you" then "Your message has been sent...") with a "Back to home" link, `noindex, nofollow`. Confirmed backend delivery is an external per-client gate (policy §7): the starter Netlify form has no confirmed-success callback, so `generate_lead` is correctly left uninstrumented (policy §6).                                                                                                                                                                                                                                                                                                                                                                                                                            | Delivery confirmation is an external gate performed during each client's Launch, not in the template. |
| Noindex/dev metadata and sitemap exclusion                     | pass           | Meta robots is correct everywhere: `dist/thank-you/index.html` and all three `dist/dev/*/index.html` carry `<meta name="robots" content="noindex, nofollow">`; public pages carry `index, follow`. Sitemap exclusion: the original review found `/thank-you` in `dist/sitemap-0.xml`; commit `47d2ade` changed the `@astrojs/sitemap` `filter` in `astro.config.ts` to derive `noindex`/`dev` exclusions from `quality-routes.json` (the single route-classification source). Re-verified at `47d2ade`: a clean `npm run build` produces `dist/sitemap-0.xml` with 7 public `<loc>` entries only (`/`, `/about`, `/contact`, `/pricing`, `/privacy`, `/services`, `/terms`), no `/thank-you`, no `/dev/*`. See "Post-review remediation" above.                                                                                                                                                                 |                                                                                                       |
| Favicon and OG assets                                          | pass           | Favicon (`/_astro/favicon.CGiRCjPI.ico`) present on all 12 routes. Dedicated OG images (`/og/*.png`, 1200×630) for all 7 public routes and `/thank-you`. Finding (minor): `/privacy`, `/terms`, `/dev/*` and `/404` fall back to the generic AstroWind default JPG for `og:image` rather than a dedicated card, acceptable (legal pages are low-share; dev/404 are `noindex`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |                                                                                                       |
| Consent states, revocation, payloads, submit/success semantics | pass           | [`evidence/analytics/events.json`](evidence/analytics/events.json) (7 sanitized `['event', name, params]` tuples) + [`evidence/commands/test-analytics.txt`](evidence/commands/test-analytics.txt) (gtag-spy browser run, 7/7). The bridge emits only when `awAnalytics.status()` returns exactly `granted`, re-checks on every event (immediate revocation), fails closed when the consent API is missing, and forwards no personal data. Rejected inputs (email/phone/URL/free text/unknown slug/over-length) produce `[]`. `contact_submit` (attempt) vs `generate_lead` (only on `aw:lead-success` after backend confirmation) is enforced; a bare submit or a direct `/thank-you` load emits no lead. Finding (expected): the starter `/contact` form carries no `data-aw-event` attributes, so it is intentionally uninstrumented pending per-client wiring; the bridge mechanism itself is fully tested. |                                                                                                       |
| Screenshot diffs and intended baseline refreshes               | pass           | `screenshot:check` 66/66 match, no `golden-baselines-diff/` directory produced ([`evidence/commands/screenshot-check.txt`](evidence/commands/screenshot-check.txt)). This branch **adds** (does not refresh) baselines for the new dev-harness routes: `golden-baselines/dev-components/*`, `golden-baselines/dev-og/*`, `golden-baselines/dev-tokens/*` (18 PNGs). It also **deletes** `golden-baselines/routes.json` (the old per-runner screenshot manifest), now replaced by the root `quality-routes.json`; `tests/init-client-visual-baseline.test.mjs` asserts that file is gone. No existing baseline pixels changed. Reason for the additions: `/dev/og` and `/dev/tokens` routes were added in the Phase 3/4 client layer and captured fresh.                                                                                                                                                         |                                                                                                       |
| 404 appearance and keyboard use                                | pass           | [`evidence/screenshots/404-http-1440-light.png`](evidence/screenshots/404-http-1440-light.png): centered "404 / Sorry, we couldn't find this page." with a bordered "Back to homepage" button. The button is keyboard-focusable with a visible focus ring. Rendered from `dist/404.html`. Minor structural note carried in the heading/landmark row above.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |                                                                                                       |

**Rubric totals: 13 pass, 0 fail, 1 not applicable (14 rows).** One scope
exception (Lighthouse coverage) is recorded against the automated gate, below.
The "Noindex/dev metadata and sitemap exclusion" row passes as of the
post-review remediation `47d2ade`; every other row was assessed at the
`b84209e` built state.

## Exceptions

### Lighthouse coverage: reduced scope for this review (CLOSED 2026-09-07)

**Closed.** The full 33-run matrix (11 routes x 3 runs) was run on the post-merge
head after the CI Lighthouse fix (`2014552`, `--no-sandbox`). `assertion-results.json`
is `[]` (0 failures). Every gated category is at median 1.00 except `/dev/og/`
performance at 0.98, well above the 0.90 floor. Evidence:
[`evidence/lighthouse/full-matrix-2026-09-07/`](evidence/lighthouse/full-matrix-2026-09-07/)
(`assertion-results.json`, per-run `lhr-*.json`, `medians.json`). The reduced-scope
record below is kept for history.

| Field     | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Owner     | Antun (antun@dodai.io)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Reason    | The user directed a reduced Lighthouse scope for this template-maintenance review. Instead of re-running the full 33-run matrix (11 routes × 3 runs), Lighthouse ran a 4-route × 1-run sample (`/`, `/contact/`, `/thank-you/`, `/dev/components/`) plus a preserved partial 3-run run of `/`, `/about/`, `/services/`. Every gated category on every route actually measured scored 1.00; all derived assertions passed. A full 33-run matrix ALREADY passed at Task 1 (commit `11402b7`, lowest performance median 0.98) on materially the same config; the only rendering-relevant change since is Task 3's small inline `AnalyticsEvents` script. The exhaustive matrix was not re-run against the current head, so its per-route medians for HEAD were not produced. |
| Expiry    | 2026-12-07                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Follow-up | Project-local task: "run a fresh full 33-run Lighthouse matrix on the template before the first client go-live".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

Per policy §7 this exception documents an accepted coverage limitation; it does
**not** mark any Lighthouse assertion as passed beyond what was observed, and it
does not lower a threshold.

## Findings

1. **`/thank-you` was in the production sitemap. RESOLVED.** The original review
   found `dist/sitemap-0.xml` listing `<loc>https://astrowind.vercel.app/thank-you</loc>`
   for a route served `<meta name="robots" content="noindex, nofollow">`, two
   contradictory signals for the same URL. Root cause: the `@astrojs/sitemap`
   `filter` in `astro.config.ts` excluded only `/dev/` and configured taxonomy
   prefixes; `noindex` pages such as `thank-you` were not excluded. Fixed in
   commit `47d2ade` (owner-authorized scoped exception to the "no core edits"
   rule): the filter now also drops routes classified `noindex` or `dev` in
   `quality-routes.json`. Re-verified, see "Post-review remediation" and the
   rubric row.

2. **`src/pages/thank-you.astro` imported a widget directly. RESOLVED (post-merge).**
   It did `import HeroText from '~/components/widgets/HeroText.astro'` and composed
   it straight into the page, violating the repo hard rule "`src/components/widgets/`
   is a parts bin: copy from it, never edit it, never compose it directly into a
   client page." It was **pre-existing** (not in `git diff main...HEAD`), not one of
   the 14 rubric criteria, and did not block this review. Deferred at review time,
   then fixed in commit `0ff243d`: `thank-you.astro` now imports
   `~/components/client/HeroText.astro` like every other starter page, and
   `tests/starter-page-boundary.test.mjs` was extended to cover it. See
   "Post-review remediation".

## Changed-path audit

```
git diff --check                 -> exit 0 (clean)
git diff --check main...HEAD      -> exit 0 (clean)
git diff --name-only             -> .claude/session-summaries/INDEX.md   (pre-existing, unrelated)
git status --short               ->  M .claude/session-summaries/INDEX.md
                                    ?? .claude/session-summaries/2026-09-07-140800-4f7a.md
                                    ?? docs/reviews/
```

`git diff --name-only main...HEAD` (48 files) touches: `.github/workflows/`,
`.prettierignore`, `CHANGELOG.md`, `README.md`, `SETUP.md`, `docs/**`,
`golden-baselines/dev-*` (added), `golden-baselines/routes.json` (deleted), `lighthouserc.cjs`,
`package.json` / `package-lock.json`, `quality-routes.json`, `scripts/**`,
`src/components/client/**` (AnalyticsEvents.astro, GlobalEmbeds.astro,
analytics-events.ts, README.md), `tests/**`.

- **No prohibited core path is touched by the Phase 4 work itself.** Explicit
  scan for `src/layouts/`, `src/utils/`, `src/components/{ui,common,blog,widgets}/`,
  `vendor/`, `astro.config*`, `src/content/`, `src/config*` over the 48-file
  Phase 4 diff returns nothing. The only `src/` changes there are under
  `src/components/client/`, the sanctioned per-client location.
- **One deliberate exception, after this diff:** commit `47d2ade` edits
  `astro.config.ts` (a prohibited file) to fix the sitemap defect, as an
  owner-authorized scoped exception. It touches only the sitemap `filter` and
  adds a `quality-routes.json` read; no other config surface changed.
- **No widget edits.**
- Baseline PNG changes are additions for new dev routes only (see rubric row 13),
  not refreshes of existing baselines.
- Every rubric row cites evidence that resolves to a file committed under
  `docs/reviews/2026-09-06-phase-4-quality-gates/` (this commit) or to a
  repository path.
- Automated results are reported as observed (Task 5a machine evidence); the
  sampled Lighthouse run is not represented as a full-matrix pass.
- The one recorded exception (Lighthouse scope) is not treated as a pass and has
  all four required fields.

## Local working changes

The review ran with a dirty working tree limited to non-source files:
` M .claude/session-summaries/INDEX.md` and
`?? .claude/session-summaries/2026-09-07-140800-4f7a.md` are pre-existing session
bookkeeping unrelated to Phase 4 (the Task brief anticipated two untracked
session summaries; the tree currently shows one untracked plus one modified
INDEX.md). `?? docs/reviews/` is this review's own evidence tree, committed by
this task. No source, config, test, or baseline file was dirty during the review,
so the rubric reflects commit `b84209e` as built, with the single exception of
the "Noindex/dev metadata and sitemap exclusion" row, which was re-verified
against the `47d2ade` build after the authorized sitemap fix.

## Conclusion

**Phase 4 quality tooling is complete; the review is clean.** The automated gate's
real correctness stages and the local screenshot gate all pass at exit 0. All 13
applicable manual rubric criteria pass and 1 is not applicable; no criterion
fails. The one sitemap defect the original review raised was fixed under an
owner-authorized scoped exception (`47d2ade`) and re-verified.

Both loose ends are closed:

1. **`thank-you.astro` widget-import.** Resolved post-merge in `0ff243d`: the page
   now imports `~/components/client/HeroText.astro` and the starter-page-boundary
   test covers it.
2. **Lighthouse coverage exception.** Closed 2026-09-07. After the CI Lighthouse
   `--no-sandbox` fix (`2014552`), the full 33-run matrix (11 routes x 3 runs) ran
   on the post-merge head with 0 assertion failures; every gated category is at
   median 1.00 except `/dev/og/` performance 0.98, above the 0.90 floor. Evidence
   in `evidence/lighthouse/full-matrix-2026-09-07/`.
