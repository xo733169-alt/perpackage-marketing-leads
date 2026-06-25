# GPT Handoff - PerPackage Marketing Lead Management System Phase 5

이 문서는 GPT 또는 다른 개발 에이전트에게 현재 프로젝트 상태를 전달하기 위한 Phase 5 인수인계 문서입니다.

## 프로젝트 기본 정보

- 프로젝트명: PerPackage Marketing Lead Management System
- 회사명: 페르패키지
- 사업: 맞춤 패키지 박스 제조업
- 위치: 서울 중구 을지로
- 프로젝트 경로: `C:\Users\inh78\OneDrive\문서\홈페이지 개발\perpackage-marketing-leads`
- 현재 완료 단계: Phase 5

## 기술 스택

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- Zod
- Vitest

## 중요한 운영 원칙

- 고객-facing UI 문구는 한국어로 유지한다.
- 예상 가격을 확정 견적으로 표현하지 않는다.
- 최종 견적은 상담 후 확정된다.
- 고객 화면의 견적 문구에는 항상 참고용 예상 범위 또는 조정 가능성 disclaimer가 포함되어야 한다.
- 내부 견적 룰, 배율, 계산 메모, 원가성 판단 로직은 공개 화면에 노출하지 않는다.
- 견적안은 관리자 검토 후 작성하는 내부 운영 문서다.
- 견적안은 고객에게 자동 발송하지 않는다.
- 고객 수락은 결제나 전자계약이 아니다.
- 공유 링크는 링크를 아는 사람이 볼 수 있는 제한 링크이므로 외부에 공개하지 않는다.
- 공유 페이지에는 phone, email, kakaoId, internalMemo, 내부 룰 정보를 노출하지 않는다.
- `/q/[token]` 공유 페이지는 sitemap에 포함하지 않고 `noindex, nofollow`로 유지한다.
- 결제, KakaoTalk API, 외부 광고 API, ERP, 재고관리, 이미지 업로드/스토리지는 아직 구현하지 않는다.
- 기존 Phase 1, 1.5, 2, 2.5, 3, 4, 4.5 기능은 제거하거나 재작성하지 않는다.

## 현재 구현 완료 기능

### Phase 1 / 1.5

- 공개 랜딩 페이지: `/`
- 견적 문의 폼
- 리드 DB 저장
- Honeypot 스팸 방어
- 개인정보 필수 동의
- 마케팅 수신 선택 동의
- UTM/referrer/landingPath 추적
- 문의 완료 페이지: `/thanks`
- 개인정보 안내 페이지: `/privacy`
- 관리자 로그인: `/admin/login`
- 관리자 리드 목록: `/admin/leads`
- 관리자 리드 상세: `/admin/leads/[id]`
- CSV export
- 리드 상태, 메모, 후속 연락 관리
- 리드 삭제
- 선택적 리드 알림 webhook

### Phase 2 / 2.5

- `PortfolioCase` 모델
- 관리자 제작 사례 목록/등록/수정 페이지
- 공개 제작 사례 목록/상세 페이지
- 제작 사례에서 견적 문의로 이어지는 sourceCase 추적
- 제작 사례 공개 승인 workflow
- 제작 사례 SEO 체크리스트와 미리보기
- 제작 사례 image alt/caption 관리
- 제작 사례 import workflow
- robots.txt route
- sitemap route
- 관리자 운영 체크리스트 페이지: `/admin/checklist`

### Phase 3

- 관리자 성과 대시보드: `/admin/analytics`
- 수동 마케팅 비용 관리: `/admin/marketing-costs`
- `MarketingCost` 모델
- 리드 전환 추적 필드
- 관리자 공통 내비게이션
- 소스/캠페인/제작 사례/업종/박스 종류별 성과 집계
- 후속 연락 필요 리드 요약
- 확정 주문 금액 내부 기록

### Phase 4

- 구조화된 rule 기반 참고 견적 엔진
- `QuoteRule` 모델
- Lead 견적 스냅샷 필드
- 관리자 견적 룰 관리 페이지
- 관리자 견적 계산기
- 공개 견적 폼의 새 견적 미리보기
- 리드 저장 시 서버 사이드 견적 스냅샷 저장
- 관리자 리드 상세의 참고 견적 정보 섹션
- CSV export에 견적 스냅샷 필드 포함
- 기본 견적 룰 seed 스크립트
- 견적 엔진 테스트

### Phase 4.5

- `QuoteProposal` 모델
- `QuoteProposalItem` 모델
- `QuoteRuleChangeLog` 모델
- 리드 기반 관리자 견적안 작성
- 견적안 항목 관리
- 서버 사이드 견적안 합계 계산
- 견적안 상태 workflow
- 프린트용 견적안 페이지
- 견적안 상태 변경 시 관련 Lead 전환 상태 갱신
- 견적 룰 변경 이력 저장
- 견적 룰 변경 이력 관리자 UI
- 견적 보정 대시보드
- 견적안/견적 보정 관리자 내비게이션

### Phase 5

- `QuoteProposalShareLink` 모델
- `QuoteProposalCustomerResponse` 모델
- `QuoteActivityLog` 모델
- 관리자 견적안 공유 링크 생성
- 공유 링크 폐기
- 공유 링크 재생성
- token 기반 고객 견적안 공유 페이지
- 고객 수락/거절/수정 요청 응답
- 고객 응답에 따른 QuoteProposal 및 Lead 상태 갱신
- 공유 링크 조회 기록
- 견적 activity timeline
- 선택적 고객 응답 webhook
- `/q` robots disallow
- `/q/[token]` noindex/nofollow
- Phase 5 README 문서화

## Phase 5 핵심 구현 내용

### 새 Prisma 모델: QuoteProposalShareLink

`QuoteProposalShareLink`는 고객 공유 링크를 관리합니다.

주요 필드:

```text
id
quoteProposalId
tokenHash
tokenPreview
status
expiresAt
revokedAt
firstViewedAt
lastViewedAt
viewCount
createdBy
createdAt
updatedAt
```

상태:

```text
ACTIVE   활성
REVOKED  폐기
EXPIRED  만료
```

보안 기준:

- raw token은 DB에 저장하지 않는다.
- DB에는 SHA-256 `tokenHash`만 저장한다.
- `tokenPreview`는 관리자 표시용 마지막 6자리다.
- raw URL은 생성 직후 관리자 화면에서만 보여준다.
- 링크를 잃어버리면 새 링크를 재생성해야 한다.
- 재생성 시 기존 활성 링크는 폐기된다.

### 새 Prisma 모델: QuoteProposalCustomerResponse

`QuoteProposalCustomerResponse`는 공유 링크를 통한 고객 응답을 저장합니다.

주요 필드:

```text
id
quoteProposalId
shareLinkId
responseType
message
responderName
createdAt
```

응답 유형:

```text
ACCEPTED            수락
REJECTED            거절
REVISION_REQUESTED  수정 요청
```

응답 처리:

- `ACCEPTED`: QuoteProposal status -> `ACCEPTED`, 관련 Lead -> `ORDER_CONFIRMED`
- `REJECTED`: QuoteProposal status -> `REJECTED`, Lead는 자동 종료하지 않음
- `REVISION_REQUESTED`: QuoteProposal status -> `READY_TO_SEND`, 관리자가 수동 수정
- 한 공유 링크당 고객 응답은 1회만 허용

### 새 Prisma 모델: QuoteActivityLog

`QuoteActivityLog`는 견적 관련 주요 이벤트 timeline입니다.

주요 필드:

```text
id
leadId
quoteProposalId
type
actor
message
metadataJson
createdAt
```

기록 type:

```text
PROPOSAL_CREATED
PROPOSAL_UPDATED
PROPOSAL_STATUS_CHANGED
SHARE_LINK_CREATED
SHARE_LINK_REVOKED
SHARE_LINK_VIEWED
CUSTOMER_ACCEPTED
CUSTOMER_REJECTED
CUSTOMER_REVISION_REQUESTED
```

actor:

```text
admin
customer
system
```

주의:

- `metadataJson`에 전화번호, 이메일, 카카오톡 ID, 고객 메시지 전문, 내부 메모를 넣지 않는다.
- 활동 내역은 관리자 견적안 상세와 관련 Lead 상세에서 확인한다.

## 새 경로

### 관리자 경로

```text
/admin/quote-proposals/[id]
/admin/leads/[id]
```

위 기존 페이지에 Phase 5 섹션이 추가되었습니다.

- 견적안 상세: 공유 링크, 고객 응답, 활동 내역
- 리드 상세: 견적 활동 내역 요약

### 고객 경로

```text
/q/[token]
```

고객 공유 페이지입니다.

특징:

- token hash로 공유 링크를 찾는다.
- `ACTIVE`이고 만료되지 않은 링크만 견적안을 보여준다.
- 폐기/만료/무효 링크는 상세를 노출하지 않는다.
- 첫 조회/마지막 조회/조회 수를 기록한다.
- 공유 페이지 방문 시 `SHARE_LINK_VIEWED` activity를 기록한다.
- `noindex, nofollow` metadata가 설정되어 있다.

## 새 API 경로

```text
POST   /api/admin/quote-proposals/[id]/share-links
DELETE /api/admin/quote-share-links/[id]
POST   /api/quote-share/[token]/response
```

### POST /api/admin/quote-proposals/[id]/share-links

관리자 전용 공유 링크 생성 API입니다.

요청:

```json
{
  "expiresInDays": 14,
  "regenerate": false
}
```

동작:

- 관리자 인증 필요
- Origin/Referer 검사
- 활성 링크가 있고 `regenerate=false`이면 409 반환
- `regenerate=true`이면 기존 활성 링크를 폐기하고 새 링크 생성
- raw share URL을 응답으로 반환
- DB에는 tokenHash와 tokenPreview만 저장

### DELETE /api/admin/quote-share-links/[id]

관리자 전용 공유 링크 폐기 API입니다.

동작:

- 관리자 인증 필요
- Origin/Referer 검사
- link status -> `REVOKED`
- `revokedAt` 저장
- `SHARE_LINK_REVOKED` activity 기록

### POST /api/quote-share/[token]/response

고객 응답 API입니다.

요청:

```json
{
  "responseType": "ACCEPTED",
  "responderName": "담당자명",
  "message": "수정 요청 또는 의견"
}
```

동작:

- 로그인 불필요
- token은 유효, 활성, 미만료 상태여야 함
- 한 공유 링크당 응답 1회만 허용
- 고객 응답 저장
- QuoteProposal status 갱신
- 수락 시 관련 Lead를 `ORDER_CONFIRMED`로 갱신
- activity 기록
- 선택 webhook 전송

## 주요 파일

### Prisma

```text
prisma/schema.prisma
prisma/migrations/20260620074723_add_quote_share_and_customer_response/migration.sql
```

### 새 helper

```text
src/lib/quote-share.ts
src/lib/quote-share-schema.ts
src/lib/quote-activity.ts
src/lib/quote-response-notifications.ts
```

### 새 컴포넌트

```text
src/components/QuoteShareLinkManager.tsx
src/components/QuoteShareResponseForm.tsx
```

### 새 페이지/API

```text
src/app/q/[token]/page.tsx
src/app/api/admin/quote-proposals/[id]/share-links/route.ts
src/app/api/admin/quote-share-links/[id]/route.ts
src/app/api/quote-share/[token]/response/route.ts
```

### 수정된 기존 파일

```text
src/app/admin/quote-proposals/[id]/page.tsx
src/app/admin/leads/[id]/page.tsx
src/app/api/admin/quote-proposals/route.ts
src/app/api/admin/quote-proposals/[id]/route.ts
src/app/robots.ts
.env.example
README.md
```

### 테스트

```text
src/test/quote-share.test.ts
src/test/quote-share-schema.test.ts
src/test/quote-activity.test.ts
src/test/quote-response-notifications.test.ts
```

## 공유 링크 workflow

1. 관리자가 `/admin/quote-proposals/[id]`에 접속한다.
2. “공유 링크” 섹션에서 만료 기간을 선택한다.
3. “공유 링크 생성”을 누른다.
4. 생성 직후 표시되는 `/q/[token]` URL을 복사한다.
5. 관리자가 카카오톡, 이메일, 문자 등 외부 채널로 직접 고객에게 전달한다.
6. 고객이 링크를 열면 조회 수와 조회 시간이 기록된다.
7. 고객은 수락/거절/수정 요청 중 하나를 선택한다.
8. 응답은 관리자 견적안 상세의 “고객 응답” 섹션에 표시된다.
9. 관련 activity는 견적안 상세과 리드 상세에서 확인할 수 있다.

주의:

- 시스템은 이메일이나 카카오톡 메시지를 자동 발송하지 않는다.
- 링크를 아는 사람은 견적안을 볼 수 있으므로 공개 채널에 올리면 안 된다.
- raw link는 생성 직후에만 표시된다.

## 고객 공유 페이지 표시/비표시 정보

표시:

- 견적안 번호
- 작성일
- 유효일
- 고객명/회사명 snapshot
- 제작 사양
- 견적 항목
- 공급가
- 부가세
- 합계
- 납기 안내
- 결제 조건
- 고객 안내 메시지
- disclaimer

비표시:

- phoneSnapshot
- emailSnapshot
- kakaoIdSnapshot
- internalMemo
- 내부 견적 룰
- 배율
- 계산 메모
- 원가성 판단 로직

공유 페이지 disclaimer:

> 본 견적안은 입력된 사양 기준의 안내 금액이며, 최종 제작 조건, 원자재, 후가공, 일정 확인에 따라 조정될 수 있습니다.

## 고객 응답 후 상태 변경

### ACCEPTED

QuoteProposal:

- status -> `ACCEPTED`

Lead:

- status -> `ORDER_CONFIRMED`
- `orderConfirmedAt`이 비어 있으면 현재 시각 저장
- `confirmedOrderAmountKrw`가 비어 있으면 견적안 total 저장

Activity:

- `CUSTOMER_ACCEPTED`

### REJECTED

QuoteProposal:

- status -> `REJECTED`

Lead:

- 자동 종료하지 않음
- lostReason은 관리자가 리드 상세에서 별도 입력

Activity:

- `CUSTOMER_REJECTED`

### REVISION_REQUESTED

QuoteProposal:

- status -> `READY_TO_SEND`

Lead:

- 자동 변경 없음

Activity:

- `CUSTOMER_REVISION_REQUESTED`

## SEO / robots

`src/app/q/[token]/page.tsx`:

- `robots.index = false`
- `robots.follow = false`

`src/app/robots.ts`:

- `/q` disallow 추가

`src/app/sitemap.ts`:

- `/q` 공유 링크는 포함하지 않음

검증 결과:

- `/robots.txt`에서 `Disallow: /q` 확인
- `/sitemap.xml`에 `/q` 미포함 확인

## 선택 webhook

환경 변수:

```env
QUOTE_RESPONSE_WEBHOOK_URL=""
```

helper:

```text
src/lib/quote-response-notifications.ts
```

전송 payload:

```text
proposalId
proposalNumber
responseType
createdAt
leadId
adminUrl
```

전송하지 않는 정보:

- phone
- email
- kakaoId
- 고객 메시지 전문
- internalMemo

Webhook 실패는 고객 응답 접수를 실패시키지 않습니다.

## 마이그레이션

생성된 마이그레이션:

```text
prisma/migrations/20260620074723_add_quote_share_and_customer_response/migration.sql
```

실행 명령:

```bash
pnpm db:migrate
pnpm exec prisma generate
```

검증 결과:

```text
Prisma migration status: Database schema is up to date.
```

## 실행 명령

```bash
pnpm install
pnpm db:migrate
pnpm quote-rules:seed
pnpm dev
```

품질 확인:

```bash
pnpm lint
pnpm test
pnpm build
```

## 환경 변수

`.env.example` 기준:

```env
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="change-me"
NEXT_PUBLIC_KAKAO_CHANNEL_URL="카카오톡 채널 URL"
NEXT_PUBLIC_SITE_URL="http://127.0.0.1:3000"
LEAD_NOTIFICATION_WEBHOOK_URL=""
QUOTE_RESPONSE_WEBHOOK_URL=""
```

운영 전 실제 값 확인:

- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_KAKAO_CHANNEL_URL`
- `QUOTE_RESPONSE_WEBHOOK_URL` 사용 여부

## Phase 5 검증 결과

다음 검증을 완료했습니다.

```text
pnpm lint  -> 통과
pnpm test  -> 통과, 23 files / 73 tests
pnpm build -> 통과
```

실제 개발 서버 검증:

- 관리자 로그인 200
- 테스트 리드 생성 201
- 테스트 견적안 생성
- 공유 URL 생성
- `/q/[token]` 고객 페이지 200
- 공유 페이지에서 phone/email/kakaoId/internalMemo 미노출 확인
- 고객 수락 응답 201
- 같은 링크 중복 응답 409
- QuoteProposal status -> `ACCEPTED`
- Lead status -> `ORDER_CONFIRMED`
- `confirmedOrderAmountKrw`에 1,650,000 저장 확인
- 공유 링크 조회 수 1 기록
- tokenHash 64자 SHA-256 hash 확인
- 고객 응답 1건 저장
- activity 4건 생성 확인
- 공유 링크 폐기 200
- 폐기 후 같은 URL에서 invalid/expired 안내 확인
- `/robots.txt`에서 `/q` disallow 확인
- `/sitemap.xml`에 `/q` 미포함 확인
- QA 테스트 데이터 삭제 확인

## 다음 GPT가 작업할 때 주의할 점

- Phase 5 기능을 다시 구현하지 말고 현재 상태 위에서 이어서 작업한다.
- 견적 공유 링크는 제한 링크이지 인증 시스템이 아니다.
- raw token은 저장하지 않는다.
- 공유 페이지는 sitemap에 넣지 않는다.
- 공유 페이지는 noindex/nofollow를 유지한다.
- 공유 페이지에 phone/email/kakaoId/internalMemo/internal rule data를 노출하지 않는다.
- 고객 수락을 결제, 전자서명, 계약 체결 완료처럼 표현하지 않는다.
- 시스템에서 이메일/KakaoTalk/문자를 자동 발송하지 않는다.
- 견적안 공유 URL은 관리자가 외부 채널로 직접 전달한다.
- 기존 Lead quote snapshot은 quote rule 변경으로 다시 계산하지 않는다.
- 기존 Phase 1-4.5 기능을 삭제하거나 구조적으로 갈아엎지 않는다.

## 남은 제한 사항

- 공유 링크는 별도 로그인이나 본인 인증이 없는 제한 링크다.
- 고객 수락은 결제나 전자계약이 아니다.
- 견적안 자동 이메일 발송은 구현하지 않았다.
- KakaoTalk API 연동은 구현하지 않았다.
- 서버 사이드 PDF 생성은 구현하지 않았다.
- 전자서명/계약 기능은 구현하지 않았다.
- 결제 기능은 구현하지 않았다.
- ERP, 생산관리, 재고관리 기능은 구현하지 않았다.
- QuoteRule 보정은 자동으로 적용하지 않는다.
- 기본 QuoteRule seed 숫자는 placeholder 기준이므로 운영 전 실제 단가 검토가 필요하다.

## 다음 단계 후보

아래는 아직 구현하지 않은 다음 단계 후보입니다. 사용자가 별도로 요청할 때만 진행하세요.

### Phase 6 후보: 견적안 revision workflow

- 견적안 revision number
- 기존 견적안 복제 후 수정안 작성
- 고객 수정 요청에서 revision draft 생성
- 이전 견적안과 새 견적안 비교
- revision별 고객 응답 추적

### Phase 6 후보: 상담 활동 timeline 강화

- 리드 활동 로그 통합
- 전화/카카오톡/이메일 상담 기록 수동 입력
- 후속 연락 알림
- 상담 담당자 필드
- 견적안 변경 이력과 고객 응답 timeline 통합 보기

### Phase 6 후보: 운영 배포 준비

- SQLite에서 PostgreSQL 전환 검토
- 운영 DB 백업 정책
- 관리자 접근 제한 강화
- 배포 환경 변수 점검
- 운영 로그/모니터링

## 다음 GPT에게 보낼 수 있는 요청 예시

```text
You are a senior full-stack developer continuing the existing “PerPackage Marketing Lead Management System”.

The current completed phase is Phase 5.
Do not rewrite the app.
Do not remove Phase 1, 1.5, 2, 2.5, 3, 4, 4.5, or 5 features.
Read GPT_HANDOFF_PHASE_5.md first.
Then inspect package.json, prisma/schema.prisma, README.md, and the current app routes.

All customer-facing UI text must be Korean.
Never present reference estimates as confirmed quotes.
Quote proposals are admin-created.
Quote share pages must be token-based, noindex/nofollow, and must not expose phone, email, kakaoId, internalMemo, or internal quote logic.
Do not add payment, KakaoTalk API, external APIs, ERP, inventory, or image upload unless explicitly requested.

Continue from the current codebase and implement only the next requested phase.
```
