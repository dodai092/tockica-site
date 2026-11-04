# Dodai website template

Base template for Dodai client websites. Fork of [AstroWind](https://github.com/arthelokyo/astrowind)
(Astro 7 + Tailwind CSS v4, static output, Netlify).

## Start here

- **[SETUP.md](./SETUP.md)**, the client-build workflow: one sequence of three arcs (Discovery, Build, Launch).
- **[CONTEXT.md](./CONTEXT.md)**, vocabulary: template core, client layer, parts bin, client component.
- **[AGENTS.md](./AGENTS.md)**, AstroWind architecture and conventions.
- **[CHANGELOG.md](./CHANGELOG.md)**, template version history. Current version in [`TEMPLATE_VERSION`](./TEMPLATE_VERSION).

## Commands

| Command           | Purpose                         |
| ----------------- | ------------------------------- |
| `npm run dev`     | Dev server at localhost:4321    |
| `npm run build`   | Production build to `./dist/`   |
| `npm run preview` | Preview the production build    |
| `npm run check`   | astro check + ESLint + Prettier |
| `npm run fix`     | Auto-fix ESLint + Prettier      |
| `npm run verify`  | Run the complete quality suite  |

Node >= 22.22.3.

## License

AstroWind is MIT licensed by onWidget and contributors. See [LICENSE.md](./LICENSE.md).
