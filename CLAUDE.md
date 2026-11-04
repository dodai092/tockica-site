# Claude Code Configuration

This repo was built from the [dodai-astrowind](https://github.com/dodai/dodai-astrowind)
template for Točkica na i (AstroWind fork). Read in this order:

1. [CONTEXT.md](./CONTEXT.md), vocabulary. Terms below are used precisely.
2. [AGENTS.md](./AGENTS.md), AstroWind architecture and conventions.
3. [docs/client-build-rules.md](./docs/client-build-rules.md), before writing a client
   plan or reviewing a client branch.
4. [docs/quality-gates.md](./docs/quality-gates.md), the canonical client quality-gate
   policy (gate order, thresholds, route coverage, review rubric).

## Hard rules

- **Never edit template core** during a client build. Core = `src/layouts/`, `src/utils/`,
  `src/components/{ui,common,blog}/`, `vendor/`, the config system.
- `src/components/widgets/` is a **parts bin**: copy from it, never edit it, never compose
  it directly into a client page.
- All per-client components go in `src/components/client/`.
- If you think core needs a change, stop and raise it, don't just edit.
- A pre-commit hook enforces "no core edits" in client repos (it is inert here in the
  template). If it blocks a commit, that is the workflow working: stop and report it,
  don't self-authorize past it. `git commit --no-verify` (or any other hook/check
  bypass) requires the human's explicit, in-the-moment instruction to use it. A
  subagent used it unauthorized once, based on misreading this file's prose instead of
  the hook's actual enforced rule; see
  `docs/retrospectives/2026-09-12-referral-build-retro.md`.
