import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test, { before, after } from 'node:test';
import { chromium } from 'playwright';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'http://127.0.0.1:4323';
let browser;
let server;
let compiled;

before(async () => {
  const source = await readFile(new URL('../src/components/client/analytics-events.ts', import.meta.url), 'utf8');
  compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  browser = await chromium.launch();
  server = spawn('npx', ['--no-install', 'astro', 'preview', '--host', '127.0.0.1', '--port', '4323'], {
    cwd: root,
    stdio: 'ignore',
    detached: true,
  });
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(origin)).ok) return;
    } catch {
      // The preview is still starting; retry until the deadline.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Production preview did not start at ' + origin);
});

after(async () => {
  if (server?.pid) {
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      // The preview launcher may already have exited.
    }
  }
  spawnSync('npx', ['--no-install', 'astro', 'preview', 'stop'], { cwd: root, stdio: 'ignore', timeout: 10000 });
  await browser?.close();
});

async function fixture(t) {
  const context = await browser.newContext();
  t.after(() => context.close());
  const page = await context.newPage();
  await page.route('https://**/*', (route) => route.abort());
  await page.setContent(
    '<script id="ga-init" data-id="G-TEST" data-consent="required"></script>' +
      '<button id="cta" data-aw-event="cta_click" data-aw-placement="hero" ' +
      'data-aw-label="primary_cta" data-aw-destination-type="internal"><span>Contact</span></button>' +
      '<form id="form" data-aw-event="contact_submit" data-aw-placement="contact_form" ' +
      'data-aw-destination-type="form"><input required name="email">' +
      '<button id="submit">Send</button></form>'
  );
  await page.addScriptTag({
    content:
      '(() => { const exports = {}; ' + compiled + '; window.testInstall = exports.installAnalyticsEvents; })();',
  });
  await page.evaluate(() => {
    window.calls = [];
    window.gtag = (...args) => window.calls.push(args);
    window.consentState = 'granted';
    window.awAnalytics = { status: () => window.consentState };
    window.testInstall(window);
    document.querySelector('form').addEventListener('submit', (event) => event.preventDefault());
  });
  return page;
}

test('grant, unset, denial, revocation, missing API, missing GA and non-consent mode', async (t) => {
  const page = await fixture(t);
  for (const state of ['unset', 'denied', 'granted', 'denied']) {
    await page.evaluate((value) => {
      window.consentState = value;
    }, state);
    await page.locator('#cta span').click();
  }
  assert.equal(await page.evaluate(() => window.calls.length), 1);
  await page.evaluate(() => {
    delete window.awAnalytics;
  });
  await page.locator('#cta').click();
  assert.equal(await page.evaluate(() => window.calls.length), 1);
  await page.evaluate(() => {
    document.querySelector('#ga-init').dataset.consent = '';
  });
  await page.locator('#cta').click();
  assert.equal(await page.evaluate(() => window.calls.length), 2);
  await page.evaluate(() => {
    document.querySelector('#ga-init').dataset.id = '';
  });
  await page.locator('#cta').click();
  assert.equal(await page.evaluate(() => window.calls.length), 2);
  await page.evaluate(() => {
    document.querySelector('#ga-init').dataset.id = 'G-TEST';
    delete window.gtag;
  });
  await page.locator('#cta').click();
  assert.equal(await page.evaluate(() => window.calls.length), 2);
});

test('valid submit attempt and confirmed success are separate, with no field data', async (t) => {
  const page = await fixture(t);
  await page.locator('#submit').click();
  assert.deepEqual(await page.evaluate(() => window.calls), []);
  await page.locator('input').fill('personal@example.test');
  await page.locator('#submit').click();
  assert.deepEqual(await page.evaluate(() => window.calls), [
    ['event', 'contact_submit', { placement: 'contact_form', destination_type: 'form' }],
  ]);
  await page.evaluate(() =>
    document.querySelector('#form').dispatchEvent(
      new CustomEvent('aw:lead-success', {
        bubbles: true,
        detail: { email: 'must-not-forward@example.test' },
      })
    )
  );
  assert.deepEqual(await page.evaluate(() => window.calls), [
    ['event', 'contact_submit', { placement: 'contact_form', destination_type: 'form' }],
    ['event', 'generate_lead', { placement: 'contact_form', destination_type: 'form' }],
  ]);
  await page.evaluate(() => {
    document.querySelector('#cta').dataset.awEvent = 'generate_lead';
  });
  await page.locator('#cta').click();
  assert.equal(await page.evaluate(() => window.calls.length), 2);
});

test('closed values reject personal/free text, long values and wrong event semantics', async (t) => {
  const page = await fixture(t);
  for (const value of [
    'person@example.test',
    '+3851234',
    'https://example.test/?id=42',
    'hello world',
    'unknown_slug',
    '',
    'a'.repeat(33),
  ]) {
    await page.evaluate((label) => {
      document.querySelector('#cta').dataset.awLabel = label;
    }, value);
    await page.locator('#cta').click();
  }
  assert.deepEqual(await page.evaluate(() => window.calls), []);
  await page.evaluate(() => {
    const cta = document.querySelector('#cta');
    cta.dataset.awLabel = 'primary_cta';
    cta.dataset.email = 'must-not-forward@example.test';
  });
  await page.locator('#cta span').click();
  assert.deepEqual(await page.evaluate(() => window.calls), [
    ['event', 'cta_click', { placement: 'hero', label: 'primary_cta', destination_type: 'internal' }],
  ]);
  for (const [name, destination, fileName] of [
    ['phone_click', 'phone', null],
    ['email_click', 'email', null],
    ['file_download', 'file', 'brochure.pdf'],
  ]) {
    await page.evaluate(
      ({ name, destination, fileName }) => {
        const link = document.createElement('a');
        link.id = 'link';
        link.textContent = 'Tracked link';
        link.href = '#';
        link.dataset.awEvent = name;
        link.dataset.awDestinationType = destination;
        if (fileName) link.dataset.awFileName = fileName;
        document.body.append(link);
        link.addEventListener('click', (event) => event.preventDefault());
      },
      { name, destination, fileName }
    );
    await page.locator('#link').click();
    const params = { destination_type: destination, ...(fileName ? { file_name: fileName } : {}) };
    assert.deepEqual(await page.evaluate(() => window.calls.at(-1)), ['event', name, params]);
    await page.locator('#link').evaluate((link) => link.remove());
  }
});

test('reinstall and page-load events retain exactly one listener per interaction', async (t) => {
  const page = await fixture(t);
  await page.evaluate(() => {
    for (let i = 0; i < 3; i++) {
      window.testInstall(window);
      document.dispatchEvent(new Event('astro:page-load'));
    }
  });
  await page.locator('#cta span').click();
  assert.equal(await page.evaluate(() => window.calls.length), 1);
  await page.locator('input').fill('fixture');
  await page.locator('#submit').click();
  await page.evaluate(() =>
    document.querySelector('#form').dispatchEvent(new CustomEvent('aw:lead-success', { bubbles: true }))
  );
  assert.deepEqual(await page.evaluate(() => window.calls.map((call) => call[1])), [
    'cta_click',
    'contact_submit',
    'generate_lead',
  ]);
});

test('built component stays active through two actual ClientRouter navigations', async (t) => {
  const context = await browser.newContext();
  t.after(() => context.close());
  const page = await context.newPage();
  await page.route('https://**/*', (route) => route.abort());
  await page.goto(origin);
  // A client with GA requireConsent wired in (SETUP.md B1d) shows a fixed bottom-of-
  // viewport consent banner until a choice is made; it intercepts clicks on anything
  // underneath it. Dismiss it before interacting with page content, same as a real visitor.
  // No-op here (template ships with the banner unmounted), but protects a client repo
  // that has wired it in from failing this test on an unrelated overlay.
  const consentAccept = page.locator('#cookie-accept');
  if (await consentAccept.isVisible().catch(() => false)) await consentAccept.click();
  await page.evaluate(() => {
    window.documentSentinel = 'original-document';
    window.calls = [];
    window.navigationCount = 0;
    document.addEventListener('astro:page-load', () => {
      window.navigationCount++;
      window.gtag = (...args) => window.calls.push(args);
    });
  });
  // '/thank-you' and '/' are the two routes every client build keeps (SETUP.md's
  // forms.md requires a dedicated thank-you route universally); a client that deletes
  // '/about' and '/contact' per SETUP.md's "delete the pages you don't need" step must
  // not break this test.
  for (const destination of ['/thank-you', '/']) {
    await page.evaluate((href) => {
      const link = document.createElement('a');
      link.id = 'quality-navigation';
      link.textContent = 'Navigate';
      link.href = href;
      document.body.append(link);
    }, destination);
    await page.locator('#quality-navigation').click();
    await page.waitForURL(origin + destination);
    await page.waitForFunction(() => window.navigationCount > window.calls.length);
    assert.equal(await page.evaluate(() => window.documentSentinel), 'original-document');
    await page.evaluate(() => {
      const init = document.querySelector('#ga-init');
      init.dataset.id = 'G-TEST';
      init.dataset.consent = '';
      delete window.awAnalytics;
      window.gtag = (...args) => window.calls.push(args);
      const button = document.createElement('button');
      button.id = 'quality-cta';
      button.textContent = 'Tracked action';
      button.dataset.awEvent = 'cta_click';
      button.dataset.awDestinationType = 'internal';
      document.body.append(button);
    });
    await page.locator('#quality-cta').click();
  }
  assert.deepEqual(await page.evaluate(() => window.calls), [
    ['event', 'cta_click', { destination_type: 'internal' }],
    ['event', 'cta_click', { destination_type: 'internal' }],
  ]);
});

test('all recognized parameter validation is enforced before emission', async (t) => {
  const page = await fixture(t);
  for (const [attribute, value] of [
    ['data-aw-placement', 'private_place'],
    ['data-aw-destination-type', 'phone'],
    ['data-aw-file-name', 'brochure.pdf'],
    ['data-aw-label', 'primary_cta '],
  ]) {
    await page.locator('#cta').evaluate(
      (element, { attribute, value }) => {
        element.setAttribute(attribute, value);
      },
      { attribute, value }
    );
    await page.locator('#cta').click();
    await page.locator('#cta').evaluate((element, attribute) => element.removeAttribute(attribute), attribute);
    await page.locator('#cta').evaluate((element) => {
      element.setAttribute('data-aw-destination-type', 'internal');
      element.setAttribute('data-aw-label', 'primary_cta');
    });
  }
  assert.deepEqual(await page.evaluate(() => window.calls), []);
  await page.evaluate(() => {
    window.awAnalytics = {
      status: () => {
        throw new Error('unavailable');
      },
    };
  });
  await page.locator('#cta').click();
  assert.deepEqual(await page.evaluate(() => window.calls), []);
});

test('submit without success and direct success-page load never confirm a lead', async (t) => {
  const page = await fixture(t);
  await page.locator('input').fill('fixture');
  await page.locator('#submit').click();
  assert.deepEqual(await page.evaluate(() => window.calls.map((call) => call[1])), ['contact_submit']);
  await page.goto(origin + '/thank-you');
  await page.evaluate(() => {
    window.calls = [];
    window.gtag = (...args) => window.calls.push(args);
    document.querySelector('#ga-init').dataset.id = 'G-TEST';
    document.dispatchEvent(new Event('astro:page-load'));
  });
  assert.deepEqual(await page.evaluate(() => window.calls), []);
});
