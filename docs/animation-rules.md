# Animation rules

Every animation on this site follows these rules. They are the Apple fluid-interface principles
(`/apple-design` skill, from WWDC "Designing Fluid Interfaces") reduced to what a marketing site needs,
expressed in the values of the booking prototype (`../prototype`). The prototype becomes the booking app
under the same domain (ADR 0005), so the site and the app must move the same way. The prototype is the
source of truth, the site holds copies, and a test fails when they drift (section 11). Read this before
adding or changing any motion. If a rule blocks something you need, raise it, do not work around it.

## 1. Principles

1. **Respond at once.** Feedback starts on pointer-down, never on release. No artificial delays.
2. **Interruptible.** Any animation can be reversed mid-flight and continues from its current value,
   never from the target. State-driven motion uses CSS transitions, which retarget from the live value.
   Do not use `@keyframes` for anything a user can trigger twice quickly.
3. **Motion explains a change, it does not decorate.** Animate only what changed. Chrome that is the same
   before and after (header, footer, logo) never animates on navigation.
4. **Symmetric.** Things leave the way they arrived. Reverse transitions use the same curve and duration.
5. **Materials, not fades.** Translucent surfaces arrive by growing tint and blur together.
6. **Calm by default.** No overshoot unless the user's own gesture carried momentum (a flick). No
   looping motion, no motion on load.
7. **Gentler, not off, for reduced motion.** Keep the state change, drop the movement.

## 2. Tokens

Use these. Do not invent new curves or durations. The curves are CSS variables from
`src/components/client/MotionStyles.astro` (loaded by `Page.astro`) and JS constants in `src/lib/motion.js`.

| Token               | Value                             | Use                                                                                                             |
| ------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `--ease-out`        | `cubic-bezier(.2, .8, .2, 1)`     | things entering or unfolding                                                                                    |
| `--ease-out-strong` | `cubic-bezier(.23, 1, .32, 1)`    | flick exits                                                                                                     |
| `--ease-drawer`     | `cubic-bezier(.32, .72, 0, 1)`    | movement: sheets, slides, indicators. Front-loaded (about 90% done at a third of the time), so never for a fade |
| `--ease-spring`     | `cubic-bezier(.34, 1.56, .64, 1)` | press release and pops only (has overshoot)                                                                     |

Fades of surfaces and colour use the keyword `ease-in-out` (the prototype's page crossfade does), enters use
`ease-out`. There is no fifth curve.

| Duration | Use                                                                                     |
| -------- | --------------------------------------------------------------------------------------- |
| 80 ms    | press feedback (`:active`)                                                              |
| 200 ms   | colour changes (text, icons, borders), and the reduced-motion version of any longer one |
| 240 ms   | fold, fade in, resize (the `motion.js` helpers)                                         |
| 250 ms   | surface tint (glass)                                                                    |
| 300 ms   | blur, movement (indicator, hide and show), icon turn                                    |
| 350 ms   | spring release on small controls                                                        |
| 400 ms   | page and theme crossfade                                                                |

Nothing on the site animates longer than 400 ms.

## 3. What to animate

- Compositor properties first: `transform`, `opacity`.
- Allowed with care: `background-color`, `color`, `border-color`, `box-shadow`, and `backdrop-filter`
  (blur and saturate only, on a small strip, 300 ms at most).
- Never animate `width`, `height`, `top`, `left`, `margin`, `padding` with CSS. To show, hide, fold or
  resize something, use the helpers in `src/lib/motion.js` (`fadeIn`, `fadeOut`, `expand`, `collapse`,
  `release`, `pop`, `resize`, `reveal`). They honour reduced motion by themselves. Do not hand-roll them.
- Gradients cannot be interpolated. Put the gradient on its own layer and fade that layer's opacity.
- Set the same property list in both states so the browser has something to interpolate (for example
  `blur(0)` to `blur(24px)`, not `none` to `blur(24px)`).

## 4. Press feedback

Every button and round icon button squeezes on press and is released on the spring. It is global, in
`MotionStyles.astro`, so a new button gets it for free. Template components such as `Button` are core and
are matched by class there, not edited.

```css
.thing {
  transition: transform 0.35s var(--ease-spring);
}
.thing:active {
  transform: scale(0.96); /* 0.92 for round icon buttons */
  transition-duration: 0.08s;
}
```

Reduced motion: no scale, colour change only.

## 5. Materials (glass)

- Light theme: `rgb(255 255 255 / 55%)`. Dark theme: `rgb(28 32 40 / 45%)`. The header bar is the exception:
  it uses 90% in both themes, because its blur cannot see the page (the header has a `view-transition-name`) and
  at 55% the page text showed through the links.
  Both with `blur(24px) saturate(180%)`, a 1 px inner top highlight and a hairline below.
- Clear state has the same properties at zero (`rgb(.. / 0%)`, `blur(0)`), so clear to glass interpolates.
- Stage the change, on `ease-in-out`. To glass: tint 250 ms, blur 300 ms starting 100 ms later (a slow
  start keeps small radii from popping), text colour 200 ms starting 100 ms in, once the tint can back it.
  To clear: the reverse order (blur and text first, tint 80 ms later). One shared duration and curve reads
  as a toggle, not a material arriving.
- Colour transitions go on the leaf elements only (links, buttons, the logo text). A wrapper that sets
  `color` and is inherited from would run its own transition first, and the child's would start only
  after it, stacking delay and duration.
- No border, line or shadow while the surface is clear. A transparent border still paints any
  background that repeats into it: if you put a gradient on a layer, give the layer `border-width: 0`
  or put the gradient on a pseudo-element.
- Never stack a light translucent surface on another.
- `prefers-reduced-transparency: reduce` and `prefers-contrast: more`: solid background, no blur.
- Switch state with hysteresis (about 16 px) so scrolling back and forth at the edge does not chatter.

## 6. Chrome and page navigation

The site uses `ClientRouter`. Pages cross-fade, chrome does not.

- Page change: one 400 ms `ease-in-out` crossfade of the whole page, as in the prototype (Astro's default
  90 ms fade is replaced in `MotionStyles.astro`). 200 ms under reduced motion.
- Language switch: the old page fades out (180 ms, `ease-in`), then the new one fades in (260 ms,
  `ease-out`, after 140 ms), so the text change is not seen as a cut. `SiteHeader.astro` sets
  `html[data-vt='lang']` around the navigation. Astro drops root attributes on swap, so it is put back in
  `astro:after-swap` and removed when the transition has finished.
- Theme change (light and dark): the whole page crossfades as one snapshot (`startViewTransition`, 400 ms
  `ease-in-out`, 200 ms under reduced motion), so text, backgrounds and icons switch together. The toggle
  sets `html[data-vt='theme']` for the duration, which also lets the header join the root snapshot.
  The sun or moon turns in from -60deg on the drawer curve over 300 ms (dropped under reduced motion).
  See `ThemeToggle.astro`.
- Chrome that looks the same on every page (the header) gets its own `view-transition-name`, with the old
  snapshot hidden and no animation on the new one, so the page crossfade never touches it. See
  `SiteHeader.astro`.
- Do not use `transition:persist` for chrome whose content depends on the page or language (the header's
  nav links and language switch are per page). A persisted element keeps the old page's attributes.
  This broke the language switch once (`tests/lang-switch.test.mjs`).
- The header is rebuilt on every navigation, so each state is set up from scratch. While it is set up it
  carries `data-instant`, which sets `transition: none` on everything inside, for two frames. After that
  only the parts that really changed animate.
- Hand state over through a module-level variable. The new header starts with the previous page's active
  link, then moves the class after two frames, so the old underline shrinks and the new one grows.
- Active nav link: an underline grows from the centre (`scaleX`, 300 ms, `--ease-drawer`). Mobile menu:
  colour only.
- Things that show and hide use the helpers: the mobile menu fades in with an 8 px rise and fades out
  before it hides, the FAQ answer folds open and shut (`expand` and `collapse`), the cookie banner fades
  in and out.

## 7. Scroll-driven state

- State machines with thresholds, not scroll-linked values, unless the value is a direct 1:1 follow of the
  finger.
- Hide on scroll down only after 150 px of continuous travel, return after 80 px up. Always visible near
  the top (200 px), while it has focus, and while the mobile menu is open.
- Slide with `transform` on `--ease-drawer`, 300 ms.

## 8. Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  /* slides become fades, springs and scales are dropped, durations drop to 200 ms */
}
```

Every new animation ships with its reduced-motion rule in the same change. The `motion.js` helpers do
nothing under reduced motion, so callers need no branch.

## 9. Checklist before you call it done

1. Uses tokens from section 2 and properties from section 3.
2. Same behaviour reversed (scroll back, close, un-hover).
3. Interrupt it halfway: no jump, no lock.
4. Reduced motion rule present and checked.
5. Does not animate chrome that did not change on navigation.
6. Measured, not eyeballed. Sample computed values per frame and look for a monotonic curve that ends on
   the target:

```js
const log = [];
const t0 = performance.now();
const tick = () => {
  const s = getComputedStyle(el);
  log.push([Math.round(performance.now() - t0), s.opacity, s.transform]);
  if (log.length < 24) requestAnimationFrame(tick);
};
tick();
```

7. Screenshots in light and dark, desktop and mobile.
8. `npm run test:quality` passes, including `tests/motion-contract.test.mjs`.

## 10. Where it is implemented

| What                                                          | Where                                                        |
| ------------------------------------------------------------- | ------------------------------------------------------------ |
| Tokens, press feedback, page and language crossfades          | `src/components/client/MotionStyles.astro`                   |
| Helpers (`fadeIn`, `expand`, `collapse`, ...)                 | `src/lib/motion.js` (verbatim prototype copy)                |
| Header clear to glass, hide and show, hysteresis, active link | `src/components/client/SiteHeader.astro`                     |
| Mobile menu fades, language switch flag                       | `src/components/client/SiteHeader.astro`                     |
| Theme change crossfade, icon turn                             | `src/components/client/ThemeToggle.astro`                    |
| FAQ fold                                                      | `src/components/client/home/Faq.astro`                       |
| Cookie banner fade                                            | `src/components/client/CookieConsent.astro`                  |
| Sheet, tab bar, gesture references                            | `../prototype/styles.css`, `../prototype/src/pages/sheet.js` |

## 11. Keeping the site and the prototype identical

- The prototype is the source of truth. Change a curve, a duration or a helper there first, then copy it.
- `src/lib/motion.js` is a byte-for-byte copy of `../prototype/src/pages/motion.js` with a two-line header.
  It is excluded from Prettier so the copy stays exact.
- `tests/motion-contract.test.mjs` fails when the four tokens differ from the prototype, when `motion.js`
  differs, when a client file defines a curve that is not a token, or when press feedback and the page
  fades differ from the prototype numbers. It skips itself when `../prototype` is not present.
- The site and the app share no code at runtime and deploy separately, so this test and this document are
  the only link between them.
