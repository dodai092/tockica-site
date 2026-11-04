// Source: docs/copy/source.md, homepage section 8. English is verbatim from Dunia's doc,
// typos and curly apostrophes included. Croatian is not written yet (null), and the
// cancel answer (item 4) is open: a null renders a Placeholder, never the other language.
// Paragraphs in an answer are separated by "\n".
export type FaqItem = {
  q: { hr: string | null; en: string };
  a: { hr: string | null; en: string | null };
};

export const faq: FaqItem[] = [
  {
    q: { hr: null, en: 'Which classes are beginner friendly?' },
    a: {
      hr: null,
      en: 'All of them. Our instructors will help you find the beat and ride at your own pace. We welcome all fitness levels, and you’re always free to sit, stand, slow down or take a break whenever you need to, regardless of the class or instructor. These are your 45 minutes.\nIf you’d prefer to start with a slightly slower tempo, we recommend trying Mario, Emma or Ivana’s ABS spin classes. ABS Spin class focuses a more on strength and controlled movement, rather than quick sprints and pace.',
    },
  },
  {
    q: { hr: null, en: 'What do i need to bring?' },
    a: { hr: null, en: 'Clean shoes, water and towel. You can always buy water at the studio.' },
  },
  {
    q: { hr: null, en: 'How early should I arrive?' },
    a: { hr: null, en: 'If you are new, come 15 minutes before to allow your instructor to help you set up.' },
  },
  {
    q: { hr: null, en: 'What if I need to cancel?' },
    a: { hr: null, en: null },
  },
];
