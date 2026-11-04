# Phase 4: client quality gates and review system

Date: 2026-09-06

Status: approved design, revised with the eight approved review improvements.

## Problem and scope

Performance is warning-only, Lighthouse and screenshots use different route lists,
and client initialization deletes inherited baselines without establishing a
replacement. Review instructions overlap across documents. Analytics consent
exists, but event semantics and permitted payloads are not defined.

Phase 4 makes these checks blocking and repeatable. The agent performs design,
accessibility, and conversion review. Client legal review, copy approval, and real
production form delivery remain separate responsibilities.

Art-direction presets and `brand.artDirection` remain out of scope. No new analytics
vendor, tag manager, identifier, reporting system, or CI pixel comparison is added.
Do not edit `src/layouts/`, `src/utils/`, `src/components/{ui,common,blog}/`,
`src/components/widgets/`, `vendor/`, content collections, `astro.config.ts`, or the
configuration system. The explicit tooling changes to Lighthouse, package scripts,
and CI below are template-maintenance work, not permission to change runtime core or
deployment configuration. All event implementation stays in `src/components/client/`.

## 1. One canonical process

Create `docs/quality-gates.md`. It owns gate order, thresholds, route policy, baseline
lifecycle, review statuses, evidence storage, and event verification.

`SETUP.md` keeps Discovery, Build, Launch sequencing and links from B4.
`docs/client-build-rules.md` keeps plan rules and points to the rubric.
`docs/go-live.md` keeps launch-only work and links to the pre-launch gate.
`docs/golden-workflow.md` keeps screenshot mechanics and renderer limitations and
links to the baseline policy. Keep this guide in generated client repos.

The local command is:

```sh
npm run build && npm run check && npm run test:quality && npm run test:routes && npm run test:analytics && npm run test:links && npm run test:lhci && npm run screenshot:check
```

Expose that sequence as `npm run verify`. `test:quality` runs existing and new Node
tests, excluding the separate browser integration file. `test:routes` checks the
production HTML inventory. `test:analytics` runs browser behavior tests against the
production preview and real ClientRouter. CI runs this portable subset through
Lighthouse. Screenshot pixel comparison remains a hard local gate.

## 2. Performance at 0.90 with three runs

Each covered route gets three Lighthouse runs. Assert the median score with
`aggregationMethod: 'median'`: performance `error` at `0.90`, accessibility `error`
at `1.00`, best practices `error` at `0.95`, and SEO `error` at `0.95` for public
routes. Intentional noindex and development pages skip only the SEO category.
There is no per-client threshold override, best-run selection, or retry-until-pass.
CI was later reduced to one run per route, while local and pre-go-live checks retain the three-run median matrix.

Use `dist` as the static input, explicit mobile simulated throttling, and the
Chromium executable installed for exactly pinned Playwright `1.62.1`. Pin CI's runner
OS to `ubuntu-24.04`, Node to `22.22.3`, and LHCI to the exact version already
resolved in `package-lock.json`; use `npm ci`. Set `TZ=UTC` and `LANG=C.UTF-8`.
Install the locked browser with `npx --no-install playwright install --with-deps chromium`.
Record Node, browser, LHCI, runner image, architecture, and lockfile hash with
each run. The hosted runner's image patch and hardware can still vary; this is a
controlled, repeatable toolchain, not a claim of identical timing. Diagnose a
failure against its three reports before changing client code. Environment changes
must be explicit maintenance changes with a new recorded run.

## 3. One machine-checked route manifest

Create project-root `quality-routes.json`, an array of `{ "path": "/contact/",
"kind": "public" }` records. `kind` is exactly `public`, `noindex`, or `dev`.
Both Lighthouse and screenshots load it through `scripts/quality-routes.cjs`.
Delete `golden-baselines/routes.json`; there is no second editable route list.

Every normal built HTML route appears exactly once, including enabled blog routes
and intentional noindex success pages. Paths are canonical root-relative paths:
`/` or slash-terminated segments of letters, digits, hyphens, and underscores.
No queries, hashes, percent encoding, traversal, protocol-relative paths, duplicate
paths, unknown fields, or screenshot-slug collisions are allowed. Widen this grammar
in a reviewed tooling change if a client actually needs another URL shape.

Both tools cover all manifest entries. `public` includes the SEO assertion.
`noindex` stays in performance, accessibility, best practices, and screenshots,
but skips SEO. `dev` is allowed only under `/dev/` while `.template-repo` exists,
gets the same non-SEO checks, and is removed by client initialization. A client
manifest containing any `dev` record fails validation. A `/dev/` path with another
kind also fails.

`npm run test:routes` compares manifest paths with all `dist/**/*.html` paths and
fails on missing or stale entries. The only fixed inventory exclusion is Astro's
`dist/404.html` error document, checked manually for appearance and keyboard use;
it is not an HTTP-200 Lighthouse target. Assets, XML, and non-HTML endpoints
are outside the page inventory. Browser review confirms actual noindex metadata and
sitemap exclusion for every `noindex` and `dev` route. Classification alone does not
prove those properties. Do not change core sitemap configuration to conceal a
pre-existing failure; record the concrete boundary blocker.

## 4. Every client owns reviewed visual baselines

Keep screenshots under `golden-baselines/<slug>/<scheme>-<viewport>.png` and current
375, 768, and 1440 pixel viewports in light and dark schemes. Initialization deletes
inherited PNGs, creates the empty baseline directory, and writes `[]` plus a real
newline to `quality-routes.json`. The screenshot runner itself is already retained.
Remove init-client's old text replacement of Lighthouse URLs, since URLs now come
from the manifest.

An empty or invalid manifest fails in capture and check modes before launching a
server or browser. After building the client, populate the complete manifest,
capture, inspect representative desktop and mobile images plus any risky state,
and commit approved PNGs with the review evidence. The template migration adds
baseline images for its three `/dev/` routes because both tools now cover them.

Missing baseline files, HTTP failures, changed dimensions, and more than 25 changed
pixels (pixelmatch threshold `0.1`) fail the local check. Missing and size-changed
baselines write the current capture; changed pixels write a diff to ignored
`golden-baselines-diff/`. Copy any cited diagnostic into the review's evidence folder
before the next run replaces the ignored directory. Refresh a baseline only for an
intentional inspected change, in the same commit as that change and its reason.

## 5. Agent review statuses and durable evidence

Every rubric row has exactly one status: `pass`, `fail`, `not applicable`, or
`exception`, with evidence. `not applicable` is allowed only when the feature is
absent, with an explicit absence reason. Untested, blocked, uncertain, or broken
features are `fail`, never `not applicable`.

An `exception` keeps the failed criterion visible. It requires an identified owner,
specific reason, expiry date in `YYYY-MM-DD`, and a linked follow-up issue or
project-local task. Missing or expired exceptions fail review. Exceptions document
accepted manual-review limitations; they cannot make a failed automated gate pass
or lower the default thresholds. Legal and copy approval remain external gates.

Store the record at `docs/reviews/YYYY-MM-DD-<slug>/review.md`. Store referenced
files beneath that same folder: `evidence/commands/<command>.txt`,
`evidence/lighthouse/`, `evidence/screenshots/`, and
`evidence/analytics/events.json`. The Phase 4 record is
`docs/reviews/2026-09-06-phase-4-quality-gates/review.md`. Commit the record and cited
sanitized evidence. Use relative links, not private scratch paths or expiring CI
artifact URLs. Include the reviewed source commit, UTC run time, manifest hash,
lockfile hash, tool versions, renderer/OS, commands, exit codes, and baseline commit.
For intentional baseline refreshes, name affected routes and the reason. Local
working changes must be recorded as such, not attributed to an unchanged commit.

The rubric covers visual hierarchy, measure, spacing, responsive layout, dark mode,
image crops, overflow, tap targets, keyboard traversal, visible focus, modal/banner
escape behavior, heading order, landmarks, form labels/errors, 200% zoom, reduced
motion, contrast, form privacy notices/consent, styled success states, success-page
noindex and sitemap exclusion, favicon/OG assets, footer cookie settings, GA consent,
event semantics/payloads, and screenshot-diff inspection. No separate human design
review is required.

## 6. Consent-aware client events with strict payloads

Create `src/components/client/analytics-events.ts` with
`installAnalyticsEvents(window): void`. `AnalyticsEvents.astro` imports it in a
processed script and calls it. Mount the component from `GlobalEmbeds.astro` only.
The installer is idempotent per browser document: retain one click listener, one
submit listener, and one success listener across repeated installation and
`astro:page-load` events. Delegation works with replaced body content without
attaching listeners to each page. Look up configuration and consent at event time.

Use the existing `#ga-init` element's configured ID and `data-consent` mode. If no
ID or no callable `gtag` exists, drop the event. If consent is required, a missing
consent API fails closed. If `awAnalytics` exists in either mode, emit only when its
callable `status()` returns exactly `granted`; exceptions or other values drop the
event. Check on every event so revocation takes effect. Do not queue or replay
pre-consent interactions. Do not modify core consent handling.

| Event            | Trigger                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| `cta_click`      | Click on a marked link or button.                                                                        |
| `phone_click`    | Click on a marked link, static destination type `phone`.                                                 |
| `email_click`    | Click on a marked link, static destination type `email`.                                                 |
| `file_download`  | Click on a marked link, static destination type `file`.                                                  |
| `contact_submit` | Native submit event from a marked, valid form. This is an attempt, including an intercepted AJAX submit. |
| `generate_lead`  | Explicit `aw:lead-success` event dispatched on that marked form only after its backend confirms success. |

Never emit `generate_lead` from a click, submit, success-page load, or unconfirmed
response. The backend integration dispatches once per successful submission and
deduplicates its own retries. The bridge reads no event detail or response body.
For redirect-only forms without a confirmed callback, leave `generate_lead`
uninstrumented. A success page view alone is not proof of a new lead.

Use `data-aw-event` and these optional parameter attributes. Values must pass both
the listed syntax/length and membership in the closed set. Reject the whole event
when a supplied recognized parameter is invalid; do not trim, truncate, or send it.
Unknown attributes and DOM text are ignored, never forwarded.

| Parameter          | Attribute                  | Allowed values                                           | Syntax and maximum length         |
| ------------------ | -------------------------- | -------------------------------------------------------- | --------------------------------- |
| `placement`        | `data-aw-placement`        | `header`, `hero`, `body`, `footer`, `contact_form`       | `^[a-z][a-z0-9_]{0,31}$`, 32      |
| `label`            | `data-aw-label`            | `primary_cta`, `secondary_cta`, `contact`, `brochure`    | `^[a-z][a-z0-9_]{0,31}$`, 32      |
| `destination_type` | `data-aw-destination-type` | `internal`, `external`, `phone`, `email`, `file`, `form` | `^[a-z][a-z0-9_]{0,31}$`, 32      |
| `file_name`        | `data-aw-file-name`        | `brochure.pdf`, `price_list.pdf`                         | `^[a-z][a-z0-9_]{0,27}\.pdf$`, 32 |

`file_name` is a static catalogue value, never an uploaded or user-provided filename.
It is permitted only on `file_download`; require it and `destination_type=file`
there. Require the matching destination type for phone/email clicks and `form` for
submit/success. A CTA requires `internal` or `external`. Other parameters are
optional. Change closed values only through reviewed client source changes using
non-personal catalogue values. Pattern matching alone is not a privacy guarantee.
Never forward form values, email addresses, phone numbers, free text, URLs, query
values, visitor identifiers, or arbitrary JavaScript objects.

## Verification and success criteria

The executable plan tests behavior and parsed configuration, not implementation
tokens or prose. Cover three-run median assertions, CI pins, manifest validation
and complete build coverage, baseline failures and matches, client initialization,
exact analytics payloads in a real browser, invalid/valid submits, explicit success,
all consent states, revocation, repeated installs, and two real Astro navigations.
Block external GA requests in browser tests and inspect a local spy. Inspect human
policy directly and use formatting/link checks where they prove something; do not
create document-string assertion tests.

Completion requires `npm run verify`, the complete agent rubric and committed
evidence, no unrecorded manual failures, and no forbidden core edits. Automated
failures stay failures even when a manual exception is recorded. All eight approved
improvements are represented above. Art-direction presets remain deferred.
