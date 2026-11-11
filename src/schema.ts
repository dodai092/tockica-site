// Per-client structured data (schema.org). Client layer, like src/brand.ts.
//
// Left as-is, the site emits a safe Organization (name + url, plus logo/sameAs if set).
// Fill in address / telephone / geo / openingHours and it becomes a LocalBusiness, which
// is what most Dodai clients want. Empty fields are dropped, so partial data is fine.
// Rendered by src/components/common/SchemaOrg.astro. Nothing is emitted without SITE.site.
import { SITE } from 'astrowind:config';

export const organization = {
  name: SITE.name,
  url: SITE.site,

  logo: '', // absolute path from the site root, e.g. '/logo.png'
  sameAs: [] as string[], // social / listing profile URLs

  // Extra @type(s) layered on top of the automatic Organization / LocalBusiness, e.g.
  // ['ProfessionalService'] makes @type ['LocalBusiness', 'ProfessionalService'].
  additionalType: [] as string[],

  founder: '', // founder's full name; emits a Person
  foundingDate: '', // ISO 8601, e.g. '2019' or '2019-06-01'

  // --- LocalBusiness fields: fill any of these to upgrade the @type ---
  // TODO(client): telephone, email, address, geo, openingHours and sameAs stay empty until
  // Dunia answers doc item 8 (address is Ferde Rusana 8, settled; Antuna Bauera 22 is the unpublished company seat) and item 18.
  // The type upgrades from Organization to LocalBusiness once an address is set.
  telephone: '',
  email: '',
  priceRange: '', // e.g. '$$'
  address: {
    streetAddress: '',
    addressLocality: '',
    addressRegion: '',
    postalCode: '',
    addressCountry: '', // ISO code, e.g. 'HR'
  },
  geo: {
    latitude: '',
    longitude: '',
  },
  openingHours: [] as string[], // e.g. ['Mo-Fr 09:00-17:00', 'Sa 09:00-13:00']

  // Itemized offerings for a service business. Each item becomes an Offer wrapping a
  // Service in a schema.org OfferCatalog (emitted as hasOfferCatalog). Leave items
  // empty to emit nothing. Set `name` when items are present.
  offerCatalog: {
    name: '', // e.g. 'Services'
    items: [] as Array<{
      name: string;
      description?: string;
      price?: string; // e.g. '150.00'
      priceCurrency?: string; // ISO 4217, e.g. 'EUR'
    }>,
  },
};
