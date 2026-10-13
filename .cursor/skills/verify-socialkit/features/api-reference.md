# API Reference

API Reference is the overview of documented endpoints plus the per-endpoint pages for YouTube summarize, transcript, and stats.

## Sub-features

- `api-overview-open` loads `/api-reference` with HTTP 200.
- `api-base-endpoint` shows the base URL `https://api.socialkit.dev`.
- `api-endpoint-list` lists `/youtube/summarize`, `/youtube/transcript`, and `/youtube/stats`.
- `api-child-summarize` opens `/api-reference/youtube-summarize-api`.
- `api-child-transcript` opens `/api-reference/youtube-transcript-api`.
- `api-child-stats` opens `/api-reference/youtube-stats-api`.

## How to get to it (user POV)

- Choose **API Reference** in the sidebar (`pages/_meta.js`: `api-reference: 'API Reference'`).
- Open `/api-reference` directly.
- From the overview, follow links to YouTube Summary, Transcript, or Stats API pages (`pages/api-reference/_meta.js`).

## Driving it with drive.sh

Preconditions:

- Docs instance is healthy at `$ORIGIN`.
- `scripts/doctor.sh $PORT` prints `READY`.

- **Open overview.** Run `scripts/drive.sh "$STATE" fetch /api-reference "$EVIDENCE/api-reference.html"`. Status `200`.
- **Overview heading.** Run `scripts/drive.sh "$STATE" assert-contains "$EVIDENCE/api-reference.html" "API Reference"`. Exit `0`.
- **Base endpoint.** Run `scripts/drive.sh "$STATE" assert-contains "$EVIDENCE/api-reference.html" "https://api.socialkit.dev"`. Exit `0`.
- **Endpoint paths.** Run `scripts/drive.sh "$STATE" assert-contains "$EVIDENCE/api-reference.html" "/youtube/summarize"`. Exit `0`.
- **Summarize child page.** Run `scripts/drive.sh "$STATE" fetch /api-reference/youtube-summarize-api "$EVIDENCE/youtube-summarize-api.html"` then `assert-contains` with `YouTube Summary API`.
- **Transcript child page.** Run `scripts/drive.sh "$STATE" fetch /api-reference/youtube-transcript-api "$EVIDENCE/youtube-transcript-api.html"` then `assert-contains` with `YouTube Transcript API`.
- **Stats child page.** Run `scripts/drive.sh "$STATE" fetch /api-reference/youtube-stats-api "$EVIDENCE/youtube-stats-api.html"` then `assert-contains` with `YouTube Stats API`.
- **Screenshot overview.** Run `scripts/drive.sh "$STATE" screenshot /api-reference "$EVIDENCE/api-reference.png"`.
- **Proof.** Retain all fetched bodies and statuses. Do not execute the example GETs against production.

## Gotchas

- Child routes use hyphenated slugs matching the MDX filenames (`youtube-summarize-api`), not the API path (`/youtube/summarize`).
- Overview copy says GET or POST are both allowed; that is documentation only.
- Links inside the overview are root-relative (`/api-reference/youtube-summarize-api`). Fetch those exact paths.
