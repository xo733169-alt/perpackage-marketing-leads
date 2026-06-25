# GPT Handoff - PerPackage Marketing Lead Management System Phase 8

이 문서는 GPT 또는 다른 개발 에이전트가 현재 프로젝트 상태와 Phase 8 구현 내용을 빠르게 이해하고 이어서 작업할 수 있도록 만든 인수인계 문서입니다.

## 프로젝트 기본 정보

- 프로젝트명: PerPackage Marketing Lead Management System
- 회사명: 페르패키지
- 사업: 맞춤 패키지 박스 제조
- 위치: 서울 중구 을지로
- 프로젝트 경로: `C:\Users\inh78\OneDrive\문서\홈페이지 개발\perpackage-marketing-leads`
- 현재 완료 단계: Phase 8
- 기준 날짜: 2026-06-20

## 기술 스택

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- Zod
- Vitest
- Vercel 배포

## 절대 유지해야 하는 운영 규칙

- 기존 Phase 1부터 Phase 7까지의 기능을 삭제하거나 재작성하지 않는다.
- 고객-facing UI 문구는 한국어를 유지한다.
- 공개 견적 미리보기는 확정 견적처럼 보이면 안 된다.
- 최종 견적은 상담과 관리자 검토 후 확정된다.
- 견적안은 관리자 작성 문서이며 자동 발송하지 않는다.
- 견적 공유 링크는 제한 token 링크이며 공개 페이지가 아니다.
- `/q/[token]` 견적 공유 페이지는 `noindex/nofollow`를 유지하고 sitemap에 넣지 않는다.
- 고객 수락은 결제, 전자서명, 계약 체결 완료가 아니다.
- 이메일, 카카오톡, SMS 자동 발송을 구현하지 않는다.
- KakaoTalk API, 결제, 외부 광고 API, ERP, 재고/생산관리, 이미지 업로드는 아직 구현하지 않는다.
- 전화번호, 이메일, 카카오톡 ID, internalMemo, 내부 견적 룰, 배율, 계산 메모는 고객-facing 페이지에 노출하지 않는다.
- 기존 Lead quote snapshot은 quote rule 변경으로 다시 계산하지 않는다.
- 기존 quote proposal은 수정안 생성 시 덮어쓰지 않는다.
- 상담 이력과 업무 데이터는 관리자 전용이다.
- 실제 고객 데이터가 들어간 DB 파일을 Git, public repo, 외부 공유 링크에 올리지 않는다.
- SQLite preview DB는 private preview 확인용이며 실제 운영 DB로 간주하지 않는다.

## 현재까지 구현된 주요 기능 요약

### Phase 1 / 1.5

- 공개 랜딩 페이지 `/`
- 견적 문의 form
- Lead DB 저장
- Honeypot spam protection
- 개인정보 필수 동의, 마케팅 선택 동의
- UTM/referrer/landingPath 추적
- 문의 완료 페이지 `/thanks`
- 개인정보 안내 페이지 `/privacy`
- 관리자 로그인 `/admin/login`
- 관리자 lead list/detail
- CSV export
- Lead status, memo, follow-up 관리
- Lead 삭제
- 선택 Lead notification webhook

### Phase 2 / 2.5

- `PortfolioCase` 모델
- 관리자 제작 사례 list/create/edit
- 공개 제작 사례 index/detail
- Portfolio-to-lead source tracking
- 제작 사례 공개 승인 workflow
- SEO checklist/preview
- image alt/caption
- portfolio import workflow
- robots/sitemap
- 관리자 운영 체크리스트 `/admin/checklist`

### Phase 3

- 관리자 성과 대시보드 `/admin/analytics`
- 수동 마케팅 비용 관리 `/admin/marketing-costs`
- `MarketingCost` 모델
- Lead conversion fields
- source/campaign/portfolio/industry/boxType 성과 집계
- follow-up summary
- 관리자 공통 navigation

### Phase 4

- rule 기반 reference quote engine
- `QuoteRule` 모델
- Lead quote snapshot fields
- 관리자 quote rule 관리
- 관리자 quote calculator `/admin/quote-calculator`
- 공개 quote form reference-only preview
- quote rule seed script

### Phase 4.5

- `QuoteProposal` 모델
- `QuoteProposalItem` 모델
- `QuoteRuleChangeLog` 모델
- Lead 기반 관리자 quote proposal 작성
- proposal item 관리
- 서버 측 subtotal/VAT/total 계산
- print-friendly quote proposal page
- proposal status workflow
- proposal status 변경 시 Lead conversion field 갱신
- quote rule change history
- quote calibration dashboard `/admin/quote-calibration`

### Phase 5

- `QuoteProposalShareLink` 모델
- `QuoteProposalCustomerResponse` 모델
- `QuoteActivityLog` 모델
- 관리자 quote proposal share link 생성/폐기/재생성
- token 기반 고객 견적안 공유 page `/q/[token]`
- 고객 accept/reject/revision request
- 고객 response가 proposal/Lead status에 반영
- activity timeline
- optional quote response webhook
- `/q` robots disallow
- `/q/[token]` noindex/nofollow

### Phase 6

- Quote proposal revision workflow
- `SUPERSEDED` proposal status
- revisionGroupId/revisionNumber/parentProposalId/supersededByProposalId 등 revision fields
- 수정안 생성 route `/admin/quote-proposals/[id]/revisions/new`
- proposal compare page `/admin/quote-proposals/[id]/compare`
- 고객 revision request에서 수정안 작성 유도
- `LeadCommunicationLog` 모델
- 상담 이력 추가/수정/삭제 API 및 UI
- lead detail timeline 개선

### Phase 7

- `SalesTask` 모델
- 오늘 할 일 대시보드 `/admin/today`
- 업무 관리 `/admin/tasks`
- 업무 생성/수정/완료/취소
- follow-up due, revision request, quote action, share link expiry queue
- lead/quote proposal linked tasks
- unified lead timeline helper
- communication log inline edit UI
- AdminNav에 오늘 할 일/업무 관리 추가

### Phase 8

- Vercel 배포 readiness 보강
- private preview / site access 운영 기준 정리
- preview SQLite DB 주의사항 문서화
- PostgreSQL 전환 계획 문서 추가
- 백업/복구 운영 문서 추가
- 보안 체크리스트 문서 추가
- `/api/health` health check route 추가
- `deployment:check` 환경변수 검사 스크립트 추가
- `/admin/checklist`에 Vercel/DB/보안/운영 전 테스트 항목 추가
- README에 Vercel 환경변수, DATABASE_URL 오류 해결, preview DB, PostgreSQL 전환 안내 추가

## Phase 8에서 추가/수정된 주요 파일

### 새 파일

- `src/app/api/health/route.ts`
- `src/lib/deployment-health.ts`
- `src/lib/deployment-env.ts`
- `scripts/check-deployment-env.ts`
- `src/test/deployment-health.test.ts`
- `src/test/deployment-env.test.ts`
- `docs/postgresql-migration-plan.md`
- `docs/backup-and-restore.md`
- `docs/security-checklist.md`

### 수정 파일

- `package.json`
- `src/lib/site-access.ts`
- `src/test/site-access.test.ts`
- `src/app/admin/checklist/page.tsx`
- `README.md`
- `docs/vercel-deployment-checklist.md`

## 새 route

### `GET /api/health`

배포 상태 확인용 최소 health check입니다.

응답 예시:

```json
{
  "ok": true,
  "app": "PerPackage Marketing Lead Management System",
  "timestamp": "2026-06-20T12:00:00.000Z",
  "database": "configured",
  "siteAccess": "enabled"
}
```

주의:

- `DATABASE_URL` 값은 노출하지 않는다.
- 비밀번호나 secret을 노출하지 않는다.
- 고객 데이터나 DB row count를 노출하지 않는다.
- `SITE_ACCESS_ENABLED=true` private mode에서도 `/api/health`는 최소 정보 확인을 위해 bypass path로 허용되어 있다.

## 새 script

### `pnpm deployment:check`

필수 환경변수 누락 여부를 확인합니다.

검사 항목:

- `DATABASE_URL`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_SITE_URL`
- `SITE_ACCESS_ENABLED`
- `SITE_ACCESS_ENABLED=true`일 때:
  - `SITE_ACCESS_PASSWORD`
  - `SITE_ACCESS_SECRET`

출력 기준:

- 누락된 변수명만 출력한다.
- 실제 secret 값은 출력하지 않는다.
- `DATABASE_URL`이 `file:`로 시작하면 SQLite preview/testing 경고를 출력한다.

## Vercel 환경변수 기준

필수/권장 변수:

```env
DATABASE_URL="file:/var/task/prisma/preview.db?mode=ro"
ADMIN_PASSWORD="관리자 로그인 비밀번호"
NEXT_PUBLIC_SITE_URL="https://perpackage-marketing-leads.vercel.app"
NEXT_PUBLIC_KAKAO_CHANNEL_URL=""
LEAD_NOTIFICATION_WEBHOOK_URL=""
QUOTE_RESPONSE_WEBHOOK_URL=""
SITE_ACCESS_ENABLED="true"
SITE_ACCESS_PASSWORD="사이트 전체 접근 비밀번호"
SITE_ACCESS_SECRET="충분히 긴 랜덤 문자열"
```

역할 구분:

- `SITE_ACCESS_PASSWORD`: 앱 전체 private preview 접근용
- `ADMIN_PASSWORD`: `/admin/login` 관리자 로그인용
- `SITE_ACCESS_SECRET`: site access cookie 서명/검증용 secret
- `NEXT_PUBLIC_*`: 브라우저에 노출될 수 있으므로 secret 금지

중요:

- `SITE_ACCESS_PASSWORD`와 `ADMIN_PASSWORD`는 서로 달라야 한다.
- 환경변수 변경 후에는 반드시 Redeploy가 필요하다.
- Vercel sensitive 변수 값은 Dashboard/CLI에서 다시 볼 수 없다.

## Vercel 배포 상태

최근 작업 중 확인된 Production URL:

```text
https://perpackage-marketing-leads.vercel.app
```

현재 private access gate가 켜져 있으면 `/` 접속 시 `/access?next=%2F`로 이동합니다.

확인 흐름:

1. `/access`에서 `SITE_ACCESS_PASSWORD` 입력
2. 홈 랜딩 페이지 확인
3. `/admin/login` 이동
4. `ADMIN_PASSWORD` 입력
5. 관리자 화면 확인

## DATABASE_URL 관련 주의

이전 Vercel build 실패 원인:

```text
Environment variable not found: DATABASE_URL
```

해결:

1. Vercel Project Settings로 이동
2. Environment Variables에서 `DATABASE_URL` 추가
3. 현재 preview SQLite 기준:

```env
DATABASE_URL="file:/var/task/prisma/preview.db?mode=ro"
```

4. 나머지 필수 환경변수 추가
5. Redeploy 실행

추가로 발생했던 runtime 오류:

```text
PrismaClientInitializationError: Error code 14: Unable to open the database file
```

대응:

- Vercel 런타임 기준 SQLite 경로를 `file:/var/task/prisma/preview.db?mode=ro`로 맞춤
- `next.config.mjs`에서 `./prisma/preview.db`를 output trace에 포함
- 홈 화면과 sitemap의 portfolio DB 조회 실패 시 전체 500이 나지 않도록 fallback 처리됨

## Preview SQLite DB 정책

- `prisma/preview.db`는 sanitized preview DB다.
- 실제 고객 lead, 상담 이력, 견적안, 업무 데이터가 들어가면 안 된다.
- Vercel serverless 환경에서 SQLite는 실제 운영 저장소로 적합하지 않다.
- 실제 고객 문의를 운영 저장하려면 PostgreSQL 전환이 필요하다.

관련 문서:

```text
docs/postgresql-migration-plan.md
docs/backup-and-restore.md
```

## PostgreSQL 전환 계획 요약

Phase 8에서는 PostgreSQL로 전환하지 않았다.

전환은 별도 작업으로 진행해야 한다.

권장 순서:

1. 별도 브랜치 생성
2. 관리형 PostgreSQL 준비
3. `prisma/schema.prisma` provider를 `postgresql`로 변경
4. PostgreSQL `DATABASE_URL` 설정
5. migration 생성
6. 로컬 검증
7. quote rule seed 확인
8. Preview 배포
9. 관리자 주요 화면 검증
10. 백업 후 Production 승격

## 백업/보안 문서

추가된 문서:

```text
docs/backup-and-restore.md
docs/security-checklist.md
docs/vercel-deployment-checklist.md
```

핵심 원칙:

- 실제 고객 DB 파일은 Git에 올리지 않는다.
- Preview DB에는 실제 고객 데이터를 넣지 않는다.
- `/q/[token]`은 noindex/nofollow와 sitemap 제외를 유지한다.
- 고객-facing 페이지에는 phone, email, kakaoId, internalMemo, 내부 quote rule을 노출하지 않는다.
- Webhook payload는 개인정보를 최소화한다.
- CSV export 파일은 개인정보 포함 가능성이 있으므로 외부 공유 전 주의한다.

## 검증 결과

Phase 8 구현 후 아래 명령을 실행했습니다.

```bash
pnpm deployment:check
pnpm lint
pnpm test
pnpm build
```

결과:

- `pnpm deployment:check`: 통과
- `pnpm lint`: 통과
- `pnpm test`: 통과
  - 31 test files
  - 105 tests
- `pnpm build`: 통과

## 현재 제한 사항

- Prisma provider는 여전히 SQLite다.
- PostgreSQL 전환은 아직 하지 않았다.
- 자동 백업 job은 구현하지 않았다.
- 실제 운영 DB 백업은 DB provider의 managed backup 기능을 사용해야 한다.
- Vercel preview SQLite는 private preview 확인용이다.
- 실제 고객 문의 저장을 운영하려면 PostgreSQL 전환이 필요하다.
- 이메일, KakaoTalk, SMS 자동 발송은 아직 구현하지 않았다.
- 결제, 전자서명, ERP, 재고/생산관리는 구현하지 않았다.

## 다음 GPT가 이어서 작업할 때 권장 순서

1. 먼저 `package.json`, `prisma/schema.prisma`, `.env.example`, `README.md`를 확인한다.
2. `src/app/api/health/route.ts`, `src/lib/deployment-env.ts`, `src/lib/deployment-health.ts`를 확인한다.
3. Vercel 배포 오류가 있으면 `vercel logs`와 `vercel inspect`를 먼저 본다.
4. 실제 운영 전환 요청이 있으면 바로 schema를 바꾸지 말고 `docs/postgresql-migration-plan.md`를 기준으로 계획을 확인한다.
5. PostgreSQL 전환은 사용자가 PostgreSQL `DATABASE_URL`을 제공하고 명시적으로 요청할 때 진행한다.
6. 어떤 작업이든 고객-facing 견적 문구가 확정 견적처럼 보이지 않는지 확인한다.
7. 작업 후 `pnpm lint`, `pnpm test`, `pnpm build`를 실행한다.

## 다음 GPT에게 줄 수 있는 시작 프롬프트 예시

```text
You are a senior full-stack developer continuing the existing “PerPackage Marketing Lead Management System”.

The project has completed Phase 8: Vercel deployment readiness, private preview access, SQLite preview DB safety, PostgreSQL migration planning, backup/security docs, /api/health, and deployment env checks.

Do not rewrite the app.
Do not remove existing Phase 1 through Phase 8 features.
Do not migrate to PostgreSQL unless I explicitly provide a PostgreSQL DATABASE_URL and ask for migration.

First read:
- GPT_HANDOFF_PHASE_8.md
- package.json
- prisma/schema.prisma
- README.md
- docs/postgresql-migration-plan.md
- docs/backup-and-restore.md
- docs/security-checklist.md

Then inspect the current task request and continue from the existing codebase.
```
