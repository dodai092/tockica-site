// Links an instructor's first name to their profile page. Used on the server (ScheduleRow callers) and in the
// browser (fillRow), so a class row links the same wherever it is built. A name with no profile gets no link.

/** "Ena" becomes "ena". Matches the slugs in src/data/instructors.ts. */
export const slugOf = (first: string): string =>
  first
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/** `base` is the profile path with a trailing slash, `slugs` the instructors that have a page. */
export function profileHref(base: string, slugs: string[], first: string): string | undefined {
  const slug = slugOf(first);
  return slugs.includes(slug) ? `${base}${slug}` : undefined;
}
