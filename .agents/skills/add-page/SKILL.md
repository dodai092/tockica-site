---
name: add-page
description: Add a routed Astro page using this Dodai template's client component boundaries.
---

# Add a page

Read `../add-page.md`, `CONTEXT.md`, and `AGENTS.md` before editing.

- Create the route under `src/pages/`.
- Use `PageLayout` for the normal header and footer shell, or `Layout` only when a bare layout is intentional.
- Compose pages from `src/components/client/`, not directly from `src/components/widgets/`.
- Add a client component first when a needed section does not exist.
- Keep metadata explicit and verify the resulting route after a production build.
