# GPT Handoff - PerPackage Marketing Lead Management System Phase 6

이 문서는 GPT 또는 다른 개발 에이전트에게 현재 프로젝트 상태와 Phase 6 구현 결과를 전달하기 위한 인수인계 문서입니다.

## 프로젝트 기본 정보

- 프로젝트명: PerPackage Marketing Lead Management System
- 회사명: 페르패키지
- 사업: 맞춤 패키지 박스 제조
- 위치: 서울 중구 을지로
- 프로젝트 경로: `C:\Users\inh78\OneDrive\문서\홈페이지 개발\perpackage-marketing-leads`
- 현재 완료 단계: Phase 6
- 기준 날짜: 2026-06-20

## 기술 스택

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- Zod
- Vitest

## 반드시 유지해야 하는 운영 원칙

- 기존 Phase 1부터 Phase 5까지의 기능을 제거하거나 다시 작성하지 않는다.
- 고객-facing UI 문구는 한국어로 유지한다.
- 공개 견적 미리보기는 확정 견적처럼 보이면 안 된다.
- 최종 견적은 상담과 관리자 검토 후 확정된다.
- 견적안 공유 링크는 제한 token 링크이며 공개 페이지가 아니다.
- `/q/[token]` 견적안 공유 페이지는 `noindex, nofollow`이며 sitemap에 포함하지 않는다.
- 고객 수락은 결제, 전자서명, 계약 체결이 아니다.
- 이메일, 카카오톡, SMS 자동 발송은 구현하지 않는다.
- KakaoTalk API, 결제, 외부 광고 API, ERP, 재고/생산관리, 이미지 업로드/스토리지는 구현하지 않는다.
- 고객 공유 페이지에는 전화번호, 이메일, 카카오톡 ID, 내부 메모, 내부 견적 룰, 배율, 계산 메모를 노출하지 않는다.
- 기존 Lead의 quote snapshot은 quote rule 변경으로 덮어쓰지 않는다.
- 수정 견적안은 기존 견적안을 덮어쓰지 않고 새 견적안으로 생성한다.
- 상담 이력은 관리자 전용 정보이며 공개 화면에 노출하지 않는다.

## 현재까지 구현된 주요 기능 요약

### Phase 1 / 1.5

- 공개 랜딩 페이지 `/`
- 견적 문의 form
- Lead DB 저장
- Honeypot spam protection
- 개인정보 필수 동의, 마케팅 선택 동의
- UTM/referrer/landingPath 추적
- Thank-you page `/thanks`
- 개인정보 안내 page `/privacy`
- 관리자 로그인 `/admin/login`
- 관리자 lead list/detail
- CSV export
- Lead status/memo/follow-up 관리
- Lead 삭제
- 선택 Lead notification webhook

### Phase 2 / 2.5

- `PortfolioCase` 모델
- 관리자 제작 사례 list/create/edit
- 공개 제작 사례 index/detail
- Portfolio-to-lead source tracking
- 공개 승인 workflow
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

## Phase 6 구현 완료 내용

Phase 6의 목표는 견적안 수정 workflow와 리드 상담 이력을 추가하는 것이었습니다.

구현된 핵심 기능:

1. Quote proposal revision group
2. 기존 견적안에서 새 수정 견적안 생성
3. revision number 표시
4. 이전 견적안과 현재 수정안 비교
5. 새 수정안 생성 시 기존 견적안 superseded 처리
6. Lead detail에서 revision group 단위로 견적안 확인
7. 고객 revision request를 관리자 수정안 생성 workflow와 연결
8. Lead communication log 모델과 상담 이력 UI
9. 상담 이력의 nextFollowUpAt을 Lead follow-up workflow와 연결
10. 수정안 생성 시 기존 활성 share link 폐기
11. 최신 수정안이 아닌 quote share page 노출 방어

## 새 데이터베이스 변경

### QuoteProposal 추가 필드

`QuoteProposal`에 다음 필드가 추가되었습니다.

- `revisionGroupId: String?`
- `revisionNumber: Int @default(1)`
- `parentProposalId: String?`
- `supersededByProposalId: String?`
- `isLatestRevision: Boolean @default(true)`
- `revisionReason: String?`
- `revisedFromCustomerResponseId: String?`
- `supersededAt: DateTime?`

추가 상태:

- `SUPERSEDED`: 대체됨

운영 규칙:

- 최초 견적안은 `revisionNumber = 1`
- 새 수정안은 같은 `revisionGroupId`를 유지한다.
- 새 수정안의 `parentProposalId`는 이전 견적안을 가리킨다.
- 이전 견적안은 `isLatestRevision = false`가 된다.
- 이전 견적안은 `supersededByProposalId`와 `supersededAt`이 기록된다.
- 이전 견적안은 수락/취소 상태가 아니라면 `SUPERSEDED`로 변경된다.
- 기존 견적안의 line item은 수정하지 않고 새 견적안에 복제한다.

### 새 모델: LeadCommunicationLog

리드별 상담 이력을 저장하기 위해 추가되었습니다.

필드:

- `id`
- `leadId`
- `channel`
- `direction`
- `summary`
- `detail`
- `contactedAt`
- `nextFollowUpAt`
- `createdAt`
- `updatedAt`

채널 값:

- `PHONE`: 전화
- `KAKAO`: 카카오톡
- `EMAIL`: 이메일
- `SMS`: 문자
- `MEETING`: 미팅
- `INTERNAL`: 내부 메모
- `OTHER`: 기타

방향 값:

- `INBOUND`: 고객 -> 페르패키지
- `OUTBOUND`: 페르패키지 -> 고객
- `INTERNAL`: 내부 기록

## 새 마이그레이션

생성 및 적용된 Prisma migration:

```text
prisma/migrations/20260620082115_add_quote_revision_and_lead_communication/migration.sql
```

운영 또는 새 환경에서 적용:

```bash
pnpm db:migrate
pnpm exec prisma generate
```

주의:

- 이번 작업 중 Windows에서 실행 중인 Next dev server가 Prisma query engine DLL을 잡고 있어서 `prisma generate`가 한 번 실패했습니다.
- dev server를 종료한 뒤 `prisma generate`를 다시 실행해 정상 완료했습니다.

## 새 라우트

관리자 페이지:

- `/admin/quote-proposals/[id]/revisions/new`
  - 기존 견적안에서 수정 견적안 생성 시작
- `/admin/quote-proposals/[id]/compare`
  - 현재 수정안과 parent proposal 비교

기존 페이지 업데이트:

- `/admin/quote-proposals/[id]`
  - 고객 수정 요청 안내
  - 수정안 만들기 버튼
  - revision history section
  - parent/superseded proposal link
  - 최신 수정안이 아닐 때 share warning
- `/admin/leads/[id]`
  - quote proposal을 revision group 단위로 표시
  - 상담 이력 section
  - 상담 이력 추가/삭제
  - 견적 활동과 상담 이력을 관리자 화면에서 확인
- `/q/[token]`
  - `SUPERSEDED` 또는 최신 revision이 아닌 proposal은 quote detail을 보여주지 않음

## 새 API

Revision API:

- `GET /api/admin/quote-proposals/[id]/revisions`
- `POST /api/admin/quote-proposals/[id]/revisions`

Lead communication API:

- `GET /api/admin/leads/[id]/communications`
- `POST /api/admin/leads/[id]/communications`
- `PATCH /api/admin/lead-communications/[id]`
- `DELETE /api/admin/lead-communications/[id]`

보안:

- 모든 API는 관리자 인증을 요구한다.
- mutation API는 기존 `isAllowedMutationOrigin` 검사를 따른다.
- 상담 이력은 공개 API나 공개 화면에 노출하지 않는다.

## 새 helper / schema

추가 파일:

- `src/lib/quote-proposal-revision.ts`
- `src/lib/quote-proposal-revision-schema.ts`
- `src/lib/lead-communication-schema.ts`

`quote-proposal-revision.ts` 주요 함수:

- `getNextRevisionNumber`
- `createRevisionTitle`
- `buildRevisionDraftFromProposal`
- `buildSupersededProposalUpdate`
- `compareProposalItems`
- `compareProposalTotals`
- `getRevisionStatusLabel`
- `getRevisionSummary`

`lead-communication-schema.ts` 주요 내용:

- 상담 채널/방향 enum
- 상담 이력 Zod validation
- Korean validation messages
- `shouldUpdateLeadFollowUp`

## 새 컴포넌트

- `src/components/QuoteRevisionCreateForm.tsx`
- `src/components/LeadCommunicationForm.tsx`
- `src/components/DeleteLeadCommunicationButton.tsx`

## 수정안 workflow

1. 고객이 `/q/[token]`에서 `수정 요청`을 제출한다.
2. 기존 Phase 5 response API가 `QuoteProposalCustomerResponse`를 생성한다.
3. 해당 proposal status는 `READY_TO_SEND`가 된다.
4. 관리자 proposal detail에 고객 수정 요청 안내가 표시된다.
5. 관리자가 `수정안 만들기`를 누른다.
6. `/admin/quote-proposals/[id]/revisions/new`에서 수정 사유를 확인한다.
7. `POST /api/admin/quote-proposals/[id]/revisions`가 새 `QuoteProposal`을 생성한다.
8. 기존 item을 새 proposal item으로 복제한다.
9. 이전 proposal은 `SUPERSEDED` 처리된다.
10. 이전 proposal의 active share link는 `REVOKED` 처리된다.
11. 새 proposal 편집 화면으로 이동한다.
12. 관리자가 수정 내용을 검토한 뒤 새 share link를 별도로 생성한다.

중요:

- 수정안 생성은 자동 발송이 아니다.
- 새 공유 링크도 자동 생성하지 않는다.
- 기존 quote proposal을 overwrite하지 않는다.
- 이전 proposal은 audit trail로 보존한다.

## 견적안 비교 기능

비교 페이지:

```text
/admin/quote-proposals/[id]/compare
```

비교 대상:

- 현재 proposal
- `parentProposalId`가 가리키는 이전 proposal

비교 내용:

- 이전/현재 proposal number
- 이전/현재 total
- 차이 금액
- 차이율
- line item 추가/삭제
- 수량 변경
- 단가 변경
- 금액 변경
- 사양 요약 변경
- 제작 메모 변경
- 납기 안내 변경
- 결제 조건 변경
- 고객 안내 문구 변경

parent proposal이 없으면:

```text
비교할 이전 견적안이 없습니다.
```

## 리드 상담 이력 workflow

관리자 리드 상세:

```text
/admin/leads/[id]
```

추가된 section:

- 상담 이력

관리자가 입력하는 값:

- 상담 채널
- 방향
- 요약
- 상세 내용
- 상담 일시
- 다음 연락 예정일

동작:

- 상담 이력은 `LeadCommunicationLog`에 저장된다.
- 상담 이력 생성 시 `QuoteActivityLog`에도 `COMMUNICATION_LOG_CREATED`가 기록된다.
- 상담 이력 수정/삭제 시에도 activity log가 생성된다.
- `nextFollowUpAt`이 입력되면 Lead의 `nextFollowUpAt`이 비어 있거나 더 늦은 날짜일 때 갱신된다.

## Activity log 추가 타입

`src/lib/quote-activity.ts`에 다음 타입이 추가되었습니다.

- `PROPOSAL_REVISION_CREATED`
- `COMMUNICATION_LOG_CREATED`
- `COMMUNICATION_LOG_UPDATED`
- `COMMUNICATION_LOG_DELETED`

## Customer share page safety update

`/q/[token]`은 기존 Phase 5 보안 규칙을 유지합니다.

추가 방어:

- proposal status가 `SUPERSEDED`이면 공유 페이지를 보여주지 않는다.
- proposal이 최신 revision이 아니면 공유 페이지를 보여주지 않는다.
- 수정안 생성 시 이전 proposal의 active share link는 revoke된다.

이로 인해 고객이 오래된 견적안을 다시 열어 혼동하는 상황을 줄입니다.

## 테스트 추가

새 테스트 파일:

- `src/test/quote-proposal-revision.test.ts`
- `src/test/lead-communication-schema.test.ts`

검증한 내용:

- next revision number 계산
- revision title 생성
- revision draft 생성
- proposal item comparison
- proposal total comparison
- superseded proposal update helper
- revision reason validation
- customer revision request message fallback
- lead communication schema validation
- lead follow-up date update rule

## 검증 결과

최종 검증 완료:

```bash
pnpm lint
pnpm test
pnpm build
```

결과:

- `pnpm lint`: 통과
- `pnpm test`: 통과
  - 25 test files
  - 82 tests
- `pnpm build`: 통과

Build 결과에 새 route가 포함됨:

- `/admin/quote-proposals/[id]/revisions/new`
- `/admin/quote-proposals/[id]/compare`
- `/api/admin/quote-proposals/[id]/revisions`
- `/api/admin/leads/[id]/communications`
- `/api/admin/lead-communications/[id]`

로컬 dev server:

```text
http://127.0.0.1:3000
```

확인한 HTTP 응답:

- `/`: 200
- `/admin/login`: 200

제한:

- 현재 환경에서 `git`이 PATH에 없어 `git status`는 확인하지 못했다.
- 브라우저 전용 도구가 노출되지 않아 클릭 기반 visual/browser 검증은 하지 못했다.
- 대신 HTTP 응답, lint, test, build는 완료했다.

## 주요 변경 파일 목록

Prisma:

- `prisma/schema.prisma`
- `prisma/migrations/20260620082115_add_quote_revision_and_lead_communication/migration.sql`

Lib:

- `src/lib/quote-proposal-revision.ts`
- `src/lib/quote-proposal-revision-schema.ts`
- `src/lib/lead-communication-schema.ts`
- `src/lib/quote-proposal-schema.ts`
- `src/lib/quote-activity.ts`
- `src/lib/proposal-number.ts`

Components:

- `src/components/QuoteRevisionCreateForm.tsx`
- `src/components/LeadCommunicationForm.tsx`
- `src/components/DeleteLeadCommunicationButton.tsx`

Admin pages:

- `src/app/admin/quote-proposals/[id]/page.tsx`
- `src/app/admin/quote-proposals/[id]/revisions/new/page.tsx`
- `src/app/admin/quote-proposals/[id]/compare/page.tsx`
- `src/app/admin/leads/[id]/page.tsx`

API:

- `src/app/api/admin/quote-proposals/route.ts`
- `src/app/api/admin/quote-proposals/[id]/revisions/route.ts`
- `src/app/api/admin/leads/[id]/communications/route.ts`
- `src/app/api/admin/lead-communications/[id]/route.ts`

Public quote share:

- `src/app/q/[token]/page.tsx`

Tests:

- `src/test/quote-proposal-revision.test.ts`
- `src/test/lead-communication-schema.test.ts`

Docs:

- `README.md`

## Phase 6 수동 테스트 절차

### 수정안 생성 확인

1. 관리자 로그인
2. `/admin/leads`에서 테스트 Lead 상세 진입
3. 견적안 작성
4. 견적안 상세에서 공유 링크 생성
5. `/q/[token]`으로 접속
6. 고객 응답에서 `수정 요청` 제출
7. 관리자 견적안 상세에서 고객 수정 요청 안내 확인
8. `수정안 만들기` 클릭
9. 수정 사유 입력 후 생성
10. 새 수정안 edit page로 이동하는지 확인
11. 이전 견적안이 `대체됨`으로 표시되는지 확인
12. 이전 active share link가 더 이상 견적 내용을 보여주지 않는지 확인

### 비교 화면 확인

1. 새 수정안 상세로 이동
2. `이전 견적안 비교` 클릭
3. item, total, 사양 문구 변경 비교가 표시되는지 확인

### 상담 이력 확인

1. `/admin/leads/[id]` 진입
2. 상담 채널, 방향, 요약, 상세 내용, 다음 연락 예정일 입력
3. 상담 이력이 최신순으로 표시되는지 확인
4. Lead summary의 다음 후속 연락 예정일이 갱신되는지 확인
5. 상담 이력 삭제 후 목록에서 사라지는지 확인

## 남은 제한사항 / TODO

- 수정안은 자동 발송되지 않는다. 관리자가 검토 후 새 공유 링크를 직접 생성하고 외부 채널로 전달해야 한다.
- 전자계약, 결제, 서명 workflow는 구현하지 않았다.
- KakaoTalk API, 이메일/SMS 자동 발송은 구현하지 않았다.
- 상담 이력 edit UI는 API는 있으나 현재 UI는 추가/삭제 중심이다. 필요하면 inline edit UI를 다음 단계에서 추가할 수 있다.
- full unified timeline은 완전한 단일 쿼리로 합치지 않고, 리드 상세에서 상담 이력과 견적 활동을 별도 section으로 제공한다.
- quote revision group은 relation model을 따로 만들지 않고 `revisionGroupId` string 기반으로 MVP 구현했다.
- 기존 과거 quote proposal 중 `revisionGroupId`가 없는 데이터는 화면과 API에서 `id`를 fallback group id로 사용한다.

## 다음 Phase 후보

Phase 7에서 고려할 수 있는 작업:

- 상담 이력 inline edit UI
- Lead detail의 상담 이력과 견적 활동을 완전한 unified timeline으로 통합
- 고객 수정 요청별 수정안 연결 UI 고도화
- quote proposal version diff를 더 상세하게 표시
- 관리자 dashboard에 revision request count와 aging 추가
- 공유 링크 만료/재발급 운영 현황 대시보드
- 견적안 고객 확인 후 follow-up 자동 reminder는 아직 외부 발송 없이 관리자 reminder 중심으로 설계 가능

