# GPT 전달용 보고서: Supabase Postgres + Naver Object Storage 전환 작업

작성일: 2026-06-25  
프로젝트: `perpackage-marketing-leads`  
작업 목적: 기존 Vercel/SQLite/local/Vercel Blob 중심 구조를 Vercel Pro + Supabase Postgres + Naver Object Storage 기준으로 1차 운영 가능하게 전환한다.

## 1. 현재 작업 요약

이번 작업에서는 실제 secret 값을 사용하지 않고, 환경변수명만 기준으로 전환 구조를 반영했다.

완료한 큰 작업:

1. Prisma datasource를 SQLite에서 PostgreSQL로 전환
2. `DATABASE_URL` + `DIRECT_URL` 구조 적용
3. 기존 SQLite migration을 archive로 보존
4. PostgreSQL baseline migration 생성
5. 제작 사례 이미지 storage provider에 `naver-object-storage` 추가
6. 기존 `local`, `vercel-blob` provider 유지
7. `.env.example`을 Supabase/Naver 운영 기준으로 정리
8. deployment env checker 보강
9. storage/deployment 테스트 보강
10. 관련 README/docs 업데이트

## 2. 변경한 파일 목록

```txt
package.json
pnpm-lock.yaml
.env.example
README.md
prisma/schema.prisma
prisma/migrations/migration_lock.toml
src/lib/storage/portfolio-storage.ts
src/app/api/admin/uploads/portfolio/route.ts
src/lib/deployment-env.ts
src/test/portfolio-storage.test.ts
src/test/deployment-env.test.ts
src/test/plugo.test.ts
docs/portfolio-image-storage.md
docs/vercel-deployment-checklist.md
docs/postgresql-migration-plan.md
```

## 3. 새로 추가한 파일/폴더

```txt
prisma/migrations/20260625000000_init_postgres_baseline/migration.sql
prisma/migrations_sqlite_archive/
docs/gpt-handoff-supabase-naver-storage-transition-20260625.md
```

`prisma/migrations_sqlite_archive/`에는 기존 SQLite migration 13개가 보존되어 있다. 삭제한 것이 아니라 PostgreSQL migration과 섞이지 않도록 분리했다.

## 4. DB 전환 내용

`prisma/schema.prisma` datasource가 아래처럼 변경됐다.

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

운영 기준:

- `DATABASE_URL`: Supabase pooled connection string
- `DIRECT_URL`: Supabase direct connection string

주의:

- 기존 SQLite migration SQL은 Supabase Postgres에 직접 적용하면 안 된다.
- 새 Supabase 빈 DB에는 `20260625000000_init_postgres_baseline` migration을 적용해야 한다.
- 기존 SQLite 데이터는 자동 이전되지 않는다.
- 기존 데이터가 필요하면 별도 export/import 작업이 필요하다.

## 5. Storage 전환 내용

기존 storage adapter 구조는 유지했다.

기존 provider:

```txt
local
vercel-blob
```

추가 provider:

```txt
naver-object-storage
naver
```

관련 파일:

```txt
src/lib/storage/portfolio-storage.ts
src/app/api/admin/uploads/portfolio/route.ts
```

새 adapter 동작:

- AWS S3 compatible SDK인 `@aws-sdk/client-s3` 사용
- `PutObjectCommand`로 네이버 Object Storage에 업로드
- 저장 key 규칙은 기존 Blob과 동일하게 `portfolio/{filename}`
- 반환 구조는 기존과 동일하게 유지

응답 형태:

```ts
{
  url: string;
  filename: string;
  sizeBytes: number;
}
```

업로드 API 응답도 기존과 호환된다.

```json
{
  "url": "대표 이미지 URL",
  "thumbnailUrl": "썸네일 URL",
  "width": 1600,
  "height": 1200,
  "format": "webp",
  "originalSizeBytes": 3456789,
  "optimizedSizeBytes": 456789
}
```

## 6. 새 dependency

추가됨:

```txt
@aws-sdk/client-s3
```

설치 명령:

```bash
pnpm add @aws-sdk/client-s3
```

실제 설치는 Codex 환경의 Corepack pnpm으로 완료됐다.

## 7. 필요한 환경변수

### 필수

```env
DATABASE_URL=""
DIRECT_URL=""
ADMIN_PASSWORD=""
NEXT_PUBLIC_SITE_URL=""
SITE_ACCESS_ENABLED="false"
```

### `SITE_ACCESS_ENABLED=true`일 때 필수

```env
SITE_ACCESS_PASSWORD=""
SITE_ACCESS_SECRET=""
```

### Naver Object Storage 사용 시 필수

```env
PORTFOLIO_STORAGE_PROVIDER="naver-object-storage"
NAVER_OBJECT_STORAGE_ACCESS_KEY=""
NAVER_OBJECT_STORAGE_SECRET_KEY=""
NAVER_OBJECT_STORAGE_BUCKET=""
NAVER_OBJECT_STORAGE_ENDPOINT="https://kr.object.ncloudstorage.com"
NAVER_OBJECT_STORAGE_REGION="kr-standard"
NAVER_OBJECT_STORAGE_PUBLIC_BASE_URL=""
```

### 선택

```env
NEXT_PUBLIC_KAKAO_CHANNEL_URL=""
LEAD_NOTIFICATION_WEBHOOK_URL=""
QUOTE_RESPONSE_WEBHOOK_URL=""
```

### Plugo 사용 시 선택

```env
PLUGO_API_BASE_URL=""
PLUGO_REQUESTS_PATH="/requests"
PLUGO_API_KEY=""
PLUGO_SECRET_KEY=""
PLUGO_API_KEY_HEADER_NAME="X-API-Key"
PLUGO_SECRET_KEY_HEADER_NAME="X-Secret-Key"
PLUGO_FORWARD_QUERY_KEYS="page,limit,offset,cursor,status,from,to,startDate,endDate,createdFrom,createdTo,updatedFrom,updatedTo,sort,order,q"
PLUGO_TIMEOUT_MS="10000"
```

### 삭제 가능 후보

현재 코드에서 실제 사용하지 않는다.

```env
BLOB_STORE_ID=""
BLOB_WEBHOOK_PUBLIC_KEY=""
```

## 8. Vercel에 입력해야 할 Production 변수

```env
DATABASE_URL=""
DIRECT_URL=""
ADMIN_PASSWORD=""
NEXT_PUBLIC_SITE_URL="https://운영도메인"
SITE_ACCESS_ENABLED="false 또는 true"
SITE_ACCESS_PASSWORD=""
SITE_ACCESS_SECRET=""

PORTFOLIO_STORAGE_PROVIDER="naver-object-storage"
NAVER_OBJECT_STORAGE_ACCESS_KEY=""
NAVER_OBJECT_STORAGE_SECRET_KEY=""
NAVER_OBJECT_STORAGE_BUCKET=""
NAVER_OBJECT_STORAGE_ENDPOINT="https://kr.object.ncloudstorage.com"
NAVER_OBJECT_STORAGE_REGION="kr-standard"
NAVER_OBJECT_STORAGE_PUBLIC_BASE_URL=""

NEXT_PUBLIC_KAKAO_CHANNEL_URL=""
LEAD_NOTIFICATION_WEBHOOK_URL=""
QUOTE_RESPONSE_WEBHOOK_URL=""
```

## 9. Vercel에 입력해야 할 Preview 변수

Preview도 Production과 같은 구조가 필요하다.

다만 안전하게 테스트하려면:

```env
SITE_ACCESS_ENABLED="true"
SITE_ACCESS_PASSWORD="Preview 접근 비밀번호"
SITE_ACCESS_SECRET="Preview cookie signing secret"
```

를 반드시 넣는 것을 권장한다.

## 10. Supabase에서 확인해야 할 값

Supabase ORM → Prisma 화면에서 확인:

```txt
DATABASE_URL
DIRECT_URL
```

주의:

- `DATABASE_URL`은 pooled URL을 사용한다.
- `DIRECT_URL`은 migration용 direct URL을 사용한다.
- 실제 secret 값은 문서에 적지 않는다.

## 11. Naver Object Storage에서 확인해야 할 값

```txt
NAVER_OBJECT_STORAGE_ACCESS_KEY
NAVER_OBJECT_STORAGE_SECRET_KEY
NAVER_OBJECT_STORAGE_BUCKET
NAVER_OBJECT_STORAGE_ENDPOINT
NAVER_OBJECT_STORAGE_REGION
NAVER_OBJECT_STORAGE_PUBLIC_BASE_URL
```

확인할 점:

- bucket 생성 여부
- API 인증키 발급 여부
- public base URL이 실제 브라우저에서 접근 가능한지
- 업로드 후 `portfolio/...webp` 파일이 보이는지

## 12. 테스트 결과

실행 완료:

```txt
tsc --noEmit
pnpm test
pnpm lint
```

결과:

```txt
tsc --noEmit: 통과
pnpm test: 36 files, 160 tests 통과
pnpm lint: 통과, ESLint warning/error 없음
```

특이사항:

- `src/test/plugo.test.ts`에서 기존 mock 타입 추론 문제가 `tsc --noEmit`에서 드러나 작은 타입 보정을 했다.
- 런타임 로직 변경이 아니라 테스트 타입 안정화다.

## 13. 추가 검증 결과

이후 더미 Postgres URL로 `pnpm build`를 재실행해 통과를 확인했다.

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/perpackage?schema=public" \
DIRECT_URL="postgresql://user:password@localhost:5432/perpackage?schema=public" \
pnpm build
```

첫 번째 build에서는 `/sitemap.xml` 생성 단계에서 더미 DB 연결 실패 로그가 찍혔지만 exit code는 0이었다. 혼동을 줄이기 위해 `src/app/sitemap.ts`에 `export const dynamic = "force-dynamic";`을 추가했고, 이후 build는 Prisma DB 연결 오류 로그 없이 통과했다.

추가로 더미 운영 환경변수로 `pnpm deployment:check`를 실행했고 통과했다.

```txt
Deployment environment check passed.
Site access: disabled
Database mode: other
Plugo API: missing
Portfolio storage: naver-object-storage
```

Windows PowerShell build 실행 예:

```powershell
$env:DATABASE_URL = "postgresql://user:password@localhost:5432/perpackage?schema=public"
$env:DIRECT_URL = "postgresql://user:password@localhost:5432/perpackage?schema=public"
pnpm build
```

실제 Supabase secret 값은 사용하지 말고, 로컬 build 확인에는 더미 Postgres URL을 사용하면 된다.

## 14. 전환 후 기능 테스트 체크리스트

1. `pnpm install`
2. `pnpm deployment:check`
3. `pnpm test`
4. `pnpm build`
5. Supabase Postgres migration 적용
6. Prisma Client generate 확인
7. 관리자 로그인 확인
8. 문의 저장 API 확인
9. 관리자 리드 목록 확인
10. 제작 사례 등록 확인
11. 제작 사례 이미지 업로드 확인
12. Naver Object Storage에 파일 저장 확인
13. 고객-facing `/portfolio` 이미지 표시 확인
14. `local` fallback 확인
15. `vercel-blob` fallback 확인

## 15. 새 Vercel Preview 배포 전 수동 작업

1. GitHub 저장소 최신 상태 push
2. 새 Vercel Pro 계정에서 프로젝트 Import
3. Root Directory를 `perpackage-marketing-leads`로 설정
4. Environment Variables 입력
5. Supabase DB migration 적용
6. Naver Object Storage 변수 입력
7. Preview 배포
8. `/access` 확인
9. `/admin/login` 확인
10. 문의 저장 테스트
11. 제작 사례 이미지 업로드 테스트

## 16. 위험 요소

- 기존 SQLite 데이터는 자동으로 Supabase에 들어가지 않는다.
- 기존 local 이미지 `/uploads/portfolio/...`는 Naver Object Storage로 자동 이전되지 않는다.
- 기존 Vercel Blob 이미지도 Naver Object Storage로 자동 이전되지 않는다.
- `DIRECT_URL`이 빠지면 Prisma generate/migrate 단계에서 문제가 날 수 있다.
- `PORTFOLIO_STORAGE_PROVIDER=naver-object-storage`인데 Naver env가 빠지면 업로드가 실패한다.
- `NAVER_OBJECT_STORAGE_PUBLIC_BASE_URL`이 잘못되면 업로드는 되어도 public 화면에서 이미지가 안 보일 수 있다.
- 실제 Production 배포 전에는 반드시 Preview에서 문의 저장과 이미지 업로드를 확인해야 한다.

## 17. 다음 단계

다음 GPT가 할 일:

1. Supabase 실제 URL은 사용자에게 묻지 말고, Vercel 환경변수 입력 안내만 제공
2. 새 Vercel Preview 배포 후 사용자에게 테스트 경로 안내
3. Supabase migration 적용 여부 확인
4. Naver Object Storage 실제 업로드 테스트 안내
5. 기존 SQLite/local/Vercel Blob 데이터가 필요하면 별도 이관 절차로 분리

## 18. 금지 사항

- 실제 secret 값을 코드나 문서에 쓰지 말 것
- 고객 파일 업로드 기능까지 확장하지 말 것
- PDF/AI/SVG/DXF/ZIP 업로드를 이번 작업에 섞지 말 것
- 결제, 세금계산서, 전자계약 기능 추가 금지
- 기존 CRM/견적/포트폴리오 기능 대규모 재작성 금지
