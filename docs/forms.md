# Contact forms

## The pattern

`src/components/client/ContactForm.astro` is the reference implementation. Copy it into
a client build and adapt the fields, labels, and card styling to the brief. Two things
do not change: the required privacy-policy consent checkbox and `action="/thank-you/"`
pointing at a styled success page.

The component is self-contained. It copies the field, label, and card classes from the
parts bin (`src/components/ui/Form.astro`, `src/components/widgets/Contact.astro`) rather
than importing them, so it still responds to `brand.tokens` through the
`--aw-radius-card` and `--aw-shadow-card` variables. It may import
`~/components/ui/Button.astro`.

## Netlify detection

Netlify scans built HTML at deploy time and registers any form carrying
`data-netlify="true"`. The form has to appear in a page that ships to `dist/`. The
reference contact form renders server-side into `dist/contact/index.html`, so Netlify
detects it with no extra file. The template does not ship a `public/__forms.html` stub.

Add one manually only if a form renders solely behind interaction (a modal, a wizard
step) and never appears in any built HTML page. In that case create
`public/__forms.html` with a hidden copy of the form (`<form data-netlify="true"
hidden name="...">` plus every field) and keep its fields in sync with the real form.

## Spam

The honeypot field (`bot-field`, declared via `netlify-honeypot="bot-field"` and a
hidden `<p>` wrapper) ships by default and needs no configuration. reCAPTCHA is opt-in:
enable it in the Netlify dashboard and add a `data-netlify-recaptcha` div to the form.
Add it only if the client asks.

## Non-Netlify hosts

Swap the `data-netlify` attribute and the hidden `form-name` input for the provider's
endpoint:

- Formspree: `action="https://formspree.io/f/xxx"`, no hidden `form-name`.
- Web3Forms: `action="https://api.web3forms.com/submit"` plus a hidden
  `<input type="hidden" name="access_key" value="..." />`.

The consent checkbox and the dedicated `/thank-you/` success page stay exactly as they
are.

## Hard requirements

Also enforced in SETUP.md B4. Every form that collects personal data has:

- a required privacy-policy consent checkbox, and
- a styled success page under our own route, not the host's generic confirmation screen.
