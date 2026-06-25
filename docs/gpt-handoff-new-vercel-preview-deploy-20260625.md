# GPT Handoff: 새 Vercel Preview 배포 안내 및 검증

작성일: 2026-06-25  
프로젝트: PerPackage Marketing Lead Management System  
대상 폴더: `perpackage-marketing-leads`

## 1. 현재 상황 요약

`perpackage-homepage-preview.vercel.app/admin/login`은 404가 뜨는 것이 정상이다.

해당 URL은 홈페이지 프리뷰 프로젝트로 보이며, `perpackage-marketing-leads`의 관리자/CRM 라우트가 포함된 프로젝트가 아니다. 관리자, CRM, 리드 관리, 제작 사례 관리, 이미지 업로드 테스트는 별도의 Vercel 프로젝트로 `perpackage-marketing-leads` 폴더를 배포해야 한다.

## 2. 로컬 확인 결과

확인한 로컬 프로젝트 경로:

```text
C:\Users\inh78\OneDrive\문서\홈페이지 개발\perpackage-marketing-leads
```

확인된 주요 라우트 파일:

```text
src/app/access/page.tsx
src/app/admin/login/page.tsx
src/app/admin/portfolio/page.tsx
src/app/admin/portfolio/new/page.tsx
src/app/admin/portfolio/[id]/edit/page.tsx
src/app/portfolio/page.tsx
src/app/api/admin/uploads/portfolio/route.ts
```

확인된 Prisma 상태:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Postgres baseline migration:

```text
prisma/migrations/20260625000000_init_postgres_baseline/migration.sql
```

SQLite migration archive:

```text
prisma/migrations_sqlite_archive
```

주의:

현재 로컬 `perpackage-marketing-leads` 폴더 자체는 Git 저장소로 인식되지 않았다. `git status`가 실패했기 때문에 GitHub 저장소에 최신 코드가 올라갔는지는 이 로컬 폴더만으로 확정할 수 없다.

## 3. GitHub 확인 필요 항목

새 Vercel 프로젝트 import 전에 GitHub에서 아래를 확인해야 한다.

1. GitHub 저장소 안에 `perpackage-marketing-leads` 폴더가 있는지 확인한다.
2. 아래 파일들이 GitHub에 올라가 있는지 확인한다.

```text
perpackage-marketing-leads/package.json
perpackage-marketing-leads/pnpm-lock.yaml
perpackage-marketing-leads/prisma/schema.prisma
perpackage-marketing-leads/prisma/migrations/20260625000000_init_postgres_baseline/migration.sql
perpackage-marketing-leads/src/app/admin/login/page.tsx
perpackage-marketing-leads/src/app/api/admin/uploads/portfolio/route.ts
perpackage-marketing-leads/src/lib/storage/portfolio-storage.ts
perpackage-marketing-leads/.env.example
```

3. GitHub에 최신 코드가 없다면 먼저 push해야 한다.
4. 기존 홈페이지 프리뷰 저장소 또는 프로젝트와 혼동하지 말아야 한다.

## 4. Vercel 새 프로젝트 Import 기준

Vercel Pro 계정에서 새 프로젝트를 만든다.

권장 설정:

```text
Project Type: New Project
Import Source: GitHub Repository
Root Directory: perpackage-marketing-leads
Framework Preset: Next.js
Install Command: pnpm install
Build Command: pnpm run build
Output Directory: 기본값
```

중요:

- 기존 `perpackage-homepage-preview` 프로젝트에 붙이면 안 된다.
- 홈페이지 프로젝트와 CRM/관리자 프로젝트는 별도 Vercel 프로젝트로 관리한다.
- 로컬 `.vercel` 폴더는 기존 프로젝트 링크가 남아 있을 수 있다. CLI 배포를 쓸 경우 새 Vercel 프로젝트로 다시 `vercel link` 해야 한다.

## 5. Vercel Environment Variables

실제 secret 값은 코드나 문서에 쓰지 않는다. Vercel Dashboard에서 직접 입력한다.

위치:

```text
Vercel Project
→ Settings
→ Environment Variables
```

### 필수

```env
DATABASE_URL=
DIRECT_URL=
ADMIN_PASSWORD=
NEXT_PUBLIC_SITE_URL=
SITE_ACCESS_ENABLED=
```

### Preview 비공개 접근을 켤 경우 필수

```env
SITE_ACCESS_ENABLED=true
SITE_ACCESS_PASSWORD=
SITE_ACCESS_SECRET=
```

### Naver Object Storage 사용 시 필수

```env
PORTFOLIO_STORAGE_PROVIDER=naver-object-storage
NAVER_OBJECT_STORAGE_ACCESS_KEY=
NAVER_OBJECT_STORAGE_SECRET_KEY=
NAVER_OBJECT_STORAGE_BUCKET=
NAVER_OBJECT_STORAGE_ENDPOINT=
NAVER_OBJECT_STORAGE_REGION=
NAVER_OBJECT_STORAGE_PUBLIC_BASE_URL=
```

권장 기본값 예시:

```env
NAVER_OBJECT_STORAGE_ENDPOINT=https://kr.object.ncloudstorage.com
NAVER_OBJECT_STORAGE_REGION=kr-standard
```

### 선택

```env
NEXT_PUBLIC_KAKAO_CHANNEL_URL=
LEAD_NOTIFICATION_WEBHOOK_URL=
QUOTE_RESPONSE_WEBHOOK_URL=
```

### 사용하지 않아도 되는 후보

현재 코드에서 직접 사용하지 않는 후보:

```env
BLOB_STORE_ID
BLOB_WEBHOOK_PUBLIC_KEY
```

## 6. Supabase Postgres Baseline Migration

기존 SQLite migration을 Supabase Postgres에 적용하면 안 된다.

금지:

```text
prisma/migrations_sqlite_archive/*
```

적용 기준:

```text
prisma/migrations/20260625000000_init_postgres_baseline/migration.sql
```

Vercel 환경변수를 먼저 설정한 뒤, 배포 전 또는 배포 직후 아래 명령으로 Supabase DB에 baseline을 적용한다.

```bash
pnpm exec prisma migrate deploy
```

주의:

- `DATABASE_URL`은 Supabase pooled connection string을 사용한다.
- `DIRECT_URL`은 Prisma migration용 direct connection string을 사용한다.
- 기존 SQLite 데이터 이관은 이번 Preview 배포와 별도 작업이다.
- 빈 Supabase DB에 baseline schema를 먼저 만드는 것이 1차 운영 전환 기준이다.

## 7. Preview 배포 후 확인할 경로

새 Vercel Preview URL 기준으로 아래 경로를 확인한다.

```text
/access
/admin/login
/portfolio
```

예상 흐름:

1. `/access` 접속
2. 사이트 접근 비밀번호 입력
3. `/admin/login` 접속
4. 관리자 비밀번호 입력
5. `/admin/portfolio/new` 이동
6. 제작 사례 등록 및 이미지 업로드 테스트

## 8. 배포 후 기능 테스트 체크리스트

### 기본 접근

- `/access`가 열린다.
- 사이트 접근 비밀번호 입력 후 다음 화면으로 이동한다.
- `/admin/login`이 열린다.
- 관리자 비밀번호 입력 후 관리자 화면으로 이동한다.

### 문의/리드

- 고객 문의폼에서 테스트 문의를 저장한다.
- `/admin/leads`에서 테스트 리드가 보인다.
- 리드 상세 화면이 열린다.

### 제작 사례

- `/admin/portfolio` 제작 사례 목록이 열린다.
- `/admin/portfolio/new`에서 제작 사례를 등록한다.
- 필수값 입력 후 저장이 된다.
- `/portfolio`에서 공개 승인된 제작 사례가 표시된다.

### 이미지 업로드

- 제작 사례 대표 이미지 JPG, PNG, WebP 업로드를 테스트한다.
- 업로드 성공 후 이미지 URL이 입력된다.
- URL이 Naver Object Storage public URL 형태인지 확인한다.
- Naver Object Storage 버킷에 아래 파일이 생성됐는지 확인한다.

```text
portfolio/portfolio-...webp
portfolio/portfolio-...-thumb.webp
```

- 제작 사례 저장 후 `/portfolio` 또는 `/portfolio/[slug]`에서 이미지가 표시되는지 확인한다.

### Storage provider 판별

Naver Object Storage가 정상 적용된 경우:

```text
https://.../portfolio/portfolio-...webp
```

local provider로 잘못 동작한 경우:

```text
/uploads/portfolio/portfolio-...webp
```

이 경우 Vercel 환경변수 `PORTFOLIO_STORAGE_PROVIDER`와 Naver Object Storage 관련 변수를 다시 확인한다.

## 9. 로컬 검증 결과

더미 환경변수 기준으로 배포 환경 체크를 실행했다.

실행 명령:

```powershell
pnpm deployment:check
```

결과:

```text
Deployment environment check passed.
Site access: enabled
Database mode: other
Plugo API: missing
Portfolio storage: naver-object-storage
```

참고:

현재 PowerShell PATH에는 `pnpm`이 직접 잡혀 있지 않아, 로컬 Codex runtime의 Corepack shim으로 실행했다.

## 10. 위험 요소

1. GitHub 최신 여부 미확정
   - 로컬 폴더가 Git 저장소로 인식되지 않았다.
   - Vercel import 전에 GitHub 저장소에 최신 코드가 올라갔는지 반드시 확인해야 한다.

2. 실제 Supabase/Naver secret 미검증
   - 보안상 실제 secret 값을 사용하지 않았다.
   - Vercel 환경변수 입력 후 Preview build 로그를 확인해야 한다.

3. SQLite 데이터 자동 이관 없음
   - 기존 SQLite 데이터는 Supabase로 자동 이전되지 않는다.
   - 필요하면 별도 export/import 작업이 필요하다.

4. 사이트 접근 보호
   - `SITE_ACCESS_ENABLED=true`이면 고객도 접근 비밀번호 없이는 문의폼과 견적 공유 링크를 볼 수 없다.
   - Preview에는 적합하지만 실제 공개 운영 전에는 설정을 다시 확인해야 한다.

5. 이미지 파일 마이그레이션
   - 기존 local/Vercel Blob 이미지가 있다면 Naver Object Storage로 자동 이동되지 않는다.
   - 기존 이미지 마이그레이션은 별도 작업이다.

## 11. 다음 GPT가 해야 할 일

1. GitHub 저장소에서 `perpackage-marketing-leads` 폴더 최신 여부를 확인한다.
2. Vercel Pro 계정에서 새 프로젝트를 import한다.
3. Root Directory를 반드시 `perpackage-marketing-leads`로 지정한다.
4. Vercel Environment Variables를 Preview 기준으로 먼저 입력한다.
5. Supabase DB에 Postgres baseline migration을 적용한다.
6. Preview 배포 후 `/access`, `/admin/login`, `/portfolio`를 확인한다.
7. 관리자 로그인 후 제작 사례 이미지 업로드가 Naver Object Storage로 저장되는지 테스트한다.

## 12. 이번 작업에서 하지 않은 것

- 고객 파일 업로드 기능 추가 없음
- 결제 기능 추가 없음
- 세금계산서 기능 추가 없음
- 전자계약 기능 추가 없음
- CRM/견적/포트폴리오 대규모 재작성 없음
- 실제 secret 값 사용 또는 출력 없음
- DB schema 추가 변경 없음
- 새 migration 생성 없음

