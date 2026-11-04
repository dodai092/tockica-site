// UI strings shared by every page. hr.ts and en.ts must have identical keys
// (tests/i18n.test.mjs). Page-specific client copy lives in docs/copy/source.md
// and is transcribed into the page data files, not here.
export type Copy = {
  nav: {
    schedule: string;
    instructors: string;
    packs: string;
    sculpt: string;
    contact: string;
    login: string;
  };
  cta: {
    book: string;
    seeSchedule: string;
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
    nextClasses: { heading: string; freeBikes: string; waitlist: string; book: string; all: string };
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
    sculptBand: { heading: string; text: string; cta: string };
    faq: { heading: string };
    contact: { heading: string; write: string };
    photo: { hero: string; space: string; riders: string; sculpt: string; instructor: string };
  };
  instructorsPage: { title: string; description: string };
  packsPage: {
    title: string;
    description: string;
    introLabel: string;
    oncePerAccount: string;
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
    formHeading: string;
    submit: string;
  };
  consent: { label: string; text: string; more: string; decline: string; accept: string };
  contactPage: { description: string; submit: string };
  legalPage: { description: string; official: string };
  notFound: { title: string; text: string; back: string };
  thanksPage: { title: string; text: string; back: string };
  schedulePage: { title: string; description: string; soon: string };
  todoLabel: string;
};
