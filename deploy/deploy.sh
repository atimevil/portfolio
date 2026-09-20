#!/usr/bin/env bash
# 운영 서버 배포 스크립트. GitHub Actions가 SSH(forced command)로 호출한다.
#
# 설치:  mkdir -p ~/deploy && cp deploy/deploy.sh ~/deploy/deploy.sh && chmod 700 ~/deploy/deploy.sh
# 호출:  ssh <배포키> ubuntu@서버 <커밋 SHA 40자>        (SSH_ORIGINAL_COMMAND로 전달됨)
# 수동:  ~/deploy/deploy.sh <커밋 SHA>                    (SHA 생략 시 origin/master 최신)
#
# 안전장치
#  - 인자는 40자리 소문자 16진수 SHA만 받는다 (임의 명령 실행 불가)
#  - origin/master의 조상 커밋만 배포한다
#  - 새 Prisma 마이그레이션이 들어 있으면 배포하지 않고 중단한다 (운영 DB 변경은 사람이 확인)
#  - 이 스크립트는 app 서비스만 교체한다. nginx·postgres는 건드리지 않는다
#  - 헬스체크에 실패하면 이전 이미지로 자동 롤백한다 (HEALTH_PATHS로 경로를 바꿔 롤백을 시험할 수 있다)
set -euo pipefail

REPO=/home/ubuntu/portfolio
LOCK=/tmp/portfolio-deploy.lock
IMAGE=portfolio-app
ROLLBACK_TAG="${IMAGE}:rollback"

log() { printf '[deploy %s] %s\n' "$(date +%H:%M:%S)" "$*"; }
die() { log "중단: $*"; exit 1; }

# 동시에 두 번 돌지 않게 잠근다
exec 9>"$LOCK"
flock -n 9 || die "다른 배포가 진행 중입니다"

REQ="${SSH_ORIGINAL_COMMAND:-${1:-}}"
if [ -n "$REQ" ] && ! [[ "$REQ" =~ ^[0-9a-f]{40}$ ]]; then
  die "인자는 40자리 커밋 SHA여야 합니다"
fi

cd "$REPO"
git fetch --quiet origin master
TARGET="${REQ:-$(git rev-parse origin/master)}"

git cat-file -e "${TARGET}^{commit}" 2>/dev/null || die "알 수 없는 커밋입니다: $TARGET"
git merge-base --is-ancestor "$TARGET" origin/master || die "origin/master에 없는 커밋입니다: $TARGET"

CURRENT="$(git rev-parse HEAD)"
if [ "$CURRENT" = "$TARGET" ] && [ -z "${FORCE_REBUILD:-}" ]; then
  log "이미 $TARGET 입니다. 배포할 변경이 없습니다 (강제하려면 FORCE_REBUILD=1)"
  exit 0
fi

# 새 마이그레이션이 있으면 자동 배포하지 않는다. 앱이 옛 스키마로 뜨는 걸 막기 위해서다.
if [ -z "${ALLOW_MIGRATIONS:-}" ] && git cat-file -e "${CURRENT}^{commit}" 2>/dev/null; then
  NEW_MIG="$(git diff --name-only --diff-filter=A "$CURRENT" "$TARGET" -- prisma/migrations | grep migration.sql || true)"
  if [ -n "$NEW_MIG" ]; then
    printf '%s\n' "$NEW_MIG"
    die "새 마이그레이션이 있습니다. 서버에서 'npx prisma migrate deploy'를 확인·실행한 뒤 ALLOW_MIGRATIONS=1 $0 $TARGET 로 배포하세요"
  fi
fi

log "코드 갱신: ${CURRENT:0:7} → ${TARGET:0:7}"
git merge --ff-only "$TARGET" >/dev/null || die "fast-forward 실패. 서버 작업트리의 미커밋 변경과 충돌했을 수 있습니다"

# 롤백용으로 지금 돌고 있는 이미지를 태그해 둔다
PREV_ID="$(docker inspect portfolio --format '{{.Image}}' 2>/dev/null || true)"
if [ -n "$PREV_ID" ]; then
  docker tag "$PREV_ID" "$ROLLBACK_TAG"
  log "롤백용 이미지 태그: $ROLLBACK_TAG ← ${PREV_ID:7:12}"
fi

log "이미지 빌드"
docker compose build app

log "app 교체 (nginx·postgres는 그대로)"
docker compose up -d --no-deps app

healthy() {
  # 컨테이너 안에서 앱이 직접 200을 주는지 확인한다 (외부 nginx/TLS와 무관)
  for path in ${HEALTH_PATHS:-/ /about /en /rss.xml}; do
    docker exec portfolio wget -q -O /dev/null -T 5 "http://127.0.0.1:3000${path}" 2>/dev/null || return 1
  done
}

log "헬스체크"
OK=""
for i in $(seq 1 20); do
  if healthy; then OK=1; break; fi
  sleep 3
done

if [ -z "$OK" ]; then
  log "헬스체크 실패 → 롤백"
  docker logs --tail 30 portfolio 2>&1 || true
  if [ -n "$PREV_ID" ]; then
    docker tag "$ROLLBACK_TAG" "${IMAGE}:latest"
    docker compose up -d --no-deps --no-build app
    git reset --keep "$CURRENT" >/dev/null 2>&1 || true
    die "롤백했습니다 (${CURRENT:0:7}). 원인은 위 로그를 확인하세요"
  fi
  die "롤백할 이전 이미지가 없습니다"
fi

log "완료: ${TARGET:0:7} 배포됨"
