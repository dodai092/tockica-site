/* eslint-disable @typescript-eslint/no-require-imports -- Shared with the synchronous LHCI CommonJS configuration. */
const { existsSync, readFileSync, readdirSync } = require('node:fs');
const path = require('node:path');

const slugForRoute = (route) => (route === '/' ? 'home' : route.replace(/^\/|\/$/g, '').replace(/\//g, '-'));

function validateQualityRoutes(value, { isTemplate }) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('Quality route manifest is empty. Populate quality-routes.json before running gates.');
  }
  const seen = new Set();
  const slugs = new Set();
  for (const row of value) {
    if (
      !row ||
      typeof row !== 'object' ||
      Array.isArray(row) ||
      Object.keys(row).sort().join(',') !== 'kind,path' ||
      typeof row.path !== 'string' ||
      !/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(row.path) ||
      !['public', 'noindex', 'dev'].includes(row.kind)
    ) {
      throw new Error('Invalid quality route: ' + JSON.stringify(row));
    }
    if ((row.kind === 'dev') !== row.path.startsWith('/dev/') || (row.kind === 'dev' && !isTemplate)) {
      throw new Error('Development route is not permitted here: ' + row.path);
    }
    const slug = slugForRoute(row.path);
    if (seen.has(row.path) || slugs.has(slug)) {
      throw new Error('Duplicate route or screenshot slug: ' + row.path);
    }
    seen.add(row.path);
    slugs.add(slug);
  }
  return value;
}

function loadQualityRoutes(root = path.resolve(__dirname, '..')) {
  return validateQualityRoutes(JSON.parse(readFileSync(path.join(root, 'quality-routes.json'), 'utf8')), {
    isTemplate: existsSync(path.join(root, '.template-repo')),
  });
}

function assertBuiltRoutes(routes, distDir) {
  const built = new Set();
  function visit(dir, relative = '') {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const name = relative + entry.name;
      if (entry.isDirectory()) visit(path.join(dir, entry.name), name + '/');
      else if (name.endsWith('.html') && name !== '404.html') {
        built.add(
          name === 'index.html'
            ? '/'
            : '/' + (name.endsWith('/index.html') ? name.slice(0, -10) : name.slice(0, -5) + '/')
        );
      }
    }
  }
  visit(distDir);
  const listed = new Set(routes.map((row) => row.path));
  const missing = [...built].filter((route) => !listed.has(route));
  const stale = [...listed].filter((route) => !built.has(route));
  if (missing.length || stale.length) {
    throw new Error('Quality route coverage: missing [' + missing.join(', ') + ']; stale [' + stale.join(', ') + ']');
  }
}

const stripTrailingSlash = (p) => (p !== '/' && p.endsWith('/') ? p.slice(0, -1) : p);

// For every manifest route classified `noindex` or `dev`, fail if its path appears
// as a <loc> in the built sitemap. The @astrojs/sitemap filter is supposed to drop
// these (see astro.config.ts); this is the post-build regression check that it did.
// Comparison is tolerant of a trailing slash and of the configured site origin.
function assertSitemapExcludes(routes, distDir) {
  const present = ['sitemap-0.xml', 'sitemap-index.xml'].filter((name) => existsSync(path.join(distDir, name)));
  if (present.length === 0) {
    throw new Error(
      'No sitemap found in ' +
        distDir +
        ' (expected sitemap-0.xml or sitemap-index.xml). The build should always produce one.'
    );
  }
  const xml = present.map((name) => readFileSync(path.join(distDir, name), 'utf8')).join('\n');
  const sitemapPaths = new Set(
    [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => {
      try {
        return stripTrailingSlash(new URL(m[1]).pathname);
      } catch {
        return stripTrailingSlash(m[1]);
      }
    })
  );
  for (const row of routes) {
    if (row.kind !== 'noindex' && row.kind !== 'dev') continue;
    if (sitemapPaths.has(stripTrailingSlash(row.path))) {
      throw new Error(
        'Sitemap must exclude ' +
          row.kind +
          ' route ' +
          row.path +
          ' but it appears as a <loc> in ' +
          present.join(', ')
      );
    }
  }
}

module.exports = { loadQualityRoutes, validateQualityRoutes, assertBuiltRoutes, assertSitemapExcludes, slugForRoute };
