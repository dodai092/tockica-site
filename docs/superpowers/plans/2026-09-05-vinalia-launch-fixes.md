# Vinalia Consulting Launch-Fixes Plan

> **For agentic workers:** Use `superpowers:subagent-driven-development` (recommended)
> or `superpowers:executing-plans` to work this plan task-by-task. Steps use checkbox
> (`- [ ]`) syntax. Antun wants approval before each task's implementer is dispatched,
> not continuous execution (memory: `feedback-sdd-approval-gate`). This plan is small
> enough (5 tasks) to run directly in one session if preferred.

**Goal:** Close the launch-blocking defects found in the post-build review of
`vinalia-site` (see `dodai-astrowind/docs/retrospectives/2026-09-05-vinalia-build-retro.md`,
appendix). Two buckets: the GA4 consent gate is not conformant, and the contact form
(the site's single primary CTA) has no success state and no privacy consent. Plus
asset-weight and focus-visible polish.

**Not in scope** (tracked in `docs/go-live.md`, external or Antun's own tasks):
creating the real GA4 property, real legal review of `terms.md` / `privacy.md`, DNS,
Search Console verification ID, `geo` coordinates, sending the build to Natalija.

**Architecture:** All changes land in the client layer (`src/pages/`,
`src/components/client/`, `src/navigation.ts`, `src/config.yaml`,
`src/assets/`). One deliberate global-stylesheet edit
(`src/assets/styles/tailwind.css`) for the focus-visible rule, called out in Task 4.
No edit to `src/layouts/`, `src/utils/`, `src/components/{ui,common,blog}/`, `vendor/`,
or the `astrowind:config` system.

**Analytics decision (settled, do not reopen):** GA4 stays. Plausible/Fathom are ruled
out (memory: `dodai-analytics-ga4-decision`). The consent model is **opt-in**: GA does
not load before an explicit accept. What changes in Task 1 is that consent is signalled
to `gtag` explicitly, the Measurement ID moves to an env var so a forgotten swap fails
the production build, and the always-visible floating settings link is replaced with a
real cookie page.

## Global Constraints

- Repo root: `/Users/antunzebec/Work/01.Clients/Vinalia Consulting/vinalia-site/`.
- Never edit template core (list above). If a task seems to need it, stop and raise it.
- No em dashes in anything this plan authors: code, comments, commit messages, and the
  new Croatian UI copy (the checkbox label, the `/hvala` and `/kolacici` page text, the
  404 title). Existing client-verbatim copy is left exactly as it is.
- All new visible Croatian copy goes on Natalija's review list in
  `docs/go-live.md` (§2 client review). Antun approved adding it now rather than
  waiting for her pass.
- Prettier: single quotes, semicolons, 120 print width, 2-space indent (inherited
  `.prettierrc.mjs`). Every commit leaves `npm run check` green.
- Commit trailer: `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- Spam protection on the contact form stays honeypot-only (`netlify-honeypot`,
  deliberate choice for this volume, do not add reCAPTCHA).
- After every task that changes rendered output, run `npm run build`.

---

## Task 1: GA4 consent gate, made conformant

**Files:**

- Modify: `src/components/client/CookieConsent.astro`
- Create: `src/pages/kolacici.astro`
- Modify: `src/navigation.ts` (footer secondary link)
- Modify: the 7 pages that mount `<CookieConsent />` (only if the settings-link
  removal changes their markup; the mount itself does not move)
- Modify: `docs/go-live.md` (the GA-ID step)
- Modify: `.env.example` (create if absent)

**Interfaces:**

- `CookieConsent` stays a no-prop component. It now reads
  `import.meta.env.PUBLIC_GA_MEASUREMENT_ID`, defaulting to `'G-PLACEHOLDER'`.
- New route `/kolacici` (cookie policy + consent control).

**Why:** three defects. (1) On accept, the code calls `gtag('config', ID)` with no
consent signal, so GA4 runs in an undefined Consent Mode state, which does not meet
Google's EU user consent policy even for opt-in setups. (2) `G-PLACEHOLDER` returns
200 from `gtag/js`, so a forgotten swap fails silently. (3) The "Postavke kolačića"
link is `position: fixed` bottom-left on all 7 pages, overlapping content, and is
absent on `terms` / `privacy` / `404`.

- [ ] **Step 1: Move the Measurement ID to an env var and fail the prod build if unset**

In `CookieConsent.astro` frontmatter:

```astro
---
// src/components/client/CookieConsent.astro
// EU opt-in consent gate for GA4. GA is NOT loaded before an explicit accept.
// The Measurement ID comes from PUBLIC_GA_MEASUREMENT_ID (set it in Netlify env,
// not in code). A production build with the placeholder still set fails loudly.
const GA_MEASUREMENT_ID = import.meta.env.PUBLIC_GA_MEASUREMENT_ID ?? 'G-PLACEHOLDER';

if (import.meta.env.PROD && GA_MEASUREMENT_ID === 'G-PLACEHOLDER') {
  throw new Error(
    'CookieConsent: PUBLIC_GA_MEASUREMENT_ID is not set. Create the GA4 property and set the env var before a production build (see docs/go-live.md).'
  );
}
---
```

- [ ] **Step 2: Pass the ID into the inline script and signal consent explicitly**

Replace the `<script>` block. Use `define:vars` to pass `GA_MEASUREMENT_ID` in. On
accept, set Consent Mode to granted **before** `gtag('config', ...)`:

```astro
<script define:vars={{ gaId: GA_MEASUREMENT_ID }}>
  function loadGA() {
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    // Opt-in: the user has accepted, so grant the analytics-relevant signals
    // explicitly. Ad signals stay denied, this property is analytics-only.
    gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted',
    });

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + gaId;
    document.head.appendChild(s);

    gtag('js', new Date());
    gtag('config', gaId, { anonymize_ip: true });
  }

  var banner = document.getElementById('cookie-consent');
  var stored;
  try {
    stored = localStorage.getItem('vinalia-consent');
  } catch (e) {
    stored = null;
  }

  if (stored === 'accepted') {
    loadGA();
  } else if (stored !== 'declined') {
    banner?.removeAttribute('hidden');
  }

  document.getElementById('cookie-accept')?.addEventListener('click', function () {
    try {
      localStorage.setItem('vinalia-consent', 'accepted');
    } catch (e) {}
    banner?.setAttribute('hidden', '');
    loadGA();
  });

  document.getElementById('cookie-decline')?.addEventListener('click', function () {
    try {
      localStorage.setItem('vinalia-consent', 'declined');
    } catch (e) {}
    banner?.setAttribute('hidden', '');
  });
</script>
```

Note: `define:vars` scripts are inline and not type-checked, so the `@ts-expect-error`
comments the old block needed are gone. Use plain ES5-ish syntax as above so ESLint
does not complain about `arguments` in an arrow function.

- [ ] **Step 3: Banner markup: a11y and remove the floating link**

- Add `role="dialog"` and `aria-label="Pristanak na kolačiće"` to `#cookie-consent`.
- Use the `hidden` attribute instead of the `hidden` Tailwind class (the template
  reset has `[hidden]{display:none!important}`), so Step 2's `removeAttribute` /
  `setAttribute` calls are the toggle.
- After `banner.removeAttribute('hidden')`, call
  `document.getElementById('cookie-accept')?.focus()`.
- **Delete** the `<p class="fixed bottom-1 left-2 ...">` "Postavke kolačića" block and
  its `cookie-settings-link` listener entirely. Its replacement is the `/kolacici`
  page (Step 4) linked from the footer (Step 5).
- Keep the "Više informacija" link to `/privacy` in the banner text.

- [ ] **Step 4: Create `/kolacici` (cookie policy + consent control)**

```astro
---
// src/pages/kolacici.astro
import Layout from '~/layouts/PageLayout.astro';
import CookieConsent from '~/components/client/CookieConsent.astro';

const metadata = {
  title: 'Kolačići',
  description: 'Kako Vinalia Consulting koristi kolačiće i kako promijeniti svoj pristanak.',
};
---

<Layout metadata={metadata}>
  <section class="py-16 max-w-3xl mx-auto px-4 sm:px-6">
    <h1 class="text-4xl font-bold mb-6" style="color: var(--aw-color-text-heading)">Kolačići</h1>
    <p class="mb-4" style="color: var(--aw-color-text-default)">
      Ova stranica koristi Google Analytics za mjerenje posjeta. Analitički kolačići postavljaju se tek nakon vašeg
      pristanka. Bez pristanka ne postavlja se nijedan kolačić za praćenje.
    </p>
    <p class="mb-8" style="color: var(--aw-color-text-default)">
      Detalji o obradi podataka nalaze se u
      <a href="/privacy" class="underline" style="color: var(--aw-color-secondary)">politici privatnosti</a>.
    </p>
    <button
      id="cookie-reset"
      type="button"
      class="rounded-md px-6 py-3 font-semibold text-white"
      style="background-color: var(--aw-color-primary)"
    >
      Promijenite pristanak
    </button>
    <p id="cookie-status" class="mt-4 text-sm" style="color: var(--aw-color-text-muted)"></p>
  </section>

  <CookieConsent />
</Layout>

<script>
  const statusEl = document.getElementById('cookie-status');
  function render() {
    let v = null;
    try {
      v = localStorage.getItem('vinalia-consent');
    } catch (e) {}
    const label = v === 'accepted' ? 'prihvaćeno' : v === 'declined' ? 'odbijeno' : 'nije odabrano';
    if (statusEl) statusEl.textContent = 'Trenutni odabir: ' + label + '.';
  }
  document.getElementById('cookie-reset')?.addEventListener('click', () => {
    try {
      localStorage.removeItem('vinalia-consent');
    } catch (e) {}
    location.reload();
  });
  render();
</script>
```

- [ ] **Step 5: Footer link**

In `src/navigation.ts`, add to `footerData.secondaryLinks`:

```typescript
{ text: 'Kolačići', href: getPermalink('/kolacici') },
```

- [ ] **Step 6: `.env.example` and go-live doc**

Create `.env.example` (if it does not exist) with:

```
# GA4 Measurement ID. Set the real value in Netlify env before a production deploy.
PUBLIC_GA_MEASUREMENT_ID=
```

In `docs/go-live.md` §3, replace the line
`Replace GA_MEASUREMENT_ID placeholder in src/components/client/CookieConsent.astro ...`
with:

```
- [ ] Create the GA4 property and set `PUBLIC_GA_MEASUREMENT_ID` in Netlify
      (Site config -> Environment). The production build fails if it is unset.
```

- [ ] **Step 7: Build and manually test**

```bash
npm run build   # expect: succeeds locally (dev/preview default the ID, PROD guard only trips on `astro build` with NODE_ENV=production AND placeholder... verify actual behaviour, see note)
npm run dev
```

Note: confirm whether `npm run build` locally sets `import.meta.env.PROD` true (it
does in Astro). If the guard trips the local build, gate it on an explicit
`import.meta.env.PUBLIC_REQUIRE_GA === 'true'` set only in CI/Netlify, so local
`npm run build` still works with the placeholder. Pick whichever keeps local builds
working without hiding the check from CI, and write the choice into the component
comment.

In the browser (incognito, clean `localStorage`): banner appears with focus on
"Prihvaćam"; DevTools Network shows no `googletagmanager.com` request until accept;
after "Prihvaćam", `gtag/js?id=...` fires and `dataLayer` contains a `consent`
`default` entry with `analytics_storage: 'granted'`; reload keeps the banner hidden
and re-fires GA; "Odbijam" on a clean state fires nothing; `/kolacici` "Promijenite
pristanak" clears the choice and the banner returns.

- [ ] **Step 8: Commit**

```
feat: make the GA4 consent gate conformant and env-driven

- signal Consent Mode explicitly on opt-in (analytics granted, ads denied)
- move the Measurement ID to PUBLIC_GA_MEASUREMENT_ID, fail the prod build if unset
- replace the floating settings link with a /kolacici cookie page
- role=dialog + focus management on the banner

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

---

## Task 2: Contact form success page

**Files:**

- Create: `src/pages/hvala.astro`
- Modify: `src/components/client/ContactForm.astro`

**Interfaces:** new route `/hvala`. `ContactForm` gains `action="/hvala"`.

**Why:** the form does a native Netlify POST with no `action`, so a real submission
lands the visitor on Netlify's generic unstyled success page. This is the site's one
primary conversion and it currently dead-ends.

- [ ] **Step 1: Create `/hvala`**

```astro
---
// src/pages/hvala.astro
import Layout from '~/layouts/PageLayout.astro';
import CookieConsent from '~/components/client/CookieConsent.astro';

const metadata = {
  title: 'Poruka je poslana',
  description: 'Hvala na upitu. Javit ću se u najkraćem roku.',
  robots: { index: false, follow: true },
};
---

<Layout metadata={metadata}>
  <section class="py-24 max-w-2xl mx-auto px-4 sm:px-6 text-center">
    <h1 class="text-4xl font-bold mb-6" style="color: var(--aw-color-text-heading)">Poruka je poslana</h1>
    <p class="text-lg mb-10" style="color: var(--aw-color-text-default)">
      Hvala na upitu. Javit ću vam se u najkraćem mogućem roku, obično unutar jednog radnog dana.
    </p>
    <a
      href="/"
      class="inline-block rounded-md px-8 py-3 font-semibold text-white"
      style="background-color: var(--aw-color-primary)"
    >
      Natrag na početnu
    </a>
  </section>

  <CookieConsent />
</Layout>
```

Confirm `metadata.robots` is honoured by `PageLayout` (AstroWind passes it through to
the `<meta name="robots">` tag). If the shape differs, match what `index.astro`'s
metadata object supports.

- [ ] **Step 2: Point the form at it**

In `ContactForm.astro`, add `action="/hvala"` to the `<form>` tag. Netlify captures the
submission and then 303-redirects to `action`. Works with JS disabled. Do not add a
client-side submit handler.

- [ ] **Step 3: Build and test**

```bash
npm run build
```

Confirm `dist/hvala/index.html` exists and carries `<meta name="robots" content="noindex, follow">`.
Full submit-path testing needs a Netlify deploy (local `astro preview` cannot process
Netlify Forms); note in `docs/go-live.md` §3 that the existing
"test a real submission" check now also verifies the redirect lands on `/hvala`.

- [ ] **Step 4: Commit**

```
feat: add a styled /hvala success page for the contact form

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

---

## Task 3: Privacy-consent checkbox on the contact form

**Files:**

- Modify: `src/components/client/ContactForm.astro`

**Why:** an EU site collecting name, email, phone, and free-text needs an explicit,
unticked, `required` consent to the privacy policy at the point of collection.

- [ ] **Step 1: Add the field**

Between the message `<textarea>` block and the submit button:

```astro
<div class="flex items-start gap-3">
  <input type="checkbox" name="privatnost" id="privatnost" required value="prihvaćam" class="mt-1" />
  <label for="privatnost" class="text-sm" style="color: var(--aw-color-text-default)">
    Slažem se s obradom svojih podataka u skladu s
    <a href="/privacy" class="underline" style="color: var(--aw-color-secondary)">politikom privatnosti</a>.
  </label>
</div>
```

Netlify Forms captures `privatnost` alongside the other fields (its value shows in the
submission), which is a light audit trail that consent was given.

- [ ] **Step 2: Build, check, and add to Natalija's list**

```bash
npm run build && npm run check
```

Add the checkbox label to the Croatian-copy review list in `docs/go-live.md`.

- [ ] **Step 3: Commit**

```
feat: require privacy-policy consent on the contact form

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

---

## Task 4: Focus-visible styling

**Files:**

- Modify: `src/assets/styles/tailwind.css`

**Why:** no element has a visible keyboard-focus indicator beyond the browser default,
and the custom inline `border-color` styles on form inputs partly fight it. Punch-list
items 3 and 7. `tailwind.css` is the template's designated home for global custom CSS
and is not in the core hard-rule list; this edit is a deliberate, scoped call, not a
core change.

- [ ] **Step 1: Add a global rule**

Append to `src/assets/styles/tailwind.css`:

```css
/* Client: visible keyboard-focus indicator (WCAG 2.4.7). The template ships only the
   browser default, which the custom inline input borders partly obscure. */
@layer base {
  :where(a, button, input, textarea, select, summary, [tabindex]):focus-visible {
    outline: 2px solid var(--aw-color-primary);
    outline-offset: 2px;
    border-radius: 2px;
  }

  :where(.dark) :where(a, button, input, textarea, select, summary, [tabindex]):focus-visible {
    outline-color: var(--aw-color-text-heading);
  }
}
```

Confirm the `@layer base` / `:where()` approach compiles under this repo's Tailwind v4
setup (the file already uses `@variant` / `@custom-variant`, so raw CSS in the file is
fine). If `@layer base` is not available, use a plain top-level rule.

- [ ] **Step 2: Build and tab through**

```bash
npm run build && npm run dev
```

Keyboard-only: tab through the header (including the Usluge dropdown), the footer
links, the homepage CTAs, the full contact form, and the consent banner. Every focused
element shows the wine outline in both light and dark mode.

- [ ] **Step 3: Commit**

```
feat: add a visible keyboard-focus indicator site-wide

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

---

## Task 5: Asset weight and the 404 page

**Files:**

- Modify: `src/assets/favicons/favicon.ico`
- Modify: `src/assets/images/default.png` -> `src/assets/images/default.jpg`
- Modify: `src/config.yaml` (OG image path + dimensions if changed)
- Modify: `src/pages/404.astro`

**Why:** `favicon.ico` is 285 KB (uncompressed 48x48 + 32x32 at 32bpp); a
PNG-compressed 16/32/48 `.ico` lands under 10 KB. The OG image is an 809 KB PNG of a
photo; a quality-82 JPG at the same 1200x630 is around 120 KB. The 404 page title is
the hardcoded English `Error 404`.

- [ ] **Step 1: Regenerate the favicon**

`sharp` is already a devDependency. Produce 16x16, 32x32, 48x48 PNG buffers from
`src/assets/images/vinalia-logo.svg` (or the existing `favicon.svg`), then pack them
into a multi-size `.ico`. If no `.ico` packer is available, add `png-to-ico` as a
devDependency (`npm i -D png-to-ico`) and use it. Target: under 15 KB. Write the
generation as a throwaway script in the scratchpad, not committed to the repo.
Verify: `file src/assets/favicons/favicon.ico` reports multiple sizes and the file is
under 15 KB.

- [ ] **Step 2: Convert the OG image**

```bash
# scratchpad script, not committed
npx --yes sharp-cli -i src/assets/images/default.png -o src/assets/images/ resize 1200 630 --fit cover -- jpeg --quality 82
```

or equivalent with the `sharp` API. Result: `src/assets/images/default.jpg`, roughly
100 to 200 KB, 1200x630. Delete `default.png`.

- [ ] **Step 3: Update the config reference**

In `src/config.yaml`, change the `metadata.openGraph.images[0].url` from
`~/assets/images/default.png` to `~/assets/images/default.jpg`. Dimensions stay
`1200 x 630`. Grep once more for any other reference:

```bash
grep -rn "default\.png" src/ astro.config.ts
```

Expected: no hits after the change.

- [ ] **Step 4: 404 page**

In `src/pages/404.astro`:

- Change `const title = 'Error 404'` to `const title = 'Stranica nije pronađena'`.
- Keep the visible `404` numeral and the existing Croatian body copy.
- Replace `text-muted dark:text-slate-400` on the body paragraph with
  `style="color: var(--aw-color-text-muted)"` so it uses the brand token and does not
  fall back to generic slate in dark mode.
- Confirm the `.btn` link renders with a visible background in both modes; if it looks
  unstyled, swap it for the same inline-styled anchor pattern the other pages use
  (`class="inline-block rounded-md px-8 py-3 font-semibold text-white" style="background-color: var(--aw-color-primary)"`).

- [ ] **Step 5: Build and verify**

```bash
npm run build
npm run test:links
```

Check `dist/` favicon and OG image sizes, and that `/404` renders with the Croatian
title and a styled button in light and dark.

- [ ] **Step 6: Commit**

```
fix: shrink favicon and OG image, localize the 404 title

- favicon.ico 285 KB -> <15 KB (compressed multi-size)
- OG image 809 KB PNG -> ~120 KB JPG
- 404 title to Croatian, body colour to brand token

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

---

## Task 6: Full verification pass

**Files:** none (fixes applied to whatever it finds, committed with the relevant task
or as a follow-up `fix:` commit).

- [ ] **Step 1: The `SETUP.md` §7 suite**

```bash
npm run build
npm run check
npm run test:links
npm run test:lhci
```

All hard gates green: accessibility = 100, SEO and best-practices >= 95. Run
`test:lhci` (or a manual Lighthouse run) against a **dark-mode** render as well, since
the derived plum palette in `brand.ts` was only ever verified on the light theme.

- [ ] **Step 2: Manual pass**

Seven marketing pages plus `/kolacici`, `/hvala`, `/terms`, `/privacy`, `/404`. Check:
dark mode on every page, mobile width, the mobile nav menu, the Usluge dropdown by
keyboard, the consent flow end to end, the contact form's required-field behaviour
including the new checkbox.

- [ ] **Step 3: Update `docs/go-live.md`**

- The GA-ID step (done in Task 1 Step 6).
- Add a step: "Configure the Netlify Forms notification recipient (Site config ->
  Forms -> Form notifications -> add `natalijabrala@vinaliaconsulting.com`)." This is
  the only way a submission reaches Natalija and it is not code.
- Note that the contact-form submission test now also checks the `/hvala` redirect.

- [ ] **Step 4: Final commit if Steps 1 and 2 surfaced fixes**

```
fix: address findings from the launch-fixes verification pass

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

---

## Self-review notes

- **Every change is client-layer** except the one `tailwind.css` focus rule, which is
  the template's sanctioned place for global client CSS and is flagged in Task 4.
- **No new copy is client-verbatim**, so the no-em-dash rule applies to all of it, and
  all of it goes on Natalija's list: the checkbox label, `/hvala` and `/kolacici`
  body text, the 404 title.
- **The GA guard's local-build behaviour is the one open question** (Task 1 Step 7):
  the check must fire in CI/Netlify without breaking a local `npm run build` on the
  placeholder. The implementer picks the mechanism and records it in a comment.
- **Netlify-dependent testing** (form submit, redirect, notifications, Consent Mode in
  a real GA property) cannot be done locally and is deferred to the go-live checklist,
  not skipped.
- **Out of scope, still tracked in `go-live.md`:** real GA4 property, legal review,
  DNS, Search Console ID, `geo` coordinates, Natalija sign-off. This plan does not
  touch `terms.md` / `privacy.md` content.
