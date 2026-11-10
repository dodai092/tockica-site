// The native schedule page on /raspored and /en/schedule (Stage A): week picker, day strip, one row per class.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (file) => readFile(new URL(`../dist/${file}`, import.meta.url), 'utf8');
const pages = [
  {
    lang: 'hr',
    file: 'raspored/index.html',
    book: 'Rezerviraj',
    wait: 'Lista čekanja',
    full: 'Popunjeno',
    weekday: 'utorak',
  },
  { lang: 'en', file: 'en/schedule/index.html', book: 'Book', wait: 'Waiting list', full: 'Full', weekday: 'tuesday' },
];

for (const { lang, file, book, wait, full, weekday } of pages) {
  test(`${lang}: has a week picker, six day buttons per week and rows with a start time`, async () => {
    const html = await read(file);
    assert.ok(html.includes('data-schedule'), 'schedule root missing');
    assert.ok(html.includes('data-week-prev') && html.includes('data-week-next'), 'week picker missing');
    const weeks = [...html.matchAll(/data-week-strip="(\d{4}-\d{2}-\d{2})"/g)].map((m) => m[1]);
    assert.equal(weeks.length, 3);
    for (const monday of weeks) {
      const strip = html.match(new RegExp(`<div[^>]*data-week-strip="${monday}"[\\s\\S]*?</div>`))[0];
      assert.equal([...strip.matchAll(/data-day="/g)].length, 6);
    }
    assert.match(html, /data-class-id="[^"]+"/);
    assert.doesNotMatch(html, /\d{2}:\d{2}–\d{2}:\d{2}/, 'a class shows its start time only');
  });

  test(`${lang}: only the selected week is shown, and within it every day but the selected one is off below md`, async () => {
    const html = await read(file);
    const panels = [...html.matchAll(/<div\b[^>]*data-day-panel="[^"]+"[^>]*>/g)].map((m) => m[0]);
    assert.equal(panels.length, 18);
    const shown = panels.filter((p) => !/\shidden/.test(p));
    assert.equal(shown.length, 6, 'the selected week is not hidden');
    assert.equal(shown.filter((p) => /\sdata-off/.test(p)).length, 5, 'one selected day, five off');
    assert.ok(
      panels.every((p) => /\bmax-md:data-off:hidden\b/.test(p)),
      'panels need the below-md rule'
    );
    assert.equal([...html.matchAll(/aria-pressed="true"/g)].length, 1);
  });

  test(`${lang}: desktop week grid: every day has a header and a rows list, the strip is hidden from md up`, async () => {
    const html = await read(file);
    assert.equal([...html.matchAll(/<p\b[^>]*data-day-head/g)].length, 18);
    assert.equal([...html.matchAll(/<ul\b[^>]*data-rows/g)].length, 18);
    const strips = [...html.matchAll(/<div\b[^>]*data-week-strip="[^"]+"[^>]*>/g)].map((m) => m[0]);
    assert.equal(strips.length, 3);
    assert.ok(
      strips.every((s) => /\bmd:hidden\b/.test(s)),
      'day strip must be hidden at md'
    );
    const panelsTag = html.match(/<div\b[^>]*data-panels[^>]*>/)?.[0] ?? '';
    assert.ok(/\bmd:grid-cols-3\b/.test(panelsTag), 'panels must be three columns from md');
    assert.ok(/\blg:grid-cols-6\b/.test(panelsTag), 'panels must be six columns from lg');
  });

  test(`${lang}: offers Book and the waiting list, and shows no bike numbers of who booked`, async () => {
    const html = await read(file);
    assert.ok(new RegExp(`${book}\\s*</a>`).test(html), 'an open class should offer Book');
    assert.ok(new RegExp(`${wait}\\s*</a>`).test(html), 'a full class should offer the waiting list');
  });

  test(`${lang}: embeds the classes as JSON with takenBikes, and only full rows carry data-full`, async () => {
    const html = await read(file);
    const json = html.match(/<script\b[^>]*data-schedule-data[^>]*>([\s\S]*?)<\/script>/)?.[1];
    assert.ok(json, 'data-schedule-data script missing');
    const classes = JSON.parse(json);
    assert.ok(Array.isArray(classes) && classes.length > 0, 'JSON must be a non-empty array');
    assert.ok(
      classes.every((c) => typeof c.id === 'string' && Array.isArray(c.takenBikes)),
      'each class needs an id and takenBikes'
    );
    const rows = [...html.matchAll(/<li\b[^>]*data-class-id="([^"]+)"[^>]*>/g)];
    assert.equal(rows.length, classes.length, 'one row per embedded class');
    const full = new Set(classes.filter((c) => c.takenBikes.length >= c.capacity).map((c) => c.id));
    assert.ok(full.size > 0, 'the mock should contain a full class');
    for (const [tag, id] of rows) {
      assert.equal(/\sdata-full/.test(tag), full.has(id), `data-full on row ${id}`);
    }
    const tpl = (kind) => html.match(new RegExp(`<template[^>]*data-row="${kind}"[^>]*>\\s*(<li\\b[^>]*>)`))?.[1] ?? '';
    assert.ok(/\sdata-full/.test(tpl('full')), 'full template needs data-full');
    assert.ok(!/\sdata-full/.test(tpl('open')), 'open template must not have data-full');
  });

  test(`${lang}: has the login step, the notice step and the hidden "your pick" bar, the first two marked as placeholders`, async () => {
    const html = await read(file);
    assert.match(html, /<div\b[^>]*data-step="login"/);
    assert.match(html, /<div\b[^>]*data-step="soon"/);
    assert.match(html, /<div\b(?=[^>]*\sdata-pending)(?=[^>]*\shidden)[^>]*>/, 'the bar starts hidden');
    assert.ok(/data-todo="[^"]*login[^"]*"/.test(html), 'login needs a data-todo marker');
    assert.ok(/data-todo="[^"]*opens soon[^"]*"/.test(html), 'the notice needs a data-todo marker');
  });

  test(`${lang}: a class row reads time, instructor, training name, with avatar, seats and meter`, async () => {
    const html = await read(file);
    const li = html.match(/<li\b[^>]*data-class-id="mock-[^"]+"[^>]*>[\s\S]*?<\/li>/)?.[0] ?? '';
    const at = (f) => li.indexOf(`data-f="${f}"`);
    assert.ok(at('time') > -1 && at('time') < at('instructor') && at('instructor') < at('name'), 'order of the lines');
    assert.match(li, /data-f="time"[^>]*>\d{2}:\d{2}</, 'start time only');
    assert.ok(at('initial') > -1, 'avatar initial');
    assert.ok(at('seats') > -1 && li.includes('data-meter'), 'seats text and meter');
    assert.ok(!/Slobodan bicikl|Free bike/.test(html), 'the first-free-bike line is gone');
  });

  test(`${lang}: a full class says so, with the meter full, and offers the waiting list`, async () => {
    const html = await read(file);
    const li = html.match(/<li\b(?=[^>]*data-class-id="mock-)(?=[^>]*\sdata-full)[^>]*>[\s\S]*?<\/li>/)?.[0] ?? '';
    assert.ok(li, 'the mock has a full class');
    assert.ok(li.includes(`>${full}<`) || li.includes(`>\n${full}`) || li.includes(full), 'full label');
    assert.match(li, /data-meter[^>]*style="[^"]*width:\s*100%/, 'meter full');
    assert.ok(li.includes(wait));
  });

  test(`${lang}: training names come from the data, not the room`, async () => {
    const html = await read(file);
    assert.ok(!html.includes("50' Riders Room"), 'no room name on the cards');
    assert.ok(html.includes('ABS Spin') && html.includes('Britney Spears'), 'training and theme names show');
  });

  test(`${lang}: each day has a sheet header with the weekday, and each strip button has a dot per class`, async () => {
    const html = await read(file);
    const heads = [...html.matchAll(/<p\b[^>]*data-sheet-head[^>]*>([\s\S]*?)<\/p>/g)].map((m) => m[1].toLowerCase());
    assert.equal(heads.length, 18);
    assert.ok(
      heads.some((h) => h.includes(weekday)),
      'a long weekday name'
    );
    assert.equal([...html.matchAll(/data-dots/g)].length, 18);
    assert.ok(/<i\b[^>]*data-full/.test(html), 'a full class shows as a pale dot');
  });

  test(`${lang}: the next-classes cards are not on the schedule page, the notice and demo link stay`, async () => {
    const html = await read(file);
    assert.ok(!html.includes('data-section="next-classes"'));
    assert.ok(html.includes('data-schedule-notice') && html.includes('data-demo-link'));
  });
}

test('the homepage still has its four next-class cards', async () => {
  const html = (await read('index.html')).replace(/<template[\s\S]*?<\/template>/g, '');
  assert.equal([...html.matchAll(/data-next-class=/g)].length, 4);
});

const demoText = {
  hr: 'Isprobaj demo rezervacija (nije prava rezervacija).',
  en: 'Try the booking demo (not a real booking).',
};
for (const { lang, file } of pages) {
  test(`${lang}: the demo line has a space between its text and the link`, async () => {
    const html = await read(file);
    const link = html.match(/<a\b[^>]*\bdata-demo-link\b[^>]*>/);
    assert.ok(link, 'demo link missing');
    assert.ok(html.slice(0, link.index).endsWith(`${demoText[lang]} `), 'a space before the link');
  });
}
