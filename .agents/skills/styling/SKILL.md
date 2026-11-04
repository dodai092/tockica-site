---
name: styling
description: Style Dodai client pages using the template's Tailwind v4 and brand-token rules.
---

# Styling

Read `../styling.md`, `CONTEXT.md`, and `AGENTS.md` before editing.

- Put brand colors, fonts, and structural tokens in `src/brand.ts`.
- Put Tailwind v4 theme mappings and utilities in `src/assets/styles/tailwind.css` only when a shared template change is intended.
- Do not edit `src/components/CustomStyles.astro` to set client brand values. It reads `src/brand.ts`.
- Use class-based `dark:` utilities and the existing `intersect` animation variant where appropriate.
- Preserve visible focus states, responsive behavior, and reduced-motion support.
