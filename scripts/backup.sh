#!/usr/bin/env bash
# 주 1회 백업: 프로덕션 portfolio DB + public/uploads + content 를
# private 레포(portfolio-db)에 스냅샷. 프로덕션 DB는 pg_dump로 읽기만 한다.
set -euo pipefail

PROJECT_DIR="/home/ubuntu/portfolio"
BACKUP_REPO="/home/ubuntu/portfolio-db"
PG_CONTAINER="portfolio-postgres"
CHECK_DB="portfolio_restore_check"

# 검증용 임시 DB는 성공/실패 무관하게 항상 회수
cleanup() {
  docker exec -e CHECK_DB="$CHECK_DB" "$PG_CONTAINER" sh -c \
    'PGPASSWORD="$POSTGRES_PASSWORD" psql -U postgres -c "DROP DATABASE IF EXISTS $CHECK_DB;"' \
    >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "[backup] pg_dump → db.sql"
# shellcheck disable=SC2016  # $POSTGRES_PASSWORD 는 컨테이너 안에서 확장돼야 한다
docker exec "$PG_CONTAINER" sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U postgres --clean --if-exists --no-owner portfolio' \
  > "$BACKUP_REPO/db.sql"
[ -s "$BACKUP_REPO/db.sql" ] || { echo "[backup] ERROR: db.sql 비어있음" >&2; exit 1; }

echo "[backup] test-restore 검증 ($CHECK_DB)"
# shellcheck disable=SC2016
docker exec -e CHECK_DB="$CHECK_DB" "$PG_CONTAINER" sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" psql -U postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS $CHECK_DB;" -c "CREATE DATABASE $CHECK_DB;"'
# shellcheck disable=SC2016
docker exec -i -e CHECK_DB="$CHECK_DB" "$PG_CONTAINER" sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" psql -U postgres -d "$CHECK_DB" -v ON_ERROR_STOP=1 -f -' \
  < "$BACKUP_REPO/db.sql"
# shellcheck disable=SC2016
POST_COUNT=$(docker exec -e CHECK_DB="$CHECK_DB" "$PG_CONTAINER" sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" psql -U postgres -d "$CHECK_DB" -tAc "SELECT count(*) FROM \"Post\";"')
echo "[backup] 복원된 Post 행수: $POST_COUNT"
[ "${POST_COUNT:-0}" -ge 1 ] || { echo "[backup] ERROR: 복원검증 실패 (Post 0행)" >&2; exit 1; }

echo "[backup] rsync 미러"
rsync -a --delete "$PROJECT_DIR/public/uploads/" "$BACKUP_REPO/uploads/"
rsync -a --delete "$PROJECT_DIR/content/"        "$BACKUP_REPO/content/"

echo "[backup] git commit & push"
git -C "$BACKUP_REPO" add -A
if git -C "$BACKUP_REPO" diff --cached --quiet; then
  echo "[backup] 변경 없음 — 커밋 스킵"
else
  git -C "$BACKUP_REPO" commit -m "backup $(date -u +%Y-%m-%dT%H:%MZ)"
fi
git -C "$BACKUP_REPO" push
echo "[backup] 완료"
