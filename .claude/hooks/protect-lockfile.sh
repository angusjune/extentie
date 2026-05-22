#!/usr/bin/env bash
# PreToolUse hook: block hand edits to dependency lockfiles.
# Exit 2 cancels the tool call and tells Claude why.
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

case "$(basename "$file_path")" in
  yarn.lock|package-lock.json|pnpm-lock.yaml)
    {
      echo "Blocked edit to $(basename "$file_path"): lockfiles are generated, not edited by hand."
      echo "Use 'yarn add <pkg>' / 'yarn remove <pkg>' / 'yarn install' so the"
      echo "lockfile stays consistent with node_modules and package.json."
    } >&2
    exit 2
    ;;
esac
exit 0
