import type { Copy } from './types.ts';

// English UI strings are Antun's translation, Dunia approves before launch.
export const en: Copy = {
  nav: {
    schedule: 'Schedule',
    instructors: 'Instructors',
    packs: 'Packs',
    sculpt: 'Sculpt Room',
    contact: 'Contact',
    login: 'Log in',
  },
  cta: {
    book: 'Book a class',
    seeSchedule: 'See the schedule',
  },
  langSwitch: {
    label: 'HR',
    aria: 'Hrvatski',
  },
  footer: {
    rules: 'Studio rules',
    terms: 'Terms of use',
    privacy: 'Privacy',
  },
  home: {
    title: 'Rhythm spin studio in Zagreb',
    description: 'The first and only rhythm spin studio in the heart of Zagreb.',
    nextClasses: {
      heading: 'Next classes',
      freeBikes: 'Free bikes',
      waitlist: 'Waitlist',
      book: 'Book',
      all: 'All classes',
    },
    about: { heading: 'About the studio', line: 'The first and only rhythm spin studio in the heart of Zagreb.' },
    rooms: {
      heading: 'Rooms',
      riders: { name: 'Riders Room', text: 'Our signature 45-minute rhythm spin class. 20 bikes.' },
      sculpt: { name: 'Sculpt Room', text: 'A room independent trainers rent for their own clients.' },
      more: 'Learn more',
    },
    instructors: { heading: 'Instructors', all: 'All instructors' },
    how: {
      heading: 'How it works',
      steps: [
        { title: 'Sign up', text: 'Log in with your e-mail, no password.' },
        { title: 'Buy a pack', text: 'Intro packs: 1 class 10 EUR, 3 classes 30 EUR.' },
        { title: 'Pick your bike', text: 'Choose a class and your bike on the map.' },
      ],
    },
    sculptBand: {
      heading: 'Sculpt Room Rent',
      text: 'For independent trainers.',
      cta: 'Get in touch',
    },
    faq: { heading: 'FAQ' },
    contact: { heading: 'Contact', write: 'Send us a message' },
    photo: {
      hero: 'Photo: the whole Riders Room with bikes',
      space: 'Photo: the space, reception and slogan wall',
      riders: 'Photo: Riders Room',
      sculpt: 'Photo: Sculpt Room',
      instructor: 'Photo: instructor portrait',
    },
  },
  instructorsPage: {
    title: 'Instructors',
    description: 'Meet the Točkica na i instructors.',
  },
  packsPage: {
    title: 'Packs',
    description: 'Intro packs and the price per class.',
    introLabel: 'Intro pack',
    oncePerAccount: 'Once per account.',
    perClass: 'per class',
    classOne: 'class',
    classMany: 'classes',
  },
  todoLabel: 'Missing',
};
