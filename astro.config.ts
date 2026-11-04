import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

import { defineConfig, fontProviders } from 'astro/config';

import { unified } from '@astrojs/markdown-remark';

import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import icon from 'astro-icon';
import compress from 'astro-compress';
import type { AstroIntegration } from 'astro';

import astrowind from './vendor/integration';
import loadConfig from './vendor/integration/utils/loadConfig';

import { readingTimeRemarkPlugin, responsiveTablesRehypePlugin } from './src/utils/frontmatter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Blog taxonomy sections marked `robots.index: false` in `src/config.yaml` are
// kept out of the sitemap. Listing a URL that we then ask crawlers not to index
// spends crawl budget on nothing and sends two contradictory signals at once.
// The prefixes are derived from the config instead of hardcoded because these
// pathnames are meant to be renamed (see the comments in `src/config.yaml`).
interface BlogSectionConfig {
  isEnabled?: boolean;
  pathname?: string;
  robots?: { index?: boolean };
}

const themeConfig = (await loadConfig('src/config.yaml')) as {
  apps?: { blog?: Record<string, BlogSectionConfig> };
};

const noindexTaxonomyPaths = ['category', 'tag']
  .map((section) => themeConfig?.apps?.blog?.[section])
  .filter((section): section is BlogSectionConfig => Boolean(section?.isEnabled) && section?.robots?.index === false)
  .map((section) => `/${(section.pathname ?? '').replace(/^\/+|\/+$/g, '')}/`);

// Routes classified `noindex` or `dev` in quality-routes.json are also kept out
// of the sitemap, for the same reason as the taxonomy sections above. The
// manifest is the single route-classification source (scripts/quality-routes.cjs);
// a fresh client repo has an empty manifest until it is repopulated post-init.
const noindexManifestPaths: string[] = (() => {
  try {
    const raw = JSON.parse(readFileSync(path.join(__dirname, 'quality-routes.json'), 'utf8'));
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((r) => r && typeof r.path === 'string' && (r.kind === 'noindex' || r.kind === 'dev'))
      .map((r) => r.path as string);
  } catch {
    return [];
  }
})();

const hasExternalScripts = false;
const whenExternalScripts = (items: (() => AstroIntegration) | (() => AstroIntegration)[] = []) =>
  hasExternalScripts ? (Array.isArray(items) ? items.map((item) => item()) : [items()]) : [];

export default defineConfig({
  output: 'static',

  // Prefetch links as they enter the viewport for snappier navigations
  // (works together with <ClientRouter />, which enables prefetch by default).
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },

  // Native Fonts API: self-hosts + subsets + preloads Noto Sans and generates
  // metric-adjusted fallbacks. Injected via <Font /> in Layout.astro and
  // consumed through the `--font-noto-sans` CSS variable in CustomStyles.astro.
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Noto Sans',
      cssVariable: '--font-noto-sans',
      weights: ['100 900'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
  ],

  integrations: [
    sitemap({
      filter: (page) => {
        const p = new URL(page).pathname;
        const withSlash = p.endsWith('/') ? p : p + '/';
        return (
          !p.startsWith('/dev/') &&
          !noindexTaxonomyPaths.some((prefix) => p.startsWith(prefix)) &&
          !noindexManifestPaths.includes(withSlash)
        );
      },
    }),
    mdx(),
    icon({
      include: {
        tabler: ['*'],
        'flat-color-icons': [
          'template',
          'gallery',
          'approval',
          'document',
          'advertising',
          'currency-exchange',
          'voice-presentation',
          'business-contact',
          'database',
        ],
      },
    }),

    ...whenExternalScripts(() =>
      partytown({
        config: { forward: ['dataLayer.push'] },
      })
    ),

    compress({
      // csso off on purpose: its parser doesn't understand the media range
      // syntax Tailwind v4 emits for breakpoints (`@media (width>=48rem)`) and
      // silently drops every one of those blocks — the site then renders as if
      // all `md:`/`lg:` classes were missing. lightningcss parses it correctly.
      CSS: { csso: false, lightningcss: { minify: true } },
      HTML: {
        'html-minifier-terser': {
          removeAttributeQuotes: false,
        },
      },
      Image: false,
      JavaScript: true,
      SVG: false,
      Logger: 1,
    }),

    astrowind({
      config: './src/config.yaml',
    }),
  ],

  image: {
    // Astro's default Sharp service handles local images.
    //
    // Most remote CDN images (Unsplash, Cloudinary, Imgix…) are routed by
    // src/components/common/Image.astro through `unpic`, which rewrites the
    // URL with CDN-side query parameters and serves it straight from the
    // provider — Astro never downloads it, so they don't need to be listed.
    //
    // `domains` only matters for remote URLs that fall through to Astro's
    // native <Image /> (i.e. providers Unpic can't detect, like Pixabay).
    // Listed entries are authorized to be processed by Sharp.
    domains: ['cdn.pixabay.com'],

    // Emit responsive styles for the native <Image layout=…> used by
    // src/components/common/Image.astro (local images). Utility classes on
    // each usage still win, since these styles use low-specificity selectors.
    responsiveStyles: true,
  },

  markdown: {
    processor: unified({
      remarkPlugins: [readingTimeRemarkPlugin],
      rehypePlugins: [responsiveTablesRehypePlugin],
    }),
  },

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
      },
    },
  },
});
