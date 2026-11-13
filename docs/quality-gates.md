# Client quality gates

Automated verification and documented review for every client site. This is the
source of truth for gate order, thresholds, evidence storage, and review rubric.
SETUP.md links here from step B4. No separate gate changes are made elsewhere.

## 1. Ownership and gate order

The local full-verification command is:

```sh
npm run build && npm run check && npm run test:quality && npm run test:routes && npm run test:analytics && npm run test:meta && npm run test:baselines && npm run test:contrast && npm run test:links && npm run test:lhci && npm run screenshot:check
```

Expose this as `npm run verify`. Run it locally before pushing.

**CI runs a portable subset:** build, check, test:quality, test:routes, test:analytics,
test:meta, test:baselines, test:contrast, test:links, and test:lhci. Lighthouse runs
there; screenshot pixel comparison does not (baselines are renderer-specific and
captured locally in a standard environment).

**`test:baselines`** (`scripts/check-baseline-presence.mjs`) asserts a screenshot exists
for every current route, at every viewport and color scheme `npm run screenshot`
captures. Pure filesystem check, no browser, safe in CI. It answers "did anyone ever
capture a baseline for the routes that exist right now", not "does it still match" (that
part stays local-only, see below): on the Dodai Referrals build, no baseline was ever
captured before the build was shown to the client, and nothing caught that before the
client looked at the page (`docs/retrospectives/2026-09-12-referral-build-retro.md`).
Routes matched by `needsBaseline` in `scripts/quality-routes.cjs` are exempt from this check and from
`npm run screenshot`: the instructor profiles other than `ena` (one template) and the demo pages.
They stay in the manifest, so every other gate still covers them.

**`test:contrast`** (`tests/contrast.test.mjs`) walks every visible text element on
every route, in both color schemes, and asserts WCAG contrast (4.5:1 normal text, 3:1
large text) against each element's actual effective background, not the page's nominal
background. Catches a builder using the wrong token role (a button-background color
used as link/text color, for example) even when the page's aggregate Lighthouse
accessibility score would still pass; this is a real per-element gate, not a substitute
for reading Lighthouse's report when it fails.

**`test:meta`** (`scripts/check-canonical-host.mjs`) asserts every `<link rel="canonical">`
and `<meta property="og:image">` in the built `dist/` shares the same origin as
`src/config.yaml` `site.site`. It catches a component hardcoding or overriding the
site URL instead of deriving it from config, the class of bug found on a real client
site in September 2026 (a typo'd domain in canonical/OG tags broke link previews and
pointed the canonical signal at an unreachable URL). It does **not** catch `site.site`
itself being mistyped, since both the check and the built output derive from the same
config value; that's a human-entry error, guarded procedurally instead (see
`go-live.md` pre-launch checks: type the domain fresh when confirming it, don't
copy-paste from a source that might already carry the typo).

**Local remains the hard gate:** `npm run screenshot:check` is a local-only requirement.
Missing baselines, HTTP errors, size changes, or more than 25 changed pixels (pixelmatch
threshold 0.1) fail it and write diagnostic diffs to an ignored directory. A screenshot
pass is a prerequisite for committing the baseline; a baseline is a prerequisite for
release.

## 2. Lighthouse environment and thresholds

CI runs Lighthouse once on a representative set of eight routes (`quickPaths` in `lighthouserc.cjs`, switched on by `LHCI_QUICK=1` in the workflow), because all routes took about 10 minutes. Local runs and `npm run verify` cover every route in the manifest. The local and pre-go-live gates use the
three-run matrix and assert the median score with `aggregationMethod: 'median'`.

**Thresholds are hard minimums, not targets:**

| Category       | Threshold | Routes      |
| -------------- | --------- | ----------- |
| performance    | 0.90      | all         |
| accessibility  | 1.00      | all         |
| best-practices | 0.95      | all         |
| seo            | 0.95      | public only |

Intentional noindex and development pages skip only the SEO category. There is no
per-client threshold override, best-run selection, or retry-until-pass. Diagnose a
failure against its report before changing client code.

**Lighthouse environment:**

- Input: static `dist/` directory (production build).
- Mobility: simulated mobile throttling.
- Browser: Chromium from exactly pinned Playwright 1.62.1.
- Recording: document Node, browser, LHCI, runner OS and image, CPU architecture,
  and lockfile hash with each run. These details are needed to diagnose platform
  variance (subpixel rendering, timing jitter, font rasterization) and to reproduce
  a failure.

**CI pins for reproducibility:**

- Runner OS: `ubuntu-24.04`.
- Node: `22.22.3`.
- LHCI: 0.15.1 (the exact version resolved in `package-lock.json`, installed via `npm ci`).
- Locale: `TZ=UTC` and `LANG=C.UTF-8`.
- Browser: `npx --no-install playwright install --with-deps chromium` (locked to
  Playwright 1.62.1 in package.json). Lighthouse launches it with `--no-sandbox`
  (`lighthouserc.cjs`): the pinned runner restricts unprivileged user namespaces,
  so Chromium's setuid sandbox cannot start. Safe here (throwaway browser, local
  static build).

Environment changes must be explicit maintenance changes with a new recorded run. The
hosted runner's image patch and hardware can still vary; this is a controlled,
repeatable toolchain, not a claim of identical timing.

## 3. Route coverage

**Manifest:** Create `quality-routes.json` at the project root. It is an array of route
objects.

**CI is red until the manifest is populated.** `init-client` writes `[]`, and the
validator throws on an empty array, so `test:quality`, `test:routes`, and `test:lhci` all
fail in a fresh client repo (and the GitHub workflow runs on every push to main).
Populating `quality-routes.json` with the client's real routes is a first Build-step task,
not a launch task.

**Schema:** Each route is `{ "path": "<path>", "kind": "<kind>" }`.

- `path`: canonical root-relative path. Required. Must be `/` or slash-terminated
  segments of letters, digits, hyphens, and underscores. Pattern: `/` or
  `^\/(?:[A-Za-z0-9_-]+\/)*$`. No queries, hashes, percent encoding, path traversal,
  protocol-relative paths, duplicates, or slug collisions across the manifest.
- `kind`: exactly `public`, `noindex`, or `dev`. Required. No other values. Widen this
  grammar only in a reviewed tooling change if a client actually needs another shape.

**Route inventory:** Every normal built HTML route in `dist/**/*.html` appears exactly
once in the manifest, with two exceptions:

1. Astro's `dist/404.html` error document. It is checked manually for appearance and
   keyboard use, never as an HTTP-200 Lighthouse target. Do not list it.
2. Enabled blog routes. Include them by path if the blog is enabled in `config.yaml`.

Assets, XML files, and non-HTML endpoints are outside the page inventory. Do not list
them.

**Kind semantics:**

- `public`: included in SEO, performance, accessibility, and best-practices gates.
  Screenshot checked. Used for most pages.
- `noindex`: included in performance, accessibility, and best-practices gates, and
  screenshots. Skips SEO. Used for thank-you / success pages that should not rank.
- `dev`: allowed only under `/dev/` while `.template-repo` exists. Included in the same
  gates as `noindex`. Removed by client initialization. Client-generated manifests with
  any `dev` record fail validation. A `/dev/` path with another `kind` also fails
  validation.

**Validation:**

- `npm run test:routes` compares manifest paths with all HTML paths in the built `dist/`
  directory and fails on missing or stale entries. It also asserts that every `noindex`
  and `dev` route is absent from the built sitemap (`dist/sitemap-0.xml` /
  `sitemap-index.xml`), so a broken sitemap filter fails the gate. Run this before every
  release.
- Browser review must confirm actual noindex metadata (`<meta name="robots"
content="noindex">`) for every `noindex` and `dev` route (sitemap exclusion is now
  asserted by `npm run test:routes`). Classification alone does not prove the meta robots
  tag. Inspect the live page source.
- Do not change core sitemap configuration to conceal a pre-existing failure. Record the
  concrete boundary blocker in the review evidence instead.

## 4. Visual baseline lifecycle

**Baseline storage:** Keep screenshots under `golden-baselines/<slug>/<scheme>-<viewport>.png`.
Each route gets six captures: viewports 375, 768, 1440 in light and dark schemes.

**Initialization:** When `init-client` runs on a new client repo, it deletes all inherited
demo PNGs from `golden-baselines/` and writes `[]` plus a newline to `quality-routes.json`.
Git does not track empty directories, so `golden-baselines/` itself does not survive the
client's first clone; the screenshot runner recreates it on the first capture. This
ensures the client starts with no baseline claims.

**Capture and inspection:** After building the client site, populate the complete
`quality-routes.json` manifest. Run `npm run build && npm run screenshot` to capture.
Before committing, inspect representative desktop and mobile screenshots plus any risky
states (dark mode, form errors, modals, keyboard focus). Confirm they show real page
content, not blank or near-blank images. Byte-determinism and file counts prove
reproducibility, not correctness.

**The first capture of each route is the one that matters most, and gets its own
sign-off, not just a glance.** Every capture after it is only checked for _change_
(pixel diff against this baseline); if the first capture is already wrong, the diff
check will pass forever, since nothing about it ever changes. On the Dodai Referrals
build, baselines were never captured before the site was shown to the client, so this
never had a chance to catch the broken dark-mode state; had a baseline existed, an
uninspected first capture would have enshrined that broken state as the thing all future
diffs get judged against. Record in the review evidence that the first capture of each
route was actually looked at, not just that it exists.

**Pixel-comparison rules:**

- Missing baseline files fail the check.
- HTTP failures (non-200 responses) fail the check.
- Changed dimensions (viewport size mismatch, layout shift) fail the check and write the
  current capture, allowing intentional dimension changes to be inspected and approved.
- More than 25 changed pixels (pixelmatch threshold 0.1) fail the check and write a
  diagnostic diff to the ignored `golden-baselines-diff/` directory.

**Baseline refresh:** Refresh a baseline only for an intentional inspected visual change.
That change and the baseline refresh must be in the same commit. In the review evidence,
name the affected routes and the reason for the refresh (for example, "responsive layout
rework" or "heading hierarchy fix").

**Diff retention:** Copy any cited diagnostic diff from the ignored directory into
`docs/reviews/<date>-<slug>/evidence/screenshots/` before the next `screenshot:check`
run replaces it. Diffs must be linked from the review and committed.

## 5. Agent review rubric and evidence

Every client review completes this rubric. Each row requires exactly one status and
evidence before the review is approved.

| Criterion                                                      | Status | Evidence and finding | Absence reason or exception owner/reason/expiry/follow-up |
| -------------------------------------------------------------- | ------ | -------------------- | --------------------------------------------------------- |
| Hierarchy, reading measure, spacing                            |        |                      |                                                           |
| Responsive layout, overflow, image crops, tap targets          |        |                      |                                                           |
| Dark mode                                                      |        |                      |                                                           |
| Keyboard traversal and visible focus                           |        |                      |                                                           |
| Modal/banner escape and footer cookie settings                 |        |                      |                                                           |
| Heading order, landmarks, labels, form errors                  |        |                      |                                                           |
| 200% zoom, reduced motion, contrast                            |        |                      |                                                           |
| Form privacy notice or required consent                        |        |                      |                                                           |
| Styled success state and confirmed delivery evidence           |        |                      |                                                           |
| Noindex/dev metadata and sitemap exclusion                     |        |                      |                                                           |
| Favicon and OG assets                                          |        |                      |                                                           |
| Copy makes sense for who actually owns/operates this site      |        |                      |                                                           |
| Consent states, revocation, payloads, submit/success semantics |        |                      |                                                           |
| Screenshot diffs and intended baseline refreshes               |        |                      |                                                           |
| 404 appearance and keyboard use                                |        |                      |                                                           |
| NAP match (name/address/phone identical to the client's GBP)   |        |                      |                                                           |
| INP measured on a deployed preview (PageSpeed Insights)        |        |                      |                                                           |
| Contact-form domain: SPF/DKIM/DMARC present (`dig TXT`)        |        |                      |                                                           |

**Status definitions:**

- `pass`: the criterion is met. Cite evidence (a screenshot, command output, or component
  path).
- `fail`: the criterion is not met. This includes untested, blocked, uncertain, or broken
  work. Cite the specific defect and the evidence (a failing test, a screenshot showing the
  problem, or a noted exception).
- `not applicable`: the feature is absent and not required for this client. Explain briefly
  why (for example, "No blog enabled" or "Form collects no personal data").
- `exception`: a known limitation accepted by the client and the Dodai team. See the
  Exceptions section below.

**Evidence storage:** Store the review at `docs/reviews/YYYY-MM-DD-<slug>/review.md`.
Store all referenced evidence under `docs/reviews/YYYY-MM-DD-<slug>/evidence/`:

```
docs/reviews/YYYY-MM-DD-<slug>/
  review.md
  evidence/
    commands/<command>.txt
    lighthouse/
    screenshots/
    analytics/events.json
```

Commands output files contain the full command and its exit code. Lighthouse evidence
is the complete HTML and JSON output from each run (generated automatically, byte-for-byte
from the LHCI tool). Screenshots are PNG diffs or representative captures. Analytics
evidence is the JSON log of all events emitted during testing.

**Review metadata:** The review.md must record:

- Reviewed source commit (short SHA + subject).
- Dirty-state note if the review included uncommitted working changes.
- UTC run time (ISO 8601).
- Manifest hash (SHA-256 of quality-routes.json).
- Lockfile hash (SHA-256 of package-lock.json).
- Tool versions: Node.js, browser/Playwright, LHCI, npm.
- Renderer and operating system (Chromium from Playwright 1.62.1, macOS / Linux, CPU
  architecture).
- The commands run, their exit codes, and which (if any) failed.
- Baseline commit where approved screenshots live.
- For intentional baseline refreshes, the affected routes and the reason.
- Rough wall-clock time spent per arc (Discovery / Build / Launch), one line, no
  precision needed. This isn't for billing; it's the only signal that exists for whether
  a workflow addition (this checklist included) is adding real time to a build worth
  its cost. Without it, that question can only ever be guessed at.

Use relative links only: `../evidence/commands/build.txt`, not absolute paths or CI artifact
URLs. Copy cited ignored diffs and downloaded CI reports into the evidence folder before the
next run replaces them. Link them from the review.

## 6. Analytics taxonomy and validation

Analytics is optional but must be consent-aware and free of personal data if enabled.

**Events and triggers:** The analytics bridge supports six events, each with a specific
trigger and required destination type.

| Event            | Trigger                                                                                                  | Required destination type |
| ---------------- | -------------------------------------------------------------------------------------------------------- | ------------------------- |
| `cta_click`      | Click on a marked link or button.                                                                        | `internal` or `external`  |
| `phone_click`    | Click on a marked link, static destination type `phone`.                                                 | `phone`                   |
| `email_click`    | Click on a marked link, static destination type `email`.                                                 | `email`                   |
| `file_download`  | Click on a marked link, static destination type `file`.                                                  | `file`                    |
| `contact_submit` | Native submit event from a marked, valid form. This is an attempt, including an intercepted AJAX submit. | `form`                    |
| `generate_lead`  | Explicit `aw:lead-success` event dispatched on that marked form only after its backend confirms success. | `form`                    |

**Submit vs. success distinction:**

- `contact_submit` fires when the form is submitted with valid data. This is an attempt, not
  confirmation of delivery or backend acceptance.
- `generate_lead` fires only after the backend confirms success. It must be dispatched
  explicitly by the form integration:

  ```js
  form.dispatchEvent(new CustomEvent('aw:lead-success', { bubbles: true }));
  ```

Never emit `generate_lead` from a click, a submit event, a success-page load, or an
unconfirmed response. The backend handles deduplication of its own retries. For
redirect-only forms without a confirmed callback, leave `generate_lead` uninstrumented.

**Parameters and validation:** Optional parameters narrow the event context. All supplied
parameters must pass both their syntax rule and membership in their closed set. Reject the
whole event (do not send it) if a recognized parameter is invalid. Do not trim, truncate,
or send a malformed parameter.

| Parameter          | Attribute                  | Allowed values                                           | Syntax and maximum length               |
| ------------------ | -------------------------- | -------------------------------------------------------- | --------------------------------------- |
| `placement`        | `data-aw-placement`        | `header`, `hero`, `body`, `footer`, `contact_form`       | `^[a-z][a-z0-9_]{0,31}$`, 32 chars      |
| `label`            | `data-aw-label`            | `primary_cta`, `secondary_cta`, `contact`, `brochure`    | `^[a-z][a-z0-9_]{0,31}$`, 32 chars      |
| `destination_type` | `data-aw-destination-type` | `internal`, `external`, `phone`, `email`, `file`, `form` | `^[a-z][a-z0-9_]{0,31}$`, 32 chars      |
| `file_name`        | `data-aw-file-name`        | `brochure.pdf`, `price_list.pdf`                         | `^[a-z][a-z0-9_]{0,27}\.pdf$`, 32 chars |

**Constraint rules:**

- `destination_type` is required and must match the event's type (for example,
  `cta_click` requires `internal` or `external`; `phone_click` requires `phone`).
- `file_name` is required only for `file_download` and forbidden for every other event.
  It is a static catalogue value, never an uploaded or user-provided filename. Change
  closed values only through reviewed client source changes.
- Other parameters are optional.
- Closed-set values are exhaustive. Pattern matching alone is not a privacy guarantee.
  Never forward form values, email addresses, phone numbers, free text, URLs, query
  values, visitor identifiers, or arbitrary JavaScript objects.

**Consent behavior:**

When `window.awAnalytics` exists, the event bridge emits only when its callable
`status()` returns exactly `granted`. It checks on every event so revocation takes effect
immediately. When `awAnalytics` is absent, the bridge calls `window.gtag` only if GA4
has initialized (the `#ga-init` element exists and has a callable `gtag` function). If
consent is required but the consent API is missing, the bridge fails closed and drops
the event.

Events are never queued or replayed. Do not modify core consent handling. The bridge
reads no form values, event detail, or response bodies.

**Integration example:**

```astro
<!-- Form in a page component -->
<form data-aw-event="contact_submit" data-aw-placement="body" data-aw-label="contact">
  <!-- form fields -->
</form>
```

After backend confirmation of success:

```js
const form = document.querySelector('form[data-aw-event="contact_submit"]');
form.dispatchEvent(new CustomEvent('aw:lead-success', { bubbles: true }));
```

The analytics bridge listens globally (delegated listeners on the document) and fires
the `generate_lead` event. It persists across ClientRouter navigation with one
installation per document.

## 7. Exceptions

An exception records an accepted manual limitation. It makes a failed criterion visible
and requires full documentation. Exceptions cannot make an automated gate pass or lower
a threshold.

**Exception requirements:** An exception needs all four fields:

- **Owner:** the Dodai team member or client contact responsible for the limitation.
- **Reason:** a specific, concrete explanation of why the criterion is not met.
- **Expiry:** a date in `YYYY-MM-DD` format. The limitation is accepted until that date.
  Expired exceptions become failures.
- **Follow-up:** a link to a GitHub issue, a Jira task, or a project-local TODO entry that
  tracks the resolution of the limitation.

Record exceptions in the rubric's "exception owner/reason/expiry/follow-up" column.

**Automation cannot be bypassed:** Failed Lighthouse assertions, missing baselines, HTTP
errors, and size changes remain failures even if an exception is recorded. Exceptions are
for manual review criteria that cannot be automated (for example, "the 404 page looks good
enough to ship even though the heading hierarchy is unusual because the page is rarely
seen").

**External gates remain external:** Exceptions document accepted manual limitations. They
do not replace client legal review, copy approval, or production form-delivery testing.
Those remain separate, external gates.
