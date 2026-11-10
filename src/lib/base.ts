// The site's base path (Astro `base`): '' at the domain root, '/tockica-site' on GitHub Pages. Root links and
// fetches go through withBase, so the site also works under a sub-path. Plain node (the tests) has no
// import.meta.env, which reads as the domain root.
const base = (import.meta.env?.BASE_URL ?? '/').replace(/\/+$/, '');

export const withBase = (path: string): string => (path.startsWith('/') ? `${base}${path}` : path);
