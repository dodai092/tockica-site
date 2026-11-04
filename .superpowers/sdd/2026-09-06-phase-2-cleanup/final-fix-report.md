# Final review fix report

## Finding

`lighthouserc.cjs` listed `/dev/components/`, `/dev/og/`, and `/dev/tokens/`, but
`scripts/init-client.mjs` removes `src/pages/dev` from initialized client repos.
That left LHCI auditing routes that no longer existed after initialization.

## Fix

Added one exact `REPLACEMENTS` entry in `scripts/init-client.mjs` that removes the
three `/dev/` URL entries from the generated `lighthouserc.cjs`. The template file
itself remains unchanged, so its explicit eleven-path LHCI coverage is preserved.

## Verification

- `npm run check:init` passed: `init-client --check: 23/23 matches present`.
- Template LHCI assertion passed: `lighthouserc.cjs` still contains 11 URLs,
  including all three `/dev/` preview URLs.
- Disposable initialization passed: the generated config contains exactly 8 URLs,
  contains no `/dev/` URL, and retains `/thank-you/` plus the seven marketing and
  legal routes.
- `git diff --check` passed.

## Scope and concerns

Only `scripts/init-client.mjs` changes behavior. The existing LHCI assertion matrix
still contains the noindex `/dev/` pattern for the template, which is harmless in a
client repo because the matching routes are no longer collected.
