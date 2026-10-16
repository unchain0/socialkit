# SocialKit docs verification map

This directory is the maintained source for verifying the user-facing behavior of the SocialKit documentation site (Next.js + Nextra). Read the index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Launch docs with `.cursor/skills/verify-socialkit/scripts/launch.sh` (port in `4310–4390`).
- Origin is `http://127.0.0.1:<port>` from the printed `INSTANCE` line.
- Run `.cursor/skills/verify-socialkit/scripts/doctor.sh <port>` and require `READY`.
- Put evidence under `.verify-evidence/<timestamp>-<feature>/` (gitignored) or `/tmp/verify-socialkit-evidence/<port>/<feature>/`.
- Never drive port `3000` or any instance this skill did not start.
- Never call `api.socialkit.dev` with real credentials. Docs pages are local HTML only.

## Driving conventions

- Start every recipe from a doctor-healthy baseline unless preconditions say otherwise.
- Prefer route paths from `pages/` and `_meta.js` over CSS selectors or coordinates.
- Treat every command as literal. Keep quoted markers and flags unchanged.
- Run HTTP actions through `scripts/drive.sh`.
- Cleanup removes the instance state only. Do not remove proof artifacts.

## Proof and skip reporting

- Capture the user action and the resulting HTML (and optional screenshot), not only a final glance.
- HTTP proof includes body, status file, and curl exit code.
- Content proof includes `assert-contains` markers taken from the MDX source.
- Record the feature ID and entry point used with every artifact.
- Report an unreachable path with the attempted command and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with drive.sh` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

Keep implementation details out of the map. Name only user paths, stable handles, required state, commands, and observable proof.

## Features

- [Introduction](./introduction.md) covers the docs home page and primary nav entry.
- [Getting Started](./getting-started.md) covers the first-request guide and access-key attachment methods.
- [Authentication](./authentication.md) covers access-key security copy and attachment methods.
- [API Reference](./api-reference.md) covers the overview and linked YouTube endpoint pages.
- [Errors](./errors.md) covers the HTTP error reference page.
