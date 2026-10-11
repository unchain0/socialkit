---
name: verify-socialkit
description: Verification skill for socialkit doc site (Next.js/Nextra, localhost:3000, web UI). Reach for it to prove doc-site changes.
disable-model-invocation: true
---

# verify-socialkit

**Surface:** docs web UI (Next.js/Nextra).
**Launch:** `yarn dev` → port 3000.
**Doctor:** curl -sf http://localhost:3000/ | grep -q SocialKit.
**Drive:** Playwright/CDP on /getting-started or /api-reference/index.
**Evidence:** `.cursor/skills/verify-socialkit/evidence/` (not git-ignored by default; skill says keep proof out of git — store outside repo if needed, here in skill dir untracked).
**Cleanup:** kill started process; do not delete evidence.

Secrets: none hardcoded; any tokens generated at runtime only.
