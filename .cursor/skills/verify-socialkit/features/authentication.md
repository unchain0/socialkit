# authentication

Authentication explains how readers attach an access key to SocialKit API requests and why the key must stay private.

## Sub-features

- `auth-open` loads `/authentication` with HTTP 200.
- `auth-access-key` documents the access key attachment methods.

## How to get to it (user POV)

- Choose **Authentication** in the sidebar (`pages/_meta.js`: `authentication: 'Authentication'`).
- Open `/authentication` directly.

## Driving it with drive.sh

Preconditions:

- Docs instance is healthy at `$ORIGIN`.
- `scripts/doctor.sh $PORT` prints `READY`.

- **Open page.** Run `scripts/drive.sh "$STATE" fetch /authentication "$EVIDENCE/authentication.html"`. Status `200`.
- **Heading.** Run `scripts/drive.sh "$STATE" assert-contains "$EVIDENCE/authentication.html" "Authentication"`. Exit
  `0`.
- **Access key attachment.** Run
  `scripts/drive.sh "$STATE" assert-contains "$EVIDENCE/authentication.html" "x-access-key"`. Exit `0`.
- **Screenshot.** Run `scripts/drive.sh "$STATE" screenshot /authentication "$EVIDENCE/authentication.png"`.
- **Proof.** Retain HTML + status + exit. Docs pages are static; no API calls are made.

## Gotchas

- The page is static documentation; no access key is required merely to open it. Access keys are relevant only for API
  requests.
- The dev server must be running before driving.
- Example URLs pointing at `https://api.socialkit.dev` are not local verification targets.
