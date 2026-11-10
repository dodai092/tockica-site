# Esc during the sheet's open animation

Cause: `closeSheet` in the prototype started its slide from `none` and the backdrop from full opacity,
so the close jumped to fully open for one frame. The fix starts the close from the live transform and
opacity (dialog and `::backdrop`), and the reduced-motion dissolve starts from the live opacity too.

Fix: `../prototype/src/pages/sheet.js` (uncommitted in the prototype repo), copied to `src/lib/sheet.js`.

Test: `tests/schedule-sheet.test.mjs`, "Esc during the open animation closes from where the sheet is".
Before the fix: 390px slide 39.6 px then 0; 1280px dialog opacity 0.946 then 1. After: both match the paused frame.

Per-frame sampling (`frames-after.json`, dev server, Esc about 120 ms into the open):

- 390px: slide goes 98, 192, 312, 465, 579, 635, 667 px. Monotonic, no return to 0.
- 1280px: opacity goes 0.76, 0.64, 0.50, 0.32, 0.18, 0.12, 0.08. Monotonic, no return to 1.
- Reduced motion, both widths: transform stays `none` on every frame, opacity fades from where it was.
