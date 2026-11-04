# Add a Page

See [CONTEXT.md](../../CONTEXT.md) and [SETUP.md](../../SETUP.md) first.

## Steps

1. Create a `.astro` file in `src/pages/` (filename = route).
2. Use `PageLayout` (Header + Footer) or `Layout` (bare).
3. Build the page from **client components** in `src/components/client/`.
   Do not import from `src/components/widgets/` directly, that folder is a parts bin.
   If you need a section that doesn't exist yet as a client component, add it first
   (see `add-component.md`).

## Template

```astro
---
import Layout from '~/layouts/PageLayout.astro';
import Hero from '~/components/client/Hero.astro';
import Features from '~/components/client/Features.astro';

const metadata = {
  title: 'Page Title',
  description: 'Page description for SEO',
};
---

<Layout metadata={metadata}>
  <Hero title="Page Heading" subtitle="Supporting text" />
  <Features items={[/* ... */]} />
</Layout>
```

## Notes

- Files/folders prefixed with `_` are not routed (`src/pages/_examples/` holds the
  AstroWind demos for reference).
- `PageLayout` includes Header + Footer; `Layout` is bare.
- Icons use `tabler:icon-name` from `@iconify-json/tabler`.
