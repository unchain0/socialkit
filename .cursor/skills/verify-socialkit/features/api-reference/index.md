# api-reference/index

API Reference overview is the main documentation overview page listing documented endpoints.

## Sub-features

- `api-overview-open` loads `/api-reference` with HTTP 200.

## How to get to it (user POV)

- Choose **API Reference** in the sidebar (`pages/_meta.js`: `api-reference: 'API Reference'`).
- Open `/api-reference` directly.

## Driving it with drive.sh

Preconditions:

- Docs instance is healthy at `$ORIGIN`.
- `scripts/doctor.sh $PORT` prints `READY`.

- **Open overview.** Run `scripts/drive.sh "$STATE" fetch /api-reference "$EVIDENCE/api-reference.html"`. Status `200`.
- **Overview heading.** Run `scripts/drive.sh "$STATE" assert-contains "$EVIDENCE/api-reference.html" "API Reference"`.
  Exit `0`.
- **Proof.** Retain HTML + status + exit. The overview page is static documentation; no API calls are made.

## Gotchas

- The stable user-facing route is `/api-reference`, not `/api-reference/index`.
- Auth is relevant only for calling the documented API endpoints, not for opening the overview page.
- Child routes use hyphenated slugs matching the MDX filenames (`youtube-summarize-api`), not the API path
  (`/youtube/summarize`).
- Links inside the overview are root-relative (`/api-reference/youtube-summarize-api`). Fetch those exact paths.
