import { getPermalink } from './utils/permalinks';

// Client layer: replace this with the real site navigation per project.
// See SETUP.md. Full demo navigation (homes/landing/widgets) is kept in
// src/pages/_examples/ for reference. Add a Blog link once the blog is enabled.

export const headerData = {
  links: [
    { text: 'Services', href: getPermalink('/services') },
    { text: 'Pricing', href: getPermalink('/pricing') },
    { text: 'About', href: getPermalink('/about') },
  ],
  actions: [{ text: 'Contact', href: getPermalink('/contact') }],
};

export const footerData = {
  links: [
    {
      title: 'Site',
      links: [
        { text: 'Services', href: getPermalink('/services') },
        { text: 'Pricing', href: getPermalink('/pricing') },
        { text: 'About', href: getPermalink('/about') },
        { text: 'Contact', href: getPermalink('/contact') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Terms', href: getPermalink('/terms') },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],
  // Add socialLinks per client. RSS belongs here only once the blog is enabled.
  socialLinks: [],
  footNote: `
    Built by <a class="text-blue-600 underline dark:text-muted" href="https://dodai.io">Dodai</a>.
  `,
};
