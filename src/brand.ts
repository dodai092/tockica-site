// Single per-client brand surface. Edit this file per client. See SETUP.md.
//
// Typeface: the family itself is set in astro.config.ts (Astro's Fonts API needs
// it at config load and exposes it as a CSS variable, e.g. `--font-noto-sans`).
// Point the `fonts` values below at that variable.

// Logo: recolour of the old green SVG, temporary until Dunia sends the official red file.
import logoImage from '~/assets/images/logo.svg';

export type BrandTokens = {
  radius?: 'sharp' | 'soft' | 'round' | 'pill';
  button?: 'solid' | 'outline' | 'ghost';
  section?: 'tight' | 'normal' | 'roomy';
  shadow?: 'none' | 'soft' | 'hard';
  container?: 'narrow' | 'normal' | 'wide';
};

export const brand = {
  logo: {
    image: logoImage,
    alt: 'Točkica na i logo', // differs from the visible name beside it (Lighthouse image-redundant-alt)
    ogPath: '', // project-root-relative raster logo path for generated OG cards
    showName: true, // show SITE.name text beside/instead of the image
  },

  fonts: {
    sans: 'var(--font-roboto)',
    serif: 'var(--font-roboto)',
    heading: 'var(--font-montserrat)',
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

  // Red is an estimate from AI images, pending Dunia's official value (doc item 21).
  // Red text on the slate page is 2.78:1 and fails, so in dark mode red is for buttons only.
  light: {
    primary: 'rgb(215 25 32)',
    secondary: 'rgb(179 18 26)',
    accent: 'rgb(35 42 53)',
    textHeading: 'rgb(35 42 53)',
    textDefault: 'rgb(42 42 42)',
    textMuted: 'rgb(99 107 118)',
    bgPage: 'rgb(247 247 247)',
    error: 'rgb(185 28 28)',
    button: 'rgb(215 25 32)',
    buttonText: 'rgb(255 255 255)',
    buttonHover: 'rgb(179 18 26)',
  },

  dark: {
    primary: 'rgb(215 25 32)',
    secondary: 'rgb(179 18 26)',
    accent: 'rgb(58 68 84)',
    textHeading: 'rgb(247 247 247)',
    textDefault: 'rgb(229 231 235)',
    textMuted: 'rgb(229 231 235 / 66%)',
    bgPage: 'rgb(35 42 53)',
    // Calm primary action (near-white, slate label) and a soft coral for errors, so red stays the logo's.
    error: 'rgb(255 179 173)',
    button: 'rgb(247 247 247)',
    buttonText: 'rgb(35 42 53)',
    buttonHover: 'rgb(224 224 224)',
  },
} as const;
