// Client layer, like src/brand.ts. The list of font cssVariables to preload in
// <head>. Each name here must match a `cssVariable` registered in the `fonts` array
// in astro.config.ts. Layout.astro (core) renders one <Font ... preload /> per entry.
//
// A system-font client leaves this empty and sets `fonts: []` in astro.config.ts:
// no web font is fetched, subset, or preloaded, and src/brand.ts points
// brand.fonts.* straight at a system stack.
//
// An entry is either a cssVariable (every file of that family is preloaded) or an object with a `preload`
// filter (Astro's own: weight, style, subset), so only the files seen above the fold are preloaded. The rest
// of the family still loads, on demand, with font-display: swap.
type PreloadFont = string | { cssVariable: string; preload: { weight?: string | number; subset?: string }[] };

// Headings (Montserrat, one variable file per subset) and regular body text. Roboto 500 and 700 are not preloaded.
export const preloadFonts: PreloadFont[] = [
  '--font-montserrat',
  { cssVariable: '--font-roboto', preload: [{ weight: 400 }] },
];
