# Točkica na i Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Follow the karpathy guidelines (simplest change, touch only what the task names, verify against the stated check).

**Goal:** A bilingual (Croatian at `/`, English at `/en/`) public website for Točkica na i, built on the Dodai template, with layout A homepage, Instruktori, Paketi, Sculpt Room, Raspored stub and legal stubs.

**Architecture:** Static Astro site. A single route table (`src/i18n/routes.ts`) names every page once with its HR and EN path, and drives links, the language switch, hreflang alternates and the twin test. Copy lives in typed per-language files that must have identical keys. All new components live in `src/components/client/`. Page language and hreflang come from page metadata (template PR #15, `metadata.lang` and `metadata.alternates`). Booking lives in a separate app proxied under `tockicanai.hr` later (Tockica ADR 0005 update), so `/raspored/` is a stub for now.

**Tech Stack:** Astro 7, Tailwind CSS v4, TypeScript, node:test, Playwright (screenshots), Netlify (forms, redirects).

**Spec:** `docs/design-brief.md` (design), `docs/intake.md` (facts), `docs/copy/source.md` (client copy), `../mockups/homepage-layout.html` (layout A), `../REQUIREMENTS.md` and `../docs/adr/0005`, `0006` (product decisions).

## Global Constraints

- Never edit template core: `src/layouts/`, `src/utils/`, `src/components/{ui,common,blog,widgets}/`, `vendor/`, the config system, `astro.config.ts` outside the `fonts:` array. The pre-commit hook blocks it. Do not use `--no-verify`.
- Copy: Croatian uses "ti". English is casual. Client copy ships verbatim from `docs/copy/source.md`. A missing fact becomes a `TODO(client)` placeholder (Task 3 component), never a guess.
- No AI images. Photos are flat slate placeholders naming the photo's role until Dunia sends real ones.
- No Dodai co-brand bar on any page.
- Instructors show first name only. Full names must not appear in `dist/`.
- Red is `#D71920` (estimated, provisional). Dark slate is `#232A35`. White on red passes, red text on slate does not (2.78:1). Fonts: Montserrat (headings, buttons) and Roboto (body), with `latin-ext`.
- No em dashes in agent-authored text. Client-verbatim copy keeps its characters.
- A task that creates or edits a page or visible component is not done without a rendered screenshot, described by what it shows (`docs/client-build-rules.md`). The reviewer is given the image file.
- Every page exists in HR and EN with a twin in the route table.
- CI stays green after every task. Any task that adds or removes a page updates `quality-routes.json` and recaptures baselines (`npm run build && npm run screenshot`) in the same commit. Task 3 trims the manifest to the routes that still exist after the demo pages go.
- New address (Ulica Antuna Bauera 22) is not published. Use the old contact details only as `TODO(client)` until item 8 is answered.

## Review Focus

- **Language switch lands on the twin, not home.** From `/instruktori/` the EN link goes to `/en/instructors/`, and back. Tested in Task 3 and Task 4.
- **hreflang is complete.** Every page lists itself, its twin and `x-default`, with absolute URLs. Tested in Task 3.
- **Placeholders never ship at launch.** A `TODO(client)` leftover in `dist/` on a launch build must fail. Tested in Task 14.
- **Croatian diacritics render.** č ć đ š ž in headings and body use the real fonts, not a fallback. Screenshot and subset check in Task 2.
- **Mobile bottom button hides nothing.** The fixed "Rezerviraj trening" bar must not cover the footer's last line or the cookie banner. Screenshot at 375 px in Task 4 and Task 13.

---

### Task 1: Discovery gate

**Files:**
- Read: `docs/intake.md`, `docs/design-brief.md`, `docs/copy/source.md`, `../mockups/homepage-layout.html`

**Interfaces:**
- Produces: a ticked checklist in the task report. Later tasks assume these four files exist.

- [ ] **Step 1: Confirm each artifact exists and is filled.** `docs/intake.md` has no `{{` placeholders and its OPEN items name a doc item number. `docs/design-brief.md` exists and marks (P) items. `docs/copy/source.md` exists (the "client supplied copy, source = X" line is this file). Schema draft: "no schema draft needed" because `LocalBusiness` from Task 13 is enough.
- [ ] **Step 2: Verify.** Run `grep -c "{{" docs/intake.md`. Expected: `0`. Run `git status --short`. Expected: clean.

No commit.

### Task 2: Theme tokens and fonts

**Files:**
- Modify: `src/brand.ts` (light and dark palettes, `fonts`, `logo`)
- Modify: `astro.config.ts` (`fonts:` array only), `src/fonts.ts`
- Modify: `src/assets/styles/tailwind.css` only if the template's documented heading rule is needed (SETUP.md B1c)
- Create: `src/assets/images/logo.svg` (copy of `../prototype/assets/tockica-logo.svg`, temporary, Dunia's official file pending)
- Test: `tests/brand-palette.test.mjs`

**Interfaces:**
- Produces: CSS variables `--font-montserrat`, `--font-roboto`; `brand.light` and `brand.dark` with primary red and slate; Tailwind classes `text-primary`, `bg-primary` already wired by the template.

- [ ] **Step 1: Write the failing test.** `brand-palette.test.mjs`: import `brand`; assert `brand.light.primary` is `rgb(215 25 32)`; assert neither mode uses the template defaults `rgb(1 84 207)` or `rgb(109 40 217)`; assert with a small WCAG contrast helper that white on `brand.light.primary`, white on `brand.dark.primary` (button text), `brand.light.textDefault` on `brand.light.bgPage` and `brand.dark.textDefault` on `brand.dark.bgPage` all reach 4.5:1.
- [ ] **Step 2: Run it and see it fail.** `node --test tests/brand-palette.test.mjs`. Expected: FAIL (template blue and purple).
- [ ] **Step 3: Implement palettes in `src/brand.ts`.** Light: page `#F7F7F7`, text `#2A2A2A`, muted `#636B76`, primary `#D71920`. Dark: page slate `#232A35`, same red for buttons. Red is never used as text on slate (2.78:1), so client components use the heading or default text colour there. Replace the template blue and purple with slate and red. Point `brand.fonts.heading` at Montserrat and `sans` at Roboto.
- [ ] **Step 4: Register fonts.** In `astro.config.ts` `fonts:` add Montserrat (weights 500 to 800) and Roboto (400, 500, 700), subsets `latin` and `latin-ext`, drop Noto Sans. Update `src/fonts.ts` to list both variables. Add the `h1..h6 { font-family: var(--font-heading) }` base rule if headings do not pick Montserrat.
- [ ] **Step 5: Wire the logo.** Uncomment the logo import in `brand.ts`, set `logo.alt` to "Točkica na i".
- [ ] **Step 6: Verify.** Run `node --test tests/brand-palette.test.mjs` (PASS), `npm run build && npm run test:contrast` (PASS), then screenshot `/` at 375 and 1440 px in light and dark and describe colours, heading font, and that č ć đ š ž render in a heading (type them on a temporary probe line, remove it after).
- [ ] **Step 7: Commit.** `git add src/brand.ts astro.config.ts src/fonts.ts src/assets tests/brand-palette.test.mjs && git commit -m "Theme: Točkica red and slate, Montserrat and Roboto"`

### Task 3: i18n module, route table, twin test

**Files:**
- Create: `src/i18n/index.ts`, `src/i18n/routes.ts`, `src/i18n/copy/types.ts`, `src/i18n/copy/hr.ts`, `src/i18n/copy/en.ts`
- Create: `src/components/client/Placeholder.astro`
- Test: `tests/i18n.test.mjs`

**Interfaces:**
- Produces:
  - `type Lang = 'hr' | 'en'`, `const defaultLang: Lang = 'hr'`.
  - `type RouteKey = 'home' | 'schedule' | 'instructors' | 'packs' | 'sculpt' | 'contact' | 'rules' | 'terms' | 'privacy' | 'thanks'`.
  - `pathFor(key: RouteKey, lang: Lang): string`, always slash-terminated; HR `home` is `/`, EN `home` is `/en/`.
  - `alternatesFor(key: RouteKey): { hreflang: string; href: string }[]` returning `hr`, `en`, `x-default` (points to HR).
  - `type Copy` (UI strings: nav labels, buttons, footer labels, section headings) with identical keys in `hr.ts` and `en.ts`; `getCopy(lang: Lang): Copy`.
  - `Placeholder.astro` props `{ label: string }`, renders a visibly marked block with `data-todo`.
- Consumes: nothing.

- [ ] **Step 1: Write failing tests** in `tests/i18n.test.mjs`: (a) every `RouteKey` has an HR and EN path that start with `/` and end with `/`, EN paths start with `/en/` or equal `/en/`, no duplicates; (b) for every key a file exists under `src/pages/` for both paths (`index.astro` or `<slug>.astro`); (c) `alternatesFor('instructors')` returns `hr`, `en` and `x-default` entries with root-relative hrefs (the layout makes them absolute); (d) `Object.keys` of `hr` and `en` copy match recursively; (e) no `hr` or `en` copy value contains an em dash.
- [ ] **Step 2: Run and see it fail.** `node --test tests/i18n.test.mjs`. Expected: FAIL (modules missing). Tests import the `.ts` modules with relative paths. CI runs Node 22.22.3, which strips types by default. If it does not, note it and use `.mjs` for the pure logic.
- [ ] **Step 3: Implement the modules** with the signatures above. Paths: HR `/raspored/`, `/instruktori/`, `/paketi/`, `/sculpt-room/`, `/kontakt/`, `/pravilnik/`, `/uvjeti/`, `/privatnost/`, `/hvala/`; EN `/en/schedule/`, `/en/instructors/`, `/en/packs/`, `/en/sculpt-room/`, `/en/contact/`, `/en/rules/`, `/en/terms/`, `/en/privacy/`, `/en/thanks/`.
- [ ] **Step 4: Remove demo pages and content.** Delete `src/pages/{about,services,pricing,contact}.astro`, `src/pages/thank-you.astro`, `src/pages/privacy.md`, `src/pages/terms.md` (replaced by Tasks 10 to 12). Empty `src/content/{faqs,team,testimonials,services}.yaml`. Keep `404.astro`. The build must still pass: stub `src/pages/index.astro` and `src/pages/en/index.astro` with a heading until Task 5.
- [ ] **Step 5: Add placeholder component** and a copy key `todoLabel` for its caption. Reuse it for every `TODO(client)` in later tasks.
- [ ] **Step 6: Run tests, build.** `node --test tests/i18n.test.mjs` (the file-exists test passes only once later tasks add pages; mark it `todo` until Task 12 and remove the flag there). Expected now: (a), (c), (d), (e) PASS, (b) todo.
- [ ] **Step 7: Commit.** `git commit -m "i18n: route table, copy types, placeholder"`

### Task 4: Page shell, header, footer, language switch

**Files:**
- Create: `src/components/client/Page.astro`, `src/components/client/SiteHeader.astro`, `src/components/client/SiteFooter.astro`, `src/components/client/BookBar.astro`
- Test: `tests/page-shell.test.mjs`

**Interfaces:**
- Produces: `Page.astro` props `{ lang: Lang; route: RouteKey; title: string; description: string; noindex?: boolean }`. It renders `~/layouts/PageLayout.astro` with `metadata = { title, description, lang, alternates: alternatesFor(route), canonical, robots }` and the `header` and `footer` slots replaced by the client components. `SiteHeader` props `{ lang: Lang; route: RouteKey }`, its language link goes to `pathFor(route, otherLang)`.
- Consumes: Task 3 `pathFor`, `alternatesFor`, `getCopy`.

- [ ] **Step 1: Failing test.** `page-shell.test.mjs` reads built `dist/instruktori/index.html` (after Task 7) and `dist/en/instructors/index.html`; until then it builds a temporary page. Assert `<html lang="hr">` and `lang="en"`; three `hreflang` links with absolute URLs; the language link href equals the twin path; one primary "Rezerviraj trening" link in the header with `href` equal to `pathFor('schedule', lang)`. Mark pages-dependent assertions `todo` until Task 7.
- [ ] **Step 2: Run, see it fail.** `npm run build && node --test tests/page-shell.test.mjs`. Expected: FAIL (components missing).
- [ ] **Step 3: Build `SiteHeader`** by copying the structure of `src/components/widgets/Header.astro` (never edit it): logo, links Raspored, Instruktori, Paketi, Sculpt Room, Prijava (link to the booking app login, `TODO(client)` target until ADR 0005 proxy exists), HR/EN switch, sticky, hamburger on mobile, theme toggle. Copy comes from `getCopy`.
- [ ] **Step 4: Build `BookBar`** the fixed bottom "Rezerviraj trening" button for widths under 768 px with `padding-bottom: env(safe-area-inset-bottom)`, hidden on `/raspored/`. Add bottom padding to the page so it never covers the last footer line.
- [ ] **Step 5: Build `SiteFooter`.** Logo, nav, legal links (`rules`, `terms`, `privacy`), Instagram and Facebook as `TODO(client)` links, company line from `docs/copy/source.md` item 13 using the name and OIB only (no seat).
- [ ] **Step 6: Build `Page.astro`** per the interface.
- [ ] **Step 7: Verify.** Build, run the test (PASS for what exists), screenshot a stub page at 375 and 1440 px, light and dark. Describe header contrast, mobile bar position, and that the last footer line stays visible above the bar.
- [ ] **Step 8: Commit.** `git commit -m "Page shell: header, footer, language switch, mobile book bar"`

### Task 5: Homepage part 1 (hero, next classes, about, rooms, instructors)

**Files:**
- Create: `src/components/client/home/HomeHero.astro`, `NextClasses.astro`, `AboutStudio.astro`, `Rooms.astro`, `InstructorTeaser.astro`, `src/components/client/Photo.astro`, `src/data/next-classes.ts`, `src/data/instructors.ts`
- Create: `src/components/client/HomePage.astro` (composes sections), `src/pages/index.astro`, `src/pages/en/index.astro`
- Test: `tests/home.test.mjs`

**Interfaces:**
- Produces: `Photo.astro` props `{ role: string; ratio?: string }` (slate placeholder naming the role, swapped for `<Image>` later). `type NextClass = { id: string; startsAt: string; name: string; instructor: string; freeBikes: number; capacity: number }` and `nextClasses: NextClass[]` (mock, four entries). `type Instructor = { slug: string; first: string; full: string; line: { hr: string | null; en: string | null } }` and `instructors: Instructor[]` filled from `docs/copy/source.md` item 4, null where `TODO(client)`. `HomePage.astro` props `{ lang: Lang }`.
- Consumes: Task 3, Task 4.

- [ ] **Step 1: Failing test** (`home.test.mjs`, runs on `dist/index.html` and `dist/en/index.html`): sections 0 to 5 appear in layout A order (booking-first: next classes before about); the hero has exactly two buttons (reserve and see schedule) pointing to the schedule route; the "next classes" list has four items each with a free-bike count; the hero contains no `<img>` with AI or stock sources; no full instructor name (e.g. `Mando`, `Zebec`) appears in either file.
- [ ] **Step 2: Run, see it fail.** Expected: FAIL.
- [ ] **Step 3: Build sections** per the layout and brief. Slogan, About line and rooms text come from `docs/copy/source.md` (items 3, 11) and `getCopy`; slogan is `Placeholder` (item 1 unanswered). Photos are `Photo` placeholders (roles from item 9: hero, space, instructor portraits).
- [ ] **Step 4: Wire data.** `NextClasses` reads `src/data/next-classes.ts` and links "Rezerviraj" to the schedule route. Comment in the file: replace with the app's public endpoint when ADR 0005 endpoint exists.
- [ ] **Step 5: Both pages** render `HomePage` with their `lang`, inside `Page` with route `home`.
- [ ] **Step 6: Verify.** `npm run build && node --test tests/home.test.mjs` (PASS). Screenshots of both homepages at 375 and 1440 px, light and dark; describe layout order, red use, placeholder look, contrast on slate sections, Croatian diacritics.
- [ ] **Step 7: Commit.** `git commit -m "Homepage: hero, next classes, about, rooms, instructors (HR, EN)"`

### Task 6: Homepage part 2 (how it works, Sculpt Room band, FAQ, contact block)

**Files:**
- Create: `src/components/client/home/HowItWorks.astro`, `SculptBand.astro`, `Faq.astro`, `ContactBlock.astro`, `src/data/faq.ts`
- Modify: `src/components/client/HomePage.astro` (append sections)
- Modify: `tests/home.test.mjs`

**Interfaces:**
- Produces: `type FaqItem = { q: { hr: string | null; en: string }; a: { hr: string | null; en: string | null } }` and `faq: FaqItem[]` (four items from `docs/copy/source.md`, Croatian null, item 4 answer null).
- Consumes: Task 5 `HomePage`, Task 3 `Placeholder`.

- [ ] **Step 1: Extend the test.** Assert `dist/index.html` has an `<details>`-based FAQ with four items (accordion usable without JS), the Sculpt band has one "Javi se" style link to the Sculpt route, and the how-it-works block names intro packs 10 EUR and 30 EUR (from `docs/copy/source.md` item 5). Assert the contact block exists and every unconfirmed value is wrapped in `data-todo`.
- [ ] **Step 2: Run, see it fail.** Expected: FAIL.
- [ ] **Step 3: Implement sections.** FAQ English verbatim from source. On the Croatian page a null question or answer renders `Placeholder`, never the English text. Contact block shows `Placeholder` for each of address, phone, e-mail and hours, since item 8 is unconfirmed.
- [ ] **Step 4: Verify.** Build, run the test (PASS), screenshot both homepages full page at 375 and 1440 px and describe the lower half: slate band contrast, FAQ open state, placeholder visibility, mobile bar not covering the footer.
- [ ] **Step 5: Commit.** `git commit -m "Homepage: how it works, Sculpt band, FAQ, contact block"`

### Task 7: Instruktori page

**Files:**
- Create: `src/components/client/InstructorsPage.astro`, `src/pages/instruktori.astro`, `src/pages/en/instructors.astro`
- Modify: `src/data/instructors.ts` (only if Task 5 left fields out)
- Test: `tests/instructors.test.mjs`

**Interfaces:**
- Consumes: Task 5 `instructors`, `Photo`; Task 4 `Page`.

- [ ] **Step 1: Failing test.** On both built pages: eight cards, each with first name only; the lines for Oliver, Mirna, Ena, Domagoj, Emma match `docs/copy/source.md` exactly in the right language; Dunia, Ivana (HR), Mario render `data-todo`; no full names anywhere in the HTML.
- [ ] **Step 2: Run, see it fail.** Expected: FAIL.
- [ ] **Step 3: Implement the page** (portrait `Photo` placeholder, first name, vibe line). Domagoj ships the first alternative only if Dunia picks one; until then `Placeholder`.
- [ ] **Step 4: Verify and screenshot** both pages at 375 and 1440 px; describe the grid, line wrapping and placeholders. Remove the `todo` flag on the Task 4 page-shell assertions.
- [ ] **Step 5: Commit.** `git commit -m "Instruktori page (HR, EN)"`

### Task 8: Paketi page

**Files:**
- Create: `src/lib/packs.ts`, `src/components/client/PacksPage.astro`, `src/data/packs.ts`, `src/pages/paketi.astro`, `src/pages/en/packs.astro`
- Test: `tests/packs.test.mjs`

**Interfaces:**
- Produces: `pricePerClass(priceEur: number, classes: number): number` (rounded to 2 decimals, throws when `classes <= 0`) and `formatEur(value: number, lang: Lang): string`. `type Pack = { id: string; classes: number; priceEur: number | null; intro: boolean }` and `packs` with the two intro packs (1 for 10, 3 for 30) and nothing else.
- Consumes: Task 3 `Lang`, `Placeholder`.

- [ ] **Step 1: Failing tests.** `pricePerClass(30, 3) === 10`; `pricePerClass(40, 3) === 13.33`; `formatEur(13.33, 'hr') === '13,33 €'` and EN `'€13.33'`; throws on `classes <= 0`. Built pages list the two intro packs with per-class price and a `Placeholder` row for the regular packs (item 5, price image not yet copied).
- [ ] **Step 2: Run, see it fail.** Expected: FAIL.
- [ ] **Step 3: Implement** `packs.ts`, data, page. No invented regular prices.
- [ ] **Step 4: Verify and screenshot** both pages at 375 and 1440 px.
- [ ] **Step 5: Commit.** `git commit -m "Paketi page with price per class"`

### Task 9: Sculpt Room Rent page

**Files:**
- Create: `src/components/client/SculptPage.astro`, `src/components/client/InquiryForm.astro`, `src/data/sculpt.ts`, `src/pages/sculpt-room.astro`, `src/pages/en/sculpt-room.astro`, `src/pages/hvala.astro`, `src/pages/en/thanks.astro`
- Test: `tests/sculpt.test.mjs`

**Interfaces:**
- Produces: `sculpt: { monthlyPriceEur: number | null; minMonths: 6; visitsPerMonth: number | null; visible: boolean }`. `InquiryForm` props `{ lang: Lang }`, Netlify form named `sculpt-inquiry` per `docs/forms.md` (honeypot, privacy consent checkbox, `action` to the thank-you route).
- Consumes: Task 3, Task 4.

- [ ] **Step 1: Failing test.** Built page contains: monthly price `data-todo` while `monthlyPriceEur` is null, the number 6 for months, a `<form data-netlify="true">` with `netlify-honeypot`, a required consent checkbox, `action` equal to the thanks path for that language. With `visible: false` the page is `noindex` and absent from the header and footer nav.
- [ ] **Step 2: Run, see it fail.** Expected: FAIL.
- [ ] **Step 3: Implement** per `docs/forms.md`; page text from `docs/copy/source.md` item 3 facts, the one-sentence pitch is `Placeholder` (item 6). Thanks pages are plain and noindex.
- [ ] **Step 4: Verify and screenshot** the page and form on both languages at 375 and 1440 px. Do not submit a form to Netlify from a local build.
- [ ] **Step 5: Commit.** `git commit -m "Sculpt Room Rent page and inquiry form"`

### Task 10: Raspored and Prijava stubs

**Files:**
- Create: `src/pages/raspored.astro`, `src/pages/en/schedule.astro`, `src/components/client/ScheduleStub.astro`

**Interfaces:**
- Consumes: Task 4 `Page`, Task 5 `NextClasses`.

- [ ] **Step 1: Failing test.** Add to `tests/page-shell.test.mjs`: both schedule pages exist, show the next-classes list and a clear notice that online booking opens soon, with a `Placeholder` for where to book until launch.
- [ ] **Step 2: Run, see it fail.** Expected: FAIL.
- [ ] **Step 3: Implement the stub.** At launch this route is replaced by a Netlify proxy to the booking app (ADR 0005 update); note that in a comment at the top of the page.
- [ ] **Step 4: Verify and screenshot** at 375 px. **Commit.** `git commit -m "Raspored stub (HR, EN)"`

### Task 11: Legal page stubs

**Files:**
- Create: `src/components/client/LegalStub.astro`, `src/pages/{pravilnik,uvjeti,privatnost}.astro`, `src/pages/en/{rules,terms,privacy}.astro`

- [ ] **Step 1: Failing test.** Six pages exist, each `noindex`, each states that Croatian is the official text and English a translation, each body is a `Placeholder` (item 14 unanswered). Footer links resolve (use the linkinator gate).
- [ ] **Step 2: Run, see it fail.** Expected: FAIL.
- [ ] **Step 3: Implement.** Do not reuse the template's English `terms.md` and `privacy.md` text.
- [ ] **Step 4: Verify, screenshot one HR and one EN page, commit.** `git commit -m "Legal page stubs (HR, EN)"`

### Task 12: Contact page and form

**Files:**
- Create: `src/components/client/ContactPage.astro`, `src/components/client/MessageForm.astro`, `src/pages/kontakt.astro`, `src/pages/en/contact.astro`
- Modify: `tests/i18n.test.mjs` (remove the `todo` flag on the file-exists assertion)
- Test: `tests/contact.test.mjs`

- [ ] **Step 1: Failing test.** Form follows `docs/forms.md` (Netlify, honeypot, consent, thanks action per language). Address, phone, e-mail and hours are `Placeholder` until item 8 is answered. Add the file-exists assertion for every route key.
- [ ] **Step 2: Run, see it fail.** Expected: FAIL.
- [ ] **Step 3: Implement** by adapting `src/components/client/ContactForm.astro`. Recipient e-mail is set in Netlify, not in the repo.
- [ ] **Step 4: Verify.** `npm run build && node --test tests/*.test.mjs`. Expected: all PASS, including the i18n twin test with no `todo`. Screenshot both pages at 375 and 1440 px.
- [ ] **Step 5: Commit.** `git commit -m "Contact page and message form (HR, EN)"`

### Task 13: Schema, consent and analytics

**Files:**
- Modify: `src/schema.ts`, `src/components/client/CookieConsent.astro`, `src/config.yaml` (`analytics`)
- Test: existing `npm run test:analytics`

- [ ] **Step 1: Consent copy in both languages.** CookieConsent reads `getCopy(lang)`; `requireConsent: true`; GA4 ID stays empty (`TODO(client)`, intake). Screenshot the banner at 375 px and confirm it sits above the mobile bar.
- [ ] **Step 2: Schema.** `LocalBusiness` with name only plus `TODO(client)` for address, phone and hours (matching NAP is blocked on item 8 and the address question). Do not publish the new seat.
- [ ] **Step 3: Verify.** `npm run build && npm run test:analytics`. Expected: PASS. **Commit.** `git commit -m "Consent in HR and EN, schema skeleton"`

### Task 14: Quality gates and launch check

**Files:**
- Modify: `quality-routes.json`, `package.json` (script `check:todos`), `docs/handoff.md`
- Create: `scripts/check-todos.mjs`
- Test: `tests/check-todos.test.mjs`

**Interfaces:**
- Produces: `npm run check:todos` that scans `dist/**/*.html` for `data-todo` and prints each file and label; exit code 1 when any found and `LAUNCH=1` is set, 0 otherwise.

- [ ] **Step 1: Failing test.** `check-todos.test.mjs` runs the script against a temp directory with one `data-todo` page: exit 0 without `LAUNCH`, exit 1 with `LAUNCH=1`, output names the label.
- [ ] **Step 2: Run, see it fail.** Expected: FAIL.
- [ ] **Step 3: Implement the script** and the `package.json` entry.
- [ ] **Step 4: Update `quality-routes.json`** to every route in `src/i18n/routes.ts` plus `/404.html` handling as the template does, `noindex` kind for thanks and legal stubs. Run `npm run build && npm run screenshot` and inspect the results, then `npm run verify`.
- [ ] **Step 5: Whole-branch review** against `docs/quality-gates.md` with evidence, plus the rendered screenshots as image files for the reviewer.
- [ ] **Step 6: Commit.** `git commit -m "Quality gates: route manifest, baselines, todo check"`

### Task 15: Redirects from the old site (BLOCKED on item 17)

**Files:**
- Create: `public/_redirects`
- Test: `tests/redirects.test.mjs`

- [ ] **Step 1.** Blocked until Dunia answers item 17 and the page set is final. Then map old WordPress URLs from `../original-site/urls.txt` (Cjenik and Pridruži se to `/paketi/`, programs to `/instruktori/`, news and blog to `/`, Pravilnik and Uvjeti to their new pages), test that every source line is syntactically valid and every target exists in the route table, and commit.

---

## Not in this plan

Booking app proxy and live schedule endpoint (app work, ADR 0005 update). Real photos, final slogan, official logo, Sculpt price, legal texts, contact details, GA4 ID, domain and DNS (all blocked on Dunia, listed in `docs/copy/source.md` and `docs/intake.md`). Sitemap language mapping (`astro.config.ts`, core).
