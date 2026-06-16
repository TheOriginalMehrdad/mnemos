#!/usr/bin/env bash
#
# add-notes.sh — make your Markdown files compatible with the ERUDITIO vault.
#
# It reads each .md file you give it, ensures it has proper frontmatter
# (title / tags / difficulty / language / source), and copies it into the
# vault under a Domain/Topic folder. ERUDITIO then auto-indexes it and
# generates flashcards within a second or two.
#
# Examples:
#   ./add-notes.sh notes/photosynthesis.md
#   ./add-notes.sh -d Biology -t Cells notes/*.md
#   ./add-notes.sh -d History ~/Documents/history-notes/      (a whole folder)
#   ./add-notes.sh -d Math -t Algebra --tags "groups,symmetry" gt.md
#
set -euo pipefail

# ---- defaults (override with flags) ----------------------------------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VAULT_DIR="${VAULT_DIR:-$SCRIPT_DIR/vault}"
DOMAIN="General"
TOPIC=""
LANG="en"
DIFFICULTY="3"
TAGS=""
SOURCE=""
DRY_RUN=0
INPUTS=()

usage() {
  sed -n '3,17p' "$0" | sed 's/^# \{0,1\}//'
  cat <<EOF

Options:
  -d, --domain NAME     Domain (top folder).            default: General
  -t, --topic NAME      Topic (sub-folder).             default: none
      --tags "a,b,c"    Comma-separated tags.
      --difficulty N    1-5.                            default: 3
      --lang CODE       Language code, e.g. en, de.     default: en
      --source URL      Where the note came from.
      --vault PATH      Vault folder.                   default: $VAULT_DIR
  -n, --dry-run         Show what would happen, write nothing.
  -h, --help            This help.
EOF
}

# ---- parse arguments -------------------------------------------------------
while [ $# -gt 0 ]; do
  case "$1" in
    -d|--domain)     DOMAIN="$2"; shift 2 ;;
    -t|--topic)      TOPIC="$2"; shift 2 ;;
    --tags)          TAGS="$2"; shift 2 ;;
    --difficulty)    DIFFICULTY="$2"; shift 2 ;;
    --lang)          LANG="$2"; shift 2 ;;
    --source)        SOURCE="$2"; shift 2 ;;
    --vault)         VAULT_DIR="$2"; shift 2 ;;
    -n|--dry-run)    DRY_RUN=1; shift ;;
    -h|--help)       usage; exit 0 ;;
    -*)              echo "Unknown option: $1" >&2; usage; exit 1 ;;
    *)               INPUTS+=("$1"); shift ;;
  esac
done

if [ ${#INPUTS[@]} -eq 0 ]; then
  echo "Error: give me at least one .md file or a folder." >&2
  usage; exit 1
fi

# clamp difficulty to 1..5
case "$DIFFICULTY" in
  1|2|3|4|5) ;;
  *) echo "Warning: difficulty '$DIFFICULTY' invalid, using 3." >&2; DIFFICULTY="3" ;;
esac

# ---- helpers ---------------------------------------------------------------

# Turn "groups, symmetry" or "[groups, symmetry]" into a clean "[groups, symmetry]".
format_tags() {
  local raw="$1"
  raw="${raw#[}"; raw="${raw%]}"           # strip surrounding brackets if present
  [ -z "$raw" ] && { printf '[]'; return; }
  printf '%s' "$raw" | awk -F',' '{
    out=""
    for (i=1;i<=NF;i++){ t=$i; gsub(/^[ \t]+|[ \t]+$/,"",t); if(t!=""){ out=(out==""?t:out", "t) } }
    printf "[%s]", out
  }'
}

# Read one frontmatter value (case-insensitive key) from a frontmatter file.
fm_value() {
  local key="$1" file="$2"
  awk -v k="$key" '
    BEGIN{ IGNORECASE=1 }
    $0 ~ "^"k"[ \t]*:" { sub("^"k"[ \t]*:[ \t]*",""); print; exit }
  ' "$file"
}

# Make a filesystem-safe filename from a title.
safe_name() {
  printf '%s' "$1" | tr '/:\\*?"<>|' '_________' | sed 's/[[:space:]]\{1,\}/ /g; s/^ //; s/ $//'
}

# ---- core: process a single markdown file ----------------------------------
process_file() {
  local src="$1"
  local base; base="$(basename "$src")"
  local tmp_fm tmp_body
  tmp_fm="$(mktemp)"; tmp_body="$(mktemp)"

  # Split leading --- frontmatter --- from the body. If none, body = whole file.
  awk -v fmf="$tmp_fm" -v bodyf="$tmp_body" '
    BEGIN{ infm=0; seen=0 }
    NR==1 && $0 ~ /^---[ \t]*$/ { infm=1; seen=1; next }
    infm && $0 ~ /^---[ \t]*$/  { infm=0; next }
    infm { print >> fmf; next }
    { print >> bodyf }
  ' "$src"

  # title: frontmatter > first "# heading" > filename (without extension)
  local title; title="$(fm_value title "$tmp_fm")"
  if [ -z "$title" ]; then
    title="$(awk '/^#[ \t]+/{ sub(/^#[ \t]+/,""); print; exit }' "$tmp_body")"
  fi
  if [ -z "$title" ]; then
    title="$(printf '%s' "$base" | sed 's/\.md$//I; s/[-_]/ /g')"
  fi

  # merged values: keep existing frontmatter value if present, else our flag/default
  local v_tags v_diff v_lang v_source
  v_tags="$(fm_value tags "$tmp_fm")";        [ -z "$v_tags" ] && v_tags="$TAGS"
  v_diff="$(fm_value difficulty "$tmp_fm")";  [ -z "$v_diff" ] && v_diff="$DIFFICULTY"
  v_lang="$(fm_value language "$tmp_fm")";    [ -z "$v_lang" ] && v_lang="$LANG"
  v_source="$(fm_value source "$tmp_fm")";    [ -z "$v_source" ] && v_source="$SOURCE"

  # any other frontmatter keys the user already had → preserve them
  local extras; extras="$(grep -ivE '^[ \t]*(title|tags|difficulty|language|source)[ \t]*:' "$tmp_fm" 2>/dev/null | grep -vE '^[ \t]*$' || true)"

  # destination path
  local dest_dir="$VAULT_DIR/$DOMAIN"
  [ -n "$TOPIC" ] && dest_dir="$dest_dir/$TOPIC"
  local dest_file="$dest_dir/$(safe_name "$title").md"

  if [ "$DRY_RUN" -eq 1 ]; then
    echo "WOULD WRITE: $dest_file   (title: \"$title\", difficulty: $v_diff, tags: $(format_tags "$v_tags"))"
    rm -f "$tmp_fm" "$tmp_body"; return
  fi

  mkdir -p "$dest_dir"
  {
    echo "---"
    echo "title: $title"
    echo "tags: $(format_tags "$v_tags")"
    echo "difficulty: $v_diff"
    echo "language: $v_lang"
    [ -n "$v_source" ] && echo "source: $v_source"
    [ -n "$extras" ] && printf '%s\n' "$extras"
    echo "---"
    echo ""
    cat "$tmp_body"
  } > "$dest_file"

  rm -f "$tmp_fm" "$tmp_body"
  echo "✓ $base  ->  ${dest_file#$VAULT_DIR/}"
}

# ---- expand inputs (files + folders) and run -------------------------------
COUNT=0
for input in "${INPUTS[@]}"; do
  if [ -d "$input" ]; then
    while IFS= read -r f; do
      process_file "$f"; COUNT=$((COUNT+1))
    done < <(find "$input" -type f -name '*.md')
  elif [ -f "$input" ]; then
    case "$input" in
      *.md|*.markdown) process_file "$input"; COUNT=$((COUNT+1)) ;;
      *) echo "Skipping (not markdown): $input" >&2 ;;
    esac
  else
    echo "Not found: $input" >&2
  fi
done

echo ""
if [ "$DRY_RUN" -eq 1 ]; then
  echo "Dry run complete — $COUNT file(s) would be added. Re-run without -n to apply."
else
  echo "Done. Added $COUNT file(s) to the vault. ERUDITIO is indexing them now —"
  echo "open http://localhost:8080 and they'll appear with flashcards in a moment."
fi
