// Lists every data-todo (TODO(client) placeholder) in the built HTML.
// Usage: node scripts/check-todos.mjs [dir]   (default: dist)
// Exit 1 when any are found and LAUNCH=1 is set, 0 otherwise.
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.argv[2] ?? fileURLToPath(new URL('../dist/', import.meta.url));

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(path);
    else if (entry.name.endsWith('.html')) yield path;
  }
}

// Minified HTML may leave the value unquoted.
const attr = /data-todo=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
const found = [];
for await (const file of htmlFiles(root)) {
  const html = await readFile(file, 'utf8');
  for (const m of html.matchAll(attr)) found.push({ file: relative(root, file), label: m[1] ?? m[2] ?? m[3] });
}

for (const { file, label } of found) console.log(`${file}: ${label}`);
const launch = process.env.LAUNCH === '1';
if (!found.length) console.log('No data-todo left.');
else if (launch) console.error(`LAUNCH=1: ${found.length} data-todo placeholder(s) left in ${root}.`);
else console.log(`${found.length} data-todo placeholder(s). Set LAUNCH=1 to fail on them.`);
process.exit(found.length && launch ? 1 : 0);
