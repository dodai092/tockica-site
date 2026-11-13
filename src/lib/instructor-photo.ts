// Instructor photos, server side only (it imports images). A photo is the file `src/assets/images/instructors/<slug>.webp`:
// dropping one in is all it takes, and an instructor without a file simply has none (callers show a Placeholder or the
// initial). It lives apart from data/instructors.ts because that file is imported by plain node tests, which cannot load images.
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import { instructors } from '~/data/instructors';
import type { Focus } from '~/lib/avatar';

const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/images/instructors/*.webp', { eager: true });
const bySlug = new Map(
  Object.entries(files).map(([path, mod]) => [
    path
      .split('/')
      .pop()!
      .replace(/\.webp$/, ''),
    mod.default,
  ])
);

/** The photo of the instructor with this slug, or undefined. */
export const photoOf = (slug: string): ImageMetadata | undefined => bySlug.get(slug);

// Where the face is in each square cutout (percent of width, height), for the round marks. A photo without an entry
// is centred on the upper half.
const FACE: Record<string, Focus> = {
  dunia: [51, 30],
  oliver: [43, 28],
  ivana: [43, 31],
  mirna: [46, 34],
  ena: [47, 31],
  domagoj: [43, 27],
  emma: [47, 21],
};

/** Where the face is in an instructor's photo, as percent `[x, y]`. */
export const faceOf = (slug: string): Focus => FACE[slug] ?? [50, 30];

// How far to zoom each portrait panel so heads come out the same size across a row (Ena's head is the largest, so 1).
const HEAD: Record<string, number> = {
  dunia: 1.2,
  oliver: 1.1,
  ivana: 1.25,
  mirna: 1.25,
  ena: 1,
  domagoj: 1.12,
  emma: 1.2,
};
export const headScaleOf = (slug: string): number => HEAD[slug] ?? 1;

// The small round marks on class rows are 56 px, shown zoomed on the face, so 224 px keeps them sharp at 2x.
const THUMB = 224;

export type Thumb = { src: string; focus: Focus };

/** Small webp per slug for the class rows, as `{ ena: { src: '/_astro/ena.hash.webp', focus: [47, 31] } }`. Also handed to the browser script. */
export async function thumbUrls(): Promise<Record<string, Thumb>> {
  const out: Record<string, Thumb> = {};
  for (const { slug } of instructors) {
    const src = bySlug.get(slug);
    if (src) {
      const img = await getImage({ src, width: THUMB, height: THUMB, format: 'webp' });
      out[slug] = { src: img.src, focus: FACE[slug] ?? [50, 30] };
    }
  }
  return out;
}
