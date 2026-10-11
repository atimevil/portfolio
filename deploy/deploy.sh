#!/usr/bin/env bash
# 운영 서버 배포 스크립트. GitHub Actions가 SSH(forced command)로 호출한다. (CD 종단 시험 완료)
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

# content/items.json·settings.json은 git이 추적하면서 서버 /admin도 직접 쓴다.
# 운영 화면에서 고친 내용은 커밋되지 않은 로컬 수정으로 남는다. 예전엔 백업만 하고 git 버전으로
# 되돌렸는데, 그러면 배포할 때마다 어드민에서 넣은 수상·설정이 사이트에서 사라졌다.
# 이제는 백업 → 코드 갱신 → 운영 수정을 다시 얹는다. 들어오는 커밋도 같은 파일을 고쳤으면 3-way 병합하고,
# 병합이 깨끗하고 JSON으로 읽힐 때만 쓴다. 아니면 git 버전을 쓰고 백업 위치를 알린다.
DIRTY="$(git diff --name-only -- content)"
BACKUP=""
if [ -n "$DIRTY" ]; then
  BACKUP="$REPO/deploy-backups/content-$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$BACKUP"
  for f in $DIRTY; do
    cp -a "$REPO/$f" "$BACKUP/$(basename "$f")"
  done
  log "운영 화면에서 수정된 파일 백업: $BACKUP ($(echo $DIRTY | tr '\n' ' '))"
  git checkout -- content
fi

git merge --ff-only "$TARGET" >/dev/null || die "fast-forward 실패. 서버 작업트리의 미커밋 변경과 충돌했을 수 있습니다"

is_json() { python3 -c 'import json,sys; json.load(open(sys.argv[1]))' "$1" 2>/dev/null; }

# JSON 구조로 3-way 병합: 객체는 키별, id가 있는 객체 배열(items.json)은 id별로 합친다.
# 줄 단위 병합은 붙어 있는 두 키(예: 메뉴의 gallery·music)를 따로 고쳐도 충돌로 본다.
# 같은 값을 양쪽이 다르게 고쳤을 때만 실패(종료코드 1)한다.
json_merge() { # base ours theirs out
  python3 - "$@" <<'PY'
import json, sys
base, ours, theirs, out = sys.argv[1:5]
MISSING = object()
class Conflict(Exception): pass
def keyed(xs):
    return isinstance(xs, list) and all(isinstance(e, dict) and 'id' in e for e in xs)
def merge(b, o, t):
    if o == t: return o
    if o == b: return t
    if t == b: return o
    if all(isinstance(x, dict) for x in (b, o, t)):
        keys = list(t) + [k for k in o if k not in t]
        r = {k: merge(b.get(k, MISSING), o.get(k, MISSING), t.get(k, MISSING)) for k in keys}
        return {k: v for k, v in r.items() if v is not MISSING}
    if all(keyed(x) for x in (b, o, t)):
        B, O, T = ({e['id']: e for e in x} for x in (b, o, t))
        order = [e['id'] for e in t] + [e['id'] for e in o if e['id'] not in T]
        r = [merge(B.get(i, MISSING), O.get(i, MISSING), T.get(i, MISSING)) for i in order]
        return [v for v in r if v is not MISSING]
    raise Conflict
load = lambda p: json.load(open(p, encoding='utf-8'))
try:
    result = merge(load(base), load(ours), load(theirs))
except Conflict:
    sys.exit(1)
with open(out, 'w', encoding='utf-8') as fh:
    json.dump(result, fh, indent=2, ensure_ascii=False)  # lib/items.ts·settings.ts의 JSON.stringify(_, null, 2)와 같은 모양
PY
}

for f in $DIRTY; do
  saved="$BACKUP/$(basename "$f")"
  if git diff --quiet "$CURRENT" "$TARGET" -- "$f"; then
    cp -a "$saved" "$REPO/$f"
    log "운영 수정 유지: $f"
    continue
  fi
  # 양쪽이 같은 파일을 고쳤다: base=배포 전 커밋, ours=운영 수정, theirs=새 커밋
  tmp="$(mktemp)"; base="$(mktemp)"
  git show "$CURRENT:$f" > "$base"
  if json_merge "$base" "$saved" "$REPO/$f" "$tmp"; then
    cp "$tmp" "$REPO/$f"
    log "운영 수정과 새 커밋을 병합: $f"
  elif cp "$saved" "$tmp" && git merge-file -q "$tmp" "$base" "$REPO/$f" && is_json "$tmp"; then
    cp "$tmp" "$REPO/$f"
    log "운영 수정과 새 커밋을 줄 단위로 병합: $f"
  else
    log "⚠ $f 는 운영 수정과 새 커밋이 충돌해 새 커밋 버전을 씁니다. 운영 수정은 $saved 에 있습니다"
  fi
  rm -f "$tmp" "$base"
done

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
