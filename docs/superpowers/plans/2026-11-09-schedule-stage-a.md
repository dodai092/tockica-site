# Native schedule page, Stage A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/raspored` and `/en/schedule` show a native Astro week picker, day strip and one row per class, built from mock data and refreshed from the feed every 30 s.

**Architecture:** The feed contract gains `takenBikes`. A pure mock generator (`src/lib/mock-schedule.ts`) produces a rolling 3 week Monday to Saturday schedule from a weekly template. The page is server-rendered from the generator, a small browser script re-renders from `/api/schedule.json`. Homepage cards keep their 4-card behaviour.

**Tech Stack:** Astro, Tailwind, TypeScript, `node:test`, Playwright (verification).

**Spec:** the user's task brief of 2026-11-09 plus `.claude/session-summaries/2026-11-09-212503-5506.md`, `docs/animation-rules.md`, ADR 0005 and 0006.

## Global Constraints

- Reply in English. No em dashes anywhere. No Dodai co-brand bar on Tockica pages.
- Never edit `src/layouts`, `src/utils`, `src/components/{ui,common,blog}`. Work in `src/components/client/`, `src/lib`, `src/data`, `src/pages`, `src/i18n`, `tests`.
- `src/lib/motion.js` is a verbatim copy: do not edit it.
- Do NOT copy the prototype's CSS or scripts. Style with Tailwind and site tokens, dark mode via the site's `dark:` classes.
- Motion: tokens from `animation-rules.md` only, symmetric and interruptible, state-driven motion by CSS transitions, reduced-motion rule in the same change.
- Public feed carries bike numbers only, never names or who booked.
- Phones: rows stacked full width, no sideways scroll.
- Do not commit or push. Stop after Stage A for user review.
- Tests: `npm run build`, then `node --test --test-concurrency=1 tests/*.test.mjs`. If contrast tests fail at startup: `npx astro preview stop`, rerun.
- Dev server stays on port 4321 (`npm run dev -- --port 4321` if down).
- Follow karpathy: simplest change, every changed line traces to the request.

## Review Focus

- Empty day (no classes, or a Sunday): the strip still renders, the list shows an empty message.
- Feed down or malformed: the built mock HTML stays, no error shown.
- Class that started while the tab was open: dropped on next refresh, selected day falls back to the next day with classes.
- `takenBikes` with duplicates, out of range or non-integer numbers: row dropped.
- Refresh while a row's button has focus: focus and selected day/week survive (no re-render when the signature is unchanged).
- Full class: waiting-list button and no free-bike number.

## File structure

- Modify `src/lib/schedule-feed.ts`: `takenBikes` in contract, `limit` option.
- Create `src/lib/mock-schedule.ts`: `buildMockSchedule(now)`.
- Modify `src/pages/api/schedule.json.ts`: serve generator output.
- Modify `src/i18n/copy/{types,hr,en}.ts`: `schedulePage` copy.
- Create `src/components/client/schedule/SchedulePicker.astro`, `ScheduleRow.astro`, `ScheduleList.astro` (+ browser script).
- Modify `src/components/client/ScheduleStub.astro`: render the list in place of `NextClasses`.
- Create/modify tests: `tests/schedule-feed.test.mjs`, new `tests/schedule-page.test.mjs`.

---

### Task 1: Feed contract with `takenBikes`

**Files:** Modify `src/lib/schedule-feed.ts`, `tests/schedule-feed.test.mjs`

**Interfaces:**
- Produces: `NextClass.takenBikes: number[]` (sorted, unique, each `1..capacity`); `freeBikes` stays and must equal `capacity - takenBikes.length`; `parseSchedule(json, now?, limit = MAX_CARDS)`; `MAX_CARDS` unchanged; new `firstFreeBike(c: NextClass): number | null`.

- [ ] **Step 1: Failing tests** in `tests/schedule-feed.test.mjs`: `takenBikes` kept and sorted; row dropped when `takenBikes` has a duplicate, `0`, `capacity+1`, `2.5` or a string; row dropped when `freeBikes !== capacity - takenBikes.length`; `parseSchedule(body, now, 100)` returns more than 4; `firstFreeBike` returns the lowest unused number and `null` when full; the "nothing beyond card fields" key list gains `takenBikes`. Update the `row()` helper to build consistent `takenBikes`.
- [ ] **Step 2:** `node --test tests/schedule-feed.test.mjs` fails.
- [ ] **Step 3:** Implement in `schedule-feed.ts`. Update the header comment contract.
- [ ] **Step 4:** Same command passes.

### Task 2: Mock generator and endpoint

**Files:** Create `src/lib/mock-schedule.ts`; modify `src/pages/api/schedule.json.ts`, `src/data/next-classes.ts` only if the types force it, `tests/schedule-feed.test.mjs`.

**Interfaces:**
- Consumes: `NextClass` from Task 1.
- Produces: `buildMockSchedule(now: Date): NextClass[]` covering the current Monday plus 2 following weeks, Monday to Saturday, no Sunday. Each class 60 min, capacity 20, template of weekly entries `{ dayOfWeek, time, name, instructor, themeName? }` mirroring the prototype's `template` shape (`prototype/src/model.js`, `schedule.js generateWeek`). Ids stable per slot (`mock-YYYY-MM-DD-HHMM`). `takenBikes` derived deterministically from the id (seeded), so reloads agree. Studio timezone Europe/Zagreb, offsets correct across DST. Past classes included by the generator, dropped by `parseSchedule`.

- [ ] **Step 1: Failing tests:** 3 weeks of Mon..Sat only; no Sunday; deterministic for the same `now`; every row passes `parseSchedule(..., 100)`; mix contains at least one full class and one with few bikes; a `now` on a Sunday starts at the next Monday's week. Endpoint test (built file) asserts `source === 'mock'`, more than 4 rows, `takenBikes` present, no key beyond the contract.
- [ ] **Step 2:** run, fail.
- [ ] **Step 3:** Implement generator. Template is mock content: use the existing instructor first names and `"50' Riders Room"`, a few `themeName`s, flagged as placeholder in a comment.
- [ ] **Step 4:** `GET` returns `buildMockSchedule(new Date())`. Check whether the endpoint is prerendered (see `astro.config`); if static, dates freeze at build, so either set `export const prerender = false` when an adapter allows it, or accept build-time dates and note it for the user. Decide from the config, do not guess.
- [ ] **Step 5:** build, tests pass.

### Task 3: Copy (hr and en)

**Files:** Modify `src/i18n/copy/types.ts`, `hr.ts`, `en.ts`.

**Interfaces:**
- Produces: `schedulePage` gains `week: string` (aria label), `prevWeek`, `nextWeek`, `thisWeek`, `freeBike: string` ("Bicikl"/"Bike"), `noClasses: string`, `dayNames: string[7]`. Existing `home.nextClasses` keys `freeBikes`, `book`, `waitlist` are reused by rows.

- [ ] **Step 1:** `tests/i18n.test.mjs` (key parity) fails after adding types only. **Step 2:** add keys to hr and en, pass. Croatian copy: spartan, no em dashes.

### Task 4: Server-rendered picker, strip and rows

**Files:** Create `src/components/client/schedule/{SchedulePicker,ScheduleRow,ScheduleList}.astro`; modify `ScheduleStub.astro`; create `tests/schedule-page.test.mjs`.

**Interfaces:**
- Consumes: `buildMockSchedule`, `firstFreeBike`, copy from Task 3.
- Produces: `<ScheduleList lang />` rendering `[data-schedule]` with: week picker (`[data-week-prev]`, `[data-week-next]`, label with date range), day strip of 6 buttons (`[data-day=YYYY-MM-DD]`, `aria-pressed`), and `<ul>` of rows `[data-class-id]`, one `<ul>`/panel per day, non-selected panels `hidden`. Row content: `HH:MM-HH:MM`, instructor first name, `themeName ?? name`, free-bike number (lowest free) with label, `Button` primary "Book" or secondary waiting-list. Buttons link to the existing schedule path for now (Stage B wires the dialog). `ScheduleStub` keeps the notice, demo link and placeholder, drops `NextClasses`.

- [ ] **Step 1: Failing tests** against built `dist/raspored/index.html` and `dist/en/schedule/index.html`: contains `data-schedule`, 6 day buttons, rows with time range text, waiting-list label on a full class, no `NextClasses` section on this page, homepage still has `data-section="next-classes"` with 4 cards.
- [ ] **Step 2:** build, run, fail.
- [ ] **Step 3:** Implement. Tailwind only. Mobile: rows `w-full`, `flex-col`/stacked, strip wraps or fits 6 buttons at 390 px with no horizontal scroll. Selected day indicator and hover/press use tokens: colour 200 ms, press from `MotionStyles`. Default week and day: first day with an upcoming class.
- [ ] **Step 4:** build, tests pass.

### Task 5: Browser script (selection, refresh)

**Files:** Modify `ScheduleList.astro` (script), `tests/schedule-page.test.mjs`.

**Interfaces:**
- Consumes: `SCHEDULE_FEED_URL`, `parseSchedule(json, now, 100)`.
- Produces: week and day selection toggles `hidden` and `aria-pressed` (CSS transition for the indicator, 300 ms `--ease-drawer`, reversible), fetch every 30 s while visible and on tab return, rebuild rows only when the feed signature changes, keep the selected day, fall back to the next day with classes when it empties. Failures leave the page as is. Handler re-registers on `astro:page-load` without stacking intervals (same pattern as `NextClasses.astro`).

- [ ] **Step 1:** pure helpers (group by studio day, week bounds) go in `src/lib/schedule-feed.ts` or a sibling lib file with unit tests first: grouping, Monday-based week, empty day.
- [ ] **Step 2:** implement script and helpers, tests pass.
- [ ] **Step 3:** reduced-motion rule present, no `@keyframes`, no new curve (`tests/motion-contract.test.mjs` passes).

### Task 6: Verification and review gate

- [ ] **Step 1:** `npm run build`, then `node --test --test-concurrency=1 tests/*.test.mjs`. Report any failure with output.
- [ ] **Step 2:** Playwright (webapp-testing) on `http://localhost:4321/raspored/` and `/en/schedule/` at 390 px and 1280 px, light and dark: screenshots into `site/docs/reviews/schedule-stage-a/`, assert `document.documentElement.scrollWidth <= innerWidth` at 390 px, click week next/prev and a day, intercept the feed to confirm a refresh updates the free-bike number and a failing feed changes nothing, check console errors, check no Dodai bar, homepage cards unchanged.
- [ ] **Step 3:** Measure the indicator transition per animation-rules checklist item 6, interrupt it midway.
- [ ] **Step 4:** STOP. Summarise and hand over for review. No commit, no push. Stage B not started.

## Self-review

- Coverage: `takenBikes` (T1), 3 week Mon to Sat mock (T2), picker, strip, rows, free-bike number, Book or waitlist (T4), 30 s refresh (T5), stacked phones and Playwright (T4, T6), stop gate (T6).
- Assumption to confirm: the prototype's own template is only two placeholder entries, so "class pattern" is read as its structure (weekly template, 60 min, 20 bikes, Mon to Sat), with realistic mock content.
