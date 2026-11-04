# Design brief: Točkica na i

Written 2026-11-04. Status: **provisional**. Items marked (P) are my defaults, waiting on Dunia's answers to doc items 21 to 24 (red and logo, reference sites, dark mode, photo style). Each (P) is a value in `src/brand.ts` or a single component, so her answers change values, not structure.

Sources: `docs/intake.md`, `Tockica/mockups/homepage-layout.html` (layout A), `Tockica/prototype/styles.css` (tokens shared with the booking app), Dunia's homepage doc.

## Direction

A rhythm spin studio with personality. Low lights, loud beats, a little main-character energy (Dunia's own line for an instructor). The site should feel like walking into the Riders Room: dark, warm, red accents, people and music first. It must also work as a clear booking tool for someone who already rides.

Not a generic fitness site. No stock photography, no AI images, no motivational clichés.

## Priorities

1. A returning rider reaches the schedule in one click (layout A, sticky "Rezerviraj trening").
2. A new visitor understands what a class is, who teaches it, and what it costs, scrolling once.
3. The site and the booking app look like one product (shared tokens).

## Colour (P)

| Role                    | Value                      | Source                                          |
| ----------------------- | -------------------------- | ----------------------------------------------- |
| Primary red             | `#D71920`                  | Estimated from AI images, not official (P)      |
| Red fill (buttons)      | `#C8141C`                  | Prototype                                       |
| Red ink (text on light) | `#B3121A`                  | Prototype, 6.96:1 on white, 6.49:1 on `#F7F7F7` |
| Dark slate              | `#232A35`                  | Original site CSS, prototype header             |
| Page background         | `#F7F7F7`, cards `#FFFFFF` | Prototype                                       |
| Body text               | `#2A2A2A`, muted `#636B76` | Prototype                                       |

Checked contrast: white text on `#D71920` is 5.19:1 and on `#C8141C` 5.88:1, so red buttons pass. Red `#D71920` text on slate `#232A35` is only 2.78:1, which fails for text. Red on dark surfaces is for buttons and large graphics only, and any red text in dark mode needs a lighter red (to pick during the build and check with the contrast test).

Red is the one accent and only marks actions and key facts. Dark slate carries the header, the Sculpt Room band and the footer. The template's blue and purple (`secondary`, `accent` in `brand.ts`) are removed or mapped to slate and red. All text pairs must pass the template's contrast gate (WCAG AA), dark mode included.

## Typography

- Montserrat for headings, buttons and numbers. Roboto for body. Both as on the original site ("fonts stay the same").
- Self-hosted via Astro's Fonts API, with `latin-ext` for Croatian diacritics (č, ć, đ, š, ž).
- Headings bold, short, sentence case. Tabular figures for prices, times and free-bike counts.

## Layout and components

- Layout A from the approved proposal: header, hero, next classes, about, rooms, instructors, how it works, Sculpt Room band, FAQ, contact, footer. Same order on mobile.
- Sticky header with a red "Rezerviraj trening" button. On mobile the button stays fixed at the bottom of the screen.
- "Next classes" cards show time, class, first name of the instructor and free bikes. Live data later, mock data first.
- Instructor cards: portrait, first name, one music or vibe line in Dunia's words.
- Package cards show price per class next to the pack price.
- Sculpt Room: dark band on the homepage, a plain page with description, monthly price, 6-month minimum, room photo, visits a month and "Send inquiry". Hidden from the booking schedule for non-subscribers.
- FAQ: four questions, accordion.
- Token knobs (`brand.tokens`) (P): radius `soft`, button `solid`, section `normal`, shadow `soft`, container `normal`. Revisit once her reference sites (item 22) arrive.

## Imagery

- Real photos only. Placeholders until about 15 arrive (hero, 3 space, 5 instructors, 2 Sculpt Room, 4 live training).
- Placeholder style: flat slate block with the photo's role written on it, so nothing looks finished that isn't.
- Treatment (P): colour, warm, unfiltered. No overlays except a dark gradient where text sits on a photo, kept to what contrast needs.

## Dark mode (P)

Light and dark, following the device setting, as the template and the prototype already do. Dark uses slate surfaces with the same red. Dropped if Dunia wants light only.

## Motion

Small and quick: hover and press states, accordion open, sticky header hide and show. Respect `prefers-reduced-motion`. No scroll-jacking, no parallax, no autoplay video.

## Voice and copy

- Croatian uses "ti". English is casual, same register, for expats, tourists and Multisport members.
- Short sentences. Dunia's instructor lines go in as written. The studio line: "The first and only rhythm spin studio in the heart of Zagreb."
- Slogan is open (doc item 1).

## Language

Croatian at `/`, English at `/en/`. Every page has a twin, checked by a test. HR/EN switch in the header. Page language and hreflang come from page metadata (template PR #15).

## Must not

- No Dodai co-brand bar.
- No AI images.
- No blog or reviews at launch.
- No new address (Ulica Antuna Bauera 22) until Dunia confirms it is official.
- No Multisport claims until Benefit Systems answers.

## Open, waiting on Dunia

| Question                                           | Doc item | Affects                            |
| -------------------------------------------------- | -------- | ---------------------------------- |
| Official red, logo files, whether slate is hers    | 21       | Colour tokens, logo, favicon       |
| 2 to 3 reference sites she likes, one she dislikes | 22       | Token knobs, density, photo crop   |
| Dark mode yes or no                                | 23       | `ui.theme`, dark palette work      |
| Photo style                                        | 24       | Image treatment, placeholder style |
| Slogan                                             | 1        | Hero                               |
| Real photos                                        | 9        | Everything with a placeholder      |

## Mapping to the template

`src/brand.ts` (colours, `tokens`, logo, fonts), `astro.config.ts` `fonts` and `src/fonts.ts`, `src/navigation.ts` (per language), `src/components/client/` for every new component. No core edits.
