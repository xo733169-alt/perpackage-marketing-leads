# 페르패키지 고객 인쇄파일 업로드 허브 별도 프로젝트 분리 검토 보고서

작성일: 2026-06-26  
현재 프로젝트: `perpackage-marketing-leads`  
분리 후보 프로젝트명: `perpackage-upload-hub`

## 1. 분리 가능 여부

분리 가능하다.

현재 인쇄파일 업로드 기능은 고객 업로드 화면, 관리자 업로드 목록/상세, 업로드 API, 관리자 검수 API, 파일 저장 adapter, Prisma 업로드 모델을 중심으로 비교적 독립된 경계를 가지고 있다.

다만 지금 프로젝트 안에는 리드 CRM, 견적 계산기, 견적 룰, 제작 사례/포트폴리오, 마케팅 비용, Plugo API, Cafe24 OAuth/Webhook/API가 함께 들어가 있다. 따라서 새 프로젝트로 분리할 때는 현재 앱을 통째로 복사하는 방식보다, 업로드 기능에 필요한 파일만 골라 가져가고 관리자 내비게이션과 Prisma schema를 업로드 전용으로 줄이는 방식이 안전하다.

## 2. 분리 추천 여부

조건부로 추천한다.

추천하는 이유:

- 업로드 허브는 고객 파일 접수와 관리자 검수라는 역할이 명확하다.
- 기존 마케팅/CRM 프로젝트와 배포 주기, 보안 정책, 파일 업로드 용량 정책을 분리할 수 있다.
- 추후 웹하드형 UploadBox, Naver Object Storage signed URL, Cafe24 주문 완료 링크 삽입을 붙일 때 책임 범위가 더 선명해진다.
- 고객 업로드 기능이 마케팅 사이트 변경에 영향을 덜 받는다.

단, 바로 분리 착수하기 전 아래 QA를 먼저 끝내는 것을 권장한다.

- Supabase PostgreSQL `DATABASE_URL`, `DIRECT_URL` 정상 설정
- Prisma migration 적용 상태 확인
- `/upload` 실제 파일 업로드 왕복 테스트
- `/admin/uploads` 목록/상세 조회 테스트
- 관리자 다운로드 signed URL 또는 서버 경유 다운로드 테스트
- 상태 변경/검수 로그 저장 테스트
- 위험 파일 차단, MIME mismatch 차단, path traversal 차단 테스트

## 3. 포함해야 할 라우트

고객 화면:

```txt
/upload
/upload/success
```

관리자 화면:

```txt
/admin/login
/admin/uploads
/admin/uploads/[id]
```

추후 확장 후보:

```txt
/upload/box/[token]
/admin/upload-boxes
/admin/upload-boxes/[id]
```

주의:

- `/upload/box/[token]`은 현재 분리 대상의 즉시 구현 범위가 아니라 다음 단계 확장 범위다.
- `/access` 보호를 유지하려면 `src/app/access/page.tsx`와 site access API도 함께 가져갈 수 있다.
- 새 프로젝트의 `AdminNav`는 업로드 메뉴와 로그아웃만 남기도록 단순화하는 것이 좋다.

## 4. 포함해야 할 API

고객 업로드 API:

```txt
/api/uploads/projects
/api/uploads/files
/api/uploads/local-object
```

관리자 API:

```txt
/api/admin/login
/api/admin/logout
/api/admin/uploads
/api/admin/uploads/[id]
/api/admin/uploads/[id]/files/[fileId]/download
/api/admin/uploads/[id]/status
/api/admin/uploads/[id]/review-log
```

site access 보호를 유지할 경우:

```txt
/api/site-access/login
/api/site-access/logout
```

분리 프로젝트에서 제외할 API:

```txt
/api/admin/uploads/portfolio
/api/admin/uploads/[id]/link-order
/api/cafe24/oauth/start
/api/cafe24/oauth/callback
/api/cafe24/webhooks/orders
/api/admin/cafe24/orders/[orderId]/sync
/api/admin/leads
/api/admin/quote-*
/api/admin/portfolio
/api/admin/marketing-costs
/api/admin/plugo/requests
/api/leads
/api/quote-preview
/api/quote-share/[token]/response
```

`/api/admin/uploads/[id]/link-order`는 Cafe24 수동 연결 API이므로 이번 분리 후보에서는 제외하는 것이 맞다. 업로드 허브가 나중에 Cafe24와 연결되어야 한다면 별도 단계에서 최소 API만 다시 설계한다.

## 5. 포함해야 할 DB 모델

현재 업로드 MVP에 필요한 핵심 모델:

```txt
UploadProject
UploadedFile
FileReviewLog
```

현재 `UploadProject`에는 Cafe24 연동 필드가 일부 들어가 있다.

```txt
uploadCode
cafe24OrderNumber
cafe24MallId
cafe24OrderId
cafe24OrderNo
cafe24MemberId
cafe24OrderMemo
linkedAt
linkSource
orderSyncedAt
```

분리 프로젝트의 1차 schema 방향:

- 기존 Supabase DB를 함께 쓰는 경우 기존 테이블명 `upload_projects`, `uploaded_files`, `file_review_logs`를 유지한다.
- Prisma schema에는 업로드 기능이 직접 쓰는 모델만 남긴다.
- Cafe24 OAuth/Webhook 전용 모델은 제외한다.
- 이미 DB에 존재하는 Cafe24 관련 컬럼은 당장 삭제하지 않는다.
- 새 프로젝트에서는 Cafe24 자동 연동 로직을 사용하지 않고, 주문번호 또는 고객명/업체명/담당자명 기준으로 업로드를 관리한다.

분리 프로젝트에서 제외할 DB 모델:

```txt
Lead
LeadCommunication
SalesTask
QuoteRule
QuoteRuleLog
QuoteProposal
QuoteProposalRevision
QuoteShareLink
PortfolioCase
MarketingCost
Cafe24Token
Cafe24WebhookEvent
```

추후 UploadBox 확장 시 예상 모델:

```txt
UploadBox
UploadBoxFile
UploadBoxReviewLog
```

UploadBox 모델은 이번 분리 검토 단계에서 생성하지 않는다.

## 6. 포함해야 할 유틸/스토리지 파일

고객/관리자 업로드 기능:

```txt
src/components/PrintFileUploadForm.tsx
src/components/PrintFileUploadSuccessDetails.tsx
src/components/AdminUploadReviewPanel.tsx
src/lib/print-file-upload-schema.ts
src/lib/admin-uploads.ts
src/lib/prisma.ts
```

관리자 인증:

```txt
src/app/admin/login/page.tsx
src/components/AdminLoginForm.tsx
src/components/AdminLogoutButton.tsx
src/lib/auth.ts
```

관리자 내비게이션:

```txt
src/components/AdminNav.tsx
```

단, 기존 `AdminNav`는 CRM, 견적, 포트폴리오 등 다른 관리자 메뉴를 포함할 수 있으므로 새 프로젝트에서는 업로드 전용으로 줄이는 것이 좋다.

site access 보호를 유지할 경우:

```txt
src/middleware.ts
src/app/access/page.tsx
src/components/SiteAccessLoginForm.tsx
src/lib/site-access.ts
src/lib/site-access-schema.ts
```

스토리지:

```txt
src/lib/storage/storage-adapter.ts
src/lib/storage/naver-object-storage.ts
src/lib/storage/local-print-file-storage.ts
src/lib/storage/upload-path.ts
```

선택:

```txt
src/lib/deployment-env.ts
src/lib/upload-code.ts
```

제외:

```txt
src/lib/storage/portfolio-storage.ts
src/lib/upload-utils.ts
src/lib/cafe24.ts
src/lib/lead-*
src/lib/quote-*
src/lib/portfolio-*
src/lib/plugo.ts
src/lib/marketing-cost-schema.ts
```

## 7. 포함해야 할 테스트

우선 포함할 테스트:

```txt
src/test/print-file-upload.test.ts
src/test/site-access.test.ts
src/test/deployment-env.test.ts
```

분리 후 추가 권장 테스트:

```txt
src/test/admin-uploads.test.ts
src/test/upload-download-flow.test.ts
src/test/upload-security.test.ts
```

브라우저 QA 권장:

```txt
/upload
/upload/success
/admin/login
/admin/uploads
/admin/uploads/[id]
```

확인 항목:

- 390px 모바일 가로 overflow 없음
- 고객 화면에 TODO, placeholder, 미구현 문구 없음
- 파일 업로드 input 정상
- PDF, AI, EPS, SVG, DXF, PSD, ZIP, JPG, JPEG, PNG 허용
- HTML, JS, EXE, BAT, CMD, SH, PHP 차단
- MIME mismatch 차단
- path traversal 차단
- 관리자 다운로드 동작
- 상태 변경 및 검수 로그 저장

분리 프로젝트에서 제외할 테스트:

```txt
lead-*.test.ts
quote-*.test.ts
portfolio-*.test.ts
marketing-cost-*.test.ts
plugo.test.ts
cafe24-integration.test.ts
```

## 8. 필요한 환경변수

분리 프로젝트 필수:

```env
DATABASE_URL=
DIRECT_URL=
ADMIN_PASSWORD=
NEXT_PUBLIC_SITE_URL=

SITE_ACCESS_ENABLED=
SITE_ACCESS_PASSWORD=
SITE_ACCESS_SECRET=

UPLOAD_MAX_FILE_SIZE_MB=
UPLOAD_MAX_ZIP_SIZE_MB=
UPLOAD_MAX_PROJECT_SIZE_MB=
UPLOAD_ALLOWED_EXTENSIONS=
UPLOAD_SIGNED_URL_EXPIRES_SECONDS=

PRINT_FILE_STORAGE_PROVIDER=
UPLOAD_LOCAL_STORAGE_DIR=
UPLOAD_LOCAL_STORAGE_SECRET=

NAVER_OBJECT_STORAGE_ENDPOINT=
NAVER_OBJECT_STORAGE_REGION=
NAVER_OBJECT_STORAGE_BUCKET=
NAVER_OBJECT_STORAGE_ACCESS_KEY=
NAVER_OBJECT_STORAGE_SECRET_KEY=
```

선택 또는 추후 후보:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_UPLOAD_ACCESS_MODE=
```

현재 DB 접근은 Prisma의 `DATABASE_URL`/`DIRECT_URL` 중심이므로 Supabase Auth 또는 Supabase Admin 기능을 쓰지 않는다면 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`는 1차 필수는 아니다.

분리 프로젝트에서 제외할 환경변수:

```env
CAFE24_MALL_ID
CAFE24_CLIENT_ID
CAFE24_CLIENT_SECRET
CAFE24_REDIRECT_URI
CAFE24_WEBHOOK_SECRET
CAFE24_API_VERSION
CAFE24_SCOPES
PLUGO_API_KEY
PORTFOLIO_STORAGE_PROVIDER
NAVER_OBJECT_STORAGE_PUBLIC_BASE_URL
```

`NAVER_OBJECT_STORAGE_PUBLIC_BASE_URL`은 포트폴리오 이미지 공개 URL용 성격이 강하므로, 인쇄파일 다운로드를 signed URL 또는 서버 경유로 유지한다면 분리 프로젝트의 필수값에서 제외할 수 있다.

## 9. 제거해야 할 기능

분리 프로젝트에 포함하지 않을 기능:

- 리드 CRM
- 상담/문의 리드 관리
- 견적 계산기
- 견적 룰 관리
- 견적 제안서
- 견적 공유 링크
- 제작 사례/포트폴리오
- 포트폴리오 이미지 업로드
- 마케팅 비용 관리
- Plugo API
- Cafe24 API
- Cafe24 OAuth
- Cafe24 Webhook
- Cafe24 주문 자동 동기화
- 결제
- 세금계산서
- 전자계약
- 전개도 에디터
- 자동 인쇄용 PDF 생성

분리 후에도 유지할 역할:

- 고객 파일 업로드
- 업로드 완료 화면
- 관리자 업로드 목록
- 관리자 업로드 상세
- 관리자 다운로드
- 상태 변경
- 검수 메모/수정 요청
- 위험 파일 차단
- MIME mismatch 차단
- local storage fallback
- Naver Object Storage signed URL

## 10. 같은 Supabase DB 사용 가능 여부

가능하다.

1차 분리에서는 새 DB를 만들지 않고 기존 Supabase DB를 함께 사용하는 방향이 현실적이다. 단, 새 프로젝트의 Prisma schema에는 업로드 관련 모델만 남기고 같은 테이블을 바라보게 해야 한다.

같이 사용할 테이블:

```txt
upload_projects
uploaded_files
file_review_logs
```

주의사항:

- 기존 DB의 전체 schema를 새 프로젝트에 그대로 가져오면 CRM/견적/포트폴리오 의존성이 다시 따라온다.
- Prisma relation 때문에 Cafe24 모델이 끌려오지 않도록 upload schema를 정리해야 한다.
- 기존 `UploadProject`에 Cafe24 관련 컬럼이 있어도 1차 분리에서는 읽기/표시에서 제외하거나 선택 필드로만 둔다.
- 같은 DB를 쓰면 현재 프로젝트와 새 프로젝트가 같은 업로드 데이터를 동시에 볼 수 있으므로, 배포 전 쓰기 충돌과 migration 소유권을 정해야 한다.

권장 운영:

- 1차: 같은 Supabase DB 사용
- 2차: 업로드 허브가 안정화되면 별도 Supabase project 또는 별도 schema 분리 검토
- migration 소유권은 `perpackage-upload-hub`로 넘기기 전까지 기존 프로젝트에서만 관리

## 11. Naver Object Storage 유지 가능 여부

가능하다.

현재 업로드 파일 저장은 adapter 구조로 분리되어 있어 새 프로젝트로 옮기기 좋다.

가져갈 구조:

```txt
storage-adapter.ts
naver-object-storage.ts
local-print-file-storage.ts
upload-path.ts
```

유지할 원칙:

- 파일 바이너리는 DB에 저장하지 않는다.
- DB에는 파일명, 용량, MIME, 확장자, storage key, bucket, 상태만 저장한다.
- 고객에게 public direct URL을 노출하지 않는다.
- 관리자 다운로드는 signed URL 또는 서버 경유로 처리한다.
- local storage fallback은 로컬 QA용으로만 사용한다.

분리 시 확인할 것:

- 새 Vercel project에 Naver Object Storage 환경변수 등록
- Naver Object Storage endpoint/region/bucket 일치
- signed URL 만료 시간 확인
- 업로드 경로 `print-files/{projectId}/{version}/{safeFilename}` 유지
- 새 도메인에서 다운로드/업로드 API가 정상 동작하는지 확인

## 12. 별도 Vercel 배포 기준

분리 프로젝트 배포명 후보:

```txt
perpackage-upload-hub
```

배포 전 준비:

1. 새 Git repository 또는 monorepo 하위 앱 결정
2. Next.js App Router 최소 구조 구성
3. 업로드 관련 route/component/lib만 복사
4. 업로드 전용 Prisma schema 작성
5. `package.json` 의존성 최소화
6. `.env.example` 업로드 허브 전용으로 정리
7. Vercel project 생성
8. Vercel 환경변수 등록
9. Supabase connection string 등록
10. Naver Object Storage 키 등록
11. `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm build` 통과
12. Vercel preview에서 `/upload`부터 관리자 다운로드까지 QA

필요 라이브러리:

```txt
next
react
react-dom
typescript
prisma
@prisma/client
zod
react-dropzone
nanoid
@aws-sdk/client-s3
@aws-sdk/s3-request-presigner
```

테스트가 유지될 경우:

```txt
vitest
@playwright/test
```

## 13. 분리 전 선행 QA

분리 전에 먼저 끝내야 할 QA:

1. 로컬 또는 preview에서 Supabase PostgreSQL 연결 확인
2. `DIRECT_URL` 포함 Prisma migration 상태 확인
3. `/upload` 프로젝트 생성 API 정상 응답 확인
4. `/api/uploads/files` 파일 메타데이터 저장 확인
5. Naver Object Storage 또는 local provider 업로드 확인
6. `/upload/success` 접수 정보와 파일 목록 표시 확인
7. `/admin/login` 인증 흐름 확인
8. `/admin/uploads` 목록 조회 확인
9. `/admin/uploads/[id]` 상세 조회 확인
10. 관리자 다운로드 확인
11. 상태 변경 확인
12. 수정 요청/검수 메모 저장 확인
13. 검수 로그 생성 확인
14. 위험 파일 차단 확인
15. MIME mismatch 차단 확인
16. 모바일 390px overflow 확인
17. 고객 화면에서 카카오톡 아이디 미노출 확인
18. 주문번호 optional 처리 확인

현재 이전 QA 기준으로 남은 핵심 문제:

- 로컬 `.env.local`의 `DATABASE_URL`이 SQLite 형식이었다.
- `DIRECT_URL`이 누락되어 Prisma migration 상태 확인이 막혔다.
- 실제 업로드 DB 저장 왕복 테스트가 완료되지 않았다.
- 운영 배포 URL에서 `/upload`가 404로 보이는 문제는 업로드 허브 코드가 production 배포에 아직 반영되지 않은 상태와 관련이 있다.

## 14. 분리 작업 단계

추천 순서:

1. 현재 프로젝트에서 업로드 MVP QA를 끝낸다.
2. `perpackage-upload-hub` 새 repository 또는 새 Vercel project 구조를 만든다.
3. Next.js App Router 기본 파일만 만든다.
4. 고객 업로드 route와 component를 복사한다.
5. 관리자 로그인/업로드 route와 component를 복사한다.
6. 업로드 API와 관리자 API를 복사한다.
7. storage adapter와 upload validation 유틸을 복사한다.
8. Prisma schema를 업로드 모델 3개 중심으로 줄인다.
9. Cafe24, CRM, 견적, 포트폴리오 relation/import를 제거한다.
10. `.env.example`을 업로드 허브 전용으로 작성한다.
11. 테스트 파일을 업로드/인증/환경변수 중심으로 정리한다.
12. `pnpm prisma generate` 실행
13. `pnpm test` 실행
14. `pnpm exec tsc --noEmit` 실행
15. `pnpm build` 실행
16. Vercel preview 배포
17. preview URL에서 고객 업로드부터 관리자 다운로드까지 왕복 QA
18. 기존 메인 사이트 또는 Cafe24 주문 완료 안내에서 새 업로드 URL로 링크 연결

## 15. 위험 요소

주요 위험:

- 현재 업로드 관련 코드 일부가 아직 production 배포에 반영되지 않았을 수 있다.
- 현재 Prisma schema는 업로드 외 모델이 많아 그대로 옮기면 분리 효과가 줄어든다.
- `UploadProject`에 Cafe24 관련 필드와 relation이 추가되어 있어 schema 슬림화가 필요하다.
- 기존 `AdminNav`는 다른 관리자 기능을 끌고 올 수 있다.
- `src/lib/storage/portfolio-storage.ts`는 업로드 허브가 아니라 포트폴리오 이미지용이므로 제외해야 한다.
- local storage fallback은 Vercel 운영 저장소로 적합하지 않다.
- 같은 Supabase DB를 쓰면 migration 관리 주체가 혼동될 수 있다.
- 새 Vercel 도메인에서 site access, admin auth, signed URL 만료, origin 검증이 다시 QA되어야 한다.
- Naver Object Storage 키가 새 Vercel project에 누락되면 파일 업로드/다운로드가 실패한다.
- 고객 업로드 화면과 관리자 화면이 다른 프로젝트로 이동하면 기존 링크, 문서, Cafe24 안내 문구도 함께 갱신해야 한다.

보안 위험:

- 고객에게 storage public URL을 직접 노출하면 안 된다.
- 고객 삭제/이동/이름 변경 API를 만들면 웹하드형 권한 모델이 흔들릴 수 있다.
- 관리자 API는 반드시 인증을 유지해야 한다.
- secret 값은 `.env.example`, 보고서, 로그에 출력하면 안 된다.

## 16. 최종 추천안

최종 판단: 분리 가능하며, 중장기적으로 분리하는 편이 좋다.

다만 지금 즉시 새 프로젝트를 만드는 것보다 아래 순서가 안전하다.

1. 현재 `/upload` MVP의 Supabase/PostgreSQL 왕복 QA를 먼저 끝낸다.
2. production 또는 preview 배포에서 `/upload`, `/admin/uploads`가 실제 접근 가능한 상태를 만든다.
3. 업로드 기능의 안정 기준을 확인한 뒤 `perpackage-upload-hub`로 분리한다.
4. 분리 1차에서는 기존 `UploadProject`, `UploadedFile`, `FileReviewLog`만 가져간다.
5. UploadBox는 분리 후 2차 기능으로 설계한다.
6. Cafe24 API/OAuth/Webhook은 분리 프로젝트 초기 범위에서 제외하고, 나중에 주문 완료 페이지 링크 삽입 또는 주문번호 검증만 최소 단위로 붙인다.

추천 결론:

```txt
분리 가능: 가능
분리 추천: 조건부 추천
분리 착수 시점: /upload MVP DB 저장, 조회, 다운로드, 상태 변경 QA 완료 후
DB 방향: 1차는 기존 Supabase DB 공유
Storage 방향: Naver Object Storage adapter 유지
UploadBox: 분리 후 2차 기능으로 구현
Cafe24 연동: 초기 분리 범위에서 제외
```

