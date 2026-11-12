// With ui.theme set to "*:only" in src/config.yaml the site has one colour mode and no toggle, so tests
// that need the toggle or the light palette skip themselves. Set theme back to "system" to run them again.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const config = readFileSync(fileURLToPath(new URL('../src/config.yaml', import.meta.url)), 'utf8');
export const skipWhenThemeOnly =
  /^\s*theme:\s*['"]?[a-z]+:only/m.test(config) && 'ui.theme is :only (single colour mode)';
