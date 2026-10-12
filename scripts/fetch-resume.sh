#!/usr/bin/env bash
#
# fetch-resume.sh
# Download the latest compiled PDF from a public Overleaf read-only link and
# place it in static/resume/ so Hugo serves it at /resume/<name>.pdf.
#
# Overleaf exposes no public "download PDF" URL for read links, so this
# performs the same handshake the web editor uses:
#   1. GET  /read/<token>          -> anonymous session cookie + CSRF token
#   2. POST /read/<token>/grant    -> resolves the project id
#   3. POST /project/<id>/compile  -> compiles and returns the output metadata
#   4. GET  <pdf url>              -> downloads the freshly compiled PDF
#
# These are internal, undocumented endpoints and may change without notice.
# If every attempt fails, the committed fallback copy is used instead so a
# transient Overleaf outage does not break the deploy. The script only fails
# (non-zero exit) when there is no usable fallback either.
#
# To refresh the fallback after updating the resume on Overleaf:
#   bash scripts/fetch-resume.sh && \
#     cp static/resume/Shivam-Lawale.pdf assets/resume/Shivam-Lawale.pdf
#
# Overridable via environment:
#   OVERLEAF_READ_URL  the read-only share link        (default: this repo's resume)
#   OUTPUT             destination path                (default: static/resume/Shivam-Lawale.pdf)
#   FALLBACK           committed last-known-good copy  (default: assets/resume/Shivam-Lawale.pdf)
#   RETRIES            number of full attempts         (default: 3)
#
set -euo pipefail

OVERLEAF_READ_URL="${OVERLEAF_READ_URL:-https://www.overleaf.com/read/fhzpmdkrwyhf#4462ad}"
OUTPUT="${OUTPUT:-static/resume/Shivam-Lawale.pdf}"
FALLBACK="${FALLBACK:-assets/resume/Shivam-Lawale.pdf}"
RETRIES="${RETRIES:-3}"

UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
BASE="https://www.overleaf.com"
CLSI_HOST="https://compiles.overleafusercontent.com"

log() { printf '[fetch-resume] %s\n' "$*"; }
die() { printf '[fetch-resume] ERROR: %s\n' "$*" >&2; exit 1; }

command -v curl    >/dev/null 2>&1 || die "curl is required"
command -v python3 >/dev/null 2>&1 || die "python3 is required"

# Token is the path segment after /read/ (fragments/queries stripped).
READ_TOKEN="$(printf '%s' "$OVERLEAF_READ_URL" | sed -E 's#^.*/read/([^/?#]+).*#\1#')"
[ -n "$READ_TOKEN" ] && [ "$READ_TOKEN" != "$OVERLEAF_READ_URL" ] \
  || die "could not parse the read token from: $OVERLEAF_READ_URL"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
JAR="$TMP/cookies.txt"

mkdir -p "$(dirname "$OUTPUT")"

# Reads the compile response and writes shell-parseable metadata to $TMP/meta.env.
parse_meta() {
  python3 - "$1" > "$TMP/meta.env" <<'PY'
import json, sys
d = json.load(open(sys.argv[1]))
build = ""
for o in d.get("outputFiles", []) or []:
    if str(o.get("path", "")).endswith(".pdf"):
        build = o.get("build", "")
        break
fields = {
    "status": d.get("status", ""),
    "build": build,
    "clsi": d.get("clsiServerId", ""),
    "domain": d.get("pdfDownloadDomain", ""),
    "prefix": d.get("outputUrlPrefix", ""),
}
for k, v in fields.items():
    print("%s=%s" % (k, v))
PY
}

fetch_and_download() {
  rm -f "$JAR" "$OUTPUT"

  # 1. Read page: establish an anonymous session and grab the CSRF token.
  local page="$TMP/read.html" csrf
  curl -fsSL --retry 2 --retry-delay 3 --max-time 60 \
    -c "$JAR" -b "$JAR" -A "$UA" "$BASE/read/$READ_TOKEN" -o "$page" || return 1
  csrf="$(grep -oE 'name="ol-csrfToken" content="[^"]+"' "$page" | sed -E 's/.*content="([^"]+)".*/\1/')"
  [ -n "$csrf" ] || { log "no CSRF token on the read page"; return 1; }

  # 2. Grant anonymous read access -> project id.
  local grant="$TMP/grant.json"
  curl -fsSL --retry 2 --retry-delay 3 --max-time 60 \
    -c "$JAR" -b "$JAR" -A "$UA" \
    -X POST "$BASE/read/$READ_TOKEN/grant" \
    -H "X-CSRF-Token: $csrf" \
    -H "Accept: application/json, text/plain, */*" \
    -H "Content-Type: application/json" \
    -H "Referer: $BASE/read/$READ_TOKEN" \
    --data '{}' -o "$grant" || return 1
  local project
  project="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1])).get("redirect","").rsplit("/",1)[-1])' "$grant")"
  [ -n "$project" ] || { log "no project id in the grant response"; return 1; }

  # 3. Compile (returns the build id, CLSI server id and download host).
  local comp="$TMP/compile.json"
  curl -fsSL --retry 2 --retry-delay 3 --max-time 180 \
    -c "$JAR" -b "$JAR" -A "$UA" \
    -X POST "$BASE/project/$project/compile?enable_pdf_caching=true" \
    -H "X-CSRF-Token: $csrf" \
    -H "Content-Type: application/json" \
    -H "Referer: $BASE/project/$project" \
    --data '{"draft":false,"check":"silent"}' -o "$comp" || return 1

  parse_meta "$comp"
  local status build clsi domain prefix
  status="$(sed -n 's/^status=//p' "$TMP/meta.env")"
  build="$(sed -n 's/^build=//p' "$TMP/meta.env")"
  clsi="$(sed -n 's/^clsi=//p' "$TMP/meta.env")"
  domain="$(sed -n 's/^domain=//p' "$TMP/meta.env")"
  prefix="$(sed -n 's/^prefix=//p' "$TMP/meta.env")"

  [ "$status" = "success" ] || { log "Overleaf compile status: '${status:-unknown}'"; return 1; }
  [ -n "$build" ] || { log "no PDF found in the compile output"; return 1; }

  # 4. Build the download URL. pdfDownloadDomain already carries any zone path
  #    (e.g. https://compiles.overleafusercontent.com/zone/c); fall back to
  #    host + outputUrlPrefix when it is absent.
  local url_base
  case "$domain" in
    http*) url_base="$domain" ;;
    /*)    url_base="$CLSI_HOST$domain" ;;
    *)     url_base="${domain:+$CLSI_HOST$domain}"; url_base="${url_base:-$CLSI_HOST$prefix}" ;;
  esac
  url_base="${url_base%/}"
  local pdf_url="$url_base/project/$project/build/$build/output/output.pdf?clsiserverid=$clsi"

  log "downloading PDF for project $project (build $build)"
  curl -fsSL --retry 2 --retry-delay 3 --max-time 120 \
    -b "$JAR" -A "$UA" "$pdf_url" -o "$OUTPUT" || return 1

  # Validate: real PDF signature and a sane size.
  local sig size
  sig="$(head -c 5 "$OUTPUT" 2>/dev/null || true)"
  [ "$sig" = "%PDF-" ] || { log "downloaded file is not a PDF (signature: '${sig:-none}')"; return 1; }
  size="$(wc -c < "$OUTPUT" | tr -d '[:space:]')"
  [ "$size" -gt 1000 ] || { log "downloaded PDF is suspiciously small ($size bytes)"; return 1; }

  log "saved $OUTPUT ($size bytes)"
  return 0
}

attempt=1
while [ "$attempt" -le "$RETRIES" ]; do
  log "attempt $attempt/$RETRIES"
  if fetch_and_download; then
    exit 0
  fi
  rm -f "$OUTPUT"
  attempt=$((attempt + 1))
  [ "$attempt" -le "$RETRIES" ] && sleep "$((attempt * 2))"
done

# Every attempt failed. Fall back to the committed last-known-good copy so the
# deploy still ships a working resume link.
if [ -f "$FALLBACK" ] && [ "$(head -c 5 "$FALLBACK" 2>/dev/null || true)" = "%PDF-" ]; then
  cp "$FALLBACK" "$OUTPUT"
  size="$(wc -c < "$OUTPUT" | tr -d '[:space:]')"
  log "WARNING: could not fetch a fresh resume from Overleaf; using committed fallback"
  log "saved $OUTPUT ($size bytes, fallback: $FALLBACK)"
  exit 0
fi

die "failed to fetch the resume after $RETRIES attempts and no usable fallback was found"
