#!/usr/bin/env bash
# Stop one verification instance. Evidence under .verify-evidence/ and /tmp/verify-socialkit-evidence/ is kept.
set -euo pipefail

PORT="${1:-}"
STATE_ROOT="/tmp/verify-socialkit/instances"
EVIDENCE_HINT=".verify-evidence/ (repo) or /tmp/verify-socialkit-evidence/"

if [[ ! "$PORT" =~ ^[0-9]+$ ]]; then
  printf '%s\n' "usage: cleanup.sh PORT" >&2
  exit 2
fi

STATE="$STATE_ROOT/$PORT"
if [[ ! -d "$STATE" ]]; then
  printf 'STOPPED port=%s evidence=%s\n' "$PORT" "$EVIDENCE_HINT"
  exit 0
fi

kill_tree() {
  local signal="$1"
  local pid="$2"
  local child
  # Depth-first: children first, then parent.
  while read -r child; do
    [[ -n "$child" ]] || continue
    kill_tree "$signal" "$child"
  done < <(ps -o pid= --ppid "$pid" 2>/dev/null || true)
  if kill -0 "$pid" 2>/dev/null; then
    # Only signal if this pid still looks like our next tree (node/next).
    if python3 - "$pid" <<'PY'
import pathlib, sys
pid = sys.argv[1]
try:
    cmd = pathlib.Path(f"/proc/{pid}/cmdline").read_bytes().replace(b"\0", b" ").decode().lower()
except OSError:
    sys.exit(1)
# next-server child may not contain the string "next" in argv0 on all builds; accept node + next path or next-server
if "next" in cmd or "node" in cmd:
    sys.exit(0)
sys.exit(1)
PY
    then
      kill "-$signal" "$pid" 2>/dev/null || true
    fi
  fi
}

if [[ -f "$STATE/pid" ]]; then
  PID="$(tr -d '[:space:]' <"$STATE/pid")"
  if [[ "$PID" =~ ^[0-9]+$ ]] && kill -0 "$PID" 2>/dev/null; then
    kill_tree TERM "$PID"
    for _ in $(seq 1 20); do
      if ! kill -0 "$PID" 2>/dev/null; then
        break
      fi
      sleep 0.25
    done
    if kill -0 "$PID" 2>/dev/null; then
      kill_tree KILL "$PID"
    fi
  fi
fi

rm -rf "$STATE"
printf 'STOPPED port=%s evidence=%s\n' "$PORT" "$EVIDENCE_HINT"
