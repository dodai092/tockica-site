# Golden branch workflow

`golden` is a long-lived branch (added in a later phase) holding a real, built
client site plus a small synthetic fixture, used to catch template-core regressions
visually. This doc covers the screenshot tooling on `main` (`scripts/screenshot.mjs`)
and the workflow for using it once `golden` exists. See [client quality gates](quality-gates.md)
section 4 for the baseline policy, lifecycle, and pixel-comparison rules.

## One-time setup

```
npm ci
npx playwright install chromium
```

## Refreshing the baseline

After a change that's meant to change how pages render:

```
npm run build
npm run screenshot
```

Writes one PNG per route, per color scheme (light/dark), per viewport (375/768/1440)
into `golden-baselines/`. Commit the result.

After every refresh, before committing, visually spot-check a couple of the written
screenshots (e.g. open `golden-baselines/home/light-desktop.png` and one tablet or
mobile shot) and confirm they show real page content, not a blank or near-blank image.
Byte-determinism and file counts (below) prove the run was reproducible, they don't
prove the screenshots are correct: a tool bug that renders every intersect-gated
section as fully transparent still produces a deterministic, correctly-counted set of
baselines.

## Checking a change against the baseline

```
npm run build
npm run screenshot:check
```

Exits non-zero if any screenshot differs from `golden-baselines/` by more than a
small pixel tolerance. Diff images go to `golden-baselines-diff/` (gitignored,
inspect locally, never committed, cleared at the start of every check run).

## Testing a template-core change against `golden` (once it exists)

```
git checkout golden
git merge main

# resolve any conflicts per the convention below

npm ci && npx playwright install chromium
npm run build
npm run screenshot:check

# inspect golden-baselines-diff/ for anything unexpected;

# if the change is intended, npm run screenshot to refresh baselines and commit on golden

```

`golden` never merges back into `main`.

### Merge-conflict convention

`golden` overrides several files that template changes on `main` are also likely to
touch: `src/brand.ts`, `src/navigation.ts`, `src/config.yaml`, `src/schema.ts`. When
`git merge main` conflicts on one of these, take golden's version by default
(`git checkout --ours <file>`), then manually re-apply any new keys or structural
additions `main` introduced (a new config key, a new brand token, a new schema field)
using the conflict markers as the checklist of what to check. Never take `main`'s
version wholesale, that silently reverts the client-layer customization the branch
exists to preserve.

## Routes

The route list lives in `quality-routes.json` at the project root. Update it by hand when pages
are added or removed.

## Baseline portability

The committed PNGs are pixel-exact and are only valid for the OS, machine, and exact
Playwright version that produced them. Font rasterization and subpixel anti-aliasing
differ across operating systems and even across Chromium builds, so a baseline
generated on one machine will show spurious diffs on another. Consequences:

- CI cannot check these baselines as-is on a runner with a different OS than the
  machine that generated them, some drift should be expected until CI generates and
  compares against its own baseline set.
- `playwright`, `pixelmatch`, and `pngjs` are pinned to exact versions (no caret) in
  `package.json` for this reason. Any Playwright version bump requires a full baseline
  refresh (`npm run screenshot`), committed on its own, not mixed with unrelated
  changes.

## Storage policy

`golden-baselines/` is committed directly to the repo, no Git LFS. This is simple and
fine as long as refreshes stay infrequent, only after an intentional visual change to
a route, not as a matter of routine. This repo is a template cloned per client, so the
binary weight of every refresh is permanent history for every clone.

If repo size becomes a real problem later, there are two levers, neither implemented
now:

- Move `golden-baselines/` to Git LFS.
- Trim the viewport/scheme matrix, e.g. drop the tablet viewport. It sits between
  mobile and desktop and adds the least unique layout coverage of the three.
