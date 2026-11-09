# Schedule desktop week grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On desktop (`lg`, 1024 px and up) `/raspored` and `/en/schedule` show the selected week as six day columns of compact class cards. Phones and tablets keep today's day strip and stacked rows.

**Architecture:** Same markup and same script. At `lg` all six day panels of the selected week are visible side by side in a CSS grid, the day strip is hidden, and each row restyles from a row into a card. Below `lg` nothing changes. The script reads `matchMedia('(min-width: 1024px)')` to decide whether a selection shows one day or one week.

**Tech Stack:** Astro, Tailwind, TypeScript, `node:test`, Playwright.

**Spec:** the Purist mock "A. Week grid" in the file "Tockica schedule desktop options" (artboard A), plus `2026-11-09-schedule-stage-a.md`.

## Global Constraints

- Reply in English. No em dashes. No Dodai co-brand bar.
- Work only in `src/components/client/schedule/`, `src/lib`, `tests`. No template core, `motion.js` untouched.
- Motion tokens only (`docs/animation-rules.md`). Selection changes use `slideIn` from `motion.js`, reduced motion needs no branch. No new curves, no `@keyframes`.
- Public feed unchanged (bike numbers only).
- Phones: stacked full width, no sideways scroll.
- Do not commit or push. Tests: build, then `node --test --test-concurrency=1 tests/*.test.mjs`.
- Karpathy: smallest change, every line traces to the request.

## Review Focus

- A day with no classes (past day, Sunday gap) shows one muted line in its column and does not collapse the grid.
- Resizing across 1024 px while the page is open switches mode without losing the selected day or week.
- A column with 1 class next to one with 6: columns stay top-aligned, cards do not stretch.
- A week arrow pressed twice quickly at `lg`: no stuck animation, one week visible.
- 1024 px wide: six columns of about 150 px must still fit time range, name and button without overflow.

## File structure

- Modify `schedule/ScheduleList.astro`: panel wrapper with a day header, `lg` grid, hide strip at `lg`, picker alignment.
- Modify `schedule/ScheduleRow.astro`: `lg:` classes turn the row into a card.
- Modify `tests/schedule-page.test.mjs`, `tests/schedule-select.test.mjs`.

---

### Task 1: Markup and styles for the `lg` grid

**Files:** Modify `ScheduleList.astro`, `ScheduleRow.astro`, `tests/schedule-page.test.mjs`

**Interfaces:**
- Produces: each day is `<div data-day-panel="YYYY-MM-DD" hidden?>` containing `<p data-day-head>` (weekday and date, visible at `lg` only) and `<ul data-rows>` (the rows or one `li[data-empty]`). `[data-panels]` is `lg:grid lg:grid-cols-6 lg:items-start lg:gap-3`. The strip wrapper gets `lg:hidden`. The picker row aligns left with the label next to the arrows at `lg`.

- [x] **Step 1:** Update `schedule-page.test.mjs`: panels are `div[data-day-panel]`, still 18, each has one `[data-day-head]` and one `ul[data-rows]`; strips carry `lg:hidden`.
- [x] **Step 2:** Build, run the test, see it fail.
- [x] **Step 3:** Implement the markup. `ScheduleRow`: at `lg` use `flex flex-col items-stretch gap-1.5 p-3` instead of the 4-column grid, the button full width, the free-bike line left aligned.
- [x] **Step 4:** Build, test passes. Screenshot at 1280 and 1024 px.

> Done 2026-11-09. Added to Task 1 (not in the original plan): `render()` in the script now rebuilds `ul[data-rows]` instead of the whole panel, otherwise the first feed refresh wiped each day header and list. Regression test added in `schedule-select.test.mjs`. Task 2 idea: drive visibility with CSS instead of `matchMedia`: JS sets `hidden` on panels outside the selected week and `data-off` on non-selected days, and `max-lg:data-off:hidden` hides those below lg, so resizing needs no script.

### Task 2: Script support for week mode

**Files:** Modify `ScheduleList.astro` (script), `tests/schedule-select.test.mjs`

**Interfaces:**
- Consumes: markup from Task 1.
- Produces: `select(day)` at `lg` shows every panel of that day's week (`hidden` false for the whole week, true for the rest); below `lg` it shows one panel as today. A `matchMedia` change listener re-runs `select(selected, false)`. `render()` and the refresh target `ul[data-rows]` inside each panel. The slide animates `[data-panels]` at `lg` (direction by week), the single panel below. The emptied-day fallback at `lg` triggers only when the whole visible week has no classes.

- [x] **Step 1:** Add tests at a 1280 px viewport: six panels visible, strip hidden; week arrows show six different panels; refresh updates a row in place and leaves another week's panel untouched; failed feed changes nothing. Keep the 390 px tests green.
- [x] **Step 2:** Run, see the new ones fail.
- [x] **Step 3:** Implement. Resize test: set viewport 1280 then 390, assert one panel visible and the same selected day.
- [x] **Step 4:** Run `schedule-select` and `schedule-page` tests, pass.

### Task 3: Verification and review gate

- [x] **Step 1:** Build, full suite, `astro check`, prettier and eslint on touched files.
- [x] **Step 2:** Playwright at 390, 1024 and 1280 px, light and dark, hr and en. Assert no horizontal scroll, no console errors, no card text overflow. Save screenshots to `docs/reviews/schedule-stage-a/`.
- [x] **Step 3:** Measure the week slide per frame, interrupt it midway, check reduced motion.
- [x] **Step 4:** STOP and report. No commit, no push.

## Self-review

- Coverage: wide-screen use (T1), selection and refresh at `lg` (T2), phones unchanged and verified (T3).
- Assumption: breakpoint is `lg` (1024 px). Between 768 and 1023 px the current strip and rows stay, since six columns do not fit there.

> Follow-up 2026-11-09: the grid now starts at md (768 px): 3 columns by 2 rows, 6 columns from lg. Below 768 px the strip and one day, as before.
