# Alternate deploy targets

The default deploy target is **Netlify** (`netlify.toml` at the repo root). Reasons:
static Astro deploys in one step, Netlify Forms covers the contact form with no extra
service, deploy previews per PR.

Use the configs here only when a client specifically needs something else:

| File                                         | Target                | When                                      |
| -------------------------------------------- | --------------------- | ----------------------------------------- |
| `vercel.json`                                | Vercel                | Client is already on Vercel               |
| `Dockerfile`, `docker-compose.yml`, `nginx/` | Self-hosted container | Client requires on-prem / their own infra |

To switch: move the relevant file(s) back to the repo root, remove `netlify.toml`, and
update the deploy docs in `SETUP.md`.
