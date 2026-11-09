import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');
const pages = ['dist/index.html', 'dist/en/index.html', 'dist/raspored/index.html', 'dist/en/schedule/index.html'];

for (const file of pages) {
  test(`${file}: mock next classes are marked data-todo so a launch build fails`, async () => {
    const html = await read(file);
    // The homepage shows next-class cards, the schedule page shows the full mock schedule.
    const schedulePage = /raspored|schedule/.test(file);
    assert.ok(schedulePage ? /data-schedule[\s>]/.test(html) : /data-section="?next-classes[^>]*>/.test(html));
    assert.ok(/data-todo="[^"]*(next classes|schedule)[^"]*"/.test(html), 'mock schedule needs a data-todo marker');
  });
}

test('footer links the three real social profiles in both languages, no social placeholder left', async () => {
  for (const file of ['dist/index.html', 'dist/en/index.html']) {
    const html = await read(file);
    for (const url of [
      'https://www.facebook.com/tockicanai',
      'https://www.instagram.com/tockicanai',
      'https://www.tiktok.com/@tockicanai',
    ])
      assert.ok(html.includes(`href=${url}`) || html.includes(`href="${url}"`), `${file}: ${url}`);
    assert.ok(!/data-todo="?(Instagram|Facebook) URL/.test(html), `${file}: social placeholder left`);
  }
});
