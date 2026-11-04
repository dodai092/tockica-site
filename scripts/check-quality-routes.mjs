import { fileURLToPath } from 'node:url';
import routes from './quality-routes.cjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const distDir = fileURLToPath(new URL('../dist/', import.meta.url));
const manifest = routes.loadQualityRoutes(root);
routes.assertBuiltRoutes(manifest, distDir);
routes.assertSitemapExcludes(manifest, distDir);
console.log(
  'Quality route manifest covers the production HTML inventory; noindex/dev routes are absent from the built sitemap.'
);
