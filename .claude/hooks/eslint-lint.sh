#!/usr/bin/env bash
# PostToolUse hook: lint edited JS/TS/Vue files with ESLint.
# Exits 2 with details on stderr so Claude sees and fixes lint errors.
set -uo pipefail

input=$(cat)

file_path=$(printf '%s' "$input" | node -e '
let data = "";
process.stdin.on("data", c => data += c);
process.stdin.on("end", () => {
  try {
    var j = JSON.parse(data);
    process.stdout.write((j.tool_input && j.tool_input.file_path) || "");
  } catch (e) { /* ignore malformed input */ }
});
')

case "$file_path" in
  *.js|*.mjs|*.ts|*.vue) ;;
  *) exit 0 ;;
esac
[ -f "$file_path" ] || exit 0

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
[ -x "node_modules/.bin/eslint" ] || exit 0

output=$(node_modules/.bin/eslint "$file_path" 2>&1)
status=$?

if [ "$status" -ne 0 ]; then
  {
    echo "ESLint reported issues in ${file_path}:"
    echo "$output"
    echo "Fix the lint errors above before continuing."
  } >&2
  exit 2
fi
exit 0
