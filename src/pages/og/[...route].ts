import { OGImageRoute } from 'astro-og-canvas';
import { brand } from '~/brand';

// Static marketing pages that get a generated branded card.
// Keys map to /og/<key>.png. Titles and descriptions are neutral starter copy;
// a client build replaces them alongside the page rewrites (Task 4).
// REPLACE: real page titles and one-line descriptions per client. Source: docs/intake.md
export const PAGES: Record<string, { title: string; description: string }> = {
  home: { title: 'Home', description: 'What the company does, in one line.' },
  about: { title: 'About', description: 'Who we are and how we work.' },
  services: { title: 'Services', description: 'What we offer and who it is for.' },
  pricing: { title: 'Pricing', description: 'Plans and what each one includes.' },
  contact: { title: 'Contact', description: 'How to get in touch with us.' },
  'thank-you': { title: 'Thank you', description: 'We received your message and will reply soon.' },
};

// brand.light.* values are CSS `rgb(r g b)` strings (space-separated, optional
// `/ a%`). astro-og-canvas wants `[r, g, b]` number tuples.
const toRGB = (value: string): [number, number, number] => {
  const m = value.match(/\d+/g) ?? [];
  return [Number(m[0] ?? 0), Number(m[1] ?? 0), Number(m[2] ?? 0)];
};

export const { getStaticPaths, GET } = await OGImageRoute({
  pages: PAGES,
  getImageOptions: (_path, page) => {
    // brand.logo.ogPath enables a bounded logo on generated cards.
    const logo = brand.logo.ogPath ? { path: brand.logo.ogPath, size: [240] as [number] } : undefined;

    return {
      title: page.title,
      description: page.description,
      fonts: ['./src/assets/fonts/NotoSans-Regular.ttf'],
      bgGradient: [toRGB(brand.light.bgPage)],
      border: { color: toRGB(brand.light.primary), width: 24, side: 'inline-start' },
      padding: 60,
      font: {
        title: { color: toRGB(brand.light.textHeading), families: ['Noto Sans'] },
        description: { color: toRGB(brand.light.textMuted), families: ['Noto Sans'] },
      },
      logo,
    };
  },
});
