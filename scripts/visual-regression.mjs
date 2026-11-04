import pixelmatch from 'pixelmatch';
import pngjs from 'pngjs';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const { PNG } = pngjs;

export async function checkAgainstBaselines({ shots, baselinesDir, diffDir, maxDiffPixels }) {
  let changed = 0;
  await rm(diffDir, { recursive: true, force: true });
  for (const shot of shots) {
    const baselinePath = path.join(baselinesDir, shot.slug, shot.fileName);
    if (!existsSync(baselinePath)) {
      console.error(`  ! ${shot.slug}/${shot.fileName}: no baseline (run "npm run screenshot" first)`);
      await mkdir(path.join(diffDir, shot.slug), { recursive: true });
      await writeFile(path.join(diffDir, shot.slug, shot.fileName), shot.buffer);
      changed++;
      continue;
    }
    const baseline = PNG.sync.read(await readFile(baselinePath));
    const current = PNG.sync.read(shot.buffer);
    if (baseline.width !== current.width || baseline.height !== current.height) {
      console.error(
        `  ! ${shot.slug}/${shot.fileName}: size changed (${baseline.width}x${baseline.height} -> ${current.width}x${current.height})`
      );
      await mkdir(path.join(diffDir, shot.slug), { recursive: true });
      await writeFile(path.join(diffDir, shot.slug, shot.fileName), shot.buffer);
      changed++;
      continue;
    }
    const diff = new PNG({ width: baseline.width, height: baseline.height });
    const diffPixels = pixelmatch(baseline.data, current.data, diff.data, baseline.width, baseline.height, {
      threshold: 0.1,
    });
    if (diffPixels > maxDiffPixels) {
      console.error(`  ! ${shot.slug}/${shot.fileName}: ${diffPixels} px differ`);
      await mkdir(path.join(diffDir, shot.slug), { recursive: true });
      await writeFile(path.join(diffDir, shot.slug, shot.fileName), PNG.sync.write(diff));
      changed++;
    } else {
      console.log(`  - ${shot.slug}/${shot.fileName}`);
    }
  }
  return changed;
}
