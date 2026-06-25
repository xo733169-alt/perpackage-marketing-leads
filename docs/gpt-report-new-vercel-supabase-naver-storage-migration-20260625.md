# GPT 보고 파일: 새 Vercel Pro + Supabase Pro + 네이버 Object Storage 이전 분석

작성일: 2026-06-25  
프로젝트: `perpackage-marketing-leads`  
목적: 새 Vercel 유료 계정 이전 전, 현재 코드 기준으로 DB/Auth/Storage/환경변수/이전 리스크를 정리한다.  
주의: 이 문서는 분석 보고서이며, 실제 환경변수 값과 secret 원문은 포함하지 않는다.

## 1. 프로젝트 구조 요약

현재 프로젝트는 단순 정적 홈페이지가 아니라 `PerPackage Marketing Lead Management System`이다.

현재 기능 성격:

- Next.js App Router 기반 고객-facing 페이지
- 고객 문의/리드 생성 API
- 관리자 리드 CRM
- 제작 사례/포트폴리오 관리
- 관리자 제작 사례 대표 이미지 업로드
- Prisma 기반 DB 저장
- QuoteRule, QuoteProposal, QuoteProposalShareLink, 고객 견적 응답, SalesTask 등 운영 관리 기능
- 사이트 전체 private access gate
- 별도 관리자 로그인
- Plugo API proxy

현재 주요 폴더:

```txt
src/app
  고객 페이지, 관리자 페이지, API Route

src/components
  문의폼, 관리자 폼, 포트폴리오 이미지 컴포넌트

src/lib
  Prisma, 인증, 사이트 접근 보호, 견적 엔진, 포트폴리오, 업로드, storage adapter, webhook helper

prisma
  Prisma schema, SQLite migration

scripts
  배포 환경변수 점검, quote rule seed, portfolio import

docs
  Vercel, storage, 보안, 백업, GPT handoff 문서
```

결론:

- Vercel은 정적 호스팅만이 아니라 Next.js 서버/API 실행 환경으로 필요하다.
- DB가 필수다.
- 파일 업로드 기능은 현재 제작 사례 대표 이미지에 한정되어 있다.
- 고객 파일 업로드, 도안 파일 업로드, AI/PDF/ZIP 업로드 기능은 아직 없다.
- Storage adapter는 이미 분리되어 있으며 현재 `local`과 `vercel-blob` provider만 구현되어 있다.

## 2. 현재 DB / Prisma 상태

파일:

```txt
prisma/schema.prisma
src/lib/prisma.ts
```

현재 datasource:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

현재 DB provider는 SQLite다.

주요 모델:

- `Lead`
- `QuoteRule`
- `QuoteProposal`
- `QuoteProposalItem`
- `QuoteProposalShareLink`
- `QuoteProposalCustomerResponse`
- `QuoteActivityLog`
- `LeadCommunicationLog`
- `SalesTask`
- `QuoteRuleChangeLog`
- `PortfolioCase`
- `MarketingCost`

마이그레이션:

- `prisma/migrations`에 초기 migration부터 Phase 10 관련 migration까지 존재한다.
- 현재 schema에는 제작 사례 필터 필드와 상담 요약 필드, quote/share/task 관련 필드가 포함되어 있다.

seed/import 스크립트:

```txt
scripts/seed-quote-rules.ts
scripts/import-portfolio-cases.ts
scripts/check-deployment-env.ts
```

Vercel 빌드 관련:

- `package.json` build script는 `prisma generate && next build`다.
- `DATABASE_URL`이 없으면 Prisma generate/build 단계에서 실패할 수 있다.
- 현재 SQLite `file:` DB는 Vercel 운영 DB로 부적합하다.

Supabase Pro 전환 판단:

- Supabase Postgres로 전환 가능하다.
- 단순히 Vercel 환경변수 `DATABASE_URL`만 바꾸는 것으로는 충분하지 않다.
- `prisma/schema.prisma` provider를 `sqlite`에서 `postgresql`로 바꾸는 별도 migration branch가 필요하다.
- 기존 데이터가 있으면 SQLite export/import 또는 Prisma 기반 이관 작업이 필요하다.
- 현재 관리자 인증은 Supabase Auth가 아니라 `ADMIN_PASSWORD` 기반 쿠키 인증이다.
- Supabase Auth로 대체는 가능하지만 별도 설계/마이그레이션 작업이다.

## 3. 현재 Storage / Blob / 업로드 구조

관련 파일:

```txt
src/app/api/admin/uploads/portfolio/route.ts
src/lib/storage/portfolio-storage.ts
src/lib/upload-utils.ts
src/lib/portfolio-image-optimizer.ts
src/components/PortfolioCaseForm.tsx
src/components/PortfolioCaseImage.tsx
```

현재 업로드 대상:

- 관리자 제작 사례 대표 이미지

아직 없는 기능:

- 고객 파일 업로드
- 도안 파일 업로드
- 견적 관련 첨부파일 업로드
- AI/PDF/ZIP 원본 업로드

현재 업로드 제한:

- JPG
- PNG
- WebP
- 최대 5MB
- 업로드 후 Sharp로 WebP 최적화
- 대표 이미지 최대 1600px
- 썸네일 최대 600px

현재 DB 저장:

- `PortfolioCase.mainImageUrl`에 대표 이미지 URL 저장
- 썸네일 URL은 API 응답에는 있으나 DB에는 저장하지 않음

현재 storage provider:

```txt
local
vercel-blob
```

현재 provider 선택:

```ts
PORTFOLIO_STORAGE_PROVIDER 없거나 local -> localPortfolioImageStorage
PORTFOLIO_STORAGE_PROVIDER=vercel-blob -> vercelBlobPortfolioImageStorage
그 외 값 -> UnsupportedPortfolioStorageProviderError
```

현재 local 저장:

```txt
public/uploads/portfolio
/uploads/portfolio/...
```

현재 Vercel Blob 저장:

```txt
portfolio/{filename}
https://...vercel-storage.com/portfolio/{filename}
```

## 4. Vercel Blob을 네이버 Object Storage로 대체 가능한가?

가능하다.

이유:

- 이미 `src/lib/storage/portfolio-storage.ts`에 storage adapter 인터페이스가 있다.
- 업로드 API는 `getPortfolioImageStorage()`를 통해 provider만 호출한다.
- 파일 최적화와 파일 저장이 분리되어 있다.
- DB에는 저장소 내부 구현이 아니라 URL만 저장한다.

대체 시 수정해야 할 파일:

```txt
src/lib/storage/portfolio-storage.ts
.env.example
docs/portfolio-image-storage.md
src/test/portfolio-storage.test.ts
scripts/check-deployment-env.ts
src/lib/deployment-env.ts
```

선택적으로 수정할 파일:

```txt
README.md
docs/vercel-deployment-checklist.md
docs/security-checklist.md
docs/backup-and-restore.md
```

구현 방향:

- `PORTFOLIO_STORAGE_PROVIDER=naver-object-storage` 또는 `object-storage` provider를 추가한다.
- 네이버 Object Storage용 adapter를 추가한다.
- AWS S3 호환 SDK를 쓸 수 있는지 확인한다.
- `save({ filename, buffer })` 인터페이스는 유지한다.
- 반환값은 기존과 동일하게 `url`, `filename`, `sizeBytes`를 유지한다.

새 provider 예시:

```txt
PORTFOLIO_STORAGE_PROVIDER=naver-object-storage
```

새 환경변수 후보:

```env
NAVER_OBJECT_STORAGE_ACCESS_KEY=
NAVER_OBJECT_STORAGE_SECRET_KEY=
NAVER_OBJECT_STORAGE_BUCKET=
NAVER_OBJECT_STORAGE_ENDPOINT=
NAVER_OBJECT_STORAGE_REGION=
NAVER_OBJECT_STORAGE_PUBLIC_BASE_URL=
```

주의:

- 현재 코드에는 네이버 Object Storage adapter가 없다.
- `PORTFOLIO_STORAGE_PROVIDER=naver`로만 바꾸면 현재는 에러가 난다.
- provider 값 추가와 adapter 구현이 선행되어야 한다.

## 5. 요청 변수별 실제 사용 여부

### `NEXT_PUBLIC_SITE_URL`

- 사용 파일:
  - `src/app/sitemap.ts`
  - `src/app/robots.ts`
  - `src/app/portfolio/[slug]/page.tsx`
  - `src/lib/auth.ts`
  - `src/lib/notifications.ts`
  - `src/lib/quote-response-notifications.ts`
  - `src/lib/quote-share.ts`
- 목적:
  - 사이트 절대 URL 생성
  - sitemap/robots host
  - admin URL/webhook payload 생성
  - quote share URL 생성
  - mutation Origin 검사 보조
- Production 필요 여부: 필요
- Preview 필요 여부: 필요
- 없으면:
  - 기본값 `http://127.0.0.1:3000` 또는 request origin fallback이 섞일 수 있다.
  - share URL/admin URL이 실제 배포 URL과 어긋날 수 있다.
- 이전 시:
  - 새 Vercel 도메인 또는 실제 커스텀 도메인으로 새로 설정한다.

### `DATABASE_URL`

- 사용 파일:
  - `prisma/schema.prisma`
  - Prisma Client 전체
  - `package.json` build script의 `prisma generate`
- 목적:
  - DB 연결
- Production 필요 여부: 필수
- Preview 필요 여부: 필수
- 없으면:
  - Prisma generate/build 실패 가능
  - 런타임 DB 접근 실패
- 이전 시:
  - Supabase Postgres 전환 시 새 Supabase DATABASE_URL로 설정한다.
  - 기존 SQLite 데이터가 있으면 별도 마이그레이션 필요.

### `ADMIN_PASSWORD`

- 사용 파일:
  - `src/lib/auth.ts`
  - admin login API
- 목적:
  - 현재 관리자 로그인 비밀번호
  - admin session cookie 서명 secret 역할도 겸함
- Production 필요 여부: 필수
- Preview 필요 여부: 필수
- 없으면:
  - 관리자 로그인 불가
- 이전 시:
  - 새로 만들어도 된다.
  - 기존 값을 꼭 알아야 하는 것은 아니지만, 운영자가 알고 있는 새 강한 값으로 설정해야 한다.
  - Supabase Auth 전환 전까지 유지 필요.

### `SITE_ACCESS_ENABLED`

- 사용 파일:
  - `src/lib/site-access.ts`
  - `src/middleware.ts`
  - `src/app/robots.ts`
  - `src/app/sitemap.ts`
  - `src/lib/deployment-health.ts`
- 목적:
  - 전체 사이트 private preview gate 활성화
- Production 필요 여부:
  - 비공개 테스트 중이면 필요
  - 공개 운영이면 `false` 또는 비활성 검토
- Preview 필요 여부: 권장
- 없으면:
  - 기본적으로 gate 비활성에 가까운 동작
- 이전 시:
  - 새 Vercel에서 새 값으로 설정 가능.

### `SITE_ACCESS_PASSWORD`

- 사용 파일:
  - `src/lib/site-access.ts`
  - `/api/site-access/login`
- 목적:
  - 전체 사이트 접근 비밀번호
- Production 필요 여부:
  - `SITE_ACCESS_ENABLED=true`이면 필수
- Preview 필요 여부:
  - private preview면 필수
- 없으면:
  - private mode 로그인 불가
- 이전 시:
  - 새로 만들어도 된다.

### `SITE_ACCESS_SECRET`

- 사용 파일:
  - `src/lib/site-access.ts`
- 목적:
  - site access cookie 서명
- Production 필요 여부:
  - `SITE_ACCESS_ENABLED=true`이면 필수 권장
- Preview 필요 여부:
  - private preview면 필수 권장
- 없으면:
  - fallback이 있으나 운영 보안에는 부적합
- 이전 시:
  - 새 긴 랜덤 문자열로 새로 만들어도 된다.

### `NEXT_PUBLIC_KAKAO_CHANNEL_URL`

- 사용 파일:
  - `src/app/page.tsx`
  - `src/app/thanks/page.tsx`
  - `src/app/portfolio/[slug]/page.tsx`
- 목적:
  - 카카오 채널 링크
- Production 필요 여부:
  - 카카오 상담 버튼을 운영할 경우 필요
- Preview 필요 여부:
  - 선택
- 없으면:
  - 버튼이 비활성/안내 문구로 남을 수 있음
- 이전 시:
  - 실제 카카오 채널 URL로 새 설정 가능.

### `LEAD_NOTIFICATION_WEBHOOK_URL`

- 사용 파일:
  - `src/lib/notifications.ts`
  - `src/app/api/leads/route.ts`
- 목적:
  - 신규 리드 생성 시 외부 webhook으로 최소 payload 전송
- Production 필요 여부:
  - 선택 기능
- Preview 필요 여부:
  - 선택 기능
- 없으면:
  - 리드 저장은 정상
  - 외부 알림만 동작하지 않음
- 이전 시:
  - 운영 초기에 비활성 가능
  - Make/Zapier/Slack/Discord 등 새 webhook으로 교체 가능
  - Supabase/Naver Storage와 직접 관계 없음

### `QUOTE_RESPONSE_WEBHOOK_URL`

- 사용 파일:
  - `src/lib/quote-response-notifications.ts`
  - quote share response API
- 목적:
  - 고객 견적 응답 발생 시 외부 webhook 알림
- Production 필요 여부:
  - 선택 기능
- Preview 필요 여부:
  - 선택 기능
- 없으면:
  - 고객 응답 저장은 정상
  - 외부 알림만 동작하지 않음
- 이전 시:
  - 운영 초기에 비활성 가능
  - 새 webhook으로 교체 가능

### `PORTFOLIO_STORAGE_PROVIDER`

- 사용 파일:
  - `src/lib/storage/portfolio-storage.ts`
  - `src/app/api/admin/uploads/portfolio/route.ts`에서 간접 사용
- 목적:
  - 제작 사례 대표 이미지 저장소 선택
- Production 필요 여부:
  - 이미지 업로드 운영 시 필요
- Preview 필요 여부:
  - 업로드 테스트 시 필요
- 없으면:
  - 기본값 `local`
  - Vercel serverless 운영에서는 local 저장소가 영구 저장소로 부적합
- 이전 시:
  - 네이버 Object Storage adapter 구현 후 `naver-object-storage` 같은 값으로 변경 가능
  - 현재는 `local`, `vercel-blob`만 지원

### `BLOB_READ_WRITE_TOKEN`

- 사용 파일:
  - `src/lib/storage/portfolio-storage.ts`
- 목적:
  - Vercel Blob 업로드 token
- Production 필요 여부:
  - `PORTFOLIO_STORAGE_PROVIDER=vercel-blob`일 때만 필수
- Preview 필요 여부:
  - Vercel Blob 테스트 시 필수
- 없으면:
  - Vercel Blob 업로드 실패
- 이전 시:
  - 네이버 Object Storage로 전환하면 필요 없어질 수 있다.

### `BLOB_STORE_ID`

- 코드 실제 사용 여부:
  - 현재 코드에서 실제 사용되지 않음
- 목적:
  - Vercel Blob 관련 과거/예상 변수로 보이나 현재 런타임에는 필요 없음
- 이전 시:
  - 네이버 Object Storage 전환 기준에서는 삭제 가능성이 높음

### `BLOB_WEBHOOK_PUBLIC_KEY`

- 코드 실제 사용 여부:
  - 현재 코드에서 실제 사용되지 않음
- 목적:
  - Vercel Blob webhook 검증 용도로 보이나 현재 구현 없음
- 이전 시:
  - 네이버 Object Storage 전환 기준에서는 삭제 가능성이 높음

## 6. 추가로 발견된 실제 환경변수

요청서에는 없지만 현재 코드에서 실제 사용되는 변수다.

### Plugo API 관련

파일:

```txt
src/lib/plugo.ts
src/app/api/admin/plugo/requests/route.ts
docs/plugo-api.md
```

변수:

```env
PLUGO_API_BASE_URL=
PLUGO_REQUESTS_PATH=
PLUGO_API_KEY=
PLUGO_SECRET_KEY=
PLUGO_API_KEY_HEADER_NAME=
PLUGO_SECRET_KEY_HEADER_NAME=
PLUGO_FORWARD_QUERY_KEYS=
PLUGO_TIMEOUT_MS=
```

목적:

- 관리자 전용 `/api/admin/plugo/requests` proxy
- Plugo credentials를 browser에 노출하지 않고 서버에서 upstream API 호출

필요 여부:

- Plugo 연동을 운영할 경우 필요
- 사용하지 않을 경우 비워도 됨
- 일부만 설정하면 deployment env check에서 partial config로 경고/실패 처리 가능

## 7. 환경변수 4그룹 분류

### A. 새 Vercel에서도 반드시 필요한 변수

```env
DATABASE_URL
ADMIN_PASSWORD
NEXT_PUBLIC_SITE_URL
SITE_ACCESS_ENABLED
```

이유:

- `DATABASE_URL`: Prisma build/runtime 필수
- `ADMIN_PASSWORD`: 관리자 로그인 필수
- `NEXT_PUBLIC_SITE_URL`: 절대 URL, webhook admin URL, quote share URL, Origin 검사에 필요
- `SITE_ACCESS_ENABLED`: private preview 운영 정책 명시용

조건부 필수:

```env
SITE_ACCESS_PASSWORD
SITE_ACCESS_SECRET
```

`SITE_ACCESS_ENABLED=true`이면 필수다.

### B. 새로 만들어도 되는 변수

```env
ADMIN_PASSWORD
SITE_ACCESS_PASSWORD
SITE_ACCESS_SECRET
```

이유:

- 기존 값을 반드시 복구할 필요는 없다.
- 새 계정 이전 시 새 강한 값으로 재발급하는 편이 안전하다.
- 단, 사용자에게 새 값을 공유/보관해야 한다.

### C. 네이버 Object Storage 또는 Supabase Pro 사용으로 대체/삭제 가능성이 있는 변수

```env
PORTFOLIO_STORAGE_PROVIDER
BLOB_READ_WRITE_TOKEN
BLOB_STORE_ID
BLOB_WEBHOOK_PUBLIC_KEY
```

판단:

- `PORTFOLIO_STORAGE_PROVIDER`는 계속 유지하되 값과 adapter를 바꾸는 것이 좋다.
- `BLOB_READ_WRITE_TOKEN`은 Vercel Blob을 안 쓰면 삭제 가능.
- `BLOB_STORE_ID`, `BLOB_WEBHOOK_PUBLIC_KEY`는 현재 코드에서 실제 사용되지 않아 삭제 가능성이 높다.

대체 변수 후보:

```env
NAVER_OBJECT_STORAGE_ACCESS_KEY
NAVER_OBJECT_STORAGE_SECRET_KEY
NAVER_OBJECT_STORAGE_BUCKET
NAVER_OBJECT_STORAGE_ENDPOINT
NAVER_OBJECT_STORAGE_REGION
NAVER_OBJECT_STORAGE_PUBLIC_BASE_URL
```

### D. 현재 코드에서 실제로 안 쓰이거나 없어도 되는 변수

현재 코드 기준:

```env
BLOB_STORE_ID
BLOB_WEBHOOK_PUBLIC_KEY
```

선택 기능이라 없어도 배포 가능한 변수:

```env
LEAD_NOTIFICATION_WEBHOOK_URL
QUOTE_RESPONSE_WEBHOOK_URL
NEXT_PUBLIC_KAKAO_CHANNEL_URL
PLUGO_* 변수들
```

단, 기능별 영향은 있다.

- webhook URL이 없으면 알림만 안 감
- 카카오 URL이 없으면 카카오 연결 버튼/동선만 제한
- Plugo env가 없으면 Plugo proxy 기능만 사용 불가

## 8. Supabase Pro가 맡아야 할 기능

Supabase Pro를 DB/Auth 후보로 본다면 아래를 맡길 수 있다.

### DB

Supabase Postgres로 이전할 테이블 후보:

- 고객/문의: `Lead`
- 견적 룰: `QuoteRule`, `QuoteRuleChangeLog`
- 견적안: `QuoteProposal`, `QuoteProposalItem`
- 견적 공유/응답: `QuoteProposalShareLink`, `QuoteProposalCustomerResponse`
- 견적 활동 로그: `QuoteActivityLog`
- 상담 기록: `LeadCommunicationLog`
- 영업 업무: `SalesTask`
- 제작 사례: `PortfolioCase`
- 마케팅 비용: `MarketingCost`

### Auth

현재:

- Supabase Auth 사용 안 함
- `ADMIN_PASSWORD` 단일 비밀번호 기반

전환 가능성:

- Supabase Auth로 관리자 계정/권한 관리를 대체 가능
- 단, middleware, admin auth helper, 로그인 UI, API guard를 별도 개편해야 함
- MVP 운영 초기에는 `ADMIN_PASSWORD` 유지가 더 단순함

### RLS

현재 앱은 서버 API/서버 컴포넌트가 Prisma로 DB 접근한다.

초기 이전에서는:

- Supabase DB를 “Postgres DB”로만 사용해도 된다.
- RLS는 Supabase client를 브라우저에서 직접 쓰기 시작할 때 본격 검토한다.

## 9. 네이버 Object Storage가 맡아야 할 기능

운영 목표 기준으로 네이버 Object Storage가 맡기 좋은 파일:

- 고객 업로드 파일
- 도안 파일
- AI/PDF/ZIP 원본
- 제작 사례 이미지
- 썸네일 이미지
- 견적 관련 첨부파일
- 상담/프로젝트 관련 참고 이미지

DB에는 원본 파일이 아니라 메타데이터만 저장하는 것이 좋다.

추천 파일 메타데이터 테이블 예시:

```txt
id
leadId 또는 projectId
customerId
quoteProposalId
portfolioCaseId
originalFilename
storedFilename
fileUrl
fileType
mimeType
fileSizeBytes
storageProvider
bucket
objectKey
uploadStatus
createdAt
updatedAt
createdBy
```

현재 DB에는 범용 파일 메타데이터 모델이 없다.

## 10. 필요 없어질 수 있는 것 정리

### A. 완전히 제거 가능성이 높은 것

```env
BLOB_STORE_ID
BLOB_WEBHOOK_PUBLIC_KEY
```

이유:

- 현재 코드에서 실제 사용되지 않음
- 네이버 Object Storage 구조에서는 필요 없음

### B. 당장은 유지하지만 나중에 제거 가능

```txt
localPortfolioImageStorage
public/uploads/portfolio
BLOB_READ_WRITE_TOKEN
vercelBlobPortfolioImageStorage
@vercel/blob
```

이유:

- 현재 제작 사례 업로드가 이 구조 위에서 동작함
- 네이버 Object Storage adapter 구현 전까지는 유지 필요
- 네이버 전환 완료 후 Vercel Blob 코드와 dependency 제거 가능

### C. 새 서비스로 대체 필요

```txt
DATABASE_URL
PORTFOLIO_STORAGE_PROVIDER
```

이유:

- `DATABASE_URL`: Supabase Postgres URL로 대체
- `PORTFOLIO_STORAGE_PROVIDER`: `naver-object-storage` provider로 전환 가능

### D. 계속 유지 필요

```env
ADMIN_PASSWORD
SITE_ACCESS_ENABLED
SITE_ACCESS_PASSWORD
SITE_ACCESS_SECRET
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_KAKAO_CHANNEL_URL
LEAD_NOTIFICATION_WEBHOOK_URL
QUOTE_RESPONSE_WEBHOOK_URL
PLUGO_* 변수들
```

단, `ADMIN_PASSWORD`는 Supabase Auth로 전환하면 나중에 제거 가능하다.

## 11. Vercel Pro가 필요한 이유

현재 프로젝트는 Next.js API Route와 server-side 기능을 많이 쓴다.

실제 사용 중:

- `/api/leads`
- `/api/quote-preview`
- `/api/admin/*`
- `/api/admin/uploads/portfolio`
- `/api/quote-share/[token]/response`
- `/api/site-access/login`
- `/api/admin/plugo/requests`
- Prisma DB 접근
- Sharp 이미지 최적화
- 관리자 페이지
- private access middleware

Hobby에서도 테스트는 가능하지만, 운영 관점에서는 Pro가 더 적합하다.

Pro가 필요한 이유:

- 운영용 안정성
- 팀/계정 이전 관리
- 환경변수 관리
- 서버 함수/API Route 운영
- 이미지 업로드/Sharp 처리
- 트래픽 증가 대응
- 도메인/Preview/Production 분리 운영

## 12. Webhook 분석

### `LEAD_NOTIFICATION_WEBHOOK_URL`

- 사용 파일:
  - `src/lib/notifications.ts`
  - `src/app/api/leads/route.ts`
- 목적:
  - 신규 리드 생성 후 외부 알림
- 없으면:
  - 리드는 정상 저장
  - 알림만 안 감
- 운영 초기에 비활성화 가능

### `QUOTE_RESPONSE_WEBHOOK_URL`

- 사용 파일:
  - `src/lib/quote-response-notifications.ts`
  - quote share customer response flow
- 목적:
  - 고객이 견적안 수락/거절/수정 요청 시 외부 알림
- 없으면:
  - 고객 응답은 정상 저장
  - 알림만 안 감
- 운영 초기에 비활성화 가능

두 webhook 모두 Supabase/Vercel/Naver Object Storage 구조와 직접적인 의존 관계는 없다.

## 13. 새 Vercel 계정 이전 위험 요소

1. Vercel sensitive 환경변수 값은 기존 계정에서 다시 볼 수 없을 수 있다.
2. 기존 `DATABASE_URL` 원문이 없으면 기존 DB 연결 복구가 어렵다.
3. Supabase Postgres를 새로 만들면 기존 SQLite 데이터는 자동 이전되지 않는다.
4. Prisma provider가 현재 `sqlite`라서 PostgreSQL 전환 작업이 별도로 필요하다.
5. Vercel Blob Store는 새 계정에서 새로 연결해야 하며 기존 Blob 파일은 자동 이전되지 않는다.
6. 네이버 Object Storage 전환 전에는 `PORTFOLIO_STORAGE_PROVIDER=naver...`를 넣어도 동작하지 않는다.
7. 기존 `/uploads/portfolio/...` 이미지 링크는 Vercel serverless 운영에서 깨질 수 있다.
8. `ADMIN_PASSWORD`, `SITE_ACCESS_PASSWORD`를 새로 만들면 팀 내 공유/보관 체계가 필요하다.
9. webhook URL을 모르면 알림 기능만 끊길 수 있다.
10. GitHub 저장소 연결 없이 CLI 배포만 했다면 코드 원본과 배포 이력이 분리될 위험이 있다.

## 14. 새 인프라 이전 체크리스트

1. 코드 원본 GitHub 저장소 준비
2. 새 Vercel Pro 계정에서 프로젝트 Import
3. Root Directory 확인
4. Install Command 확인: `pnpm install`
5. Build Command 확인: `pnpm run build`
6. Supabase Pro 프로젝트 생성
7. Supabase DATABASE_URL 발급
8. PostgreSQL 전환 branch 생성
9. `prisma/schema.prisma` provider를 `postgresql`로 전환
10. Prisma migration 생성/검증
11. 기존 SQLite 데이터 export/import 계획 수립
12. 네이버 Object Storage Bucket 생성
13. 네이버 Object Storage access key/secret 발급
14. 네이버 Object Storage adapter 구현
15. `PORTFOLIO_STORAGE_PROVIDER=naver-object-storage` 지원 추가
16. Vercel Environment Variables 입력
17. Preview 배포 테스트
18. `/access` 테스트
19. `/admin/login` 테스트
20. 문의 저장 테스트
21. 관리자 리드 목록/상세 테스트
22. 제작 사례 이미지 업로드 테스트
23. 고객 파일 업로드는 기능 구현 후 별도 테스트
24. Webhook 알림 테스트
25. Production 배포
26. 기존 local/Vercel Blob 이미지 마이그레이션 필요 여부 확인

## 15. 최종 표

| 항목 | 현재 확인 결과 | 새 인프라에서 필요한 조치 | 유지/대체/삭제 | 위험도 |
|---|---|---|---|---|
| 코드 원본 | Next.js/Prisma 프로젝트가 로컬에 있음. GitHub 연결 상태는 코드만으로 확정 불가 | 새 Vercel 계정에는 GitHub 저장소 Import 권장 | 유지 | 중 |
| Vercel Pro | API Route, 관리자 페이지, middleware, Sharp 이미지 처리 사용 | 새 Vercel Pro 프로젝트 생성 후 env 재입력 | 유지 | 중 |
| Supabase Pro | 현재 Supabase 사용 없음. DB는 SQLite | Supabase Postgres 생성, Prisma provider 전환, migration/import 필요 | 대체 | 높음 |
| DATABASE_URL | Prisma SQLite `file:` URL 사용 | Supabase Postgres URL로 대체. 기존 데이터 있으면 이관 필요 | 대체 | 높음 |
| Vercel Blob | `@vercel/blob` dependency와 `vercel-blob` adapter 있음 | 네이버 Object Storage 전환 시 adapter 대체 후 제거 가능 | 당장 유지, 이후 대체 | 중 |
| 네이버 Object Storage | 현재 코드 구현 없음 | 새 provider/adapter/env 추가 필요 | 신규 도입 | 높음 |
| BLOB_STORE_ID | 현재 코드에서 실제 사용 안 함 | 네이버 전환 시 불필요 | 삭제 가능 | 낮음 |
| BLOB_WEBHOOK_PUBLIC_KEY | 현재 코드에서 실제 사용 안 함 | 네이버 전환 시 불필요 | 삭제 가능 | 낮음 |
| PORTFOLIO_STORAGE_PROVIDER | `local`, `vercel-blob`만 지원 | `naver-object-storage` 값과 adapter 추가 필요 | 유지하되 값 확장 | 중 |
| Webhook URL | 리드/견적 응답 알림용 선택 기능 | 운영 알림을 쓸 경우 새 URL 설정. 안 쓰면 비워도 됨 | 선택 유지 | 낮음 |
| ADMIN_PASSWORD | 현재 관리자 인증 핵심 | 새 강한 값으로 재설정 가능. Supabase Auth 전까지 유지 | 유지 | 중 |
| SITE_ACCESS_SECRET | private access cookie 서명 | 새 긴 랜덤 값으로 생성 | 유지 | 중 |
| NEXT_PUBLIC_SITE_URL | sitemap, robots, share/admin URL, Origin 검사에 사용 | 새 Vercel URL 또는 커스텀 도메인으로 설정 | 유지 | 중 |
| GitHub 연결 | 로컬 파일만으로 연결 여부 확정 불가 | 새 Vercel 이전 전 GitHub 저장소 연결 권장 | 유지/정비 | 중 |
| Production 배포 | 현재 Vercel 배포 이력 있음 | 새 계정에서 env/DB/storage 세팅 후 Preview 검증, Production 승격 | 재구성 | 높음 |

## 16. 결론

새 운영 구조를 `Vercel Pro + Supabase Pro + 네이버 Object Storage`로 잡는 방향은 타당하다.

다만 현재 상태에서 바로 환경변수만 바꿔서 이전할 수 있는 것은 아니다.

필수 선행 작업:

1. DB를 SQLite에서 Supabase Postgres로 전환하는 별도 작업
2. 네이버 Object Storage adapter 구현
3. 기존 local/Vercel Blob 이미지 URL 처리 방침 결정
4. 새 Vercel 계정에 env 재입력
5. Preview에서 문의 저장, 관리자 로그인, 제작 사례 업로드 검증

특히 `DATABASE_URL`과 파일 storage는 자동 이전되지 않는다. 이 두 가지를 조심하면 전체 이전의 큰 줄기는 비교적 명확하다.

