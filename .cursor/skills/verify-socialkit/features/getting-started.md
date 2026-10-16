# Getting Started

Getting Started walks a developer through obtaining an access key and making the first documented API request shapes (summary, transcript, stats) without leaving the docs site.

## Sub-features

- `gs-open` loads `/getting-started` with HTTP 200.
- `gs-access-key` documents the three attachment methods (`access_key` query/body and `x-access-key` header).
- `gs-first-requests` shows example GET URLs for summarize, transcript, and stats.
- `gs-response-samples` shows JSON response examples embedded in the page.

## How to get to it (user POV)

- Choose **Getting Started** in the sidebar (`pages/_meta.js`: `getting-started: 'Getting Started'`).
- Open `/getting-started` directly.
- Follow an in-docs link to `/getting-started`.

## Driving it with drive.sh

Preconditions:

- Docs instance is healthy at `$ORIGIN`.
- `scripts/doctor.sh $PORT` prints `READY`.
- Evidence dir created: `mkdir -p "$EVIDENCE"`.

- **Open page.** Run `scripts/drive.sh "$STATE" fetch /getting-started "$EVIDENCE/getting-started.html"`. Status `200`, exit `0`.
- **Heading.** Run `scripts/drive.sh "$STATE" assert-contains "$EVIDENCE/getting-started.html" "Getting Started"`. Exit `0`.
- **Access key methods.** Run `scripts/drive.sh "$STATE" assert-contains "$EVIDENCE/getting-started.html" "access_key"` and `scripts/drive.sh "$STATE" assert-contains "$EVIDENCE/getting-started.html" "x-access-key"`. Exit `0`.
- **Example summarize route shape.** Run `scripts/drive.sh "$STATE" assert-contains "$EVIDENCE/getting-started.html" "youtube/summarize"`. Exit `0`.
- **Example transcript route shape.** Run `scripts/drive.sh "$STATE" assert-contains "$EVIDENCE/getting-started.html" "youtube/transcript"`. Exit `0`.
- **Example stats route shape.** Run `scripts/drive.sh "$STATE" assert-contains "$EVIDENCE/getting-started.html" "youtube/stats"`. Exit `0`.
- **Screenshot.** Run `scripts/drive.sh "$STATE" screenshot /getting-started "$EVIDENCE/getting-started.png"`.
- **Proof.** Retain HTML, status, exit, screenshot. Do not call the live API URLs shown on the page.

## Gotchas

- Example URLs point at `https://api.socialkit.dev`. Fetching them is not local verification and may consume real quota. Never use a real access key here.
- Placeholder text `<your-access-key>` in the MDX is expected. Do not replace it with a secret in evidence files.
- Nextra may inject client bundles; assert on stable MDX strings, not minified script contents.
- Doctor already hits `/getting-started`; still re-fetch into the evidence dir so the proof is self-contained.
