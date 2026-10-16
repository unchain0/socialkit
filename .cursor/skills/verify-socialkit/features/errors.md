# Errors

Errors is the HTTP error reference for the SocialKit API: status codes, sample JSON bodies, and what each failure means for the caller.

## Sub-features

- `errors-open` loads `/api-reference/errors` with HTTP 200.
- `errors-400` documents malformed or missing parameter responses.
- `errors-401` documents missing access key responses.
- `errors-403` documents invalid key and quota-style failures.

## How to get to it (user POV)

- Choose **Errors** under API Reference in the sidebar (`pages/api-reference/_meta.js`: `errors: 'Errors'`).
- Open `/api-reference/errors` directly.
- Follow an in-docs link to the error reference.

## Driving it with drive.sh

Preconditions:

- Docs instance is healthy at `$ORIGIN`.
- `scripts/doctor.sh $PORT` prints `READY`.

- **Open page.** Run `scripts/drive.sh "$STATE" fetch /api-reference/errors "$EVIDENCE/errors.html"`. Status `200`.
- **Heading.** Run `scripts/drive.sh "$STATE" assert-contains "$EVIDENCE/errors.html" "Error Reference"`. Exit `0`.
- **400 sample.** Run `scripts/drive.sh "$STATE" assert-contains "$EVIDENCE/errors.html" "400 Bad Request"`. Exit `0`.
- **401 sample.** Run `scripts/drive.sh "$STATE" assert-contains "$EVIDENCE/errors.html" "401 Unauthorized"`. Exit `0`.
- **Missing key message.** Run `scripts/drive.sh "$STATE" assert-contains "$EVIDENCE/errors.html" "Access key is missing"`. Exit `0`.
- **Screenshot.** Run `scripts/drive.sh "$STATE" screenshot /api-reference/errors "$EVIDENCE/errors.png"`.
- **Proof.** Keep HTML + status + exit. Observing error docs is not the same as triggering live API errors; do not probe production.

## Gotchas

- The path is `/api-reference/errors`, not `/errors`.
- Sample JSON in the page includes `"success": false`. Assert on the human headings when possible; minified bundles can also contain the string `success`.
- Never validate these codes by calling the real API without an explicit, separate, non-production harness.
