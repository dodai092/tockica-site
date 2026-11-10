# Theme toggle colour: results

Rule: the toggle icon is the same colour as the header's menu bars (and the close bars when the menu is open) in every state.

Before: the toggle was grey (`text-muted` / `dark:text-gray-400`) in every state. The bars were white over the hero, black on light glass, white on dark glass.

After: `ThemeToggle.astro` uses `text-black dark:text-white`, and `SiteHeader.astro` no longer excludes the toggle from the hero white rules.

## Computed colour, toggle vs bar (built preview, 37 readings)

| State                        | Light                             | Dark                              |
| ---------------------------- | --------------------------------- | --------------------------------- |
| Home, over the hero          | toggle = bar = `rgb(255,255,255)` | toggle = bar = `rgb(255,255,255)` |
| Home, below the hero (glass) | toggle = bar = `rgb(0,0,0)`       | toggle = bar = `rgb(255,255,255)` |
| /raspored (glass)            | toggle = bar = `rgb(0,0,0)`       | toggle = bar = `rgb(255,255,255)` |
| Menu open, close bars (390)  | toggle = bar = `rgb(255,255,255)` | toggle = bar = `rgb(255,255,255)` |

Widths 390, 768, 1024 and 1280, hr (`/`) and en (`/en`). Every reading matched.

Note: the bars are `opacity: 0.8` (core `ToggleMenu.astro`), so they look slightly lighter than their computed colour. The toggle has no opacity, so it looks a little stronger. The computed colours match; the visible difference is small.

## Files

- `<width>-<scheme>-<lang>-hero.png`, `-below.png`: header strip (90 px), toggle and menu bars.
- `390-<scheme>-hr-menu-open.png`, `390-<scheme>-en-menu-open.png`: close bars with the menu open.
- `390-light-hr-raspored.png`: /raspored.
- `home-top-*`, `home-below-*` (from the previous session): captured before this change, stale.

## Tests

`tests/theme-toggle.test.mjs`: 6 tests (light and dark, at 390 and 1280; plus menu open at 390). It failed before the change (toggle grey, bar white) and passes after.
