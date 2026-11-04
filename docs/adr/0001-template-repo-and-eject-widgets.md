# 1. Template repo with ejected widgets, not a shared component library

Date: 2026-09-04

## Status

Accepted

## Context

This AstroWind fork is the base for Dodai client marketing sites. Client sites get
**genuinely custom designs**, not the same layouts with swapped text. We had to decide
how new sites are created and how much of AstroWind's widget library to reuse.

Options considered:

- **Fork per client** with an upstream link, to pull template improvements later. Rejected:
  we rarely want to merge template changes into a live client site, and the link invites
  risky merges.
- **Strip the template to a blank base** (plumbing only). Rejected: existing widgets are
  useful starting points for custom work.
- **Keep widgets as a shared library, customise in place.** Rejected: per-client edits to
  shared components make the template untrustworthy for the next site.

## Decision

1. This repo is a **GitHub template repo**. Each client site is created via "Use this
   template" as an independent repo with fresh history.
2. AstroWind's `src/components/widgets/` is a **parts bin**: reference implementations,
   never composed as-is, never edited.
3. All per-client design work lands in `src/components/client/`, created by ejecting a
   widget and modifying it or building new.
4. **Template core** (`layouts/`, `utils/`, `ui/`, `common/`, `blog/`, `vendor/`, config
   system) is never edited during a client build. A needed core change is either
   generalised properly or becomes a client component.
5. Netlify is the default deploy target; other targets live in `deploy/`.

## Consequences

- Template core stays stable and reusable across clients.
- No mechanism to propagate template fixes into existing client sites; each is a snapshot.
  Acceptable given client sites are small and shipped once.
- Some duplication between `widgets/` and `client/` components. Accepted as the price of
  isolation.
- Vocabulary defined in [CONTEXT.md](../../CONTEXT.md); workflow in [SETUP.md](../../SETUP.md).
