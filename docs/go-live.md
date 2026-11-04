# Go-live runbook

Fixed procedure for launching a client site. Do the client sign-off step before touching
production DNS.

## 1. Netlify site setup

1. Netlify → Add new site → Import from Git → the client repo.
2. Build settings are picked up from `netlify.toml` (build `npm run build`, publish `dist`).
   Set the Node version to 22 (Site config → Environment → `NODE_VERSION = 22`).
3. First deploy runs. Confirm the `*.netlify.app` URL renders.

## 2. Client review (before DNS)

1. Netlify → Site config → Access & security → Password protection → set a site password.
2. Send the client the `*.netlify.app` URL + password. Get written sign-off on content and design.
3. Run the pre-launch checks (below) once sign-off is in.

## 3. Pre-launch checks

- [ ] [Client quality gates](quality-gates.md) are complete with review evidence committed.
- [ ] CI passes: build, check, test:quality, test:routes, test:analytics, test:meta, test:links, test:lhci.
- [ ] `src/config.yaml` `site.site` is the final `https://` domain (canonical URLs, sitemap, OG depend on it).
      Type it fresh here rather than copy-pasting from an earlier note or draft; a typo
      typed once and copied everywhere is invisible to every check, since `test:meta` only
      confirms internal consistency, not that the configured domain is the _correct_ one.
      Then open the deployed preview, view-source, and read the canonical URL back against
      the actual domain in your browser's address bar as a final human sanity check.
- [ ] Favicons, OG image (`src/assets/images/default.png`), and logos are the client's.
- [ ] `robots.txt` allows indexing; `metadata.robots.index: true` in `config.yaml`.
- [ ] Legal pages reviewed and approved by the client.
- [ ] Contact form: test a real submission, confirm it arrives.
- [ ] `src/schema.ts` filled if the client is a local business.
- [ ] 404 page renders.
- [ ] Analytics: `config.yaml` has the real GA4 id; an EU client also has `requireConsent: true` and the consent banner mounted; the preview receives hits (after accepting, for an EU client).

## 4. Custom domain + DNS

1. Netlify → Domain management → Add the client's domain (apex + `www`).
2. Set the primary domain (usually the apex, `example.com`) and enable "redirect
   automatically to primary domain" so `www` 301s to it (or the reverse if the client prefers `www`).
3. At the DNS host, add:
   - Apex `example.com`: Netlify DNS, or an `ALIAS`/`ANAME` to `<site>.netlify.app`, or the
     Netlify load-balancer `A` record `75.2.60.5` if the host has no ALIAS support.
   - `www`: `CNAME` to `<site>.netlify.app`.
4. Do not touch `MX`, `TXT` (SPF/DKIM), or other existing records.
5. Wait for propagation. Netlify provisions the Let's Encrypt certificate automatically
   once DNS resolves (can take up to an hour).

## 5. Cutover

1. Remove the site password (step 2.1).
2. Confirm `https://example.com` and `https://www.example.com` both resolve and the
   redirect direction is correct.
3. Submit the sitemap (`https://example.com/sitemap-index.xml`) in Google Search Console.
4. Record the launch date and `TEMPLATE_VERSION` in the repo.

## 6. Handoff

Fill in `docs/handoff-template.md` and send it to the client.

## 7. Post-launch monitoring

Set up a free uptime check on the production domain (e.g. UptimeRobot's free tier)
pointed at the primary domain, alerting to your own inbox. This is a "tell me if it goes
down" tripwire, not a monitoring product; nobody watches a dashboard, it only needs to
fire when something breaks.

## 8. If the site goes down: rollback

Netlify keeps every previous deploy. If a bad deploy breaks production:

1. Netlify → the site → **Deploys**.
2. Find the last known-good deploy (before the break).
3. Click it → **Publish deploy**. This is instant and does not require a new build or a
   `git revert`.
4. Once the client repo's `main` branch is fixed, the next push republishes normally and
   supersedes the manual rollback.

Do this before debugging the cause. Restore service first, investigate after.
