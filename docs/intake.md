# Client intake: Točkica na i

Filled 2026-11-04 from the project folder (`Tockica/CONTEXT.md`, `REQUIREMENTS.md`, `docs/adr/`) and Dunia's first answers in the homepage doc (https://docs.google.com/document/d/1UFBuWAPTzEDWSU2H4Zo-GIBb3MDcf6ytVOAv6A9wYV8/edit). "OPEN" means Dunia has not answered yet, with the doc item number.

- Discovery done here, or already completed in a prior engagement? Done in the booking-platform engagement. Material: `Tockica/CONTEXT.md`, `Tockica/REQUIREMENTS.md`, `Tockica/docs/adr/0001` to `0006`, the layout proposal in `Tockica/mockups/homepage-layout.html`.
- Has the client already drafted and approved page copy? Partly. Dunia writes Croatian copy, Antun translates to English, Dunia approves. Received so far (doc items 4 and 11): instructor vibe lines, the About line, the FAQ draft (English). Source is the Google doc above, copied into `docs/copy/` when the plan starts. Still missing: slogan, Sculpt Room sentence, contact details, FAQ cancel answer.
- Any verbatim-locked text? "The first and only rhythm spin studio in the heart of Zagreb" (Dunia's wording). Instructor vibe lines are hers, keep as written. Legal texts (Pravilnik, uvjeti, waiver, privacy): Croatian is official, English is a translation for her lawyer to review. OPEN item 14.
- Structured-data / schema draft from the client? None. LocalBusiness is enough (SportsActivityLocation is a possible type).

## Business

- What the business does, in one sentence: A rhythm spin studio in Zagreb with a 45-minute signature class in the Riders Room (20 bikes), plus a Sculpt Room that independent trainers rent by subscription.
- Who the customer is: Women and men in Zagreb who want a fun, music-led group workout, from first-timers to regulars. Also expats, tourists and Multisport members (English version).
- What makes them different from competitors: "The first and only rhythm spin studio in the heart of Zagreb." Choreography to the beat, personality-driven instructors, low lights and loud music.
- Competitors / sites they like: OPEN, not asked.

## Goal of the site

- Primary action a visitor should take: Book a class ("Rezerviraj trening").
- Secondary actions: See the schedule, see instructors, see packs and prices, send a Sculpt Room inquiry, contact the studio.
- How success is measured: Bookings made through the app. The site has GA4 with consent (EU). OPEN: Measurement ID.

## Pages

- Required pages: Home, Raspored (booking starts here, lives in the booking app and is proxied under tockicanai.hr, ADR 0005 update), Instruktori, Paketi, Sculpt Room Rent, Prijava i registracija (booking app), footer pages: Pravilnik studija, Uvjeti korištenja, Privatnost, Kontakt. Every page exists in Croatian and English (`/en/`).
- Blog needed? No. Old news and blog are dropped. OPEN item 7, Dunia can ask to keep it.
- Any page with special functionality: Raspored and login (booking app, bike map, emailed-code login), contact form (OPEN item 16), Sculpt Room "Send inquiry" form, map in contact section. Homepage "Sljedeći treninzi" reads live data from the app.

## Brand

- Logo files received? An older green SVG (`Tockica/TNI_logo.svg`) and my red recolor (`prototype/assets/tockica-logo.svg`). Not Dunia's official red file. Ask her for it. White/dark versions unknown.
- Brand colors (hex): Red estimated from AI images, not official: `#D71920` base, `#C8141C` fill, `#B3121A` ink. Dark slate `#232A35` and greys come from the original Točkica site CSS (used in the prototype). Dunia confirms the red and whether slate is part of her palette (doc item 21). The Dodai navy `#243F5C` is not a Točkica colour.
- Fonts / typeface: Montserrat for headings and buttons, Roboto for body, as on the original site and the prototype ("fonts stay the same", Dunia). Check Roboto is wanted on the new site.
- Photography / image assets received? None. Real photos only, no AI images. Placeholders until she sends about 15 (item 9).
- Tone of voice notes: Playful, music-led, direct. Croatian addresses the visitor with "ti". English is casual, same register. Spartan copy.

## Messaging and voice

- Core differentiators / messaging pillars: Rhythm spin, 45 minutes, "your 45 minutes" at your own pace, all levels welcome, instructors with personality.
- Guardrails, what not to say: No AI images. No Multisport claims until Benefit Systems answers. No Sculpt Room trainer promotion. Show instructor first names only.
- Real customer language: FAQ questions from Dunia: beginner classes, what to bring (clean shoes, water, towel), when to arrive (15 minutes early if new), cancelling.
- Anti-persona: None stated. Confirm with Dunia.

## Local presence (local-business clients)

- Google Business Profile: OPEN, item 18. Address on the old site is Rusanova 8, Zagreb, phone 095 865 1335. Dunia says a new seat, Ulica Antuna Bauera 22, is not yet on official papers. Do not publish the new address until she confirms which one is correct (item 8, item 13).
- Apple Maps / Bing Places listing, if any: OPEN.

## Domain and infrastructure

- Production domain: tockicanai.hr
- Who controls DNS? OPEN, item 18. Required before launch.
- Existing site to migrate content/redirects from: WordPress at https://www.tockicanai.hr/. Mirror at `Tockica/original-site/mirror/` (stuck preloader, use the live site for visuals). Redirects from old Cjenik, Pridruži se and program pages to the new Paketi, Instruktori and Home.
- Email provider: OPEN. Booking emails come from info@tockicanai.hr for now.
- Is the contact email printed on marketing materials actually receiving mail? info@tockicanai.hr is on the old site. Confirm it receives mail (item 8).
- Hosting: Netlify, EU region. Booking app on a separate Netlify project, proxied under the same domain (ADR 0005).

## Analytics and legal

- GA4 Measurement ID: OPEN. Not asked yet.
- Consent banner required? Yes, EU/GDPR. `requireConsent: true`.
- Legal entity name: Točkica na i j.d.o.o., OIB HR37892279693, authorised person Dunia Mando. Seat: see Local presence.
- Contact email for legal pages: info@tockicanai.hr
- Jurisdiction: Croatia
- Existing privacy policy / terms to reuse? Old terms exist on the old site (mention a newsletter database). Dunia is sending her own terms draft. Privacy policy unknown (item 14), Antun drafts one if none exists, Dunia or her lawyer approves.
- Cookie/consent requirements: Consent Mode with all denied until accepted, adapt `src/components/client/CookieConsent.astro`.
- EU consumer-facing client: possible European Accessibility Act exposure? Yes, it sells services to consumers online in the EU. A micro-enterprise exemption may apply for a company with fewer than 10 staff and low turnover, but I have not verified the numbers, so treat the site as needing WCAG 2.2 AA anyway (the template's contrast gate already enforces part of it).

## Timeline

- Target launch date: Mid-December 2026, with the booking system, not a promise. Dunia is flexible and accepts a slip (item 19).
- Hard deadlines / events: None known.
- Review cycles expected: Dunia reviews Croatian and English copy before publishing. Her lawyer reviews legal pages and the English translation.
