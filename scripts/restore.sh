#!/usr/bin/env bash
# 백업 레포에서 portfolio DB + 업로드/아카이브를 복원. 파괴적(대상 덮어씀).
# 사용:   scripts/restore.sh <backup-repo-path>
# 테스트: TARGET_DB=portfolio_restore_rehearsal AUTO_CONFIRM=1 scripts/restore.sh <path>  (DB만, 파일 제외)
set -euo pipefail

BACKUP_REPO="${1:-}"
PROJECT_DIR="/home/ubuntu/portfolio"
PG_CONTAINER="portfolio-postgres"
TARGET_DB="${TARGET_DB:-portfolio}"

[ -n "$BACKUP_REPO" ] || { echo "사용법: $0 <backup-repo-path>" >&2; exit 2; }
[ -f "$BACKUP_REPO/db.sql" ] || { echo "ERROR: $BACKUP_REPO/db.sql 없음" >&2; exit 1; }

# shellcheck disable=SC2016  # $POSTGRES_PASSWORD/$TARGET_DB 는 컨테이너 안에서 확장돼야 한다
CURRENT=$(docker exec -e TARGET_DB="$TARGET_DB" "$PG_CONTAINER" sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" psql -U postgres -d "$TARGET_DB" -tAc "SELECT count(*) FROM \"Post\";"' 2>/dev/null || echo "?")
echo "복원 대상 DB : $TARGET_DB (현재 Post 행수: $CURRENT)"
echo "백업 소스    : $BACKUP_REPO/db.sql"
echo "!! 대상 DB를 백업 내용으로 덮어씁니다 !!"

if [ "${AUTO_CONFIRM:-}" != "1" ]; then
  read -r -p "계속하려면 'y' 입력: " ans
  [ "$ans" = "y" ] || { echo "취소됨"; exit 0; }
fi

echo "[restore] DB 복원 → $TARGET_DB"
# shellcheck disable=SC2016
docker exec -i -e TARGET_DB="$TARGET_DB" "$PG_CONTAINER" sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" psql -U postgres -d "$TARGET_DB" -v ON_ERROR_STOP=1' \
  < "$BACKUP_REPO/db.sql"

if [ "$TARGET_DB" = "portfolio" ]; then
  echo "[restore] 이미지·아카이브 복원"
  rsync -a "$BACKUP_REPO/uploads/" "$PROJECT_DIR/public/uploads/"
  rsync -a "$BACKUP_REPO/content/" "$PROJECT_DIR/content/"
fi
echo "[restore] 완료"
