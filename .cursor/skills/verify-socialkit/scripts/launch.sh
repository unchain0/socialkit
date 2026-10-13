#!/usr/bin/env bash
# Start one isolated SocialKit docs (Next.js/Nextra) instance and wait until / is ready.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
STATE_ROOT="/tmp/verify-socialkit/instances"
NEXT_BIN="$ROOT/node_modules/next/dist/bin/next"

if [[ ! -f "$NEXT_BIN" ]]; then
  printf '%s\n' "Next.js is not installed. From ${ROOT} run:" "yarn install --frozen-lockfile" >&2
  exit 1
fi

mkdir -p "$STATE_ROOT"
PORT=""
STATE_DIR=""
for candidate in $(seq 4310 4390); do
  if ! mkdir "$STATE_ROOT/$candidate" 2>/dev/null; then
    continue
  fi
  if python3 - "$candidate" <<'PY'
import socket, sys
port = int(sys.argv[1])
probe = socket.socket()
try:
    probe.bind(("127.0.0.1", port))
except OSError:
    sys.exit(1)
finally:
    probe.close()
PY
  then
    PORT="$candidate"
    STATE_DIR="$STATE_ROOT/$candidate"
    break
  fi
  rmdir "$STATE_ROOT/$candidate" 2>/dev/null || true
done

if [[ -z "$PORT" ]]; then
  printf '%s\n' "No free verification port between 4310 and 4390." >&2
  exit 1
fi

on_exit() {
  local status=$?
  if [[ "$status" -ne 0 && -n "${STATE_DIR:-}" && -d "${STATE_DIR}" ]]; then
    "$SCRIPT_DIR/cleanup.sh" "$PORT" || true
  fi
}
trap on_exit EXIT

ORIGIN="http://127.0.0.1:${PORT}"
mkdir -p "$STATE_DIR"
chmod 700 "$STATE_DIR"

# Start next directly (no subshell) so $! is the node process that runs next/dist/bin/next.
cd "$ROOT"
PORT="$PORT" NODE_ENV=development \
  node "$NEXT_BIN" dev --hostname 127.0.0.1 --port "$PORT" \
  >"$STATE_DIR/server.log" 2>&1 &
echo $! >"$STATE_DIR/pid"
PID="$(tr -d '[:space:]' <"$STATE_DIR/pid")"

cat >"$STATE_DIR/instance.env" <<EOF
PORT=${PORT}
ORIGIN=${ORIGIN}
PID=${PID}
ROOT=${ROOT}
NEXT_BIN=${NEXT_BIN}
EOF
chmod 600 "$STATE_DIR/instance.env"

BODY="$(mktemp)"
for _ in $(seq 1 90); do
  if ! kill -0 "$PID" 2>/dev/null; then
    printf '%s\n' "next dev exited during startup. Log follows." >&2
    tail -n 80 "$STATE_DIR/server.log" >&2 || true
    rm -f "$BODY"
    exit 1
  fi
  code="$(curl --silent --output "$BODY" --write-out '%{http_code}' --max-time 2 "$ORIGIN/" || true)"
  if [[ "$code" == "200" ]] && grep -q 'SocialKit' "$BODY" 2>/dev/null; then
    rm -f "$BODY"
    trap - EXIT
    printf 'INSTANCE port=%s origin=%s state=%s\n' "$PORT" "$ORIGIN" "$STATE_DIR"
    exit 0
  fi
  sleep 1
done

rm -f "$BODY"
printf '%s\n' "Timed out waiting for ${ORIGIN}/. Log follows." >&2
tail -n 80 "$STATE_DIR/server.log" >&2 || true
exit 1
