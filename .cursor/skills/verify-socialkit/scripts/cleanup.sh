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

# Confirm the recorded PID tree is still our Next instance and still owns PORT.
# A recycled PID that merely contains "node" must not be killed.
instance_still_ours() {
  local root_pid="$1"
  local port="$2"
  local repo_root="${3:-}"
  python3 - "$root_pid" "$port" "$repo_root" <<'PY'
import os, pathlib, sys

root_pid = int(sys.argv[1])
port = int(sys.argv[2])
repo_root = sys.argv[3] if len(sys.argv) > 3 else ""


def cmdline(pid: int) -> str:
    try:
        return pathlib.Path(f"/proc/{pid}/cmdline").read_bytes().replace(b"\0", b" ").decode()
    except OSError:
        return ""


def ppid_of(pid: int):
    try:
        raw = pathlib.Path(f"/proc/{pid}/stat").read_text()
        rest = raw[raw.rfind(")") + 1 :].split()
        return int(rest[1])
    except (OSError, IndexError, ValueError):
        return None


def children(pid: int):
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


def walk(pid: int):
    seen, stack = [], [pid]
    while stack:
        cur = stack.pop()
        if cur in seen:
            continue
        seen.append(cur)
        stack.extend(children(cur))
    return seen


if not pathlib.Path(f"/proc/{root_pid}").exists():
    sys.exit(1)

tree = walk(root_pid)
nextish = [p for p in tree if "next" in cmdline(p).lower()]
if not nextish:
    sys.exit(1)
if repo_root:
    rooted = [p for p in nextish if repo_root in cmdline(p)]
    # Accept next-server children that omit the full path if a parent is rooted.
    if not rooted and not any(repo_root in cmdline(p) for p in tree):
        sys.exit(1)


def listening_inodes(path: str, port: int):
    found = set()
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
    # Process alive but not listening: still our next tree with matching repo path is enough
    # to tear down a crashed server; refuse pure node lookalikes without next.
    sys.exit(0 if nextish else 1)

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

sys.exit(0 if owned else 1)
PY
}

kill_tree() {
  local signal="$1"
  local pid="$2"
  local child
  while read -r child; do
    [[ -n "$child" ]] || continue
    kill_tree "$signal" "$child"
  done < <(ps -o pid= --ppid "$pid" 2>/dev/null || true)
  if kill -0 "$pid" 2>/dev/null; then
    kill "-$signal" "$pid" 2>/dev/null || true
  fi
}

ROOT=""
if [[ -f "$STATE/instance.env" ]]; then
  # shellcheck disable=SC1091
  source "$STATE/instance.env" || true
  ROOT="${ROOT:-}"
fi

if [[ -f "$STATE/pid" ]]; then
  PID="$(tr -d '[:space:]' <"$STATE/pid")"
  if [[ "$PID" =~ ^[0-9]+$ ]] && kill -0 "$PID" 2>/dev/null; then
    if instance_still_ours "$PID" "$PORT" "$ROOT"; then
      kill_tree TERM "$PID"
      for _ in $(seq 1 20); do
        if ! kill -0 "$PID" 2>/dev/null; then
          break
        fi
        sleep 0.25
      done
      if kill -0 "$PID" 2>/dev/null && instance_still_ours "$PID" "$PORT" "$ROOT"; then
        kill_tree KILL "$PID"
      fi
    else
      printf '%s\n' "cleanup: pid ${PID} is not our Next instance on port ${PORT}; leaving process alone, dropping stale state." >&2
    fi
  fi
fi

rm -rf "$STATE"
printf 'STOPPED port=%s evidence=%s\n' "$PORT" "$EVIDENCE_HINT"
