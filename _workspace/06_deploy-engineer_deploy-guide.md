# 배포 가이드

## 로컬 개발 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.example .env
# .env 수정:
#   NEXTAUTH_SECRET=랜덤_시크릿_키
#   ADMIN_PASSWORD=관리자_비밀번호

# 3. 개발 서버 실행
npm run dev
# → http://localhost:3000
```

---

## Docker 배포

### 1. 서버 사전 준비
```bash
# Docker + Docker Compose 설치
curl -fsSL https://get.docker.com | sh

# 프로젝트 클론
git clone <repo-url> /home/user/portfolio
cd /home/user/portfolio
```

### 2. 환경변수 설정
```bash
cp .env.example .env
nano .env
# 아래 항목 반드시 설정:
# NEXTAUTH_URL=https://yourdomain.com
# NEXTAUTH_SECRET=$(openssl rand -base64 32)
# ADMIN_PASSWORD=강력한_비밀번호
# NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### 3. nginx.conf 도메인 교체
```bash
sed -i 's/yourdomain.com/실제도메인.com/g' nginx.conf
```

### 4. SSL 인증서 발급 (Let's Encrypt)
```bash
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

### 5. 빌드 & 실행
```bash
docker compose up -d --build
# 로그 확인
docker compose logs -f app
```

### 6. 접속 확인
- 사이트: `https://yourdomain.com`
- 관리자: `https://yourdomain.com/ko/admin/login`

---

## Docker Volume 구조

```
./content/          ← 블로그 MDX, JSON 데이터 (컨테이너 재시작 후에도 보존)
./public/uploads/   ← 업로드 이미지 (컨테이너 재시작 후에도 보존)
```

---

## 업데이트 배포

```bash
git pull
docker compose up -d --build
```

---

## 백업

```bash
# 콘텐츠 백업
tar -czf backup-$(date +%Y%m%d).tar.gz content/ public/uploads/
```

---

## GitHub Actions CI

`.github/workflows/ci.yml` — PR 시 자동 실행:
1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run build`
