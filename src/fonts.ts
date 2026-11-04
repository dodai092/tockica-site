// Client layer, like src/brand.ts. The list of font cssVariables to preload in
// <head>. Each name here must match a `cssVariable` registered in the `fonts` array
// in astro.config.ts. Layout.astro (core) renders one <Font ... preload /> per entry.
//
// A system-font client leaves this empty and sets `fonts: []` in astro.config.ts:
// no web font is fetched, subset, or preloaded, and src/brand.ts points
// brand.fonts.* straight at a system stack.
export const preloadFonts: string[] = ['--font-montserrat', '--font-roboto'];
