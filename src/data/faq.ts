// Source: docs/copy/source.md, homepage section 8. English is verbatim from Dunia's doc,
// typos and curly apostrophes included. Croatian is Antun's translation in the informal "ti"
// form (Dunia chose "ti"), Dunia approves before launch. A null renders a Placeholder, never
// the other language. Paragraphs in an answer are separated by "\n".
export type FaqItem = {
  q: { hr: string | null; en: string };
  a: { hr: string | null; en: string | null };
};

export const faq: FaqItem[] = [
  {
    q: { hr: 'Koji su treninzi prikladni za početnike?', en: 'Which classes are beginner friendly?' },
    a: {
      hr: 'Svi. Naši instruktori će ti pomoći da pronađeš ritam i voziš svojim tempom. Dobrodošle su sve razine kondicije, a uvijek možeš sjesti, ustati, usporiti ili uzeti predah kad god ti zatreba, bez obzira na trening ili instruktora. Ovo je tvojih 50 minuta.\nAko želiš krenuti nešto sporijim tempom, preporučujemo ABS Spin treninge s Mariom, Emmom ili Ivanom. ABS Spin se više usredotočuje na snagu i kontrolirane pokrete nego na brze sprinteve i tempo.',
      en: 'All of them. Our instructors will help you find the beat and ride at your own pace. We welcome all fitness levels, and you’re always free to sit, stand, slow down or take a break whenever you need to, regardless of the class or instructor. These are your 50 minutes.\nIf you’d prefer to start with a slightly slower tempo, we recommend trying Mario, Emma or Ivana’s ABS spin classes. ABS Spin class focuses a more on strength and controlled movement, rather than quick sprints and pace.',
    },
  },
  {
    q: { hr: 'Što trebam ponijeti?', en: 'What do i need to bring?' },
    a: {
      hr: 'Čistu obuću, vodu i ručnik. Vodu uvijek možeš kupiti u studiju.',
      en: 'Clean shoes, water and towel. You can always buy water at the studio.',
    },
  },
  {
    q: { hr: 'Koliko ranije trebam doći?', en: 'How early should I arrive?' },
    a: {
      hr: 'Ako dolaziš prvi put, dođi 15 minuta ranije da ti instruktor pomogne namjestiti bicikl.',
      en: 'If you are new, come 15 minutes before to allow your instructor to help you set up.',
    },
  },
  {
    q: { hr: 'Što ako moram otkazati?', en: 'What if I need to cancel?' },
    a: {
      hr: 'Termin možeš otkazati najkasnije 6 sati prije treninga.',
      en: 'Cancellation window is 6 hours prior to the lesson.',
    },
  },
];
