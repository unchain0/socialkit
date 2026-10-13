# Authentication

Authentication explains how readers attach an access key to SocialKit API requests and why the key must stay private.

## Sub-features

- `auth-open` loads `/authentication` with HTTP 200.
- `auth-methods` lists GET parameter, POST parameter, and `x-access-key` header attachment.
- `auth-security` states that unauthenticated requests fail and keys must not be published.
- `auth-mandatory` documents that authentication is mandatory.

## How to get to it (user POV)

- Choose **Authentication** in the sidebar (`pages/_meta.js`: `authentication: 'Authentication'`).
- Open `/authentication` directly.
- Follow an in-docs link to `/authentication`.

## Driving it with drive.sh

Preconditions:

- Docs instance is healthy at `$ORIGIN`.
- `scripts/doctor.sh $PORT` prints `READY`.

- **Open page.** Run `scripts/drive.sh "$STATE" fetch /authentication "$EVIDENCE/authentication.html"`. Status `200`.
- **Heading.** Run `scripts/drive.sh "$STATE" assert-contains "$EVIDENCE/authentication.html" "Authentication"`. Exit `0`.
- **Header method.** Run `scripts/drive.sh "$STATE" assert-contains "$EVIDENCE/authentication.html" "x-access-key"`. Exit `0`.
- **Query method.** Run `scripts/drive.sh "$STATE" assert-contains "$EVIDENCE/authentication.html" "access_key"`. Exit `0`.
- **Security reminder.** Run `scripts/drive.sh "$STATE" assert-contains "$EVIDENCE/authentication.html" "Authentication is Mandatory"`. Exit `0`.
- **Screenshot.** Run `scripts/drive.sh "$STATE" screenshot /authentication "$EVIDENCE/authentication.png"`.
- **Proof.** Keep body + status + exit under the evidence directory. No network calls to the live API.

## Gotchas

- This page does not issue tokens. There is nothing to log into on localhost.
- Do not open `https://socialkit.dev/login` as part of this skill; that is production UI outside this repo.
- Marker casing matters for `assert-contains` (`Authentication is Mandatory` matches the MDX heading text).
