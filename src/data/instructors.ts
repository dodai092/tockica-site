// Source: docs/copy/source.md item 4. `first` is the only name shown on the site.
// `full` is for payroll reports and must never be rendered. A null line is a
// TODO(client): the page shows a Placeholder, never a guess. Domagoj has two
// alternative lines in the source, so both stay null until Dunia picks one.
export type Instructor = {
  slug: string;
  first: string;
  full: string;
  line: { hr: string | null; en: string | null };
  /** A few sentences for the profile page (Dunia's doc item 1). Null shows a Placeholder. */
  bio?: { hr: string | null; en: string | null };
  /** Spotify playlist id of their favourite songs, the part after /playlist/. Null shows a Placeholder. */
  playlist?: string | null;
};

export const instructors: Instructor[] = [
  { slug: 'dunia', first: 'Dunia', full: 'Dunia Mando', line: { hr: null, en: null } },
  {
    slug: 'oliver',
    first: 'Oliver',
    full: 'Oliver Mando',
    line: {
      hr: 'Prigušena svjetla, glasni beatovi i malo main character energije.',
      en: 'Low lights, loud beats and a little main-character energy.',
    },
  },
  {
    slug: 'ivana',
    first: 'Ivana',
    full: 'Ivana Mauer',
    line: {
      hr: null,
      en: 'For riders who want choreography, strength and a satisfying beat drop. Every chorus, drop and finish hits right on cue.',
    },
  },
  {
    slug: 'mirna',
    first: 'Mirna',
    full: 'Mirna Zebec',
    line: {
      hr: 'Ili pušta dark techno ili Anastaciu. Ovisi koja se osobnost taj dan pojavi.',
      en: 'Plays dark techno or Anastacia. Depends on which personality shows up.',
    },
  },
  {
    slug: 'ena',
    first: 'Ena',
    full: 'Ena Vušić',
    line: {
      hr: 'Prava milenijalka: velika kosa, velika energija i još veći throwbackovi.',
      en: 'A true millennial: big hair, big energy and even bigger throwbacks.',
    },
  },
  { slug: 'domagoj', first: 'Domagoj', full: 'Domagoj Vončina', line: { hr: null, en: null } },
  {
    slug: 'emma',
    first: 'Emma',
    full: 'Emma Stepinac',
    line: {
      hr: 'Negdje između Disney princeze i Mr. Worldwidea.',
      en: 'Somewhere between Disney princess and Mr. Worldwide.',
    },
  },
];

// The homepage teaser shows these four, all with lines in both languages.
export const teaserSlugs = ['oliver', 'mirna', 'ena', 'emma'];
