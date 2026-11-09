// Copies the booking prototype (../prototype, a different git repo) into public/demo-app so the site serves it at
// /demo-app/, framed by the /demo page (src/components/client/DemoPage.astro). The copy is committed, because the site builds from its own repo and cannot see ../prototype.
// Re-run after the prototype changes: npm run sync:demo. The page gets noindex, so search engines skip it.
import { cpSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const from = (p) => fileURLToPath(new URL(`../../prototype/${p}`, import.meta.url));
const out = fileURLToPath(new URL('../public/demo-app/', import.meta.url));

if (!existsSync(from('index.html'))) {
  console.error('sync-demo: ../prototype not found');
  process.exit(1);
}
rmSync(out, { recursive: true, force: true });
for (const p of ['src', 'assets', 'styles.css']) cpSync(from(p), `${out}${p}`, { recursive: true });
// Inside the /demo page the site's header, language and theme buttons are the real ones, so the prototype hides its own.
const embed = `<meta name="robots" content="noindex, nofollow">
<script>if (self !== top) document.documentElement.dataset.embed = '';</script>
<style>
html[data-embed] .top :is(.logo, #lang-button, #theme-button) { display: none; }
html[data-embed] .top { position: static; justify-content: flex-end; gap: 12px; padding: 12px 16px 0; background: transparent; }
html[data-embed] .top :is(.login-select, .info-button) { background: var(--dark); color: #fff; border-radius: 999px; }
</style>`;
const html = readFileSync(from('index.html'), 'utf8').replace(
  '<meta charset="utf-8">',
  `<meta charset="utf-8">\n${embed}`
);
writeFileSync(`${out}index.html`, html);
console.log('sync-demo: public/demo-app updated');
