# Introduction

Introduction is the docs home page. It welcomes readers, names what SocialKit can do, and is the default landing route
after launch.

## Sub-features

- `intro-open` loads `/` with HTTP 200.
- `intro-identity` shows SocialKit branding in the rendered HTML.
- `intro-capabilities` lists video summaries, transcripts, and multi-platform support copy.
- `intro-nav` reaches Getting Started from the sidebar or direct route.

## How to get to it (user POV)

- Open the docs origin root in a browser (`http://127.0.0.1:<port>/`).
- Choose **Introduction** in the Nextra sidebar (label from `pages/_meta.js`: `index: 'Introduction'`).
- Follow an in-docs link that targets `/`.

## Driving it with drive.sh

Preconditions:

- Docs instance is healthy at `$ORIGIN` from `instance.env`.
- `scripts/doctor.sh $PORT` prints `READY`.

- **Open home.** Fetch the root. Run `scripts/drive.sh "$STATE" fetch / "$EVIDENCE/introduction.html"`. Exit code `0`,
  `$EVIDENCE/introduction.html.status` is `200`.
- **Confirm identity.** Assert branding. Run
  `scripts/drive.sh "$STATE" assert-contains "$EVIDENCE/introduction.html" "SocialKit"`. Exit code `0`.
- **Confirm welcome copy.** Assert the introduction heading text. Run
  `scripts/drive.sh "$STATE" assert-contains "$EVIDENCE/introduction.html" "Introduction"`. Exit code `0`.
- **Confirm capability bullets.** Assert a capability phrase from `pages/index.mdx`. Run
  `scripts/drive.sh "$STATE" assert-contains "$EVIDENCE/introduction.html" "Video Summaries"`. Exit code `0`.
- **Screenshot (optional).** Capture the rendered page. Run
  `scripts/drive.sh "$STATE" screenshot / "$EVIDENCE/introduction.png"`. Exit code `0`, or a `.skipped` marker if Chrome
  is absent.
- **Proof.** Keep `introduction.html`, `.status`, `.exit`, and optional `.png` under the evidence directory. Cleanup
  must not delete them.

## Gotchas

- Port `3000` is the human README default. Verification uses `4310–4390` only.
- The Logo component hydrates after mount; SSR HTML may omit the SVG briefly, but page text still contains `SocialKit`
  via title/footer/content.
- A bare HTTP 200 without the `SocialKit` marker can mean a foreign process on the port. Trust doctor, not the port
  number alone.
- External `Home Page` nav item in `_meta.js` points at `https://www.socialkit.dev`. Do not follow it during local
  verification.
