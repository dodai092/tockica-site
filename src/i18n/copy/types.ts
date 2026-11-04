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
    label: string;
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
    photo: { hero: string; space: string; riders: string; sculpt: string; instructor: string };
  };
  todoLabel: string;
};
