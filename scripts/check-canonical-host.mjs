import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import yaml from 'js-yaml';

const root = fileURLToPath(new URL('../', import.meta.url));
const distDir = path.join(root, 'dist');

const configuredSite = yaml.load(readFileSync(path.join(root, 'src/config.yaml'), 'utf8'))?.site?.site;
if (!configuredSite) {
  console.error('src/config.yaml has no site.site value; nothing to check against.');
  process.exit(1);
}
const expectedOrigin = new URL(configuredSite).origin;

const htmlFiles = readdirSync(distDir, { recursive: true })
  .filter((f) => f.endsWith('.html'))
  .map((f) => path.join(distDir, f));

if (htmlFiles.length === 0) {
  console.error(`No built HTML found under ${distDir}. Run "npm run build" first.`);
  process.exit(1);
}

// Attribute order inside the tag is not guaranteed (astro-seo emits href before rel,
// content before property), so match the whole tag first, then pull the attribute
// value out of it, instead of assuming a fixed attribute order.
function extractAttr(tag, attr) {
  return tag.match(new RegExp(`${attr}=["']([^"']+)["']`, 'i'))?.[1];
}
function findTag(html, tagName, matchAttr, matchValue) {
  const tagRe = new RegExp(`<${tagName}\\b[^>]*>`, 'gi');
  for (const [tag] of html.matchAll(tagRe)) {
    if (extractAttr(tag, matchAttr) === matchValue) return tag;
  }
  return null;
}

let failures = 0;

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const canonicalTag = findTag(html, 'link', 'rel', 'canonical');
  const ogImageTag = findTag(html, 'meta', 'property', 'og:image');
  const canonical = canonicalTag && extractAttr(canonicalTag, 'href');
  const ogImage = ogImageTag && extractAttr(ogImageTag, 'content');
  const relPath = path.relative(distDir, file);

  for (const [label, value] of [
    ['canonical', canonical],
    ['og:image', ogImage],
  ]) {
    if (!value) continue; // not every route sets both; absence is not this check's concern
    let origin;
    try {
      origin = new URL(value).origin;
    } catch {
      console.error(`${relPath}: ${label} is not an absolute URL: "${value}"`);
      failures++;
      continue;
    }
    if (origin !== expectedOrigin) {
      console.error(
        `${relPath}: ${label} host is "${origin}", but src/config.yaml site.site is "${expectedOrigin}". ` +
          'A mismatch here breaks link previews and can point search engines at the wrong canonical URL.'
      );
      failures++;
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} canonical/og:image host mismatch(es) found.`);
  process.exit(1);
}

console.log(`All canonical and og:image tags in dist/ use the configured origin (${expectedOrigin}).`);
