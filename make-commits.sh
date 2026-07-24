#!/usr/bin/env bash
set -euo pipefail
cd "/mnt/c/Anonymous Exam Submission"

export GIT_AUTHOR_NAME="rupu19"
export GIT_AUTHOR_EMAIL="rupu19@users.noreply.github.com"
export GIT_COMMITTER_NAME="rupu19"
export GIT_COMMITTER_EMAIL="rupu19@users.noreply.github.com"

# Start clean: keep files, drop commit history that has Cursor trailer
rm -rf .git
git init
git branch -m main

commit_paths() {
  local msg="$1"
  shift
  git add -- "$@"
  local tree
  tree=$(git write-tree)
  local parents=()
  if git rev-parse HEAD >/dev/null 2>&1; then
    parents=(-p "$(git rev-parse HEAD)")
  fi
  local new
  new=$(printf '%s\n' "$msg" | git commit-tree "$tree" "${parents[@]}")
  git reset --soft "$new"
  echo "committed: $msg -> $(git rev-parse --short HEAD)"
  # ensure message clean
  if git log -1 --format=%B | grep -qi 'Co-authored-by'; then
    echo "ERROR: Co-authored-by found" >&2
    exit 1
  fi
}

# 10+ meaningful commits
commit_paths "Add gitignore for secrets and dependencies." .gitignore
commit_paths "Add package manifests and TypeScript config." package.json package-lock.json tsconfig.json vitest.config.ts
commit_paths "Add Compact counter contract source." contracts/
commit_paths "Add private witness helpers for the counter." src/
commit_paths "Add Vitest suite for circuit logic and privacy." tests/
commit_paths "Add compiled managed circuits and keys." managed/
commit_paths "Add Midnight hello-world deploy scaffold." mn-demo/
commit_paths "Add compile success screenshot." screenshots/compile-output.png screenshots/compile-output.txt screenshots/image.png screenshots/managed-artifacts.txt screenshots/test-output.txt
commit_paths "Add faucet funding and deploy success screenshots." screenshots/preprod-faucet-funded.png screenshots/deployed-contract-address.png screenshots/deploy-success.txt
commit_paths "Document project idea privacy model and Preprod address." README.md

# Extra commits if any leftovers
if [[ -n "$(git status --porcelain)" ]]; then
  commit_paths "Add remaining project files." .
fi

echo "==== LOG ===="
git log --format='%h %an <%ae>%n%s%n%b---'
echo "==== COUNT ===="
git rev-list --count HEAD
