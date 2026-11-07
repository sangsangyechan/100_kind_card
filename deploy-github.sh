#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
command -v gh >/dev/null || { echo 'GitHub CLI(gh)를 먼저 설치해 주세요.'; exit 1; }
gh auth status >/dev/null 2>&1 || { echo 'gh auth login으로 GitHub에 로그인한 뒤 다시 실행해 주세요.'; exit 1; }
repo_name="${1:-positive-cards-100}"
[[ "$repo_name" =~ ^[A-Za-z0-9._-]+$ ]] || { echo '저장소 이름을 확인해 주세요.'; exit 1; }
repo_owner="$(gh api user --jq .login)"
if gh repo view "$repo_owner/$repo_name" >/dev/null 2>&1; then
  echo '같은 이름의 저장소가 이미 있습니다. 기존 저장소를 보호하기 위해 중단합니다. 다른 이름을 인수로 지정해 주세요.'
  exit 1
fi
[[ ! -d .git ]] || { echo '이미 Git 저장소입니다. 기존 저장소 상태를 확인해 주세요.'; exit 1; }
git init -b main
git add .
git -c user.name="$repo_owner" -c user.email="$repo_owner@users.noreply.github.com" commit -m 'Create 100 positive cards'
gh repo create "$repo_owner/$repo_name" --public --source . --remote origin --push
gh api --method POST "repos/$repo_owner/$repo_name/pages" -f build_type=workflow >/dev/null
gh workflow run pages.yml --repo "$repo_owner/$repo_name" --ref main
echo '배포를 시작했습니다. 저장소 Actions에서 완료 상태를 확인해 주세요.'
gh api "repos/$repo_owner/$repo_name/pages" --jq .html_url
