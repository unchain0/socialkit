---
name: verify-socialkit
description: Drive the SocialKit documentation site (Next.js + Nextra docs theme) locally and prove user-facing doc pages render. Use for /verify-socialkit, doc copy or nav regressions, or when a change needs real localhost evidence instead of a static read of the MDX.
---

# Verify SocialKit docs

**Surface.** The primary user surface is the Nextra docs web UI served by Next.js (`pages/`, `theme.config.jsx`, `nextra-theme-docs`). Users read Introduction, Getting Started, Authentication, and API Reference pages in a browser. There is no app backend in this repo: the live SocialKit API at `api.socialkit.dev` is documented here only. Never call that API with real keys, and never post or publish anything as part of verification.

**Isolate.** Each launch picks a free loopback port in `4310–4390` and records state under `/tmp/verify-socialkit/instances/<port>/`. Do not drive port `3000` (the human dev default from the README). Do not drive a process this skill did not start.

**Secrets.** This docs site needs no credentials. Never put access keys, tokens, or production URLs with write intent into helpers, evidence, or commands.

## Launch

From the repository root, install deps once (Yarn Classic; `yarn.lock` is committed):

```bash
yarn install --frozen-lockfile
```

Start one isolated instance:

```bash
.cursor/skills/verify-socialkit/scripts/launch.sh
```

The script:

1. Resolves the repo root from its own path.
2. Requires `node_modules/next` (run `yarn install` first if missing).
3. Claims a free port in `4310–4390` and a state dir `/tmp/verify-socialkit/instances/<port>/`.
4. Starts `node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port <port>` with a clean-enough env, logging to `state/server.log`, PID in `state/pid`.
5. Waits until `GET http://127.0.0.1:<port>/` returns HTTP 200 and the body contains `SocialKit`.
6. Prints `INSTANCE port=<port> origin=http://127.0.0.1:<port> state=<dir>` and writes `instance.env` (mode 600) with `PORT`, `ORIGIN`, `PID`, `ROOT`.

**Ready signal.** `launch.sh` exits 0 only after the ready check above. Prefer `scripts/doctor.sh <port>` before any drive.

**Teardown.** Use Cleanup (`scripts/cleanup.sh <port>`). Never `pkill node` or kill by process name.

## Doctor

Read-only. Run before driving whenever anything looks off:

```bash
.cursor/skills/verify-socialkit/scripts/doctor.sh PORT
```

Passes only when all of these hold:

- `/tmp/verify-socialkit/instances/<port>/instance.env` and `pid` exist
- the recorded PID is alive and its command line contains `next`
- that PID owns the listening socket for the port
- `GET $ORIGIN/` is HTTP 200 and the HTML contains `SocialKit`
- `GET $ORIGIN/getting-started` is HTTP 200 and the HTML contains `Getting Started`

Non-zero exit means do not drive this process. Inspect `state/server.log` or relaunch.

## Drive

There is no Playwright or Cypress suite in this repo. Drive pages over HTTP with the helper (curl-backed), and optionally capture a headless Chrome screenshot of one page.

```bash
STATE=/tmp/verify-socialkit/instances/4310   # state= path from launch
# shellcheck disable=SC1091
source "$STATE/instance.env"
DRIVE=.cursor/skills/verify-socialkit/scripts/drive.sh
EVIDENCE=".verify-evidence/$(date -u +%Y%m%dT%H%M%SZ)-getting-started"
mkdir -p "$EVIDENCE"

# Prove Getting Started end to end (one mapped feature is enough per run)
"$DRIVE" "$STATE" fetch /getting-started "$EVIDENCE/getting-started.html"
"$DRIVE" "$STATE" assert-contains "$EVIDENCE/getting-started.html" "Getting Started"
"$DRIVE" "$STATE" assert-contains "$EVIDENCE/getting-started.html" "access_key"
"$DRIVE" "$STATE" assert-contains "$EVIDENCE/getting-started.html" "x-access-key"
"$DRIVE" "$STATE" screenshot /getting-started "$EVIDENCE/getting-started.png"
"$DRIVE" "$STATE" nav-check "$EVIDENCE/nav-summary.txt"
```

`drive.sh` commands:

| Command | Meaning |
| --- | --- |
| `fetch PATH OUT` | `GET $ORIGIN$PATH` → body to `OUT`, status to `OUT.status`, curl exit to `OUT.exit` |
| `assert-contains FILE TEXT` | fail unless `FILE` contains `TEXT` |
| `screenshot PATH OUT.png` | headless Chrome screenshot of `$ORIGIN$PATH` (skips cleanly if Chrome is missing) |
| `nav-check OUT.txt` | fetch `/`, `/getting-started`, `/authentication`, `/api-reference`, `/api-reference/errors`; record status + marker per route |

Stable handles are **route paths** from `pages/` and `_meta.js`, not CSS coordinates:

- `/` — Introduction (`pages/index.mdx`)
- `/getting-started` — Getting Started (`pages/getting-started.mdx`)
- `/authentication` — Authentication (`pages/authentication.mdx`)
- `/api-reference` — API Reference overview (`pages/api-reference/index.mdx`)
- `/api-reference/youtube-summarize-api` — Summary endpoint docs
- `/api-reference/youtube-transcript-api` — Transcript endpoint docs
- `/api-reference/youtube-stats-api` — Stats endpoint docs
- `/api-reference/errors` — Error reference

Per-feature recipes live under `features/`. Always start from a doctor-healthy instance.

**Out of scope for Drive.** Calling `https://api.socialkit.dev/*`, signing into `socialkit.dev/login`, or using any real access key. Docs pages only show example request shapes; verification stops at rendered local HTML.

## Evidence

Write proof under a run directory that Cleanup does **not** delete:

- Preferred (repo-local, gitignored): `.verify-evidence/<timestamp>-<feature>/`
- Fallback: `/tmp/verify-socialkit-evidence/<port>/<feature>/`

For each driven feature capture:

1. The HTTP body (`.html`), status (`.status`), and curl exit (`.exit`) for the action
2. A second check that proves content (assert-contains markers from the MDX), not only HTTP 200
3. Optional screenshot (`.png`) with the docs chrome visible
4. A short `summary.txt` listing feature id, origin, routes hit, and exit codes

Proof standards:

- Exercise the real user path (request the doc URL the reader hits)
- Capture action + resulting body, not only a final screenshot
- Side effects: this site is read-only docs; the observable result is correct HTML markers and nav links. Do not treat a production API call as proof.
- Never store secrets in evidence. Example `access_key=<your-access-key>` strings already in the MDX are fine; do not add real keys.

After Cleanup, confirm the evidence directory still exists.

## Cleanup

Stop only the instance this run started:

```bash
.cursor/skills/verify-socialkit/scripts/cleanup.sh PORT
```

The script:

1. Reads `/tmp/verify-socialkit/instances/<port>/`
2. Confirms the PID is still the recorded `next` process and owns the port
3. Sends `SIGTERM`, then `SIGKILL` if needed
4. Removes the instance state dir only
5. Does **not** delete `.verify-evidence/` or `/tmp/verify-socialkit-evidence/`

Never kill by process name. Run cleanup after failed launches and failed drives too so ports are not stranded.

## Helpers

| Script | Invocation |
| --- | --- |
| `scripts/launch.sh` | `.cursor/skills/verify-socialkit/scripts/launch.sh` |
| `scripts/doctor.sh` | `.cursor/skills/verify-socialkit/scripts/doctor.sh PORT` |
| `scripts/drive.sh` | `.cursor/skills/verify-socialkit/scripts/drive.sh STATE_DIR COMMAND [args…]` |
| `scripts/cleanup.sh` | `.cursor/skills/verify-socialkit/scripts/cleanup.sh PORT` |

`STATE_DIR` is the `state=` path printed by launch. Source `instance.env` from there before manual curls if needed; do not print it in logs beyond `PORT` and `ORIGIN`.

## Feature map

See [`features/README.md`](features/README.md). Keep the map honest as pages change; prefer `/maintain-verification-skill` when routes or copy drift.
