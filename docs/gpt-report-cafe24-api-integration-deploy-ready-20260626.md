# Cafe24 OAuth/Webhook 연동 배포 준비 보고서

작성일: 2026-06-26  
프로젝트: `perpackage-marketing-leads`

## 1. 작업 목적

기존 로컬에 구현된 고객 인쇄파일 업로드 허브와 Cafe24 OAuth/Webhook 연동 기반 코드를 GitHub/Vercel 배포 가능한 상태로 정리하기 위한 배포 준비 작업이다.

이번 작업에서는 새 기능을 추가하지 않고, 변경 파일 확인, secret 포함 여부 확인, 테스트/빌드, migration 적용 가능 여부, Vercel/Cafe24 설정값을 정리했다.

## 2. git status 확인 결과

현재 변경 범위는 아래 묶음으로 확인됐다.

- 고객 인쇄파일 업로드 허브 화면/API
- 관리자 업로드 목록/상세/검수 API
- Naver Object Storage 및 local fallback storage adapter
- Cafe24 OAuth 시작/callback API
- Cafe24 주문 Webhook 수신 API
- Cafe24 관리자 연동 상태 페이지
- Cafe24 주문 수동 동기화/연결 API
- Prisma schema 및 PostgreSQL migration
- 배포 환경변수 체크 유틸/테스트
- 관련 보고서 문서

주의:

- `git` 일부 명령은 Windows 소유권 보호로 `safe.directory` 옵션이 필요했다.
- 전역 git 설정은 변경하지 않고 명령마다 `-c safe.directory=...` 방식으로 확인했다.

## 3. commit/push 여부

이 보고서 작성 시점 기준:

- commit: 준비 대상
- push: commit 후 진행 대상

커밋 메시지 권장:

```txt
feat: add cafe24 oauth webhook upload linking foundation
```

커밋 전 확인한 내용:

- `.env`, `.env.local`은 커밋 대상에 포함되지 않았다.
- `.env.example`에는 실제 secret이 아니라 예시 변수명/빈 값만 포함되어 있다.
- Cafe24/Naver/Supabase secret 값은 코드에 하드코딩되어 있지 않다.

## 4. 테스트 명령 결과

`pnpm` 명령은 현재 PowerShell PATH에서 직접 실행되지 않았다. 대신 `node_modules/.bin`의 실행 파일로 동일한 검증을 수행했다.

실행 결과:

```txt
vitest run: 통과
38 test files / 186 tests passed

tsc --noEmit: 통과

prisma generate && next build: 통과
```

빌드 결과에 포함된 주요 route:

```txt
/upload
/upload/success
/admin/uploads
/admin/uploads/[id]
/admin/cafe24
/api/uploads/projects
/api/uploads/files
/api/uploads/local-object
/api/admin/uploads
/api/admin/uploads/[id]
/api/admin/uploads/[id]/files/[fileId]/download
/api/admin/uploads/[id]/status
/api/admin/uploads/[id]/review-log
/api/admin/uploads/[id]/link-order
/api/cafe24/oauth/start
/api/cafe24/oauth/callback
/api/cafe24/webhooks/orders
/api/admin/cafe24/orders/[orderId]/sync
```

`deployment:check` 결과:

```txt
실패
```

실패 이유:

- 현재 실행 shell에 운영용 환경변수가 없다.
- `DATABASE_URL`, `DIRECT_URL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`, `SITE_ACCESS_ENABLED`가 누락되어 있다.
- print-file storage provider가 Naver Object Storage 기준이라 Naver Object Storage 환경변수도 필요하다.

이 실패는 코드 오류가 아니라 로컬/현재 shell 환경변수 미설정에 따른 배포 전 체크 실패로 분류한다.

## 5. migration 적용 여부

Supabase migration은 아직 적용하지 않았다.

확인 명령:

```txt
prisma migrate status --schema prisma/schema.prisma
```

결과:

```txt
실패
Environment variable not found: DIRECT_URL
```

적용해야 할 migration:

```txt
prisma/migrations/20260625090000_add_print_file_upload_hub/migration.sql
prisma/migrations/20260626093000_add_upload_customer_contact_fields/migration.sql
prisma/migrations/20260626143000_add_cafe24_integration/migration.sql
```

운영 Supabase에 적용할 명령:

```bash
pnpm exec prisma migrate deploy
```

주의:

- Supabase/PostgreSQL용 `DATABASE_URL`, `DIRECT_URL`이 설정된 환경에서만 실행해야 한다.
- 기존 SQLite archive migration은 Supabase에 적용하지 않는다.
- 실제 DB password나 secret 값은 보고서/로그에 남기지 않는다.

## 6. Vercel 환경변수 등록 필요 목록

기존 운영 필수:

```env
DATABASE_URL=
DIRECT_URL=
ADMIN_PASSWORD=
NEXT_PUBLIC_SITE_URL=
SITE_ACCESS_ENABLED=
```

site access를 켤 경우:

```env
SITE_ACCESS_PASSWORD=
SITE_ACCESS_SECRET=
```

인쇄파일 업로드 허브:

```env
UPLOAD_MAX_FILE_SIZE_MB=
UPLOAD_MAX_ZIP_SIZE_MB=
UPLOAD_MAX_PROJECT_SIZE_MB=
UPLOAD_ALLOWED_EXTENSIONS=
UPLOAD_SIGNED_URL_EXPIRES_SECONDS=
PRINT_FILE_STORAGE_PROVIDER=
UPLOAD_LOCAL_STORAGE_DIR=
UPLOAD_LOCAL_STORAGE_SECRET=
ADMIN_UPLOAD_ACCESS_MODE=
```

Naver Object Storage:

```env
NAVER_OBJECT_STORAGE_ENDPOINT=
NAVER_OBJECT_STORAGE_REGION=
NAVER_OBJECT_STORAGE_BUCKET=
NAVER_OBJECT_STORAGE_ACCESS_KEY=
NAVER_OBJECT_STORAGE_SECRET_KEY=
```

Cafe24 OAuth/Webhook:

```env
CAFE24_MALL_ID=
CAFE24_CLIENT_ID=
CAFE24_CLIENT_SECRET=
CAFE24_REDIRECT_URI=
CAFE24_WEBHOOK_SECRET=
CAFE24_API_VERSION=
CAFE24_SCOPES=
```

현재 권장값:

```env
CAFE24_REDIRECT_URI=https://perpackage-marketing-leads.vercel.app/api/cafe24/oauth/callback
CAFE24_API_VERSION=2024-06-01
PRINT_FILE_STORAGE_PROVIDER=naver-object-storage
```

## 7. Cafe24 Developers 등록값

App URL:

```txt
https://perpackage-marketing-leads.vercel.app/admin/cafe24
```

Redirect URI:

```txt
https://perpackage-marketing-leads.vercel.app/api/cafe24/oauth/callback
```

Webhook URL:

```txt
https://perpackage-marketing-leads.vercel.app/api/cafe24/webhooks/orders
```

권장 권한:

```txt
Application: 읽기 + 쓰기
Order: 읽기
Customer: 읽기
Product: 읽기
Shipping: 읽기
Customer Identifier: 읽기
```

Webhook 이벤트:

```txt
1차 추천: 주문 생성
추후 필요 시: 주문 결제 완료
```

## 8. 배포 후 확인할 URL

Production 배포 후 확인:

```txt
https://perpackage-marketing-leads.vercel.app/upload
https://perpackage-marketing-leads.vercel.app/upload/success
https://perpackage-marketing-leads.vercel.app/admin/uploads
https://perpackage-marketing-leads.vercel.app/admin/cafe24
https://perpackage-marketing-leads.vercel.app/api/cafe24/oauth/start
https://perpackage-marketing-leads.vercel.app/api/cafe24/oauth/callback
https://perpackage-marketing-leads.vercel.app/api/cafe24/webhooks/orders
```

확인 기준:

- `/upload`가 404가 아니어야 한다.
- `/admin/uploads`는 관리자 로그인 보호가 유지되어야 한다.
- `/admin/cafe24`가 404가 아니어야 한다.
- `/api/cafe24/oauth/start`는 Cafe24 인증 URL로 이동해야 한다.
- callback은 Cafe24 승인 이후에만 정상 테스트가 가능하다.
- webhook은 Cafe24 Developers Webhook TEST로 검증한다.

## 9. 다음 QA 순서

1. GitHub main push 확인
2. Vercel production 자동 배포 확인
3. Vercel 환경변수 등록 확인
4. Supabase migration deploy 실행
5. `/upload` production 접근 확인
6. `/admin/uploads` 관리자 로그인/목록 확인
7. `/admin/cafe24` 접근 확인
8. Cafe24 Developers App URL/Redirect URI/Webhook URL 등록
9. Cafe24 OAuth 승인 테스트
10. token 저장 상태 확인
11. Webhook TEST 실행
12. Webhook event 저장 확인
13. Cafe24 주문 메모에 `PP-UP-YYYYMMDD-001` 형식 업로드 접수번호 입력
14. UploadProject와 Cafe24 주문 자동 연결 확인

## 10. 발견한 문제

- 현재 운영 배포 URL에서 `/upload`가 404로 보인 원인은 로컬 변경분이 GitHub/Vercel production에 아직 배포되지 않았기 때문으로 판단된다.
- 현재 shell에는 운영용 환경변수가 없어 `deployment:check`가 실패했다.
- 현재 Prisma migration 상태 확인은 `DIRECT_URL` 누락으로 실패했다.
- `pnpm`이 PATH에 직접 잡히지 않아 `node_modules/.bin` 실행 파일로 테스트했다.

## 11. 수정한 파일 목록

주요 코드:

```txt
.env.example
.gitignore
package.json
pnpm-lock.yaml
prisma/schema.prisma
src/app/globals.css
src/components/AdminNav.tsx
src/lib/deployment-env.ts
src/test/deployment-env.test.ts
src/lib/cafe24.ts
src/lib/upload-code.ts
src/lib/admin-uploads.ts
src/lib/print-file-upload-schema.ts
src/lib/storage/storage-adapter.ts
src/lib/storage/naver-object-storage.ts
src/lib/storage/local-print-file-storage.ts
src/lib/storage/upload-path.ts
```

주요 route:

```txt
src/app/upload/page.tsx
src/app/upload/success/page.tsx
src/app/admin/uploads/page.tsx
src/app/admin/uploads/[id]/page.tsx
src/app/admin/cafe24/page.tsx
src/app/api/uploads/projects/route.ts
src/app/api/uploads/files/route.ts
src/app/api/uploads/local-object/route.ts
src/app/api/admin/uploads/route.ts
src/app/api/admin/uploads/[id]/route.ts
src/app/api/admin/uploads/[id]/files/[fileId]/download/route.ts
src/app/api/admin/uploads/[id]/status/route.ts
src/app/api/admin/uploads/[id]/review-log/route.ts
src/app/api/admin/uploads/[id]/link-order/route.ts
src/app/api/cafe24/oauth/start/route.ts
src/app/api/cafe24/oauth/callback/route.ts
src/app/api/cafe24/webhooks/orders/route.ts
src/app/api/admin/cafe24/orders/[orderId]/sync/route.ts
```

Prisma migration:

```txt
prisma/migrations/20260625090000_add_print_file_upload_hub/migration.sql
prisma/migrations/20260626093000_add_upload_customer_contact_fields/migration.sql
prisma/migrations/20260626143000_add_cafe24_integration/migration.sql
```

테스트:

```txt
src/test/print-file-upload.test.ts
src/test/cafe24-integration.test.ts
src/test/deployment-env.test.ts
```

보고서:

```txt
docs/gpt-report-cafe24-api-integration-deploy-ready-20260626.md
docs/gpt-report-cafe24-api-integration-handoff-20260626.md
docs/gpt-report-customer-file-upload-qa-20260626.md
docs/gpt-report-upload-mvp-qa-before-upload-box-20260626.md
docs/gpt-report-upload-box-webhard-plan-20260626.md
```

## 12. 남은 위험 요소

- Supabase migration이 아직 운영 DB에 적용되지 않았다.
- Vercel 환경변수 등록 전에는 `/upload` DB 저장, 파일 업로드, Cafe24 OAuth/Webhook이 운영에서 정상 동작하지 않는다.
- Cafe24 Webhook 인증 header 이름은 Cafe24 Developers TEST로 실제 값을 확인해야 한다.
- Cafe24 OAuth는 실제 Cafe24 앱 등록과 Redirect URI 일치가 필요하다.
- Naver Object Storage 값 누락 시 인쇄파일 업로드/다운로드가 실패한다.
- local storage fallback은 운영 저장소가 아니므로 Vercel production에서는 Naver Object Storage 사용이 필요하다.

