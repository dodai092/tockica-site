# Context

Glossary for this repo. Točkica na i was built from the dodai-astrowind template (an
AstroWind fork). Terms below have precise meanings; use them consistently in code,
commits, and docs.

## Glossary

### Template core

The files reused unchanged across every client site: `src/layouts/`, `src/utils/`,
`src/components/ui/`, `src/components/common/`, `src/components/blog/`, `vendor/`, the
`astrowind:config` virtual-module system, content collections, and build/deploy config.
Editing template core during a client build is a smell: either generalise the change back
into core, or move it to a **client component**.

The files customised for every client: `src/config.yaml`, `src/brand.ts` (colour/font
values), `src/schema.ts` (structured data), the `fonts` entry in `astro.config.ts`,
`src/navigation.ts`, `src/pages/`, `src/data/post/`, and logo/image assets.

### Brand surface

`src/brand.ts`, the single file holding per-client colours, font variables, and the
`tokens` structural knobs (radius, button, section, shadow, container).
`src/components/CustomStyles.astro` reads it and renders the `--aw-*` CSS variables.
Never put brand values anywhere else.

### `_examples/`

`src/pages/_examples/` holds the original AstroWind demo pages (`homes/`, `landing/`).
The `_` prefix means Astro does not route them. Kept as design references, not shipped.

### Parts bin

`src/components/widgets/` from upstream AstroWind. Not composed directly into client
pages as-is; treated as reference implementations to copy from when building a
**client component**. Never edited in place.

### Client component

A per-client component living in `src/components/client/`. Created by ejecting a widget
from the **parts bin** and modifying it freely, or built new. This is where all
per-client design work lands, so **template core** never drifts.

### Waitlist

The people who sign up before the studio opens. They later create a login on the booking system and
unlock the **Waitlist offer**. It is a list of future users, not a newsletter.

_Avoid_: newsletter, mailing list, subscribers

**Why:** Dunia's opening plan treats sign-ups as the first accounts of the booking system, so nothing is
sent to them as marketing mail.

### Waitlist offer

€100 for 30 days of unlimited rides. Joining the **Waitlist** by 31 December unlocks it. It can be bought from
4 January (opening day) to 31 January, and the 30 days start on the day of purchase. "Unlimited" covers all spin
classes. Subject to class availability, not transferable (only the account it is linked to), no pause, no refund.
Stated openly on the waitlist page, because it is the reason to join.

_Avoid_: early bird, launch promo

**Why:** the January offers "Buy 1, we double it" and "Bring a +1" are separate and start only after opening,
so they are not part of this term. Dunia's 2026-11-12 text replaced the earlier reading "buy by 31.12, valid until 4.2".

### Waitlist page

The page that stands in as the site's homepage until opening on 4 January: the **Waitlist offer**, the sign-up form,
the steps and the studio's opening hours. One page in both languages.

_Avoid_: landing page, home hero

**Why:** Dunia wants visitors to land on the waitlist first. A form inside the full homepage's hero was tried and
rejected, because it changed a homepage she wanted left as it is.

### Full homepage

The complete homepage (next classes, packs, about, rooms, instructors, FAQ, contact). Built and kept out of sight
until opening, when it replaces the **Waitlist page** as the homepage.

_Avoid_: old homepage, real homepage

## Related docs

- [SETUP.md](./SETUP.md), the build reference kept from the template
- [AGENTS.md](./AGENTS.md), AstroWind architecture and conventions
