#!/usr/bin/env node
// Reinit this template for a new client site. Run once, right after "Use this template":
//   npm run init-client
// Edits package.json, src/config.yaml, src/brand.ts, the legal pages, and README.md.
// Everything it can't do (logos, fonts, nav, page content, deploy) is printed at the end.
// Safe to inspect the diff afterwards; git is the undo.

import { copyFile, readFile, writeFile, rm, stat, mkdir } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';

// Small line prompter that works both interactively and with piped stdin (readline/promises
// leaves later questions unsettled once a pipe hits EOF).
const makePrompter = () => {
  const rl = createInterface({ input, output });
  const buffered = [];
  const waiters = [];
  let closed = false;
  rl.on('line', (line) => {
    const w = waiters.shift();
    if (w) w(line);
    else buffered.push(line);
  });
  rl.on('close', () => {
    closed = true;
    while (waiters.length) waiters.shift()('');
  });
  const question = (q) => {
    output.write(q);
    if (buffered.length) return Promise.resolve(buffered.shift());
    if (closed) return Promise.resolve('');
    return new Promise((resolve) => waiters.push(resolve));
  };
  return { question, close: () => rl.close() };
};

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const hexToRgbTriplet = (hex) => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

const exists = async (p) => {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
};

const replaceInFile = async (path, pairs) => {
  let text = await readFile(path, 'utf8');
  for (const [from, to] of pairs) {
    if (!text.includes(from)) {
      console.warn(`  ! "${from}" not found in ${path} (skipped)`);
      continue;
    }
    text = text.split(from).join(to);
  }
  await writeFile(path, text);
};

const resolve = (v, c) => (typeof v === 'function' ? v(c) : v);

const applyReplacements = async (ctx) => {
  const byFile = new Map();
  for (const r of REPLACEMENTS) {
    if (r.when && !r.when(ctx)) continue;
    if (!byFile.has(r.file)) byFile.set(r.file, []);
    byFile.get(r.file).push(r);
  }
  for (const [file, entries] of byFile) {
    let text = await readFile(file, 'utf8');
    for (const e of entries) {
      if (!text.includes(e.from)) {
        console.warn(`  ! "${e.from.slice(0, 60)}" not found in ${file} (skipped)`);
        continue;
      }
      text = text.split(e.from).join(resolve(e.to, ctx));
    }
    await writeFile(file, text);
  }
};

const runCheck = async () => {
  if (!(await exists('.template-repo'))) {
    console.log('init-client --check: not a template repo, nothing to check');
    return 0;
  }
  const files = [...new Set(REPLACEMENTS.map((r) => r.file))];
  const cache = new Map();
  for (const f of files) {
    try {
      cache.set(f, await readFile(f, 'utf8'));
    } catch {
      cache.set(f, null); // renamed/deleted target: every REPLACEMENTS entry for it counts as a miss
    }
  }
  const misses = REPLACEMENTS.filter((r) => {
    const text = cache.get(r.file);
    return text === null || !text.includes(r.from);
  });
  for (const m of misses) console.error(`  MISS ${m.file}: "${m.from.slice(0, 60)}..."`);
  console.log(`init-client --check: ${REPLACEMENTS.length - misses.length}/${REPLACEMENTS.length} matches present`);
  return misses.length ? 1 : 0;
};

// Every verbatim doc/config string init-client rewrites, in one place so
// `--check` can prove each `from` still exists in its target. `when` gates
// application only; `--check` verifies every entry regardless of `when`.
const REPLACEMENTS = [
  { file: 'package.json', from: '"name": "dodai-astrowind"', to: (c) => `"name": "${c.slug}"` },
  {
    file: 'package.json',
    from: '"description": "Dodai client website template. Fork of AstroWind (Astro 7 + Tailwind CSS v4). See SETUP.md.",',
    to: (c) => `"description": "${c.name} website.",`,
  },
  { file: 'src/config.yaml', from: '  name: AstroWind', to: (c) => `  name: ${c.name}` },
  { file: 'src/config.yaml', from: "  site: 'https://astrowind.vercel.app'", to: (c) => `  site: '${c.siteUrl}'` },
  {
    file: 'src/config.yaml',
    from: '  googleSiteVerificationId: orcPxI47GSa-cRvY11tUe6iGg2IO_RPvnA1q95iEM3M',
    to: "  googleSiteVerificationId: ''",
  },
  { file: 'src/config.yaml', from: '    default: AstroWind', to: (c) => `    default: ${c.name}` },
  { file: 'src/config.yaml', from: "    template: '%s | AstroWind'", to: (c) => `    template: '%s | ${c.name}'` },
  {
    file: 'src/config.yaml',
    from: '  description: "\\U0001F680 Suitable for Startups, Small Business, Sass Websites, Professional Portfolios, Marketing Websites, Landing Pages & Blogs."',
    to: (c) => `  description: '${c.name} website.'`,
  },
  { file: 'src/config.yaml', from: '    site_name: AstroWind', to: (c) => `    site_name: ${c.name}` },
  { file: 'src/config.yaml', from: "    handle: '@arthelokyo'", to: "    handle: ''" },
  { file: 'src/config.yaml', from: "    site: '@arthelokyo'", to: "    site: ''" },
  {
    file: 'src/brand.ts',
    from: "primary: 'rgb(1 97 239)'",
    to: (c) => `primary: 'rgb(${c.rgb})'`,
    when: (c) => Boolean(c.rgb),
  },
  {
    file: 'CLAUDE.md',
    from: `This repo is the **Dodai website template** (AstroWind fork). Read in this order:

1. [CONTEXT.md](./CONTEXT.md), vocabulary. Terms below are used precisely.
2. [SETUP.md](./SETUP.md), the per-client build workflow (one workflow: Discovery, Build, Launch).
3. [AGENTS.md](./AGENTS.md), AstroWind architecture and conventions.
4. [docs/client-build-rules.md](./docs/client-build-rules.md), before writing a client
   plan or reviewing a client branch.
5. [docs/quality-gates.md](./docs/quality-gates.md), the canonical client quality-gate
   policy (gate order, thresholds, route coverage, review rubric).`,
    to: (c) => `This repo was built from the [dodai-astrowind](https://github.com/dodai/dodai-astrowind)
template for ${c.name} (AstroWind fork). Read in this order:

1. [CONTEXT.md](./CONTEXT.md), vocabulary. Terms below are used precisely.
2. [AGENTS.md](./AGENTS.md), AstroWind architecture and conventions.
3. [docs/client-build-rules.md](./docs/client-build-rules.md), before writing a client
   plan or reviewing a client branch.
4. [docs/quality-gates.md](./docs/quality-gates.md), the canonical client quality-gate
   policy (gate order, thresholds, route coverage, review rubric).`,
  },
  {
    file: 'AGENTS.md',
    from: `This repo is the **Dodai website template**, a fork of AstroWind: a static website
template built with **Astro v7** and **Tailwind CSS v4**, optimized for performance, SEO,
and accessibility.`,
    to: (c) => `This repo was built from the dodai-astrowind template for ${c.name}, a fork of AstroWind:
a static website built with **Astro v7** and **Tailwind CSS v4**, optimized for
performance, SEO, and accessibility.`,
  },
  {
    file: 'AGENTS.md',
    from: `Read [CONTEXT.md](./CONTEXT.md) for the exact meaning of the terms below,
[SETUP.md](./SETUP.md) for the per-client build workflow (one workflow: Discovery, Build, Launch),
[docs/client-build-rules.md](./docs/client-build-rules.md) before writing a client plan
or reviewing a client branch, and [docs/quality-gates.md](./docs/quality-gates.md) for the
canonical client quality-gate policy (gate order, thresholds, route coverage, review rubric).`,
    to: `Read [CONTEXT.md](./CONTEXT.md) for the exact meaning of the terms below,
[docs/client-build-rules.md](./docs/client-build-rules.md) before writing a client plan
or reviewing a client branch, and [docs/quality-gates.md](./docs/quality-gates.md) for the
canonical client quality-gate policy (gate order, thresholds, route coverage, review rubric).`,
  },
  {
    file: 'CONTEXT.md',
    from: `Glossary for this repo. This is an AstroWind fork used as the base template for Dodai
client websites. Terms below have precise meanings; use them consistently in code,
commits, and docs.`,
    to: (c) => `Glossary for this repo. ${c.name} was built from the dodai-astrowind template (an
AstroWind fork). Terms below have precise meanings; use them consistently in code,
commits, and docs.`,
  },
  {
    file: 'SETUP.md',
    from: `# Building a client site from this template

This repo is a GitHub **template repo**. Each client site is a fresh repo created from it
with independent history,`,
    to: `# Client site build reference

This repo was created from the dodai-astrowind GitHub **template repo**, with its own
independent history,`,
  },
  {
    file: 'src/fonts.ts',
    from: "export const preloadFonts: string[] = ['--font-noto-sans'];",
    to: 'export const preloadFonts: string[] = [];',
    when: (c) => c.fontMode === 'system',
  },
  {
    file: 'astro.config.ts',
    from: `  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Noto Sans',
      cssVariable: '--font-noto-sans',
      weights: ['100 900'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
  ],`,
    to: '  fonts: [],',
    when: (c) => c.fontMode === 'system',
  },
  {
    file: 'src/brand.ts',
    from: `  fonts: {
    sans: 'var(--font-noto-sans)',
    serif: 'var(--font-noto-sans)',
    heading: 'var(--font-noto-sans)',
  },`,
    to: `  fonts: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },`,
    when: (c) => c.fontMode === 'system',
  },
  {
    file: 'astro.config.ts',
    from: "import { defineConfig, fontProviders } from 'astro/config';",
    to: "import { defineConfig } from 'astro/config';",
    when: (c) => c.fontMode === 'system',
  },
  {
    file: 'CONTEXT.md',
    from: '- [SETUP.md](./SETUP.md), the per-client build workflow (Discovery, Build, Launch)',
    to: '- [SETUP.md](./SETUP.md), the build reference kept from the template',
  },
];

// --- gather every answer first, then touch files (readline over a pipe closes on EOF) ---

if (process.argv.includes('--check')) {
  process.exit(await runCheck());
}

const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const rl = makePrompter();
const ask = async (question, fallback = '') => {
  const hint = fallback ? ` [${fallback}]` : '';
  const answer = (await rl.question(`${question}${hint}: `)).trim();
  return answer || fallback;
};

if (pkg.name !== 'dodai-astrowind') {
  const go = await ask(`package.json name is already "${pkg.name}". Run init again anyway? (y/N)`);
  if (go.toLowerCase() !== 'y') {
    console.log('Aborted.');
    rl.close();
    process.exit(0);
  }
}

console.log('\nNew client site setup. Press enter to accept a [default].\n');

const name = await ask('Client / site name (e.g. Northwind Plumbing)');
if (!name) {
  console.log('Name is required. Aborted.');
  rl.close();
  process.exit(1);
}
let domain = await ask('Production domain (e.g. northwind.com)');
domain = domain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
const entity = await ask('Legal entity name (for terms/privacy)', name);
const email = await ask('Contact email (for terms/privacy)');
const jurisdiction = await ask('Jurisdiction (e.g. Croatia)');
const colorInput = await ask('Primary brand color as hex (blank = keep template blue)');
const fontModeInput = await ask('Custom web font or system stack? (custom/system)', 'system');
const fontMode = fontModeInput.toLowerCase() === 'custom' ? 'custom' : 'system';
const dropExamples = await ask('Remove src/pages/_examples/ (AstroWind demo pages)? (y/N)');
rl.close();

const rgb = colorInput ? hexToRgbTriplet(colorInput) : null;
if (colorInput && !rgb) console.warn(`  ! "${colorInput}" is not a valid hex color; keeping template blue.`);

const siteUrl = domain ? `https://${domain}` : '';
const siteDomainText = domain ? `https://${domain}` : '{{SITE_DOMAIN}}';
const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

console.log('\nEditing files...');

const ctx = {
  name,
  slug: slugify(name),
  domain,
  siteUrl,
  siteDomainText,
  entity,
  email,
  jurisdiction,
  rgb,
  today,
  fontMode,
};

await applyReplacements(ctx);

const legalPairs = [
  ['{{LAST_UPDATED}}', today],
  ['{{CLIENT_ENTITY}}', entity],
  ['{{CLIENT_NAME}}', name],
  ['{{SITE_DOMAIN}}', siteDomainText],
  ['{{CONTACT_EMAIL}}', email || '{{CONTACT_EMAIL}}'],
  ['{{JURISDICTION}}', jurisdiction || '{{JURISDICTION}}'],
];
await replaceInFile('src/pages/terms.md', legalPairs);
await replaceInFile('src/pages/privacy.md', legalPairs);

await writeFile(
  'README.md',
  `# ${name}\n\nWebsite for ${name}. Built by Dodai from the [dodai-astrowind](https://github.com/dodai/dodai-astrowind) template.\n\n\`\`\`\nnpm install\nnpm run dev      # localhost:4321\nnpm run build\nnpm run check\n\`\`\`\n\nDeploy: Netlify (\`netlify.toml\`).\n`
);

const scaffold = async (src, dest) => {
  if (await exists(dest)) {
    console.warn(`  ! ${dest} already exists (skipped)`);
    return;
  }
  await copyFile(src, dest);
  console.log(`  scaffolded ${dest}`);
};
await scaffold('docs/intake-template.md', 'docs/intake.md');
await scaffold('docs/handoff-template.md', 'docs/handoff.md');

const fontRow =
  fontMode === 'system'
    ? '- [x] Fonts: system stack wired by init-client (astro.config.ts fonts: [], src/fonts.ts empty, brand.fonts.* system stacks)'
    : '- [ ] Fonts: add the family to astro.config.ts fonts, list its cssVariable in src/fonts.ts, point brand.fonts.* at it';

const checklist = `# ${name} reinit checklist

Generated by \`npm run init-client\`. Tick items as you complete them. The B4
verification pass reads this file. Canonical explained version: SETUP.md step B1c / B1d.

## Brand and assets

- [ ] src/brand.ts: secondary / accent / text / background colours (design phase)
- [ ] src/brand.ts tokens: 5 structural knobs (radius / button / section / shadow / container) set for the client; preview at /dev/tokens
${fontRow}
- [ ] src/navigation.ts: real header / footer nav (currently a placeholder)
- [ ] Logos and assets: replace public/ and src/assets/images/ files; regenerate src/assets/favicons/ (favicon.ico a valid multi-size container); replace src/assets/images/default.png (OG image)
- [ ] OG images: replace the placeholder titles and descriptions in src/pages/og/[...route].ts (source: docs/intake.md), then open /og/home.png (npm run dev) and confirm it renders with the client's brand colour
- [ ] src/brand.ts brand.logo.image / brand.logo.alt set (uncomment the import at the top); set brand.logo.ogPath to the project-root-relative raster path, such as ./src/assets/images/logo.png, for generated OG cards
- [ ] public/robots.txt, public/_headers checked
- [ ] Blog: apps.blog.isEnabled left false unless the client wants one
- [ ] Blog: if apps.blog.isEnabled is turned on, replace src/data/post/example-post.mdx
- [ ] src/schema.ts: address / phone / hours filled if the client is a local business
- [ ] ui.theme in src/config.yaml if the client wants a fixed light / dark mode
- [ ] Content pages: src/pages/{index,about,services,pricing,contact}.astro carry neutral starter copy; replace each block marked <!-- REPLACE --> during the build (source: docs/intake.md)
- [ ] src/content/{services,team,testimonials,faqs}.yaml: replace or empty ([]) the seed entries

## Quality routes and visual regression

- [ ] Populate quality-routes.json with every public and intentional noindex page. Development routes are not allowed in a client repo. Do this first, before other Build work; CI stays red until it is done (the validator throws on an empty manifest).
- [ ] Run npm run build and npm run test:routes, then npm run screenshot. Inspect desktop and mobile captures and commit approved baselines.
- [ ] Run npm run verify and save the rubric and cited evidence under docs/reviews/YYYY-MM-DD-<slug>/review.md.

## Analytics (SETUP.md B1d)

- [ ] GA4 Measurement ID set in src/config.yaml analytics.vendors.googleAnalytics.id
- [ ] EU / GDPR: requireConsent: true, adapt src/components/client/CookieConsent.astro, render it from src/components/client/GlobalEmbeds.astro
`;

if (await exists('docs/reinit-checklist.md')) {
  console.warn('  ! docs/reinit-checklist.md already exists (skipped)');
} else {
  await writeFile('docs/reinit-checklist.md', checklist);
  console.log('  wrote docs/reinit-checklist.md');
}

if (dropExamples.toLowerCase() === 'y') {
  await rm('src/pages/_examples', { recursive: true, force: true });
  console.log('  removed src/pages/_examples/');
}

// Template-maintenance files that make no sense in a client deliverable repo: the
// golden visual-regression baseline (screenshots of the template's own demo pages),
// this template's internal planning docs, and its session history. A `git clone` of
// the template carries them across; strip them so the client repo starts clean.
// The `.template-repo` marker is dropped too, which activates the core-edit guard in the client repo.
for (const path of [
  'src/pages/dev',
  'golden-baselines',
  'golden-baselines-diff',
  'docs/superpowers',
  'docs/retrospectives',
  'docs/intake-template.md',
  'docs/handoff-template.md',
  '.claude/session-summaries',
  'SETUP.v1.md',
  '.template-repo',
]) {
  await rm(path, { recursive: true, force: true });
}
await mkdir('golden-baselines', { recursive: true });
await writeFile('quality-routes.json', '[]\n');
console.log('  initialized empty client quality manifest and baseline directory');
console.log('  removed template-maintenance files (golden baseline, internal docs, session history)');

console.log(`
Done. Still to do by hand:

  - Logos: replace files in public/ and src/assets/images/ (incl. favicons, default.png OG image)
  - Fonts: ${
    fontMode === 'system'
      ? 'system stack wired (astro.config.ts fonts: [], src/fonts.ts empty, brand.fonts.* system stacks). If headings need a distinct face, set brand.fonts.heading and add an h1..h6 { font-family: var(--font-heading) } base rule in src/assets/styles/tailwind.css.'
      : 'custom typeface: add the family to astro.config.ts fonts, list its cssVariable in src/fonts.ts, point brand.fonts.* at it (see SETUP.md B1c).'
  }
  - Colors: set secondary / accent / text / background in src/brand.ts (design phase)
  - Navigation: src/navigation.ts is a placeholder
  - Page content: src/pages/{index,about,services,pricing,contact}.astro still hold demo content
  - Legal: read src/pages/terms.md and src/pages/privacy.md, get them reviewed for ${jurisdiction || 'the client jurisdiction'}
  - Schema: fill src/schema.ts if the client is a local business (address, phone, hours)
  - Blog: set apps.blog.isEnabled: true in src/config.yaml if wanted${email ? '' : '\n  - Contact email was left blank; fill {{CONTACT_EMAIL}} in the legal pages'}
  - Docs: docs/intake.md and docs/handoff.md scaffolded, fill them in. docs/go-live.md is the launch runbook (no per-client edits).
  - Checklist: work through docs/reinit-checklist.md and tick items as you go

Then: npm run check
`);
