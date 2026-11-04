# Add a Client Component

Per-client components live in `src/components/client/`. See [CONTEXT.md](../../CONTEXT.md).

## Steps

1. Decide: start from a parts-bin widget or build new.
   - **From a widget:** copy `src/components/widgets/<Name>.astro` to
     `src/components/client/<Name>.astro`, then modify freely. Never edit the original.
   - **New:** create `src/components/client/<Name>.astro`.
2. Keep props simple and specific to this site. Don't rebuild the widgets' generic
   `classes` / slot API unless you actually need it.
3. Import core primitives (`~/components/ui/*`, `~/components/common/*`) as needed.
   Those are core: use them, don't edit them.

## Template (new client component)

```astro
---
import WidgetWrapper from '~/components/ui/WidgetWrapper.astro';

interface Props {
  title: string;
  items: { title: string; description: string }[];
}

const { title, items } = Astro.props;
---

<WidgetWrapper>
  <h2>{title}</h2>
  <div class="grid gap-6 md:grid-cols-3">
    {
      items.map((item) => (
        <div>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </div>
      ))
    }
  </div>
</WidgetWrapper>
```

## Notes

- `WidgetWrapper` gives consistent section spacing and dark-mode support.
- Icons: `tabler:icon-name` from `@iconify-json/tabler`.
- Use `twMerge()` when a component accepts a `class` override.
