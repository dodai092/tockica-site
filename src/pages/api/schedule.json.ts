// MOCK of the booking app's public schedule endpoint, same path and shape (src/lib/schedule-feed.ts). Remove it
// when the app is proxied at this path. The site is static, so the dates are fixed when the site is built (the dev
// server builds them on every request). The browser drops classes that have passed.
import type { APIRoute } from 'astro';
import { buildMockSchedule } from '~/lib/mock-schedule';

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ source: 'mock', classes: buildMockSchedule(new Date()) }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
