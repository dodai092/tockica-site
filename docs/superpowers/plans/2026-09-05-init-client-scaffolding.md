# init-client scaffolding + string-match guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `npm run init-client` scaffold the client working docs, prompt for font mode, emit a tracked reinit checklist, and guard its own verbatim doc matches against silent drift.

**Architecture:** All behaviour lives in `scripts/init-client.mjs`. Its scattered inline `replaceInFile` literals are collected into one `REPLACEMENTS` array that both the apply loop and a new `--check` mode read. `--check` (gated on the `.template-repo` marker, wired into `npm run check`) asserts every `from` literal still exists in its target file. A font-mode prompt drives conditional entries and file writes. Two template docs are copied to their working names and a checklist file is generated.

**Tech Stack:** Node 22 ESM script, `node:fs/promises`, `node:readline`. No test framework in the repo; verification is a scratchpad dry run plus `npm run check` / `npm run build`.

**Spec:** `docs/superpowers/specs/2026-09-05-init-client-scaffolding-design.md`

## Global Constraints

- No em dashes in any authored text (script output, docs, comments, commit messages). Use a period, comma, or "and"/"so".
- Never edit template core: `src/layouts/`, `src/utils/`, `src/components/{ui,common,blog}/`, `vendor/`, the config system. This plan touches `scripts/`, `docs/`, `SETUP.md`, `CONTEXT.md`, `astro.config.ts` string literals inside the script only, `package.json` scripts. `src/brand.ts` and `src/fonts.ts` are the per-client brand surface, not core; the script already edits `src/brand.ts`.
- Analytics vendor is GA4. Settled. Do not add or mention alternatives.
- `docs/go-live.md` is a fixed launch runbook, not a per-client fill-in. Do not copy or templatize it.
- Font-mode default is `system`. Blank / unrecognised answer resolves to `system`.
- Follow `/karpathy`: simplest change that satisfies the spec, touch only what the task names, verify against the stated check.
- Every `REPLACEMENTS` `from` literal must be an exact substring of its target file as the file stands after this plan. `npm run check` enforces this once Task 1 lands.
- Run `npm run fix:prettier` on any Markdown / JS you create or edit before committing; `npm run check` runs `prettier --check`.
- Dry-run harness: every verify step below reads `git worktree add --detach /tmp/ic-tN HEAD && cd /tmp/ic-tN && npm install --silent`. That sees only committed state, so it would test pre-change code. Replace that line, in every verify step, with: `rm -rf /tmp/ic-tN && rsync -a --exclude=.git --exclude=node_modules --exclude=.superpowers --exclude=dist ./ /tmp/ic-tN/ && ln -s "$PWD/node_modules" /tmp/ic-tN/node_modules && cd /tmp/ic-tN` (keep the same `/tmp/ic-tN` name the step uses). This copies the live working tree including uncommitted task changes and the `.template-repo` marker. Replace the paired `cd - && git worktree remove --force /tmp/ic-tN` cleanup with `cd - && rm -rf /tmp/ic-tN`. Verify before you commit.
- On a second `init-client` run in the same tree, the first prompt is `package.json name is already "<slug>". Run init again anyway? (y/N)`; a re-run dry test must pipe `y` as its first input line before the normal answers.

---

### Task 1: REPLACEMENTS table, `--check` mode, npm wiring

Pure refactor plus a new no-op-in-client-repo check. No change to what a normal
`init-client` run produces (byte-identical output on the template working tree). This
task lands first because it is the safety net the later tasks rely on.

**Files:**

- Modify: `scripts/init-client.mjs`
- Modify: `package.json` (scripts block only)

**Interfaces:**

- Consumes: nothing from other tasks.
- Produces:
  - `const REPLACEMENTS`: an array of `{ file: string, from: string, to: (ctx) => string | string, when?: (ctx) => boolean }`. `ctx` is the answers object (see below). Later tasks add entries.
  - `ctx` object shape passed to `to` / `when`: `{ name, slug, domain, siteUrl, siteDomainText, entity, email, jurisdiction, rgb, today, fontMode }`. `fontMode` is `'custom'` until Task 2; every field is a plain string except `rgb` (string or `null`).
  - `applyReplacements(ctx)` groups `REPLACEMENTS` by file, reads each file once, for each entry whose `when` is absent or returns true does `text.split(from).join(resolve(to, ctx))`, warns `! "<from slice>" not found in <file> (skipped)` on a miss, writes the file once.
  - `runCheck()` is async and, returns exit code. If `.template-repo` is absent: prints `init-client --check: not a template repo, nothing to check` and returns 0. Else reads each distinct `file` once, asserts `text.includes(entry.from)` for every entry (ignoring `when`), prints each miss as `  MISS <file>: "<first 60 chars of from>..."`, prints `init-client --check: N/N matches present` on success. Returns 1 if any miss, else 0.

- [ ] **Step 1: Read the current file top to bottom**

Read `scripts/init-client.mjs` fully. Note every `replaceInFile(path, [...])` call: `package.json` (2 pairs), `src/config.yaml` (9 pairs), `src/brand.ts` (1 conditional pair, only when `rgb`), `src/pages/terms.md` + `src/pages/privacy.md` (share `legalPairs`), `CLAUDE.md` (1 pair), `AGENTS.md` (2 pairs), `CONTEXT.md` (1 pair), `SETUP.md` (1 pair).

- [ ] **Step 2: Add the `--check` short-circuit and the `exists` helper**

Near the top of the file, after the imports, add:

```js
import { readFile, writeFile, rm, copyFile, stat } from 'node:fs/promises';
```

(extend the existing import, it currently pulls `readFile, writeFile, rm`).

Add a helper next to `slugify`:

```js
const exists = async (p) => {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
};
```

- [ ] **Step 3: Build the `REPLACEMENTS` array**

Place it after the helper functions and before the `// --- gather every answer first` comment. Convert every `replaceInFile` pair to an entry. `to` is a function of `ctx` for anything that interpolates an answer, a plain string otherwise. Keep the `from` literals character-identical to what is in the file today. Example shape (fill in all entries):

```js
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
  // CLAUDE.md, AGENTS.md (2), CONTEXT.md, SETUP.md: copy the exact multi-line
  // `from` / `to` strings from the current replaceInFile calls. `to` strings that
  // interpolate `${name}` become `(c) => \`...${c.name}...\``.
];
```

Do NOT move the `legalPairs` block or the terms/privacy calls into `REPLACEMENTS`: those match `{{PLACEHOLDER}}` tokens, not prose, and are not the drift risk this guards. Leave them as `replaceInFile` calls.

- [ ] **Step 4: Add `applyReplacements` and replace the call sites**

Add:

```js
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
```

In the file-editing section, delete the `replaceInFile` calls for `package.json`,
`src/config.yaml`, `src/brand.ts` (the `rgb` one), `CLAUDE.md`, `AGENTS.md`, `CONTEXT.md`,
`SETUP.md`. Replace them with a single `await applyReplacements(ctx);` where `ctx` is
assembled from the already-gathered answers:

```js
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
  fontMode: 'custom',
};
```

Keep `replaceInFile` in the file for the legal pages. Keep the `if (rgb) ...` warning line
about an invalid hex.

- [ ] **Step 5: Add `runCheck` and the argv short-circuit**

Add `runCheck` per the Interfaces block. Immediately after the imports and helpers, before
any prompting or file reads:

```js
if (process.argv.includes('--check')) {
  process.exit(await runCheck());
}
```

`runCheck`:

```js
const runCheck = async () => {
  if (!(await exists('.template-repo'))) {
    console.log('init-client --check: not a template repo, nothing to check');
    return 0;
  }
  const files = [...new Set(REPLACEMENTS.map((r) => r.file))];
  const cache = new Map();
  for (const f of files) cache.set(f, await readFile(f, 'utf8'));
  const misses = REPLACEMENTS.filter((r) => !cache.get(r.file).includes(r.from));
  for (const m of misses) console.error(`  MISS ${m.file}: "${m.from.slice(0, 60)}..."`);
  console.log(`init-client --check: ${REPLACEMENTS.length - misses.length}/${REPLACEMENTS.length} matches present`);
  return misses.length ? 1 : 0;
};
```

- [ ] **Step 6: Wire `check:init` into npm**

In `package.json` scripts, add after `check:prettier`:

```json
"check:init": "node scripts/init-client.mjs --check",
```

and change `check` to:

```json
"check": "npm run check:astro && npm run check:eslint && npm run check:prettier && npm run check:init",
```

- [ ] **Step 7: Verify the check passes clean**

Run: `npm run check:init`
Expected: `init-client --check: 20/20 matches present` (count may differ; must equal total and exit 0).

Run: `npm run check`
Expected: all four sub-checks pass.

- [ ] **Step 8: Verify a normal init run is unchanged**

```bash
rm -rf /tmp/ic-t1 && git worktree add --detach /tmp/ic-t1 HEAD && cd /tmp/ic-t1 && npm install --silent
printf 'Acme Co\nacme.test\n\nhi@acme.test\nCroatia\n#2244cc\nn\n' | npm run init-client
git --no-pager diff --stat
```

Expected: `package.json`, `src/config.yaml`, `src/brand.ts`, `src/pages/terms.md`,
`src/pages/privacy.md`, `README.md`, `CLAUDE.md`, `AGENTS.md`, `CONTEXT.md`, `SETUP.md`
modified. Inspect `git diff CLAUDE.md src/config.yaml`: identical to what the pre-refactor
script produced (compare against `git stash` / a second worktree at the parent commit if
unsure). Then:

```bash
npm run check && npm run build
cd - && git worktree remove --force /tmp/ic-t1
```

Expected: both pass.

- [ ] **Step 9: Prove the guard catches drift**

```bash
node scripts/init-client.mjs --check   # exit 0
# temporarily break one match:
perl -pi -e 's/  name: AstroWind/  name: AstroWindX/' src/config.yaml
node scripts/init-client.mjs --check ; echo "exit=$?"
git checkout src/config.yaml
```

Expected: second run prints `MISS src/config.yaml: "  name: AstroWind..."` and `exit=1`.

- [ ] **Step 10: Commit**

```bash
npm run fix:prettier
git add scripts/init-client.mjs package.json
git commit -m "refactor: single REPLACEMENTS table + init-client --check guard

Collects every verbatim doc/config match init-client makes into one array
that both the apply loop and a new --check mode read. --check asserts each
from-literal still exists in its target file, gated on .template-repo so it
no-ops in client repos, wired into npm run check. No change to normal run output.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Font-mode prompt and conditional font wiring

**Files:**

- Modify: `scripts/init-client.mjs`

**Interfaces:**

- Consumes: `REPLACEMENTS`, `ctx`, `applyReplacements` from Task 1.
- Produces:
  - `ctx.fontMode`: `'system'` or `'custom'`, from the new prompt (was hardcoded `'custom'` in Task 1).
  - Three new `REPLACEMENTS` entries with `when: (c) => c.fontMode === 'system'`:
    - `src/fonts.ts`: `export const preloadFonts: string[] = ['--font-inter'];` -> `export const preloadFonts: string[] = [];`
    - `astro.config.ts`: the `fonts: [ ... ],` block -> `fonts: [],`
    - `src/brand.ts`: the `fonts: { ... },` block -> system-stack version
  - `ctx.fontMode` is consumed by Task 3 (checklist font row).

- [ ] **Step 1: Add the prompt**

In the answer-gathering block, immediately after the `colorInput` prompt and before
`dropExamples`:

```js
const fontModeInput = await ask('Custom web font or system stack? (custom/system)', 'system');
const fontMode = fontModeInput.toLowerCase() === 'custom' ? 'custom' : 'system';
```

Set `fontMode` in `ctx` to this value instead of the literal `'custom'` from Task 1.

- [ ] **Step 2: Add the three conditional REPLACEMENTS entries**

Append to `REPLACEMENTS`:

```js
{
  file: 'src/fonts.ts',
  from: "export const preloadFonts: string[] = ['--font-inter'];",
  to: 'export const preloadFonts: string[] = [];',
  when: (c) => c.fontMode === 'system',
},
{
  file: 'astro.config.ts',
  from: `  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Inter',
      cssVariable: '--font-inter',
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
    sans: 'var(--font-inter)',
    serif: 'var(--font-inter)',
    heading: 'var(--font-inter)',
  },`,
  to: `  fonts: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },`,
  when: (c) => c.fontMode === 'system',
},
```

Before writing the `from` strings, open `astro.config.ts` and `src/brand.ts` and copy the
blocks verbatim (indentation, quote style, trailing comma). If either differs from the
above, the file wins; update the `from` to match.

- [ ] **Step 3: Update the end-of-run "Fonts" hint**

In the closing `console.log`, the Fonts bullet currently describes both paths. Replace it
with a line that reflects what the script just did:

```js
  - Fonts: ${
    fontMode === 'system'
      ? 'system stack wired (astro.config.ts fonts: [], src/fonts.ts empty, brand.fonts.* system stacks). If headings need a distinct face, set brand.fonts.heading and add an h1..h6 { font-family: var(--font-heading) } rule in src/components/CustomStyles.astro base layer.'
      : 'custom typeface: add the family to astro.config.ts fonts, list its cssVariable in src/fonts.ts, point brand.fonts.* at it (see SETUP.md B1c).'
  }
```

- [ ] **Step 4: Verify `--check` still clean**

Run: `npm run check:init`
Expected: `23/23 matches present`, exit 0. (The three new `from` literals must all be
present in the pristine template.)

- [ ] **Step 5: Verify system mode end to end**

```bash
rm -rf /tmp/ic-t2 && git worktree add --detach /tmp/ic-t2 HEAD && cd /tmp/ic-t2 && npm install --silent
printf 'Acme Co\nacme.test\n\nhi@acme.test\nCroatia\n\nsystem\nn\n' | npm run init-client
grep -n 'fonts: \[\]' astro.config.ts
grep -n 'preloadFonts: string\[\] = \[\]' src/fonts.ts
grep -n 'BlinkMacSystemFont' src/brand.ts
npm run check && npm run build
cd - && git worktree remove --force /tmp/ic-t2
```

Expected: all three greps hit; check and build pass.

- [ ] **Step 6: Verify custom mode leaves fonts untouched**

```bash
rm -rf /tmp/ic-t2c && git worktree add --detach /tmp/ic-t2c HEAD && cd /tmp/ic-t2c && npm install --silent
printf 'Acme Co\nacme.test\n\nhi@acme.test\nCroatia\n\ncustom\nn\n' | npm run init-client
git --no-pager diff --stat astro.config.ts src/fonts.ts
git --no-pager diff src/brand.ts | grep -c 'font-inter'   # unchanged fonts block still present
npm run check && npm run build
cd - && git worktree remove --force /tmp/ic-t2c
```

Expected: `astro.config.ts` and `src/fonts.ts` show no diff; `src/brand.ts` fonts block
still references `--font-inter`; check and build pass.

- [ ] **Step 7: Commit**

```bash
npm run fix:prettier
git add scripts/init-client.mjs
git commit -m "feat: init-client font-mode prompt (default system)

Adds a custom/system prompt. System mode wires the system stack end to end:
astro.config.ts fonts: [], empty src/fonts.ts preload list, system stacks in
src/brand.ts. Custom mode is unchanged from today. Guarded by --check.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Scaffold working docs and emit the reinit checklist

**Files:**

- Modify: `scripts/init-client.mjs`
- Modify: `SETUP.md:169` (one sentence under B1c)

**Interfaces:**

- Consumes: `ctx` (needs `ctx.name`, `ctx.jurisdiction`, `ctx.fontMode`), `exists` helper, `copyFile` import from Task 1.
- Produces: after a run, `docs/intake.md`, `docs/handoff.md`, `docs/reinit-checklist.md` exist in the working tree.

- [ ] **Step 1: Add the doc-scaffold block**

In the file-editing section, after the `README.md` write and before the
`_examples` removal, add:

```js
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
```

- [ ] **Step 2: Add the checklist emitter**

Right after the scaffold calls:

```js
const fontRow =
  fontMode === 'system'
    ? '- [x] Fonts: system stack wired by init-client (astro.config.ts fonts: [], src/fonts.ts empty, brand.fonts.* system stacks)'
    : '- [ ] Fonts: add the family to astro.config.ts fonts, list its cssVariable in src/fonts.ts, point brand.fonts.* at it';

const checklist = `# ${name} reinit checklist

Generated by \`npm run init-client\`. Tick items as you complete them. The B4
verification pass reads this file. Canonical explained version: SETUP.md step B1c / B1d.

## Brand and assets

- [ ] src/brand.ts: secondary / accent / text / background colours (design phase)
${fontRow}
- [ ] src/navigation.ts: real header / footer nav (currently a placeholder)
- [ ] Logos and assets: replace public/ and src/assets/images/ files; regenerate src/assets/favicons/ (favicon.ico a valid multi-size container); replace src/assets/images/default.png (OG image)
- [ ] src/brand.ts logo.image / logo.alt set (uncomment the import at the top)
- [ ] public/robots.txt, public/_headers checked
- [ ] Blog: apps.blog.isEnabled left false unless the client wants one
- [ ] src/schema.ts: address / phone / hours filled if the client is a local business
- [ ] ui.theme in src/config.yaml if the client wants a fixed light / dark mode

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
```

Note `${name}` is in scope here (top-level `const name`). `jurisdiction` is not
interpolated in the checklist; drop it from the Interfaces "needs" if unused after you
write this. Keep it simple: no jurisdiction line unless it earns its place.

- [ ] **Step 3: Update the end-of-run Docs line**

In the closing `console.log`, replace:

```
  - Docs: work through docs/intake-template.md, docs/go-live.md, docs/handoff-template.md
```

with:

```
  - Docs: docs/intake.md and docs/handoff.md scaffolded, fill them in. docs/go-live.md is the launch runbook (no per-client edits).
  - Checklist: work through docs/reinit-checklist.md and tick items as you go
```

- [ ] **Step 4: Add the SETUP.md B1c sentence**

In `SETUP.md`, directly under the `#### B1c. Manual brand and asset checklist` heading
(before the first `- [ ]` line), add a blank line then:

```
`init-client` emits this list as `docs/reinit-checklist.md`; tick items there as you go.
This section stays the explained canonical version.
```

- [ ] **Step 5: Verify**

```bash
rm -rf /tmp/ic-t3 && git worktree add --detach /tmp/ic-t3 HEAD && cd /tmp/ic-t3 && npm install --silent
printf 'Acme Co\nacme.test\n\nhi@acme.test\nCroatia\n\nsystem\nn\n' | npm run init-client
test -f docs/intake.md && test -f docs/handoff.md && test -f docs/reinit-checklist.md && echo "docs ok"
grep -n 'Fonts: system stack wired by init-client' docs/reinit-checklist.md
head -1 docs/reinit-checklist.md   # "# Acme Co reinit checklist"
# re-run guard: second run must not clobber (first 'y' answers the "run again?" prompt)
printf 'y\nAcme Co\nacme.test\n\nhi@acme.test\nCroatia\n\nsystem\nn\n' | npm run init-client 2>&1 | grep 'already exists'
npm run check && npm run build
cd - && git worktree remove --force /tmp/ic-t3
```

Expected: `docs ok`; the system font row grep hits; header line shows the client name;
the re-run prints `already exists` for all three docs; check and build pass.

- [ ] **Step 6: Verify custom mode checklist row**

```bash
rm -rf /tmp/ic-t3c && git worktree add --detach /tmp/ic-t3c HEAD && cd /tmp/ic-t3c && npm install --silent
printf 'Acme Co\nacme.test\n\nhi@acme.test\nCroatia\n\ncustom\nn\n' | npm run init-client
grep -n '\- \[ \] Fonts: add the family' docs/reinit-checklist.md
cd - && git worktree remove --force /tmp/ic-t3c
```

Expected: the unticked custom font row is present.

- [ ] **Step 7: Commit**

```bash
npm run fix:prettier
git add scripts/init-client.mjs SETUP.md
git commit -m "feat: init-client scaffolds working docs and emits reinit checklist

Copies docs/intake-template.md and docs/handoff-template.md to their working
names, writes docs/reinit-checklist.md from B1c/B1d with the font row reflecting
the chosen mode. All three skip-and-warn if already present. SETUP.md B1c points
at the generated file.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: CONTEXT.md pointer fix and ADR 0003

**Files:**

- Modify: `scripts/init-client.mjs` (one `REPLACEMENTS` entry)
- Create: `docs/adr/0003-init-client-scaffolding-and-string-guard.md`

**Interfaces:**

- Consumes: `REPLACEMENTS` from Task 1.
- Produces: nothing consumed downstream.

- [ ] **Step 1: Add the CONTEXT.md REPLACEMENTS entry**

Append to `REPLACEMENTS`:

```js
{
  file: 'CONTEXT.md',
  from: '- [SETUP.md](./SETUP.md), the per-client build workflow (Discovery, Build, Launch)',
  to: '- [SETUP.md](./SETUP.md), the build reference kept from the template',
},
```

Confirm the `from` line exists verbatim in `CONTEXT.md` (currently line 46, under
`## Related docs`). There is already a `CONTEXT.md` entry in `REPLACEMENTS` (the glossary
intro from Task 1); this is a second entry for the same file, which `applyReplacements`
handles (it groups by file).

- [ ] **Step 2: Verify check and a run**

```bash
npm run check:init            # count goes up by 1, exit 0
rm -rf /tmp/ic-t4 && git worktree add --detach /tmp/ic-t4 HEAD && cd /tmp/ic-t4 && npm install --silent
printf 'Acme Co\nacme.test\n\nhi@acme.test\nCroatia\n\nsystem\nn\n' | npm run init-client
grep -n 'build reference kept from the template' CONTEXT.md
grep -c 'per-client build workflow (Discovery, Build, Launch)' CONTEXT.md   # 0
cd - && git worktree remove --force /tmp/ic-t4
```

Expected: check passes; after a run CONTEXT.md shows the new line and not the old one.

- [ ] **Step 3: Write ADR 0003**

Create `docs/adr/0003-init-client-scaffolding-and-string-guard.md`. Match the house style
of `0001` and `0002` (title as `# N. <sentence>`, `Date:`, `## Status`, `## Context`,
`## Decision`, `## Consequences`). Status: `Accepted (2026-09-05). Implemented in the same
change.` Content to cover:

- Context: after `init-client`, B1c was an untracked manual checklist and the operator
  hand-copied three doc templates; separately the self-identity string matches broke once
  (commit `3a08f2d`) when SETUP.md was reworded and `replaceInFile` only warns.
- Decision:
  - Font-mode prompt, default `system`. Extends ADR 0002 item 1 (which documented the
    system-font path) by making it the enter-key default. Rationale: matches the `[default]`
    convention, keeps piped runs working, the do-nothing path ships no fetched web font.
  - `docs/go-live.md` deliberately not copied or templatized: it is a fixed launch
    runbook, not a per-client fill-in.
  - `REPLACEMENTS` table as the single source of truth for every verbatim match, plus
    `node scripts/init-client.mjs --check` (gated on `.template-repo`, wired into
    `npm run check`) asserting each `from` still exists. This is the guard against silent
    match drift.
  - `docs/reinit-checklist.md` is the tracked B4 input; SETUP.md B1c stays the canonical
    explained version, kept in sync by hand.
- Consequences:
  - Any future doc reword near a matched string fails `npm run check` until the
    `REPLACEMENTS` literal is updated in the same commit.
  - `init-client.mjs` is now the one place its verbatim matches live.
  - A fresh fork after `init-client` has its working docs and checklist in place with no
    manual copying.

- [ ] **Step 4: Commit**

```bash
npm run fix:prettier
git add scripts/init-client.mjs docs/adr/0003-init-client-scaffolding-and-string-guard.md
git commit -m "docs: ADR 0003 + fix CONTEXT.md SETUP pointer in client repos

init-client now rewrites CONTEXT.md's Related-docs SETUP.md line the same way
it already rewrites the CLAUDE.md and AGENTS.md pointers. ADR 0003 records the
scaffolding, font-mode default, and the --check guard.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Full-workflow verification

No code. One clean end-to-end pass plus the gaps-doc update.

**Files:**

- Modify: `docs/superpowers/specs/2026-09-05-post-setup-rewrite-gaps.md` (mark Gap C done)

- [ ] **Step 1: Clean-room system-mode run**

```bash
rm -rf /tmp/ic-final && git worktree add --detach /tmp/ic-final HEAD && cd /tmp/ic-final && npm install --silent
printf 'Vinalia Two\nvinalia-two.test\nVinalia Two d.o.o.\nhi@vinalia-two.test\nCroatia\n#8a1f2b\nsystem\ny\n' | npm run init-client
test -f docs/intake.md && test -f docs/handoff.md && test -f docs/reinit-checklist.md && echo "docs ok"
grep -q 'fonts: \[\]' astro.config.ts && echo "astro ok"
grep -q 'preloadFonts: string\[\] = \[\]' src/fonts.ts && echo "fonts.ts ok"
grep -q 'Vinalia Two reinit checklist' docs/reinit-checklist.md && echo "checklist named ok"
grep -q 'build reference kept from the template' CONTEXT.md && echo "context ok"
test ! -d src/pages/_examples && echo "examples dropped ok"
npm run check && npm run build && npm run test:links
cd - && git worktree remove --force /tmp/ic-final
```

Expected: every echo prints; `check`, `build`, `test:links` all pass.

- [ ] **Step 2: Guard regression check on the real repo**

```bash
node scripts/init-client.mjs --check                       # exit 0, "N/N matches present"
perl -0pi -e 's/  name: AstroWind\n/  name: AstroWindZ\n/' src/config.yaml
node scripts/init-client.mjs --check ; echo "exit=$?"       # MISS line, exit=1
git checkout src/config.yaml
npm run check:init                                          # exit 0 again
```

- [ ] **Step 3: Mark Gap C done in the gaps doc**

In `docs/superpowers/specs/2026-09-05-post-setup-rewrite-gaps.md`, under the Gap C heading,
add a `**DONE 2026-09-05.**` paragraph mirroring the Gap B one: font-mode prompt (default
system), `docs/intake.md` / `docs/handoff.md` scaffolded, `docs/reinit-checklist.md`
emitted, `REPLACEMENTS` table + `init-client --check` in `npm run check`, CONTEXT.md
pointer fixed, ADR 0003. Reference the plan and spec paths.

- [ ] **Step 4: Commit**

```bash
npm run fix:prettier
git add docs/superpowers/specs/2026-09-05-post-setup-rewrite-gaps.md
git commit -m "docs: mark Gap C done in the post-setup-rewrite-gaps spec

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**

- Spec §1 font-mode prompt -> Task 2. Default system, blank resolves to system, both file-write paths, checklist row. Covered.
- Spec §2 scaffold working docs -> Task 3 steps 1, 3. go-live.md not copied (Global Constraints + Task 3 does not touch it). Covered.
- Spec §3 reinit-checklist.md -> Task 3 step 2, SETUP.md sentence step 4. Covered.
- Spec §4 REPLACEMENTS + --check -> Task 1. Restructure, `--check`, `.template-repo` gate, npm wiring, conditional entries still checked. Covered.
- Spec §5 CONTEXT.md pointer -> Task 4 step 1. Covered.
- Spec §6 ADR 0003 -> Task 4 step 3. Covered.
- Spec §7 verification -> per-task verify steps + Task 5. Covered.
- Spec success criteria -> Task 5 step 1 asserts each one.

**Placeholder scan:** ADR 0003 body (Task 4 step 3) is described as bullet points to cover, not verbatim prose. Acceptable: ADR wording is judgement work and the points are specific. Checklist and code blocks are literal. `from` literals for `astro.config.ts` / `src/brand.ts` carry a "copy verbatim from the file, the file wins" instruction because exact indentation cannot be guaranteed from this document.

**Type consistency:** `ctx` shape defined in Task 1 Interfaces and assembled in Task 1 step 4; `ctx.fontMode` set to `'custom'` in Task 1, reassigned from the prompt in Task 2 step 1. `applyReplacements` / `runCheck` / `resolve` / `exists` / `scaffold` signatures consistent across tasks. `REPLACEMENTS` entry shape (`file`, `from`, `to`, optional `when`) consistent in Tasks 1, 2, 4.

**Ordering:** Task 1 must land first (guard + refactor). Task 2 and 3 both depend on Task 1's `ctx` / `applyReplacements`; 3 also reads `ctx.fontMode` from 2, so run 2 before 3. Task 4 depends on 1. Task 5 last.
