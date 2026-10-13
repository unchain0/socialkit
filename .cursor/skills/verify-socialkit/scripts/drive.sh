#!/usr/bin/env bash
# Drive one SocialKit docs verification instance over HTTP (and optional Chrome screenshot).
# Usage: drive.sh STATE_DIR COMMAND [args...]
set -euo pipefail

STATE_DIR="${1:-}"
COMMAND="${2:-}"
shift 2 2>/dev/null || true

if [[ -z "$STATE_DIR" || -z "$COMMAND" ]]; then
  printf '%s\n' "usage: drive.sh STATE_DIR COMMAND [args...]" >&2
  printf '%s\n' "commands: fetch PATH OUT | assert-contains FILE TEXT | screenshot PATH OUT.png | nav-check OUT.txt" >&2
  exit 2
fi

if [[ ! -f "$STATE_DIR/instance.env" ]]; then
  printf '%s\n' "missing ${STATE_DIR}/instance.env" >&2
  exit 1
fi

# shellcheck disable=SC1091
source "$STATE_DIR/instance.env"
: "${ORIGIN:?ORIGIN missing from instance.env}"

LOG="$STATE_DIR/drive.log"
mkdir -p "$STATE_DIR"
log() { printf '%s\n' "$*" | tee -a "$LOG" >/dev/null; printf '%s\n' "$*"; }

case "$COMMAND" in
  fetch)
    PATH_ARG="${1:-}"
    OUT="${2:-}"
    if [[ -z "$PATH_ARG" || -z "$OUT" ]]; then
      printf '%s\n' "usage: drive.sh STATE fetch PATH OUT" >&2
      exit 2
    fi
    mkdir -p "$(dirname "$OUT")"
    # PATH_ARG must start with /
    if [[ "$PATH_ARG" != /* ]]; then
      printf '%s\n' "path must start with /" >&2
      exit 2
    fi
    set +e
    code="$(curl --silent --output "$OUT" --write-out '%{http_code}' --max-time 30 "${ORIGIN}${PATH_ARG}")"
    curl_exit=$?
    set -e
    printf '%s' "${code:-000}" >"${OUT}.status"
    printf '%s\n' "$curl_exit" >"${OUT}.exit"
    log "fetch path=${PATH_ARG} status=${code:-000} exit=${curl_exit} out=${OUT}"
    if [[ "$curl_exit" -ne 0 || "$code" != "200" ]]; then
      exit 1
    fi
    ;;

  assert-contains)
    FILE="${1:-}"
    TEXT="${2:-}"
    if [[ -z "$FILE" || -z "$TEXT" ]]; then
      printf '%s\n' "usage: drive.sh STATE assert-contains FILE TEXT" >&2
      exit 2
    fi
    if [[ ! -f "$FILE" ]]; then
      printf '%s\n' "missing file: $FILE" >&2
      exit 1
    fi
    if ! grep -qF -- "$TEXT" "$FILE"; then
      log "assert-contains FAIL file=${FILE} text=${TEXT}"
      exit 1
    fi
    log "assert-contains OK file=${FILE} text=${TEXT}"
    ;;

  screenshot)
    PATH_ARG="${1:-}"
    OUT="${2:-}"
    if [[ -z "$PATH_ARG" || -z "$OUT" ]]; then
      printf '%s\n' "usage: drive.sh STATE screenshot PATH OUT.png" >&2
      exit 2
    fi
    mkdir -p "$(dirname "$OUT")"
    CHROME="${CHROME_BIN:-}"
    if [[ -z "$CHROME" ]]; then
      for c in /usr/bin/google-chrome-stable /usr/bin/google-chrome /usr/bin/chromium /usr/bin/chromium-browser; do
        if [[ -x "$c" ]]; then CHROME="$c"; break; fi
      done
    fi
    if [[ -z "$CHROME" ]]; then
      log "screenshot SKIP no chrome binary; writing marker instead"
      printf '%s\n' "screenshot skipped: chrome not found" >"${OUT}.skipped"
      exit 0
    fi
    # Headless screenshot of the docs page (local origin only)
    if [[ "$PATH_ARG" != /* ]]; then
      printf '%s\n' "path must start with /" >&2
      exit 2
    fi
    # Chrome often writes the PNG and then hangs in headless mode. Bound the
    # process, then judge success by the output file rather than Chrome's exit.
    PROFILE="$(mktemp -d /tmp/verify-socialkit-chrome.XXXXXX)"
    set +e
    timeout 40s "$CHROME" \
      --headless=new \
      --disable-gpu \
      --no-sandbox \
      --disable-dev-shm-usage \
      --user-data-dir="$PROFILE" \
      --window-size=1280,720 \
      --screenshot="$OUT" \
      "${ORIGIN}${PATH_ARG}" \
      >/dev/null 2>&1
    set -e
    rm -rf "$PROFILE"
    if [[ ! -s "$OUT" ]]; then
      log "screenshot FAIL empty output file"
      exit 1
    fi
    log "screenshot OK path=${PATH_ARG} out=${OUT}"
    ;;

  nav-check)
    OUT="${1:-}"
    if [[ -z "$OUT" ]]; then
      printf '%s\n' "usage: drive.sh STATE nav-check OUT.txt" >&2
      exit 2
    fi
    mkdir -p "$(dirname "$OUT")"
    : >"$OUT"
    fail=0
    check_one() {
      local path="$1" marker="$2"
      local tmp body code
      tmp="$(mktemp)"
      set +e
      code="$(curl --silent --output "$tmp" --write-out '%{http_code}' --max-time 30 "${ORIGIN}${path}")"
      curl_exit=$?
      set -e
      if [[ "$curl_exit" -eq 0 && "$code" == "200" ]] && grep -qF -- "$marker" "$tmp"; then
        printf 'OK status=%s exit=%s path=%s marker=%s\n' "$code" "$curl_exit" "$path" "$marker" >>"$OUT"
      else
        printf 'FAIL status=%s exit=%s path=%s marker=%s\n' "${code:-000}" "$curl_exit" "$path" "$marker" >>"$OUT"
        fail=1
      fi
      rm -f "$tmp"
    }
    # Markers taken from pages/*.mdx and theme footer "SocialKit Docs"
    check_one "/" "SocialKit"
    check_one "/getting-started" "Getting Started"
    check_one "/authentication" "Authentication"
    check_one "/api-reference" "API Reference"
    check_one "/api-reference/errors" "Error Reference"
    log "nav-check wrote ${OUT}"
    cat "$OUT"
    exit "$fail"
    ;;

  *)
    printf '%s\n' "unknown command: $COMMAND" >&2
    exit 2
    ;;
esac
