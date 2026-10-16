#!/usr/bin/env bash
# Read-only check that a verification instance is the one we started and is worth driving.
set -euo pipefail

PORT="${1:-}"
STATE_ROOT="/tmp/verify-socialkit/instances"
if [[ ! "$PORT" =~ ^[0-9]+$ ]]; then
  printf '%s\n' "usage: doctor.sh PORT" >&2
  exit 2
fi

STATE="$STATE_ROOT/$PORT"
if [[ ! -f "$STATE/instance.env" || ! -f "$STATE/pid" ]]; then
  printf '%s\n' "No verification instance at ${STATE}." >&2
  exit 1
fi

# shellcheck disable=SC1091
source "$STATE/instance.env"
PID_FILE="$(tr -d '[:space:]' <"$STATE/pid")"
PID="${PID:-$PID_FILE}"

if [[ ! "$PID" =~ ^[0-9]+$ ]] || ! kill -0 "$PID" 2>/dev/null; then
  printf '%s\n' "Instance ${PORT} is not running (pid ${PID:-missing})." >&2
  exit 1
fi

# Confirm the recorded PID (or a descendant) is a next process, and that
# something in that process tree owns the listening socket for PORT.
python3 - "$PID" "$PORT" "${ROOT:-}" <<'PY'
import os, pathlib, sys

root_pid = int(sys.argv[1])
port = int(sys.argv[2])
repo_root = sys.argv[3] if len(sys.argv) > 3 else ""


def cmdline(pid: int) -> str:
    try:
        return pathlib.Path(f"/proc/{pid}/cmdline").read_bytes().replace(b"\0", b" ").decode()
    except OSError:
        return ""


def ppid_of(pid: int) -> int | None:
    try:
        # /proc/pid/stat: "pid (comm) state ppid ..." — comm may contain spaces.
        raw = pathlib.Path(f"/proc/{pid}/stat").read_text()
        rest = raw[raw.rfind(")") + 1 :].split()
        return int(rest[1])
    except (OSError, IndexError, ValueError):
        return None


def children(pid: int) -> list[int]:
    out = []
    try:
        for entry in pathlib.Path("/proc").iterdir():
            if not entry.name.isdigit():
                continue
            child = int(entry.name)
            if ppid_of(child) == pid:
                out.append(child)
    except OSError:
        pass
    return out


def walk(pid: int) -> list[int]:
    seen = []
    stack = [pid]
    while stack:
        cur = stack.pop()
        if cur in seen:
            continue
        seen.append(cur)
        stack.extend(children(cur))
    return seen


tree = walk(root_pid)
next_pids = [p for p in tree if "next" in cmdline(p).lower()]
if not next_pids:
    sys.exit(f"no next process found under pid {root_pid}")

# Prefer a next cmdline that still points at this repo when ROOT is known.
if repo_root:
    rooted = [p for p in next_pids if repo_root in cmdline(p)]
    if rooted:
        next_pids = rooted


def listening_inodes(path: str, port: int) -> set[str]:
    found: set[str] = set()
    p = pathlib.Path(path)
    if not p.exists():
        return found
    for line in p.read_text().splitlines()[1:]:
        parts = line.split()
        local, state, inode = parts[1], parts[3], parts[9]
        hexport = local.rsplit(":", 1)[1]
        if state == "0A" and int(hexport, 16) == port:
            found.add(inode)
    return found


inodes = listening_inodes("/proc/net/tcp", port) | listening_inodes("/proc/net/tcp6", port)
if not inodes:
    sys.exit(f"nothing is listening on port {port}")

owned = False
for pid in tree:
    fd_dir = pathlib.Path(f"/proc/{pid}/fd")
    if not fd_dir.exists():
        continue
    try:
        for entry in fd_dir.iterdir():
            try:
                target = os.readlink(entry)
            except OSError:
                continue
            if target.startswith("socket:[") and target[8:-1] in inodes:
                owned = True
                break
    except OSError:
        continue
    if owned:
        break

if not owned:
    sys.exit(f"process tree of {root_pid} does not own 127.0.0.1:{port}")
PY

ORIGIN="${ORIGIN:-http://127.0.0.1:$PORT}"
BODY="$(mktemp)"
cleanup_body() { rm -f "$BODY"; }
trap cleanup_body EXIT

fetch_ok() {
  local path="$1" marker="$2"
  local code=""
  local i
  for i in $(seq 1 15); do
    code="$(curl --silent --output "$BODY" --write-out '%{http_code}' --max-time 5 "${ORIGIN}${path}" || true)"
    if [[ "$code" == "200" ]] && grep -qF -- "$marker" "$BODY" 2>/dev/null; then
      return 0
    fi
    sleep 1
  done
  printf '%s\n' "GET ${path} failed or body missing '${marker}' (last http=${code})." >&2
  return 1
}

fetch_ok "/" "SocialKit"
fetch_ok "/getting-started" "Getting Started"

printf 'READY port=%s pid=%s origin=%s\n' "$PORT" "$PID" "$ORIGIN"
