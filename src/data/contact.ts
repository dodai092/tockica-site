// Contact facts from Dunia's homepage doc (layout table, Kontakt row). Phone is still missing
// and item 8's own answer box is blank, so address and hours are as she wrote them, not re-confirmed.
// Company seat (Ulica Antuna Bauera 22) is not on official papers yet and must not be published.
export const contact = {
  address: 'Ulica Ferde Rusana 8, Zagreb',
  email: 'info@tockicanai.hr',
  hours: [
    { days: { hr: 'Pon', en: 'Mon' }, time: '7:00-9:00, 17:00-20:00' },
    { days: { hr: 'Uto', en: 'Tue' }, time: '17:00-20:00' },
    { days: { hr: 'Sri', en: 'Wed' }, time: '7:00-9:00, 17:00-20:00' },
    { days: { hr: 'Čet', en: 'Thu' }, time: '17:00-20:00' },
    { days: { hr: 'Pet', en: 'Fri' }, time: '7:00-9:00, 17:00-19:00' },
    { days: { hr: 'Sub', en: 'Sat' }, time: '10:00-13:00' },
    { days: { hr: 'Ned', en: 'Sun' }, time: '10:00-12:00' },
  ],
} as const;
