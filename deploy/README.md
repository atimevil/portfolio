# 배포 · 운영 메모

운영 서버에서 사람이 한 번씩 해야 하는 것들. 앱은 Docker(standalone Next.js)로 돌고,
`REPO=/home/ubuntu/portfolio`, 앱 컨테이너 이름은 `portfolio`, `content/`는 호스트와
컨테이너가 공유하는 볼륨(`./content:/app/content`)이다. 경로가 다르면 아래 명령의 경로만 바꾼다.

## 배포는 어떻게 도는가

`master`에 푸시하면 GitHub Actions가 SSH(forced command)로 `deploy/deploy.sh <커밋 SHA>`를
호출한다. 스크립트가 `git merge --ff-only` → `docker compose build app` → `up -d app` →
헬스체크(실패 시 이전 이미지로 자동 롤백)를 한다. nginx·postgres는 안 건드린다.

서버에 설치된 `~/deploy/deploy.sh`는 저장소의 `deploy/deploy.sh` **복사본**이다.
스크립트를 고쳤으면 서버에도 복사해야 반영된다:

```bash
cp ~/portfolio/deploy/deploy.sh ~/deploy/deploy.sh
```

## 지금 해두면 좋은 것

### 1. 배포 스크립트 최신화 (한 번)

이 저장소의 `deploy.sh`에 "서버 `content/`가 수정돼 있어도 백업 후 배포를 진행"하는
처리가 들어갔다. 서버 복사본이 옛날 것이면 `/admin`에서 뭘 고친 뒤 배포가 멈출 수 있다.

```bash
cp ~/portfolio/deploy/deploy.sh ~/deploy/deploy.sh
```

### 2. GitHub 스타·포크 자동 갱신 크론 (한 번)

`scripts/fetch-github-stats.mjs`가 프로젝트들의 스타·포크를 받아
`content/github-stats.json`에 쓴다. 화면은 이 값을 쓰고, 파일이 없으면 `items.json`에
적어둔 값이 폴백으로 나온다. 의존성 0(node 18+ 내장 fetch), 앱 컨테이너 밖 호스트에서 돈다.

먼저 한 번 채우기:

```bash
cd ~/portfolio && node scripts/fetch-github-stats.mjs
```

매일 새벽 5시 30분 크론 등록:

```bash
( crontab -l 2>/dev/null; \
  echo "30 5 * * * cd /home/ubuntu/portfolio && /usr/bin/node scripts/fetch-github-stats.mjs >> /tmp/gh-stats.log 2>&1" \
) | crontab -
```

- `node` 경로는 `which node`로 확인해 바꾼다.
- 비공개 레포까지 세거나 rate limit(시간당 60회)이 걸리면 `GITHUB_TOKEN=<토큰>`을 크론 줄 앞에 붙인다. 공개 레포·하루 6개면 토큰 없이 충분하다.
- 로그: `/tmp/gh-stats.log`.

## content/ 볼륨에 있는 것

git으로 추적: `items.json`(프로젝트·이력), `settings.json`(프로필·메뉴).
git 밖(런타임 상태): `views.json`(조회수), `github-stats.json`(위 크론), `auth.json`(관리자 비밀번호 해시).

`auth.json`은 절대 커밋하지 않는다. 배포는 추적 파일만 git 버전으로 되돌리므로
비밀번호·조회수·스타 캐시는 배포로 사라지지 않는다.

**규칙:** 프로젝트·이력·설정은 로컬에서 고쳐 푸시한다. `/admin`에서 고치면 다음 배포 때
git 버전으로 덮이되(백업은 `deploy-backups/`에 남는다), 블로그 글은 Postgres라 영향이 없다.

## 자주 쓰는 것

```bash
# 앱 로그
docker logs -f --tail 50 portfolio

# 수동 재배포(변경 없어도 강제 빌드)
FORCE_REBUILD=1 ~/deploy/deploy.sh

# 새 Prisma 마이그레이션이 있을 때(스크립트가 배포를 막는다)
docker exec portfolio npx prisma migrate deploy   # 확인 후
ALLOW_MIGRATIONS=1 ~/deploy/deploy.sh <커밋 SHA>
```
