// The round mark next to an instructor's name until portraits exist: their initial on one of four soft tints.
// The class names are written out here so Tailwind finds them.
export const TINTS = [
  'bg-sky-100 text-sky-900 dark:bg-sky-900/60 dark:text-sky-100',
  'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100',
  'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100',
  'bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-900/60 dark:text-fuchsia-100',
] as const;

export const initialOf = (name: string): string => name.trim().charAt(0).toLocaleUpperCase();

export const tintIndex = (name: string): number => {
  let sum = 0;
  for (const ch of name.trim().toLocaleLowerCase()) sum += ch.codePointAt(0) ?? 0;
  return sum % TINTS.length;
};
