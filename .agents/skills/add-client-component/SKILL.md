---
name: add-client-component
description: Add or adapt a per-client Astro component in this Dodai template.
---

# Add a client component

Read `../add-component.md`, `CONTEXT.md`, and `AGENTS.md` before editing.

- Put client-specific components in `src/components/client/`.
- If starting from a widget, copy it from `src/components/widgets/` first.
- Never edit or import a widget directly from the parts bin.
- Core UI and common components may be imported but must not be edited during a client build.
- Keep props specific to this site and follow the existing Astro and Tailwind patterns.

After editing, run the smallest relevant check, then `npm run check` and `npm run build` when the component is integrated.
