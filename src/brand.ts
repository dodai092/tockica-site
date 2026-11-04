// Single per-client brand surface. Edit this file per client. See SETUP.md.
//
// Typeface: the family itself is set in astro.config.ts (Astro's Fonts API needs
// it at config load and exposes it as a CSS variable, e.g. `--font-noto-sans`).
// Point the `fonts` values below at that variable.

// Client: drop your logo in src/assets/images/ and uncomment:
// import logoImage from '~/assets/images/logo.svg';

export type BrandTokens = {
  radius?: 'sharp' | 'soft' | 'round' | 'pill';
  button?: 'solid' | 'outline' | 'ghost';
  section?: 'tight' | 'normal' | 'roomy';
  shadow?: 'none' | 'soft' | 'hard';
  container?: 'narrow' | 'normal' | 'wide';
};

export const brand = {
  logo: {
    image: null, // set to logoImage once the import above is uncommented
    alt: '',
    ogPath: '', // project-root-relative raster logo path for generated OG cards
    showName: true, // show SITE.name text beside/instead of the image
  },

  fonts: {
    sans: 'var(--font-noto-sans)',
    serif: 'var(--font-noto-sans)',
    heading: 'var(--font-noto-sans)',
  },

  /**
   * Design knobs. Enums only, so a build cannot produce an incoherent in-between.
   * Flow through src/components/CustomStyles.astro into --aw-* custom properties.
   * The whole block and every key is optional (see BrandTokens); omitting a key
   * uses its default. In the template repo, preview at /dev/tokens (npm run dev).
   *   radius     corner rounding for buttons, inputs, cards, media
   *   button     primary-action treatment: filled, outlined, or text-only
   *   section    vertical rhythm between page bands
   *   shadow     card elevation language
   *   container  max content width
   */
  tokens: {
    radius: 'soft',
    button: 'solid',
    section: 'normal',
    shadow: 'soft',
    container: 'normal',
  } satisfies BrandTokens,

  light: {
    primary: 'rgb(1 97 239)',
    secondary: 'rgb(1 84 207)',
    accent: 'rgb(109 40 217)',
    textHeading: 'rgb(0 0 0)',
    textDefault: 'rgb(16 16 16)',
    textMuted: 'rgb(16 16 16 / 66%)',
    bgPage: 'rgb(255 255 255)',
  },

  dark: {
    primary: 'rgb(1 97 239)',
    secondary: 'rgb(1 84 207)',
    accent: 'rgb(109 40 217)',
    textHeading: 'rgb(247 248 248)',
    textDefault: 'rgb(229 236 246)',
    textMuted: 'rgb(229 236 246 / 66%)',
    bgPage: 'rgb(3 6 32)',
  },
} as const;
