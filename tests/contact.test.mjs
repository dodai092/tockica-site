import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { pathFor } from '../src/i18n/index.ts';

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');
const pages = [
  { lang: 'hr', file: 'dist/kontakt/index.html', h1: 'Kontakt' },
  { lang: 'en', file: 'dist/en/contact/index.html', h1: 'Contact' },
];
const noindex = /<meta[^>]*(?:name="robots"[^>]*content="[^"]*noindex|content="[^"]*noindex[^"]*"[^>]*name="robots")/;

for (const { lang, file, h1 } of pages) {
  test(`${lang}: contact page is indexable with an h1`, async () => {
    const html = await read(file);
    assert.ok(!noindex.test(html));
    assert.match(html, new RegExp(`<h1[^>]*>${h1}</h1>`));
  });

  test(`${lang}: address, e-mail and hours from Dunia ship, phone stays an open placeholder`, async () => {
    const html = await read(file);
    assert.ok(/data-todo="[^"]*phone[^"]*"/.test(html), 'phone placeholder missing');
    for (const fact of ['Ulica Ferde Rusana 8', 'info@tockicanai.hr', '17:00-20:00'])
      assert.ok(html.includes(fact), fact);
    for (const secret of ['Bauera', 'Rusanova', '865 1335'])
      assert.ok(!html.includes(secret), `${secret} must not ship until Dunia confirms`);
  });

  test(`${lang}: message form follows docs/forms.md`, async () => {
    const html = await read(file);
    const form = html.match(/<form\b[\s\S]*?<\/form>/)?.[0];
    assert.ok(form, 'no form');
    assert.match(form, /name="contact-message"/);
    assert.match(form, /data-netlify="true"/);
    assert.match(form, /netlify-honeypot="bot-field"/);
    assert.match(form, /<input[^>]*name="form-name"[^>]*value="contact-message"/);
    assert.match(form, /<input[^>]*name="bot-field"/);
    assert.match(form, new RegExp(`action="${pathFor('thanks', lang)}"`));
    const consent = form.match(/<input[^>]*type="checkbox"[^>]*>/)?.[0];
    assert.ok(consent && /\brequired\b/.test(consent), 'consent checkbox must be required');
    assert.ok(form.includes(`href="${pathFor('privacy', lang)}"`));
    for (const field of ['name', 'email', 'message'])
      assert.match(form, new RegExp(`name="${field}"[^>]*required|required[^>]*name="${field}"`));
  });

  test(`${lang}: form ids do not collide with the sculpt form`, async () => {
    const html = await read(file);
    assert.ok(!/id="sculpt-/.test(html));
  });
}
