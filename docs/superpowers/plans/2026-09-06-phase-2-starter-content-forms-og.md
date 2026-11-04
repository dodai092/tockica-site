# Phase 2: Starter Content, Forms Pattern, OG Images — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give a client build a neutral starting point for the five content pages, a copy-and-wire Netlify Forms pattern, build-time branded OG images, and optional typed content collections.

**Architecture:** Four independent additions in one SDD run. Content collections are new files under `src/content/` plus schemas in `src/content.config.ts`. The neutral pages rewrite the existing `src/pages/*.astro` in place, keeping widget composition and consuming the new collections as the worked demo. The forms pattern lives entirely in `src/components/client/` and `src/pages/`. OG images use `astro-og-canvas` as an endpoint at `src/pages/og/[...route].ts`, with a scoped guard added to core `src/utils/images.ts` so a generated-route URL is not fed to Sharp.

**Tech Stack:** Astro 7, Tailwind v4, Astro content collections (`file()` loader), `astro-og-canvas` 0.13.1, Netlify Forms (static HTML detection), Playwright golden screenshots.

**Spec:** `docs/superpowers/specs/2026-09-06-phase-2-starter-content-forms-og-design.md` — read it before starting. The plan argues from the spec; both travel together.

## Global Constraints

- **No em dashes** anywhere — page copy, component copy, docs, comments, commit messages. Use a period, comma, or "and"/"so".
- **Analytics is GA4.** Do not add or mention Plausible/Fathom/other vendors.
- **Spartan copy.** Neutral page copy is short declarative sentences. No fake company name, no Lorem, no marketing inflation, no rule-of-three lists.
- **Forms pattern touches no core.** `src/components/ui/Form.astro` and `src/components/widgets/Contact.astro` stay byte-identical (`git diff` proves it).
- **Allowed core edits, each raised before making it:** `src/content.config.ts` (Part 1), `astro.config.ts` integration line if `astro-og-canvas` needs one (Part 2), one guard block in `src/utils/images.ts` `adaptOpenGraphImages` (Part 2). Nothing else under `src/layouts/`, `src/utils/`, `src/components/{ui,common,blog}/`, `vendor/`.
- **Golden baseline** must be refreshed and committed as its own commit (Task 5) because Task 4 changes rendered appearance.
- Every task ends green on: `npm run build`, `npm run check`, `npm run test:links`. `npm run test:lhci` is run at Task 4 and Task 6.
- Client copy in seeds is generic and industry-free; mark it so a build knows to replace it.

---

### Task 1: Light content collections

**Files:**
- Modify: `src/content.config.ts` (add four collections to the schema and the `collections` export)
- Create: `src/content/services.yaml`
- Create: `src/content/team.yaml`
- Create: `src/content/testimonials.yaml`
- Create: `src/content/faqs.yaml`
- Test: none as a framework; verification is `npm run check` run two ways (seeds present, seeds emptied) plus a `node` assertion via `getCollection`.

**Interfaces:**
- Produces: four collections queryable with `getCollection('services'|'team'|'testimonials'|'faqs')`. Entry `data` shapes:
  - `services`: `{ id: string; title: string; summary: string; icon?: string; order?: number }`
  - `team`: `{ id: string; name: string; role: string; bio?: string; image?: string; order?: number }`
  - `testimonials`: `{ id: string; quote: string; name: string; role?: string; company?: string; image?: string }`
  - `faqs`: `{ id: string; question: string; answer: string; order?: number }`
- Later tasks (Task 4) import `getCollection` from `astro:content` and sort by `order ?? 0` where `order` exists.

- [ ] **Step 1: Add the four collection definitions to `src/content.config.ts`**

Insert above the existing `postCollection` definition:

```ts
import { file } from 'astro/loaders';

const servicesCollection = defineCollection({
  loader: file('src/content/services.yaml'),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    icon: z.string().optional(),
    order: z.number().optional(),
  }),
});

const teamCollection = defineCollection({
  loader: file('src/content/team.yaml'),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string().optional(),
    image: z.string().optional(),
    order: z.number().optional(),
  }),
});

const testimonialsCollection = defineCollection({
  loader: file('src/content/testimonials.yaml'),
  schema: z.object({
    quote: z.string(),
    name: z.string(),
    role: z.string().optional(),
    company: z.string().optional(),
    image: z.string().optional(),
  }),
});

const faqsCollection = defineCollection({
  loader: file('src/content/faqs.yaml'),
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    order: z.number().optional(),
  }),
});
```

Note: `glob` is already imported. Add `file` to that same `astro/loaders` import line rather than a second import.

- [ ] **Step 2: Extend the `collections` export**

```ts
export const collections = {
  post: postCollection,
  services: servicesCollection,
  team: teamCollection,
  testimonials: testimonialsCollection,
  faqs: faqsCollection,
};
```

- [ ] **Step 3: Write the seed files**

`src/content/services.yaml` (the `file()` loader gives each entry `id` from the `id` key):

```yaml
# REPLACE all entries with the client's real services (source: docs/intake.md).
- id: discovery
  title: Discovery
  summary: A short engagement to map the problem, the constraints, and what a good outcome looks like.
  icon: tabler:search
  order: 1
- id: build
  title: Build
  summary: Design and implementation delivered in reviewable increments.
  icon: tabler:tool
  order: 2
- id: support
  title: Ongoing support
  summary: Maintenance, monitoring, and iteration after launch.
  icon: tabler:lifebuoy
  order: 3
```

`src/content/team.yaml`:

```yaml
# REPLACE all entries with the client's real team (source: docs/intake.md).
- id: person-1
  name: First Last
  role: Founder
  bio: One or two sentences on background and focus.
  order: 1
- id: person-2
  name: First Last
  role: Operations
  bio: One or two sentences on background and focus.
  order: 2
```

`src/content/testimonials.yaml`:

```yaml
# REPLACE all entries with real, permissioned client quotes (source: docs/intake.md).
- id: quote-1
  quote: They understood what we needed and delivered it without fuss.
  name: First Last
  role: Role
  company: Company
- id: quote-2
  quote: Clear communication and a result that did what it was supposed to.
  name: First Last
  role: Role
  company: Company
```

`src/content/faqs.yaml`:

```yaml
# REPLACE all entries with the client's real FAQs (source: docs/intake.md).
- id: how-long
  question: How long does a project take?
  answer: Most engagements run four to eight weeks depending on scope.
  order: 1
- id: how-priced
  question: How is pricing structured?
  answer: A fixed price per phase, agreed before the phase starts.
  order: 2
- id: after-launch
  question: What happens after launch?
  answer: A support window is included, with optional ongoing maintenance after that.
  order: 3
```

- [ ] **Step 4: Verify `astro check` passes with seeds present**

Run: `npm run check`
Expected: PASS, 0 errors. `astro sync` generates `data` types for the four collections.

- [ ] **Step 5: Verify the collections load and are typed**

Create a throwaway check file `scripts/_check-collections.mjs`:

```js
import { getCollection } from 'astro:content';
for (const name of ['services', 'team', 'testimonials', 'faqs']) {
  const entries = await getCollection(name);
  if (!entries.length) throw new Error(`${name}: expected seed entries, got 0`);
  console.log(`${name}: ${entries.length} entries`);
}
```

Run: `npx astro build` then confirm the build log shows the four collections synced with no schema error. Delete `scripts/_check-collections.mjs` after (it cannot run standalone; the real signal is a clean `astro check` + `astro build`).

Simpler sufficient check: `npm run build` and confirm no `[content] ... does not match collection schema` error.

- [ ] **Step 6: Verify empty collections do not break `astro check`**

Temporarily replace each YAML file's contents with `[]`, run `npm run check`, confirm PASS, then restore the seed contents (`git checkout src/content/`).
Expected: PASS both with `[]` and with seeds. This proves a client that empties the collections stays green.

- [ ] **Step 7: Commit**

```bash
git add src/content.config.ts src/content/
git commit -m "feat: optional services/team/testimonials/faqs content collections"
```

---

### Task 2: OG images (astro-og-canvas, build-time)

**Files:**
- Modify: `package.json` (add `astro-og-canvas` dependency)
- Modify: `astro.config.ts` (only if `astro-og-canvas` requires an integration registration; the endpoint form does not — confirm in Step 1)
- Modify: `src/utils/images.ts` (guard in `adaptOpenGraphImages`) — **core touch, raise before making**
- Create: `src/pages/og/[...route].ts` (the OG image route + page manifest)
- Create: `src/pages/dev/og.astro` (preview route, stripped by init-client with the rest of `src/pages/dev/`)
- Modify: `src/pages/{index,about,services,pricing,contact}.astro` (add `metadata.openGraph.images`) — note Task 4 rewrites these files wholesale, so keep this change to the `metadata` object only and expect Task 4 to preserve it
- Test: `curl` the built OG routes; `npm run build`; grep built HTML for the `og:image` tag

**Interfaces:**
- Consumes: `brand` from `~/brand` (`brand.light.primary`, `brand.light.bgPage`, `brand.logo`).
- Produces: static routes `/og/home.png`, `/og/about.png`, `/og/services.png`, `/og/pricing.png`, `/og/contact.png`, `/og/thank-you.png` (1200x630 PNG). A `PAGES` manifest object exported from `src/pages/og/[...route].ts` mapping key -> `{ title, description }`.

- [ ] **Step 1: Spike — confirm `astro-og-canvas` builds in this repo**

```bash
npm install astro-og-canvas@0.13.1
```

Create `src/pages/og/[...route].ts`:

```ts
import { OGImageRoute } from 'astro-og-canvas';
import { brand } from '~/brand';

// Static marketing pages that get a generated card. Keys map to /og/<key>.png.
export const PAGES: Record<string, { title: string; description: string }> = {
  home: { title: 'Home', description: '' },
  about: { title: 'About', description: '' },
  services: { title: 'Services', description: '' },
  pricing: { title: 'Pricing', description: '' },
  contact: { title: 'Contact', description: '' },
  'thank-you': { title: 'Thank you', description: '' },
};

const rgbToHex = (rgb: string): string => {
  const m = rgb.match(/\d+/g);
  if (!m || m.length < 3) return '#0161ef';
  return '#' + m.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join('');
};

export const { getStaticPaths, GET } = OGImageRoute({
  param: 'route',
  pages: PAGES,
  getImageOptions: (_path, page: { title: string; description: string }) => ({
    title: page.title,
    description: page.description,
    bgGradient: [
      [
        parseInt(rgbToHex(brand.light.bgPage).slice(1, 3), 16),
        parseInt(rgbToHex(brand.light.bgPage).slice(3, 5), 16),
        parseInt(rgbToHex(brand.light.bgPage).slice(5, 7), 16),
      ],
    ],
    border: { color: [1, 97, 239], width: 20, side: 'inline-start' },
    padding: 60,
  }),
});
```

Adjust option keys to `astro-og-canvas` 0.13.1's actual API (check `node_modules/astro-og-canvas/README.md` — the key names for gradient/border/logo may differ). The point of this step: get one route rendering.

Run: `npx astro build`
Expected: build succeeds, `dist/og/home.png` etc. exist and are valid PNGs (`file dist/og/home.png` says "PNG image data, 1200 x 630").

**If the build fails** (integration incompatibility, canvas native dep, conflict with `astro-compress`): stop, record the failure in the spec's "Open flags" section and in this task, and switch to the fallback — skip the route, keep `src/assets/images/default.png`, and in Step 5 document a per-page override via `metadata.openGraph.images` pointing at a committed `~/assets/images/og/<page>.png` the build team supplies by hand. Then Steps 3-4 below still apply (the guard is still useful for public images), Step 2's manifest becomes just the doc note. Continue to Task 3.

- [ ] **Step 2: Fill in the manifest titles and descriptions**

Set each `PAGES` entry's `title` and `description` to the real page title and a one-sentence neutral description (these are Task 4's page copy in miniature; keep them consistent with what Task 4 writes). Example:

```ts
home: { title: 'Company', description: 'What the company does, in one line.' },
about: { title: 'About', description: 'Who we are and how we work.' },
```

- [ ] **Step 3: Write the failing check for the core guard**

Before editing `src/utils/images.ts`, confirm the problem exists. Add `images: [{ url: '/og/home.png', width: 1200, height: 630 }]` to `src/pages/index.astro`'s `metadata.openGraph` and run `npx astro build`.
Expected: build errors or emits a broken `og:image` URL, because `adaptOpenGraphImages` passes `/og/home.png` to Sharp `getImage`. Record the exact error.

- [ ] **Step 4: Add the guard to `adaptOpenGraphImages` (raise this core touch first)**

In `src/utils/images.ts`, inside the `openGraph.images.map` callback, after `const resolved = await findImage(image.url);` and its null check, add:

```ts
// A root-relative URL that is not an assets file (a generated route like
// /og/x.png, or any public/ image) cannot be reprocessed by Sharp. Pass it
// through as an absolute URL with its declared dimensions.
if (typeof resolved === 'string' && resolved.startsWith('/') && !resolved.startsWith('//')) {
  return {
    url: String(new URL(resolved, astroSite)),
    width: image.width ?? OG_WIDTH,
    height: image.height ?? OG_HEIGHT,
  };
}
```

The existing remote-URL branch (`http`/`https` strings) is unchanged. `~/assets/images/*` still resolves to `ImageMetadata` and goes through `getImage` as before.

- [ ] **Step 5: Wire the six pages' OG images**

In each of `src/pages/{index,about,services,pricing,contact}.astro`, set:

```ts
const metadata = {
  title: '...',
  openGraph: { images: [{ url: '/og/<key>.png', width: 1200, height: 630 }] },
};
```

(`index.astro` -> `home`, others by name.) `thank-you.astro` is created in Task 3; add its `openGraph.images` there.
Leave `src/config.yaml`'s `default.png` entry as the fallback for any page without its own.

- [ ] **Step 6: Create the dev preview route**

`src/pages/dev/og.astro`: a noindex page (`robots: { index: false, follow: false }`) that lists each `PAGES` key with an `<img src="/og/<key>.png">` at a reduced width, so a build can eyeball the cards. Import `PAGES` from `~/pages/og/[...route].ts`.

- [ ] **Step 7: Verify**

Run: `npm run build && npm run check && npm run test:links`
Expected: all pass. `dist/og/*.png` are valid 1200x630 PNGs. `grep -o 'og:image[^>]*' dist/about/index.html` shows the absolute `/og/about.png` URL. `dist/dev/og/index.html` exists (still present in the template; init-client strips `src/pages/dev/`).

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json astro.config.ts src/utils/images.ts src/pages/og/ src/pages/dev/og.astro src/pages/index.astro src/pages/about.astro src/pages/services.astro src/pages/pricing.astro src/pages/contact.astro
git commit -m "feat: build-time branded OG images via astro-og-canvas"
```

---

### Task 3: Forms pattern (Netlify Forms, client layer)

**Files:**
- Create: `src/components/client/ContactForm.astro`
- Create: `src/pages/thank-you.astro`
- Create: `public/__forms.html` (Netlify build-time form detection stub)
- Create: `docs/forms.md`
- Modify: `SETUP.md` (cross-reference `docs/forms.md` from B3 and B4)
- Test: `npm run build` then grep built HTML for the form attributes and the thank-you page

**Interfaces:**
- Consumes: parts-bin markup patterns from `src/components/widgets/Contact.astro` and `src/components/ui/Form.astro` (copied, not imported from a build's perspective — but in the template `ContactForm.astro` may import `~/components/ui/Button.astro` and `~/layouts/PageLayout.astro`, which is allowed).
- Produces: `<ContactForm />` usable from any page; `/thank-you/` route.

- [ ] **Step 1: Write the failing check**

Run: `grep -rn "data-netlify" src/` -> no matches. `curl` of `/thank-you/` after build -> 404. These are the conditions the task fixes.

- [ ] **Step 2: Create `src/components/client/ContactForm.astro`**

A self-contained form (not wrapping core `Form.astro`). Requirements:
- `<form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/thank-you/">`
- Hidden `<input type="hidden" name="form-name" value="contact" />`
- Hidden honeypot: `<p hidden><label>Do not fill this out: <input name="bot-field" /></label></p>`
- Fields: `name` (text, required), `email` (email, required), `message` (textarea, required)
- **Required** consent checkbox: `<input type="checkbox" name="consent" required />` with a label linking to `/privacy` ("I agree to the privacy policy").
- Submit button via `~/components/ui/Button.astro` (`variant="primary" type="submit"`).
- Styling: copy the field/label/container classes from `src/components/ui/Form.astro` and the card wrapper from `src/components/widgets/Contact.astro` (the `rounded-(--aw-radius-card)` / `shadow-(--aw-shadow-card)` card) so it responds to the design tokens. Do not import those core files' markup; copy the classes.
- A leading HTML comment: `<!-- Netlify Forms reference. Wired for Netlify deploys. For another host, see docs/forms.md. -->`

- [ ] **Step 3: Create `src/pages/thank-you.astro`**

```astro
---
import Layout from '~/layouts/PageLayout.astro';
import HeroText from '~/components/widgets/HeroText.astro';

const metadata = {
  title: 'Thank you',
  robots: { index: false, follow: false },
  openGraph: { images: [{ url: '/og/thank-you.png', width: 1200, height: 630 }] },
};
---

<Layout metadata={metadata}>
  <HeroText
    title="Thank you"
    subtitle="Your message has been sent. We will get back to you shortly."
  />
  <div class="mx-auto max-w-3xl px-4 pb-16 text-center">
    <a href="/" class="text-primary underline">Back to home</a>
  </div>
</Layout>
```

- [ ] **Step 4: Create `public/__forms.html`**

```html
<!doctype html>
<!-- Netlify scans built HTML for forms at deploy time. This stub guarantees the
     "contact" form is registered even if the page that renders it changes. -->
<html>
  <body>
    <form name="contact" data-netlify="true" netlify-honeypot="bot-field" hidden>
      <input type="text" name="name" />
      <input type="email" name="email" />
      <textarea name="message"></textarea>
      <input type="checkbox" name="consent" />
      <input name="bot-field" />
    </form>
  </body>
</html>
```

- [ ] **Step 5: Render the form on `/contact`**

This is done properly in Task 4's contact-page rewrite. For this task, add `<ContactForm />` to `src/pages/contact.astro` in place of the parts-bin `<ContactUs .../>` block, import it, and leave the rest of the page for Task 4. Run `npm run build` to confirm it renders.

- [ ] **Step 6: Write `docs/forms.md`**

Cover, in short prose (no em dashes):
- The pattern: `src/components/client/ContactForm.astro` is the reference. Copy and adapt per build; keep the consent checkbox and the `action="/thank-you/"`.
- Netlify detection: Netlify scans built HTML at deploy. The form must appear in a built page; `public/__forms.html` is the backstop for forms that only render behind interaction.
- Spam: the honeypot (`bot-field`) ships. reCAPTCHA is opt-in via Netlify's dashboard plus a `data-netlify-recaptcha` div; add only if the client asks.
- Non-Netlify hosts: swap `data-netlify` + `form-name` for the provider's endpoint (Formspree `action="https://formspree.io/f/xxx"`, Web3Forms hidden `access_key`). The consent checkbox and success page requirements do not change.
- Hard requirements (also in SETUP.md B4): every form that collects personal data has a required privacy-policy consent checkbox and a styled success page, not the host's generic one.

- [ ] **Step 7: Cross-reference from SETUP.md**

In SETUP.md Arc B, step B3 build rules, add a bullet: "Contact forms: copy `src/components/client/ContactForm.astro`; the pattern and the non-Netlify swap-ins are in [`docs/forms.md`](./docs/forms.md)." In B4 step 6 (compliance), add "(see `docs/forms.md`)" after the consent-checkbox line.

- [ ] **Step 8: Verify**

Run: `npm run build && npm run check && npm run test:links`
Expected: pass. `grep -o 'data-netlify[^ ]*' dist/contact/index.html` matches. `dist/thank-you/index.html` exists. `git diff --stat src/components/ui/Form.astro src/components/widgets/Contact.astro` is empty.

- [ ] **Step 9: Commit**

```bash
git add src/components/client/ContactForm.astro src/pages/thank-you.astro public/__forms.html docs/forms.md SETUP.md src/pages/contact.astro
git commit -m "feat: Netlify Forms contact pattern + thank-you page + docs/forms.md"
```

---

### Task 4: Neutral starter pages

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/pages/about.astro`
- Modify: `src/pages/services.astro`
- Modify: `src/pages/pricing.astro`
- Modify: `src/pages/contact.astro`
- Create: `src/assets/images/placeholder-hero.svg` (neutral local hero image)
- Test: `grep` for demo strings; `npm run build`; `npm run test:lhci`

**Interfaces:**
- Consumes: `getCollection` from `astro:content` (Task 1); the `metadata.openGraph.images` entries added in Task 2 (preserve them); `<ContactForm />` (Task 3).

- [ ] **Step 1: Write the failing check**

```bash
grep -rniE "lorem|astrowind|miami|arthelokyo|unsplash|fake numbers|template collection" src/pages/*.astro
```
Expected now: many matches. Target after this task: zero (except any `_examples/` which this grep excludes since it globs `src/pages/*.astro` only — confirm `_examples` is a subdir and not matched).

- [ ] **Step 2: Create the neutral hero placeholder**

`src/assets/images/placeholder-hero.svg`: a plain low-contrast SVG (a soft rounded rectangle or a simple abstract shape) on a transparent or `currentColor`-tinted background, 1200x800 viewBox. No text. This replaces the Unsplash URLs on the pages that set a hero `image`.

- [ ] **Step 3: Rewrite `src/pages/index.astro`**

Keep the widget sequence: Hero, Note, Features, Content x1 (drop the three-Content pileup to one), Steps, Testimonials (from collection), FAQs (from collection), CallToAction. Drop `BlogLatestPosts` (blog is off by default) and `Stats` (no neutral numbers). For each remaining widget:
- Replace every string with short neutral copy. Example Hero:

```astro
<Hero
  actions={[{ variant: 'primary', text: 'Get in touch', href: '/contact' }]}
  image={{ src: '~/assets/images/placeholder-hero.svg', alt: '' }}
>
  <Fragment slot="title">A clear one-line statement of what the company does</Fragment>
  <Fragment slot="subtitle">
    <!-- REPLACE: two sentences on who this is for and the outcome they get. Source: docs/intake.md -->
    One or two plain sentences describing the offer and who it is for.
  </Fragment>
</Hero>
```

- Testimonials section reads the collection:

```astro
---
import { getCollection } from 'astro:content';
const testimonials = (await getCollection('testimonials')).map((t) => ({
  testimonial: t.data.quote,
  name: t.data.name,
  job: [t.data.role, t.data.company].filter(Boolean).join(', '),
}));
---
{testimonials.length > 0 && (
  <Testimonials title="What clients say" testimonials={testimonials} />
)}
```

- FAQs section:

```astro
---
const faqs = (await getCollection('faqs'))
  .sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0))
  .map((f) => ({ title: f.data.question, description: f.data.answer }));
---
{faqs.length > 0 && <FAQs title="Questions" items={faqs} />}
```

- Preserve the `metadata.openGraph.images` entry from Task 2. Set `metadata.title` to a neutral value and remove `ignoreTitleTemplate` (or keep it and set a neutral title — pick one, note it).
- Every block a build must revisit gets a `<!-- REPLACE: ... -->` comment naming what belongs there and its source.

- [ ] **Step 4: Rewrite `src/pages/about.astro`**

Keep: Hero, one Features3 (values), Steps2 (how we work), team section from collection. Drop the locations Features2, the achievements/stats, the second Features3. Team section:

```astro
---
const team = (await getCollection('team'))
  .sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0));
---
{team.length > 0 && (
  <Features2
    title="Team"
    columns={2}
    items={team.map((p) => ({
      title: p.data.name,
      description: [p.data.role, p.data.bio].filter(Boolean).join(' — '),
    }))}
  />
)}
```

Wait: no em dashes. Use `.join('. ')` or render role and bio as separate lines. Use:

```astro
items={team.map((p) => ({ title: p.data.name, description: `${p.data.role}. ${p.data.bio ?? ''}`.trim() }))}
```

Hero `image` -> `~/assets/images/placeholder-hero.svg`, `alt=""`.

- [ ] **Step 5: Rewrite `src/pages/services.astro`**

Keep: Hero, a services grid from the collection, one Content block, CallToAction. Services grid:

```astro
---
const services = (await getCollection('services'))
  .sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0));
---
<Features2
  title="What we do"
  columns={3}
  items={services.length > 0
    ? services.map((s) => ({ title: s.data.title, description: s.data.summary, icon: s.data.icon }))
    : [{ title: 'Service', description: 'REPLACE: describe a service. Source: docs/intake.md' }]}
/>
```

Note the empty-collection fallback renders one placeholder item so the page never has an empty grid. Drop Testimonials here (it is on the home page). Hero `image` -> placeholder SVG, `actions` -> `href: '/contact'`, `target` removed.

- [ ] **Step 6: Rewrite `src/pages/pricing.astro`**

Keep: HeroText, Prices, one FAQs (from the `faqs` collection, same pattern as Step 3), CallToAction. Drop Features3 and Steps. Prices: three neutral tiers with `<!-- REPLACE -->` on every price and feature line, `price` set to a placeholder like `0` with a comment, `callToAction.href: '/contact'`. Example one tier:

```astro
{
  title: 'Starter',
  subtitle: 'REPLACE: who this tier is for',
  price: 0, // REPLACE with the real price. Source: docs/intake.md
  period: 'per project',
  items: [{ description: 'REPLACE: what is included' }],
  callToAction: { text: 'Get in touch', href: '/contact' },
},
```

- [ ] **Step 7: Rewrite `src/pages/contact.astro`**

Keep: HeroText, `<ContactForm />` (from Task 3), one Features2 with neutral contact-channel items (email, phone, location) each with a `<!-- REPLACE -->` and a placeholder value. Drop the six-item support grid. Preserve `metadata.openGraph.images`.

- [ ] **Step 8: Update the `contact` OG description and any manifest drift**

If page titles/descriptions changed vs Task 2's `PAGES` manifest, update `src/pages/og/[...route].ts` `PAGES` to match.

- [ ] **Step 9: Verify**

Run:
```bash
grep -rniE "lorem|astrowind|miami|arthelokyo|unsplash|fake numbers" src/pages/index.astro src/pages/about.astro src/pages/services.astro src/pages/pricing.astro src/pages/contact.astro
npm run build && npm run check && npm run test:links && npm run test:lhci
```
Expected: grep is empty. Build, check, links pass. LHCI: a11y 100, SEO/best-practices >= 95 (perf is a warning). If a11y drops, fix contrast/labels before committing.

- [ ] **Step 10: Commit**

```bash
git add src/pages/index.astro src/pages/about.astro src/pages/services.astro src/pages/pricing.astro src/pages/contact.astro src/assets/images/placeholder-hero.svg src/pages/og/
git commit -m "feat: neutral starter content on the five marketing pages"
```

---

### Task 5: Golden baseline refresh

**Files:**
- Modify: `golden-baselines/**` (regenerated PNGs)
- Modify: `golden-baselines/routes.json` (add `/thank-you`)
- Test: `npm run screenshot:check`

**Interfaces:** none. This task only refreshes the visual-regression baseline that Tasks 3-4 invalidated.

- [ ] **Step 1: Add the new route to the baseline set**

Edit `golden-baselines/routes.json` to add `/thank-you`:

```json
["/", "/about", "/contact", "/pricing", "/services", "/privacy", "/terms", "/thank-you"]
```

- [ ] **Step 2: Confirm the baseline is currently stale**

Run: `npm run screenshot:check`
Expected: FAIL on `/`, `/about`, `/contact`, `/pricing`, `/services` (content changed) and MISSING on `/thank-you`. This confirms the refresh is needed and scoped to the pages Phase 2 touched. If any page NOT touched by Tasks 1-4 shows a diff, stop and investigate before refreshing.

- [ ] **Step 3: Regenerate the baseline**

Run: `npm run screenshot`
Expected: writes new PNGs under `golden-baselines/` for all routes.

- [ ] **Step 4: Verify the refreshed baseline passes**

Run: `npm run screenshot:check`
Expected: PASS for every route.

- [ ] **Step 5: Eyeball the new screenshots**

Open a few (`golden-baselines/home/light-desktop.png`, `golden-baselines/thank-you/light-desktop.png`) and confirm the pages render as intended: neutral copy, placeholder hero visible, contact form present, no broken images, no leftover demo text.

- [ ] **Step 6: Commit**

```bash
git add golden-baselines/ golden-baselines/routes.json
git commit -m "chore: refresh golden baseline for Phase 2 page rewrites"
```

---

### Task 6: init-client wiring, ADR 0005, verification

**Files:**
- Modify: `scripts/init-client.mjs` (add two `reinit-checklist.md` lines; update the "Content pages" line)
- Create: `docs/adr/0005-starter-content-forms-og.md`
- Test: scratch `init-client` run in a copy; full `npm run check` + `npm run build` + `npm run test:lhci`

**Interfaces:** none.

- [ ] **Step 1: Update the `reinit-checklist.md` template in `scripts/init-client.mjs`**

In the `checklist` template string:
- Change the "Content pages" line to: `- [ ] Content pages: src/pages/{index,about,services,pricing,contact}.astro carry neutral starter copy; replace each block marked <!-- REPLACE --> during the build (source: docs/intake.md)`
- Add under "Brand and assets":
  - `- [ ] src/content/{services,team,testimonials,faqs}.yaml: replace or empty ([]) the seed entries`
  - `- [ ] OG images: open /og/home.png (npm run dev) and confirm it renders with the client's brand colour and logo`

- [ ] **Step 2: Verify the string guard still passes**

Run: `node scripts/init-client.mjs --check`
Expected: PASS (the checklist template is not part of the `REPLACEMENTS` verbatim-match table, so this should be unaffected — confirm).

- [ ] **Step 3: Write `docs/adr/0005-starter-content-forms-og.md`**

House style of ADR 0001-0004 (Context / Decision / Consequences). Record:
- Four optional `file()`-loader content collections (`services`, `team`, `testimonials`, `faqs`). Optional by design: a build uses them or keeps copy inline. Seeds ship and the build clears them. Page-section content beyond these four kinds stays inline; a bespoke-per-client build is not a CMS.
- The five marketing pages carry neutral starter copy with `<!-- REPLACE -->` markers, keeping widget composition as the reference layout. Old demo copy is in git history, not `_examples/`.
- Forms: `src/components/client/ContactForm.astro` is the reference, Netlify Forms as the default, client layer only, core `Form.astro`/`Contact.astro` untouched. `docs/forms.md` has the detail.
- OG images: `astro-og-canvas` endpoint at `src/pages/og/[...route].ts`, scoped to the six static pages, reading `brand.ts`. `adaptOpenGraphImages` in `src/utils/images.ts` gained a guard so a root-relative URL (generated route or `public/` image) is passed through without Sharp. Blog-post OG deferred (blog off by default, needs a core `[...blog]` change).
- If Task 2 hit the fallback: record that instead (static `default.png` + manual per-page override) and mark OG generation deferred.

- [ ] **Step 4: Scratch `init-client` verification**

```bash
mkdir -p /private/tmp/claude-501/.../scratchpad && cd "$_"   # use the session scratchpad
git -C /Users/antunzebec/Work/dodai-astrowind archive HEAD | tar -x -C .
npm install
printf 'Acme Co\nacme.example\nAcme Co Ltd\nhello@acme.example\nEngland and Wales\n#cc0000\ny\nsystem\n' | node scripts/init-client.mjs   # adjust prompt order to the actual prompts
```

Then in the scratch copy:
- `grep -riE "lorem|astrowind|miami" src/pages/*.astro` -> empty
- `cat docs/reinit-checklist.md` -> contains the two new lines and the reworded Content pages line
- `npm run dev` and open `/og/home.png` -> renders with `#cc0000` accent
- `npm run build && npm run check` -> pass
- confirm `src/pages/dev/` and `docs/superpowers/` were stripped

Delete the scratch copy after.

- [ ] **Step 5: Full verification on the branch**

Run: `npm run build && npm run check && npm run test:links && npm run test:lhci && npm run screenshot:check`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add scripts/init-client.mjs docs/adr/0005-starter-content-forms-og.md
git commit -m "docs: ADR 0005 + init-client wiring for Phase 2"
```

- [ ] **Step 7: Update the memory note**

Add a Phase 2 DONE entry to `~/.claude/projects/-Users-antunzebec-Work-dodai-astrowind/memory/dodai-template-plan.md` after the Phase 1 entry: what shipped (four collections, neutral pages, Netlify Forms pattern, OG generation or its fallback), the `images.ts` guard, ADR 0005, and that Phase 3/4 remain conversation-only. Convert any relative date to absolute.

---

## Self-Review

**Spec coverage:**
- Part 1 (content collections) -> Task 1. ADR -> Task 6 Step 3. init-client seed line -> Task 6 Step 1. ✓
- Part 2 (neutral pages) -> Task 4. Collections consumed as the demo -> Task 4 Steps 3-6. Local hero -> Task 4 Step 2. `reinit-checklist` "Content pages" reword -> Task 6 Step 1. ✓
- Part 3 (forms) -> Task 3. `ContactForm.astro`, `thank-you.astro`, `__forms.html`, `docs/forms.md`, SETUP cross-refs -> all in Task 3. Consent + success page -> Steps 2-3. ✓
- Part 4 (OG) -> Task 2. `astro-og-canvas`, route, manifest, `images.ts` guard, per-page wiring, dev preview, fallback -> Steps 1-8. `reinit-checklist` OG line -> Task 6 Step 1. Blog deferral -> ADR, Task 6 Step 3. ✓
- Open flag 1 (compat spike) -> Task 2 Step 1 with explicit fallback. ✓
- Open flag 2 (golden refresh own commit) -> Task 5. ✓
- Success criteria: build/check/links/lhci -> each task's verify step + Task 6 Step 5. `astro check` both ways -> Task 1 Step 6. scratch init-client -> Task 6 Step 4. forms core untouched -> Task 3 Step 8. golden -> Task 5. ADR 0005 -> Task 6. ✓

**Placeholder scan:** `<!-- REPLACE: ... -->` markers in page copy are intentional deliverable content (client-fill markers), not plan placeholders. All code steps carry real code. `astro-og-canvas` option keys flagged for README verification in Task 2 Step 1 because the exact 0.13.1 API surface (gradient/border/logo key names) must be read from the installed package, not guessed.

**Type consistency:** `getCollection('<name>')` entry access is `entry.data.<field>` throughout. `order` sort is `(a.data.order ?? 0) - (b.data.order ?? 0)` everywhere. OG manifest keys (`home`/`about`/`services`/`pricing`/`contact`/`thank-you`) match the `/og/<key>.png` URLs in the page `metadata` and the `dev/og.astro` preview. `image.width ?? OG_WIDTH` in the guard matches the existing `OG_WIDTH`/`OG_HEIGHT` constants in `images.ts`.

**Note on em dashes:** Task 4 Step 4's first draft used `' — '` in a `.join`; corrected in the same step to `. `. Reviewers: reject any em dash in generated copy or code.
