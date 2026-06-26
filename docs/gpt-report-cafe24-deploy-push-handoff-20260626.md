# GPT 보고용: Cafe24 OAuth/Webhook 배포 준비 및 push 대기 상태

작성일: 2026-06-26  
프로젝트: `perpackage-marketing-leads`  
현재 브랜치: `main`

## 1. 현재 결론

Cafe24 OAuth/Webhook 연동 기반과 고객 인쇄파일 업로드 허브 변경분은 로컬에서 commit까지 완료됐다.

다만 GitHub `origin/main` push는 아직 진행되지 않았다. 외부 GitHub 원격 저장소의 `main` 브랜치로 변경분을 올리는 단계라 명시 승인이 필요해 중단된 상태다.

## 2. 현재 commit 상태

마지막 commit:

```txt
2a70d99 feat: add cafe24 oauth webhook upload linking foundation
```

작업 트리:

```txt
clean
```

즉, 로컬 변경분은 commit에 들어갔고, 아직 원격에는 올라가지 않았다.

## 3. push 상태

아직 push 안 됨.

다음 명령이 필요하다.

```bash
git push origin main
```

주의:

- 이 명령은 GitHub 원격 저장소 `origin`의 `main` 브랜치에 변경분을 올린다.
- push 후 Vercel production 자동 배포가 연결되어 있다면 새 배포가 시작될 수 있다.
- 사용자가 명시적으로 승인한 뒤 실행하는 것이 맞다.

## 4. 이번 commit에 포함된 핵심 기능

고객 인쇄파일 업로드 허브:

- `/upload`
- `/upload/success`
- 업로드 프로젝트 생성 API
- 파일 업로드 API
- local object fallback API
- Naver Object Storage adapter
- 업로드 파일 검증 로직

관리자 업로드 검수:

- `/admin/uploads`
- `/admin/uploads/[id]`
- 관리자 파일 다운로드 API
- 상태 변경 API
- 검수 로그 API
- 수정 요청/관리자 메모 구조

Cafe24 연동 기반:

- `/admin/cafe24`
- `GET /api/cafe24/oauth/start`
- `GET /api/cafe24/oauth/callback`
- `POST /api/cafe24/webhooks/orders`
- `POST /api/admin/cafe24/orders/[orderId]/sync`
- `POST /api/admin/uploads/[id]/link-order`
- Cafe24 token 저장 모델
- Cafe24 webhook event 저장 모델
- 업로드 접수번호 `PP-UP-YYYYMMDD-001` 추출/연결 구조

## 5. 검증 결과

로컬에서 통과한 검증:

```txt
vitest run: 통과
38 test files / 186 tests passed

tsc --noEmit: 통과

prisma generate && next build: 통과
```

Next build 결과에 포함된 주요 route:

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

## 6. 아직 안 된 것

아래는 아직 완료되지 않았다.

- GitHub `origin/main` push
- Vercel production 새 배포 확인
- Supabase migration 적용
- Vercel production 환경변수 등록
- Cafe24 Developers 앱 설정
- Cafe24 OAuth 실제 승인 테스트
- Cafe24 Webhook TEST
- 실제 주문 메모 기반 자동 연결 QA

## 7. migration 상태

아직 Supabase에는 적용하지 않았다.

적용 대상 migration:

```txt
prisma/migrations/20260625090000_add_print_file_upload_hub/migration.sql
prisma/migrations/20260626093000_add_upload_customer_contact_fields/migration.sql
prisma/migrations/20260626143000_add_cafe24_integration/migration.sql
```

현재 로컬에서 migration status 확인은 실패했다.

사유:

```txt
DIRECT_URL 환경변수 누락
```

운영 Supabase 적용 명령:

```bash
pnpm exec prisma migrate deploy
```

단, Supabase PostgreSQL `DATABASE_URL`, `DIRECT_URL`이 정확히 등록된 환경에서만 실행해야 한다.

## 8. Vercel에 등록해야 할 환경변수

기본 운영:

```env
DATABASE_URL=
DIRECT_URL=
ADMIN_PASSWORD=
NEXT_PUBLIC_SITE_URL=
SITE_ACCESS_ENABLED=
```

site access 사용 시:

```env
SITE_ACCESS_PASSWORD=
SITE_ACCESS_SECRET=
```

인쇄파일 업로드:

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

Cafe24:

```env
CAFE24_MALL_ID=
CAFE24_CLIENT_ID=
CAFE24_CLIENT_SECRET=
CAFE24_REDIRECT_URI=
CAFE24_WEBHOOK_SECRET=
CAFE24_API_VERSION=
CAFE24_SCOPES=
```

권장값:

```env
CAFE24_REDIRECT_URI=https://perpackage-marketing-leads.vercel.app/api/cafe24/oauth/callback
CAFE24_API_VERSION=2024-06-01
PRINT_FILE_STORAGE_PROVIDER=naver-object-storage
```

## 9. Cafe24 Developers 등록값

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
주문 생성
```

필요 시 추후:

```txt
주문 결제 완료
```

## 10. 배포 후 확인 URL

push 및 Vercel 배포 후 확인:

```txt
https://perpackage-marketing-leads.vercel.app/upload
https://perpackage-marketing-leads.vercel.app/upload/success
https://perpackage-marketing-leads.vercel.app/admin/uploads
https://perpackage-marketing-leads.vercel.app/admin/cafe24
https://perpackage-marketing-leads.vercel.app/api/cafe24/oauth/start
https://perpackage-marketing-leads.vercel.app/api/cafe24/webhooks/orders
```

확인 기준:

- `/upload`가 404가 아니어야 한다.
- `/admin/uploads`는 관리자 로그인 보호가 유지되어야 한다.
- `/admin/cafe24`가 404가 아니어야 한다.
- `/api/cafe24/oauth/start`는 Cafe24 인증 화면으로 이동해야 한다.
- Webhook은 Cafe24 Developers TEST로 확인한다.

## 11. 다음 순서

1. 사용자가 `git push origin main` 명시 승인
2. GitHub `main` push
3. Vercel production 배포 완료 확인
4. Vercel 환경변수 등록 확인
5. Supabase migration deploy
6. `/upload` production 접근 확인
7. `/admin/uploads` 관리자 접근 확인
8. `/admin/cafe24` 접근 확인
9. Cafe24 Developers 설정
10. OAuth 승인 테스트
11. Webhook TEST
12. 주문 메모의 `PP-UP-YYYYMMDD-001` 기반 자동 연결 QA

## 12. 관련 보고서

상세 배포 준비 보고서:

```txt
docs/gpt-report-cafe24-api-integration-deploy-ready-20260626.md
```

Cafe24 연동 구현 요약:

```txt
docs/gpt-report-cafe24-api-integration-handoff-20260626.md
```

업로드 MVP QA 보고서:

```txt
docs/gpt-report-upload-mvp-qa-before-upload-box-20260626.md
```

## 13. 한 줄 요약

Cafe24 OAuth/Webhook 및 업로드 허브 배포 준비 변경분은 로컬 commit까지 완료됐고, 이제 사용자의 명시 승인 후 `git push origin main`, Vercel 환경변수 등록, Supabase migration, Cafe24 Developers 설정 순서로 진행하면 된다.

