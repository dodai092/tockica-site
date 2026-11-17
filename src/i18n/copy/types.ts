// UI strings shared by every page. hr.ts and en.ts must have identical keys
// (tests/i18n.test.mjs). Page-specific client copy lives in docs/copy/source.md
// and is transcribed into the page data files, not here.
export type Copy = {
  nav: {
    schedule: string;
    instructors: string;
    packs: string;
    waitlist: string;
    sculpt: string;
    contact: string;
    login: string;
  };
  cta: {
    book: string;
    seeSchedule: string;
    signIn: string;
  };
  langSwitch: {
    aria: string;
  };
  footer: {
    rules: string;
    terms: string;
    privacy: string;
  };
  home: {
    title: string;
    description: string;
    nextClasses: { heading: string; waitlist: string; book: string };
    about: { heading: string; line: string };
    rooms: {
      heading: string;
      riders: { name: string; text: string };
      sculpt: { name: string; text: string };
      more: string;
    };
    instructors: { heading: string; all: string };
    how: {
      heading: string;
      steps: [{ title: string; text: string }, { title: string; text: string }, { title: string; text: string }];
    };
    offer: { label: string; colDiscount: string; firstTime: string; packs: string };
    sculptBand: { heading: string; text: string; cta: string };
    faq: { heading: string };
    contact: { heading: string; write: string };
    photo: { hero: string; space: string; riders: string; sculpt: string; instructor: string };
  };
  instructorsPage: { title: string; description: string };
  instructorPage: {
    back: string;
    teaches: string;
    playlist: string;
    loadPlaylist: string;
    spotifyNote: string;
    nextClasses: string;
  };
  firstTimePage: { title: string; description: string; lead: string };
  packsPage: {
    title: string;
    description: string;
    noteDuration: string;
    noteAbs: string;
    perClass: string;
    classOne: string;
    classMany: string;
  };
  form: {
    name: string;
    email: string;
    message: string;
    consentBefore: string;
    consentLink: string;
    consentAfter: string;
  };
  sculptPage: {
    title: string;
    description: string;
    priceLabel: string;
    minLabel: string;
    monthsMany: string;
    visitsLabel: string;
    slots: string;
    /** Pitch under the title (doc item 6): headline, who it is for, what is fixed, what you do with it. */
    pitch: { lead: string; text: string; fixed: string; plan: string };
    formHeading: string;
    submit: string;
  };
  consent: { label: string; text: string; more: string; decline: string; accept: string };
  contactPage: { description: string; submit: string };
  legalPage: { description: string; official: string };
  notFound: { title: string; text: string; back: string };
  thanksPage: { title: string; text: string; back: string };
  waitlist: {
    title: string;
    description: string;
    heading: string;
    /** One short lead-in under the heading. */
    offer: string;
    /** The offer as one display sentence, with the price set larger at its end. */
    priceLine: string;
    price: string;
    room: string;
    deadline: string;
    /** Purchase window and when the 30 days start, under the deadline pill. */
    terms: string;
    /** Footnotes under the terms: availability, not transferable, no pause and no refund. */
    notes: [string, string, string];
    /** Title of the opening-hours block under the FAQ. */
    hoursHeading: string;
    firstName: string;
    lastName: string;
    formHeading: string;
    submit: string;
    /** Form errors in the page language, shown in place of the browser's own. */
    errors: { required: string; email: string; date: string; dateReal: string; consent: string };
    birthDate: string;
    /** Labels of the three date-of-birth fields. */
    birthParts: { day: string; month: string; year: string };
    birthHints: { day: string; month: string; year: string };
    /** The line under the birth date fields: why we ask for it. */
    birthDateWhy: string;
    /** Names what is still missing from the terms, on the placeholder flag under them. */
    termsMissing: string;
    stepsHeading: string;
    steps: [{ title: string; text: string }, { title: string; text: string }, { title: string; text: string }];
    /** Three dates under the steps: last day to join, opening, last day to buy. */
    timeline: [{ date: string; label: string }, { date: string; label: string }, { date: string; label: string }];
  };
  waitlistThanks: { title: string; text: string; instagram: string; pendingMissing: string; back: string };
  schedulePage: {
    title: string;
    description: string;
    soon: string;
    demo: { text: string; link: string };
    weeks: string;
    prevWeek: string;
    nextWeek: string;
    days: string;
    noClasses: string;
    today: string;
    /** Button label on a class in the third week, which can be seen but not booked yet. */
    notOpen: string;
    /** Free places on a class card. */
    seats: {
      full: string;
      /** {n} is the number of free places. */
      plenty: string;
      scarce: { one: string; few: string; other: string };
    };
  };
  bikeSheet: {
    title: string;
    close: string;
    /** Label of one bike button, {n} is the number. */
    bike: string;
    free: string;
    taken: string;
    picked: string;
    instructor: string;
    pickBike: string;
    /** Continue button once a bike is picked, {n} is the number. */
    continue: string;
    /** Shown when the picked bike was booked by someone else meanwhile, {n} is the number. */
    taken_now: string;
    loginTitle: string;
    loginIntro: string;
    email: string;
    sendCode: string;
    soonTitle: string;
    soonText: string;
    /** Small note on the bike map while the schedule is mock data. */
    preview: string;
    changeBike: string;
    backToSchedule: string;
    waitlist: string;
    /** The "your pick" bar after a reload. {when} is the day, time and instructor, {n} the bike. */
    pendingText: string;
    pendingWaitlist: string;
    pendingContinue: string;
    pendingClear: string;
  };
  demoPage: { title: string; description: string; frame: string };
  todoLabel: string;
};
