# Schedule Stage B Implementation Plan (bike map, kept choice, login step, "opens soon")

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A visitor who is not logged in can press Book on a class, pick a bike on a map in a dialog, go through a placeholder login step, and land on a "booking opens soon" notice. The class and bike survive the login step and a page reload. Waiting list skips the map.

**Architecture:** One native `<dialog>` (`BikeSheet.astro`) with three steps: `map`, `login`, `soon`. The schedule list script publishes its latest classes and Book clicks as `CustomEvent`s on `document`, the sheet script listens, so the two scripts share no state. The choice lives in `sessionStorage` as class id, start time and bike number, nothing else. A "your pick" bar on the page restores it after a reload. Opening and closing use a verbatim copy of the prototype's `sheet.js`.

**Tech Stack:** Astro, Tailwind, TypeScript, `node:test`, Playwright.

**Spec:** the user's Stage A brief (Stage B paragraph), `docs/adr/0006-guests-can-pick-a-bike-before-login.md`, `docs/adr/0005-...`, `site/docs/animation-rules.md`, prototype `src/layout.js`, `src/pages/schedule.js` (`drawBikes`), `src/pages/sheet.js`. The prototype has no logged-out flow, it always starts with a demo account.

## Global Constraints

- Reply in English. No em dashes. No Dodai co-brand bar on Tockica pages.
- Work only in `src/components/client/schedule/`, `src/lib`, `src/i18n/copy`, `tests`, `docs`. Never `src/layouts`, `src/utils`, `src/components/{ui,common,blog}`. `src/lib/motion.js` untouched.
- Do NOT copy the prototype's CSS or app scripts. `sheet.js` is the one allowed verbatim copy (like `motion.js`), because the motion must match.
- Motion: tokens only, symmetric, interruptible, CSS transitions for state, `motion.js` helpers for show and hide, reduced-motion rule in the same change.
- Storage holds `classId`, `startsAt`, `bike` only. No names, emails or booking data. Public feed unchanged.
- Nothing is held for an anonymous visitor (ADR 0006). The first to confirm gets the bike, the other is told and returned to the map.
- Login and "booking opens soon" are placeholders: marked `data-todo` so a `LAUNCH=1` build fails until the real app replaces them.
- Phones: bottom sheet, no sideways scroll. Do not commit or push. Stop after this stage for review.
- Tests: build first, then `node --test --test-concurrency=1 tests/*.test.mjs`. If contrast tests fail at startup: `npx astro preview stop`, rerun. Browser tests use port 4326.
- Karpathy: smallest change, every changed line traces to the request.

## Review Focus

- The picked bike becomes taken while the sheet is open (feed refresh): it is unpicked, Continue is disabled, a short message is shown, focus stays on the map.
- A stored choice for a class that has started, vanished from the feed, or whose bike is now taken: dropped or sent back to the map, never shown as valid.
- `sessionStorage` blocked or holding garbage (private window, other app's key): page works, nothing throws.
- Press Book twice quickly, press Esc during the open animation, close and reopen: dialog never sticks half open (`closeSheet` guard).
- Full class: no map, waiting list goes straight to the login step.
- Language switch with a stored choice: the "your pick" bar and sheet follow the page language, the stored value is language-free.
- Class with capacity other than 20: the map must not misplace bikes (layout is defined for 20).

## File structure

- Create `src/lib/sheet.js` (verbatim prototype copy), `src/lib/bike-map.ts`, `src/lib/booking-choice.ts`.
- Create `src/components/client/schedule/BikeSheet.astro` (dialog, map, steps, script, styles).
- Modify `ScheduleList.astro` (embed data JSON, publish events, pending bar), `ScheduleRow.astro` (`data-full`), `src/i18n/copy/{types,hr,en}.ts`, `tests/motion-contract.test.mjs`.
- Create `tests/bike-map.test.mjs`, `tests/booking-choice.test.mjs`, `tests/schedule-sheet.test.mjs`. Modify `tests/schedule-page.test.mjs`.

## Decisions to confirm before Task 1

1. **Waiting list** skips the map and goes to the login step with `bike: null`. (Alternative: show the map read-only. Not recommended, nothing to pick.)
2. **After reload** a "your pick" bar above the week picker offers Continue and Clear. (Alternative: reopen the dialog by itself. Rejected, a dialog that opens unasked on page load is hostile.)
3. **Placeholder login** is an email field and a "send code" button that does nothing but advance to the notice. No code field, no network call.
4. **Guest booking** ("Za gosta") and credits are out of scope for Stage B.

---

### Task 1: Pure libraries and the sheet copy

**Files:** Create `src/lib/bike-map.ts`, `src/lib/booking-choice.ts`, `src/lib/sheet.js`, `tests/bike-map.test.mjs`, `tests/booking-choice.test.mjs`. Modify `tests/motion-contract.test.mjs`.

**Interfaces:**
- Produces: `BIKE_COUNT = 20`; `bikePosition(bikeNo: number): { column: 1 | 2; row: number }` (same values as `prototype/src/layout.js`); `type Choice = { classId: string; startsAt: string; bike: number | null }`; `saveChoice(c: Choice, storage?: Storage): void`, `loadChoice(now?: Date, storage?: Storage): Choice | null` (null when missing, malformed, bike outside 1 to 20, or `startsAt` not in the future), `clearChoice(storage?: Storage): void`, key `'tockica.choice'`. `storage` defaults to `sessionStorage` behind try/catch. `sheet.js` exports `openSheet`, `closeSheet`, `bindSheet`, with the same two-line header as `motion.js`.

- [ ] **Step 1: Failing tests.** `bike-map.test.mjs`: bikes 1 to 20 match the prototype's `bikePosition` (skips itself when `../prototype` is absent), all 20 cells distinct, aisle row 6 empty. `booking-choice.test.mjs` with a fake `Storage`: round trip, `bike: null` allowed, garbage JSON, wrong types, bike 0 and 21, past `startsAt`, storage that throws on every call (all three functions silent). `motion-contract`: `src/lib/sheet.js` equals the prototype's after the two header lines.
- [ ] **Step 2:** Run, see them fail.
- [ ] **Step 3:** Implement. Copy `sheet.js` with `cp` plus the header, do not retype it.
- [ ] **Step 4:** Run the three test files, pass. Prettier excludes `sheet.js` like `motion.js`.

### Task 2: Plumbing between the list and the sheet

**Files:** Modify `ScheduleList.astro`, `ScheduleRow.astro`, `tests/schedule-page.test.mjs`, `tests/schedule-select.test.mjs`.

**Interfaces:**
- Consumes: the Stage A list script (`render`, `showFeed`) and `NextClass`. Independent of Task 1.
- Produces: `<script type="application/json" data-schedule-data>` holding the SSR `NextClass[]`; `li[data-class-id]` gets `data-full` when `freeBike === null` (also in both templates); list script dispatches `document` events `schedule:update` (`detail: NextClass[]`, after every parsed feed and once at load from the SSR data) and `schedule:book` (`detail: { classId: string; full: boolean }`, from a click on a row's button, `preventDefault()` so the link only works without JS).

- [ ] **Step 1: Failing tests.** Page test: JSON element parses to an array with `takenBikes`, only full rows carry `data-full`. Browser test: a click on a Book button dispatches `schedule:book` with that class id and `full: false` and does not navigate, a waiting-list click gives `full: true`, a refresh dispatches `schedule:update` with the feed's classes.
- [ ] **Step 2:** Run, fail. **Step 3:** Implement. **Step 4:** Run, pass, all Stage A browser tests still green.

### Task 3: The bike map sheet

**Files:** Create `BikeSheet.astro`. Modify `ScheduleList.astro` (render it), `src/i18n/copy/{types,hr,en}.ts`, create `tests/schedule-sheet.test.mjs`.

**Interfaces:**
- Consumes: `schedule:update`, `schedule:book`, `bikePosition`, `openSheet`, `closeSheet`, `bindSheet`, `saveChoice`.
- Produces: `dialog[data-bike-sheet]` with `[data-step="map"]` containing a head (time range, instructor, close button), legend (free, taken, picked), `[data-bike-grid]` (two columns, aisle after the fifth row, an instructor block like the prototype) with 20 `button[data-bike="N"]` (`aria-label` "Bicikl N", `aria-pressed`, `disabled` when taken), a polite `[data-sheet-message]`, and a bar with `[data-continue]` ("Rezerviraj bicikl N", disabled until a bike is picked, fades in on the first pick). Copy keys `bikeSheet: { title, close, free, taken, picked, instructor, continue, taken_now, pickBike }` in hr and en. A full class never opens the map. Capacity other than 20 renders the map for 20 and disables bikes above capacity.

- [ ] **Step 1: Failing browser tests** (390 and 1280 px): Book opens the dialog for that class with 20 bikes, taken ones disabled, two columns and the aisle by bounding boxes, picking sets one `aria-pressed`, Continue enables with the number, Esc and the close button close it and focus returns to the Book button, a refresh that takes the picked bike unpicks it and shows the message while other bikes keep focus, no horizontal scroll with the sheet open.
- [ ] **Step 2:** Run, fail. **Step 3:** Implement with Tailwind and site tokens, never the prototype CSS: bottom sheet below `sm`, centred card from `sm`, drawer-curve movement, scrim by `::backdrop`. Update bike buttons in place on refresh, never rebuild the grid. **Step 4:** Run, pass.

### Task 4: Login placeholder, "opens soon", kept choice

**Files:** Modify `BikeSheet.astro`, `ScheduleList.astro`, `src/i18n/copy/{types,hr,en}.ts`, `tests/schedule-sheet.test.mjs`, `tests/schedule-page.test.mjs`.

**Interfaces:**
- Consumes: Task 3 sheet, `loadChoice`, `clearChoice`.
- Produces: `[data-step="login"]` (summary of class, time and bike, an email field, a "send code" button, `Placeholder` marker), `[data-step="soon"]` (the "booking opens soon" notice, the summary, "Change bike" back to the map and "Back to the schedule" closing the sheet). The choice is saved on Continue and on a waiting-list click. `[data-pending]` bar above the week picker, shown when `loadChoice()` finds a valid choice whose class is still in the feed: text with class and bike, `[data-pending-continue]` reopens the sheet at the login step, `[data-pending-clear]` clears. If the stored bike is now taken, Continue reopens at the map with the message. Step changes fade the old step out then the new one in with `fadeOut`/`fadeIn`.

- [ ] **Step 1: Failing browser tests:** full flow map, login, notice at 390 and 1280 px in both languages (copy language follows the page); reload after picking shows the bar with the same class and bike, Continue goes to login, Clear removes it and the storage key; a stored choice for an unknown or past class shows no bar; stored bike now taken goes back to the map with the message; waiting list reaches login with no bike; `sessionStorage` disabled through `addInitScript` does not break the page; language switch keeps the choice.
- [ ] **Step 2:** Run, fail. **Step 3:** Implement. **Step 4:** Run, pass.

### Task 5: Verification and review gate

- [ ] **Step 1:** Build, full suite, `astro check`, prettier and eslint on touched files.
- [ ] **Step 2:** Playwright at 390, 768, 1024 and 1280 px, light and dark, hr and en: screenshots of the map, login and notice steps and the pending bar into `docs/reviews/schedule-stage-b/`, no console errors, no sideways scroll, keyboard path (Tab order, Esc, focus return), contrast of the map states in both themes.
- [ ] **Step 3:** Measure the sheet open and close per frame, interrupt it midway, reduced motion drops the slide.
- [ ] **Step 4:** STOP and report. No commit, no push.

## Self-review

- Coverage: bike map dialog (T3), class and bike in sessionStorage (T1, T4), login placeholder (T4), "booking opens soon" (T4), ADR 0006 pick-before-login and survive-login (T3, T4), mobile and desktop (T3, T5).
- Types: `Choice`, `NextClass`, `bikePosition` and the event names are defined once above and reused unchanged.
- Proportion: the plan decides names, signatures and checks. It leaves markup and class strings to the implementer.
