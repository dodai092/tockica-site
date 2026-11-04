// Source: docs/copy/source.md item 3. Price is 100 or 150 EUR a month and not final
// (doc items 3 and 6), visits a month is unknown: both null render a Placeholder.
// visible: false hides the nav links and sets the page to noindex.
export const sculpt: {
  monthlyPriceEur: number | null;
  minMonths: 6;
  visitsPerMonth: number | null;
  visible: boolean;
} = {
  monthlyPriceEur: null,
  minMonths: 6,
  visitsPerMonth: null,
  visible: true,
};
