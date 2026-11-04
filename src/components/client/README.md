# Client components

Per-client components go here. This is the only component folder you edit during a
client build.

- Copy a starting point from `src/components/widgets/` (the parts bin) or build new.
- Never edit `src/components/widgets/`, `ui/`, `common/`, or `blog/` (template core).
- See `.agents/skills/add-component.md` and `../../../CONTEXT.md`.

Included files:

- `GlobalEmbeds.astro` is the site-wide mount point rendered once at the end of `<body>`
  by core `Layout.astro`. Add things that belong on every page here (cookie banner,
  chat widget, pixels). It mounts `AnalyticsEvents.astro` by default.
- `CookieConsent.astro` is an example EU consent banner. Only used if you wire it in; see
  `SETUP.md` step B1d.
- `AnalyticsEvents.astro` installs the delegated listeners from `analytics-events.ts`.
  They persist across ClientRouter navigation, with one installation per document.

## Client analytics events

Mark links, buttons and forms with `data-aw-event`. The bridge checks the current
`#ga-init` ID, callable `gtag` and consent at each interaction. When `awAnalytics`
exists, its `status()` must return `granted`. Required consent with a missing API,
invalid status or exception sends nothing. Without required consent or a consent
API, configured GA can receive events. Events are never queued or replayed.

See [client quality gates](../../../docs/quality-gates.md) section 6 for the authoritative
event and parameter taxonomy and consent validation rules.

| Event            | Trigger                                                                                            | Required destination type |
| ---------------- | -------------------------------------------------------------------------------------------------- | ------------------------- |
| `cta_click`      | Click on a marked link or button                                                                   | `internal` or `external`  |
| `phone_click`    | Click on a marked link                                                                             | `phone`                   |
| `email_click`    | Click on a marked link                                                                             | `email`                   |
| `file_download`  | Click on a marked link with an allowed `file_name`                                                 | `file`                    |
| `contact_submit` | Native submit event from a marked, valid form, including an intercepted AJAX submit                | `form`                    |
| `generate_lead`  | Explicit `aw:lead-success` on a form marked `data-aw-event="contact_submit"` after backend success | `form`                    |

A submit means a valid attempt, not backend acceptance. After the existing backend
integration verifies success, dispatch this once on the marked form:

```js
form.dispatchEvent(new CustomEvent('aw:lead-success', { bubbles: true }));
```

The event has no payload. Response parsing and retry deduplication remain the form
integration's responsibility. A redirect-only form without a confirmed callback
has no `generate_lead` event. Clicks, submits and direct success-page loads never
confirm a lead.

| Parameter          | Attribute                  | Allowed values                                           | Syntax and maximum length         |
| ------------------ | -------------------------- | -------------------------------------------------------- | --------------------------------- |
| `placement`        | `data-aw-placement`        | `header`, `hero`, `body`, `footer`, `contact_form`       | `^[a-z][a-z0-9_]{0,31}$`, 32      |
| `label`            | `data-aw-label`            | `primary_cta`, `secondary_cta`, `contact`, `brochure`    | `^[a-z][a-z0-9_]{0,31}$`, 32      |
| `destination_type` | `data-aw-destination-type` | `internal`, `external`, `phone`, `email`, `file`, `form` | `^[a-z][a-z0-9_]{0,31}$`, 32      |
| `file_name`        | `data-aw-file-name`        | `brochure.pdf`, `price_list.pdf`                         | `^[a-z][a-z0-9_]{0,27}\.pdf$`, 32 |

`destination_type` is required and must match the event table. `file_name` is required
only for `file_download` and forbidden for every other event. It is a static
catalogue value, never an uploaded or user-provided filename. Other parameters are
optional. Every supplied recognized parameter must match both its syntax and its
closed set. Invalid values reject the whole event without trimming or truncation.
Change closed values only through reviewed client source changes using non-personal
catalogue values.

Unknown attributes, DOM text, event detail and response bodies are ignored. Never
put personal data in these attributes. The bridge forwards no form values, email
addresses, phone numbers, free text, URLs, query values, visitor identifiers or
arbitrary objects.
