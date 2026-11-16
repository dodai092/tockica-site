// Source: Dunia's homepage doc, item 4 (lines as of 2026-11-16). `first` is the only name shown on the site.
// `full` is for payroll reports and must never be rendered. A null line is a
// TODO(client): the page shows a Placeholder, never a guess.
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
  {
    slug: 'dunia',
    first: 'Dunia',
    full: 'Dunia Mando',
    line: {
      hr: 'Tu je da zaboraviš je li ovo trening ili izlazak. Dobra energija zagarantirana.',
      en: 'Here to make you question whether you came to work out or party. Guaranteed mood boost.',
    },
  },
  {
    slug: 'oliver',
    first: 'Oliver',
    full: 'Oliver Mando',
    line: {
      hr: 'Tvoj omiljeni hip-hop party, samo s više pulsa.',
      en: 'Your favorite hip hop club, on a spin bike.',
    },
  },
  {
    slug: 'ivana',
    first: 'Ivana',
    full: 'Ivana Mauer',
    line: {
      hr: 'Koreografija, snaga i moćan beat drop koji podiže energiju. Svaki refren i kraj pjesme kod nje su tempirani točno u sekundu.',
      en: 'The perfect mix of choreography, strength and a satisfying beat drop. Every chorus, drop and finish hits right on cue.',
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
      hr: 'Prava milenijalka: velika kosa, velika energija i još veći hitovi.',
      en: 'A true millennial: big hair, big energy and even bigger throwbacks.',
    },
  },
  {
    slug: 'domagoj',
    first: 'Domagoj',
    full: 'Domagoj Vončina',
    line: {
      hr: 'Došao voditi spin. Slučajno održao koncert.',
      en: 'Came to teach spin. Accidentally started a concert.',
    },
  },
  {
    slug: 'emma',
    first: 'Emma',
    full: 'Emma Stepinac',
    line: {
      hr: 'Negdje između Disney princeze i Mr. Worldwidea, uz obaveznu dozu Taylor Swift.',
      en: 'Somewhere between a Disney princess and Mr. Worldwide, with Taylor Swift always on standby.',
    },
  },
];

// The homepage teaser shows these four, all with lines in both languages.
export const teaserSlugs = ['dunia', 'ena', 'oliver', 'mirna', 'emma', 'ivana', 'domagoj'];
