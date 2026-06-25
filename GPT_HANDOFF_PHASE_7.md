# GPT Handoff - PerPackage Marketing Lead Management System Phase 7

이 문서는 GPT 또는 다른 개발 에이전트가 현재 프로젝트 상태와 Phase 7 구현 내용을 빠르게 이해하고 이어서 작업할 수 있도록 만든 인수인계 문서입니다.

## 프로젝트 기본 정보

- 프로젝트명: PerPackage Marketing Lead Management System
- 회사명: 페르패키지
- 사업: 맞춤 패키지 박스 제조
- 위치: 서울 중구 을지로
- 프로젝트 경로: `C:\Users\inh78\OneDrive\문서\홈페이지 개발\perpackage-marketing-leads`
- 현재 완료 단계: Phase 7
- 기준 날짜: 2026-06-20

## 기술 스택

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- Zod
- Vitest

## 절대 유지해야 하는 운영 규칙

- 기존 Phase 1부터 Phase 6까지의 기능을 삭제하거나 재작성하지 않는다.
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
- `LeadCommunicationLog` 모델
- 기존 견적안을 덮어쓰지 않는 수정 견적안 생성
- revision number, revision group, parent/superseded proposal 관리
- 이전/현재 견적안 비교 페이지
- 고객 수정 요청을 관리자 수정안 작성 workflow에 연결
- 리드 상담 이력 추가/삭제
- 상담 이력의 nextFollowUpAt을 Lead follow-up workflow에 연결

## Phase 7 구현 완료 내용

Phase 7의 목표는 관리자 세일즈 운영 레이어를 추가하는 것이었습니다.

구현된 핵심 기능:

1. `SalesTask` 모델 추가
2. 관리자 오늘 할 일 대시보드 `/admin/today`
3. 관리자 업무 관리 페이지 `/admin/tasks`
4. 업무 생성 페이지 `/admin/tasks/new`
5. 업무 수정 페이지 `/admin/tasks/[id]/edit`
6. 관리자 업무 CRUD API
7. 리드 상세의 연결 업무 섹션
8. 견적안 상세의 연결 업무 섹션
9. 리드 상세의 전체 활동 타임라인
10. 상담 이력 inline edit UI
11. 고객 수정 요청 action queue
12. 견적안 action queue
13. 공유 링크 만료 action queue
14. 업무 후보 중복 방지 로직
15. AdminNav에 오늘 할 일/업무 관리 링크 추가
16. README Phase 7 문서화

## 데이터베이스 변경

### 새 모델: SalesTask

`prisma/schema.prisma`에 `SalesTask` 모델이 추가되었습니다.

필드:

- `id`
- `leadId`
- `quoteProposalId`
- `title`
- `description`
- `type`
- `priority`
- `status`
- `dueAt`
- `completedAt`
- `cancelledAt`
- `assignedTo`
- `sourceType`
- `sourceId`
- `createdAt`
- `updatedAt`

관계:

- `Lead.salesTasks`
- `QuoteProposal.salesTasks`

업무 유형:

- `FOLLOW_UP`: 후속 연락
- `QUOTE_PREP`: 견적안 작성
- `REVISION_REVIEW`: 수정 요청 검토
- `QUOTE_SHARE`: 견적안 공유
- `CUSTOMER_RESPONSE`: 고객 응답 확인
- `SHARE_LINK_EXPIRY`: 공유 링크 만료 확인
- `GENERAL`: 일반 업무

우선순위:

- `LOW`: 낮음
- `NORMAL`: 보통
- `HIGH`: 높음
- `URGENT`: 긴급

상태:

- `TODO`: 예정
- `IN_PROGRESS`: 진행중
- `DONE`: 완료
- `CANCELLED`: 취소

중복 방지:

- `sourceType + sourceId` 조합으로 같은 출처의 미완료 업무 중복 생성을 방지합니다.
- 완료 또는 취소된 업무는 같은 출처로 다시 만들 수 있습니다.

## 마이그레이션

생성된 Prisma migration:

```text
prisma/migrations/20260620093935_add_sales_tasks/migration.sql
```

마이그레이션 이름:

```text
add_sales_tasks
```

적용 명령:

```bash
pnpm db:migrate
pnpm exec prisma generate
```

## 새 관리자 라우트

### 오늘 할 일

```text
/admin/today
```

역할:

- 오늘 처리할 업무와 주요 액션 큐를 한 화면에서 보여줍니다.
- 외부 발송은 하지 않습니다.
- 관리자가 직접 확인하고 처리하는 내부 운영 대시보드입니다.

표시 섹션:

- Summary cards
- 오늘 업무
- 신규 문의 확인
- 후속 연락 필요
- 고객 수정 요청
- 견적안 조치 필요
- 곧 만료되는 공유 링크

### 업무 관리

```text
/admin/tasks
/admin/tasks/new
/admin/tasks/[id]/edit
```

지원 기능:

- 업무 검색
- 상태 필터
- 유형 필터
- 우선순위 필터
- 기한 상태 필터
- 정렬
- 업무 생성
- 업무 수정
- 완료 처리
- 취소 처리
- 삭제

기한 상태 필터:

- 전체
- 오늘
- 기한 지남
- 예정
- 완료

정렬:

- 기한 빠른순
- 우선순위순
- 최신순

## 새 API

관리자 전용 API:

```text
GET    /api/admin/tasks
POST   /api/admin/tasks
GET    /api/admin/tasks/[id]
PATCH  /api/admin/tasks/[id]
DELETE /api/admin/tasks/[id]
```

보안:

- 모두 관리자 인증이 필요합니다.
- mutation 요청은 기존 Origin/Referer safety check를 따릅니다.
- 업무 데이터는 공개 API 또는 공개 페이지에 노출하지 않습니다.

상태 변경 규칙:

- `DONE`으로 변경하면 `completedAt`이 비어 있을 때 현재 시각을 저장합니다.
- `CANCELLED`로 변경하면 `cancelledAt`이 비어 있을 때 현재 시각을 저장합니다.

## 새 helper / schema

### `src/lib/sales-task-schema.ts`

역할:

- 업무 type/priority/status enum
- 한국어 label map
- Zod validation schema
- PATCH schema
- field error helper

주요 export:

- `SALES_TASK_TYPES`
- `SALES_TASK_PRIORITIES`
- `SALES_TASK_STATUSES`
- `SALES_TASK_TYPE_LABELS`
- `SALES_TASK_PRIORITY_LABELS`
- `SALES_TASK_STATUS_LABELS`
- `salesTaskSchema`
- `salesTaskPatchSchema`
- `toSalesTaskFieldErrors`

### `src/lib/sales-task.ts`

역할:

- 업무 label helper
- due/overdue 판단
- 오늘 업무 정렬
- action item candidate 생성
- candidate 중복 생성 방지

주요 함수:

- `getTaskTypeLabel`
- `getTaskPriorityLabel`
- `getTaskStatusLabel`
- `isTaskDue`
- `isTaskOverdue`
- `sortTasksForToday`
- `buildLeadFollowUpTaskCandidate`
- `buildRevisionRequestTaskCandidate`
- `buildQuoteProposalTaskCandidate`
- `buildShareLinkExpiryTaskCandidate`
- `shouldCreateTaskFromCandidate`
- `formatTaskDueLabel`

### `src/lib/lead-timeline.ts`

역할:

- 리드 기준 전체 활동 타임라인 구성

타임라인에 포함되는 항목:

- 문의 접수
- 상담 이력
- 견적안 작성
- 견적안 상태/활동
- 고객 응답
- 업무 생성
- 업무 완료
- 업무 취소

주요 함수:

- `buildLeadTimeline`
- `filterLeadTimelineItems`

## 새 컴포넌트

### `src/components/SalesTaskForm.tsx`

업무 생성/수정 form입니다.

지원:

- title
- description
- type
- priority
- status
- dueAt
- assignedTo
- leadId
- quoteProposalId
- 완료 처리
- 취소 처리
- 삭제

### `src/components/TaskQuickActions.tsx`

빠른 업무 액션 버튼입니다.

포함:

- `CompleteTaskButton`
- `CreateTaskFromCandidateButton`

### `src/components/LeadCommunicationEditor.tsx`

리드 상세에서 상담 이력을 inline으로 수정하는 client component입니다.

수정 필드:

- 상담 채널
- 방향
- 요약
- 상세 내용
- 상담 일시
- 다음 연락 예정일

## 기존 페이지 업데이트

### `/admin/leads/[id]`

추가된 내용:

- 연결 업무 섹션
- 후속 연락 업무 만들기 버튼
- 상담 이력 inline 수정 버튼
- 전체 활동 타임라인 섹션

리드 상세의 업무 생성 prefill:

- type: `FOLLOW_UP`
- title: `{customerName} 후속 연락`
- leadId: 현재 리드 ID
- dueAt: `Lead.nextFollowUpAt`이 있으면 해당 날짜, 없으면 내일
- priority: `NORMAL`

### `/admin/quote-proposals/[id]`

추가된 내용:

- 연결 업무 섹션
- 업무 추가 버튼
- 고객 확인 업무 만들기
- 수정 요청 검토 업무 만들기

견적안 상세의 업무 생성 prefill 예:

- 고객 확인 업무: `CUSTOMER_RESPONSE`
- 수정 요청 검토 업무: `REVISION_REVIEW`
- quoteProposalId: 현재 견적안 ID
- leadId: 연결 Lead가 있으면 해당 Lead ID

### `src/components/AdminNav.tsx`

추가 링크:

- 오늘 할 일: `/admin/today`
- 업무 관리: `/admin/tasks`

기존 링크는 유지합니다.

## 오늘 할 일 대시보드 로직

### 오늘 업무

조회 조건:

- `status`가 `TODO` 또는 `IN_PROGRESS`
- `dueAt`이 오늘 끝 시각 이하

정렬:

1. 기한 지난 업무 우선
2. dueAt 빠른 순
3. priority 높은 순
4. title 가나다순

### 신규 문의 확인

조회 조건:

- `Lead.status = NEW`
- 최신순

액션:

- 리드 보기
- 후속 연락 업무 만들기

### 후속 연락 필요

조회 조건:

- `Lead.nextFollowUpAt <= 오늘 끝`
- `Lead.status`가 `CLOSED`, `ORDER_CONFIRMED`가 아님

액션:

- 리드 보기
- 후속 연락 업무 만들기

### 고객 수정 요청

조회 조건:

- `QuoteProposal.customerResponses` 중 `REVISION_REQUESTED` 존재
- status가 `ACCEPTED`, `CANCELLED`, `SUPERSEDED`가 아님
- `supersededByProposalId`가 없음

액션:

- 견적안 보기
- 수정안 만들기
- 검토 업무 만들기

### 견적안 조치 필요

조회 조건:

- `READY_TO_SEND`인데 active share link가 없는 견적안
- 최근 수정된 `DRAFT` 견적안
- `SENT` 상태이고 3일 이상 고객 응답이 없는 견적안

액션:

- 견적안 보기
- 업무 만들기

### 곧 만료되는 공유 링크

조회 조건:

- share link status가 `ACTIVE`
- revokedAt 없음
- expiresAt이 현재부터 2일 이내
- proposal status가 `ACCEPTED`, `REJECTED`, `CANCELLED`, `SUPERSEDED`가 아님

액션:

- 견적안 보기
- 만료 확인 업무 만들기

## 리드 전체 활동 타임라인

리드 상세에 `전체 활동 타임라인` 섹션이 추가되었습니다.

포함 데이터:

- Lead created
- LeadCommunicationLog
- QuoteProposal created
- QuoteActivityLog
- QuoteProposalCustomerResponse
- SalesTask created/completed/cancelled

정렬:

- 최신순

주의:

- 완전한 이벤트 소싱 시스템은 아닙니다.
- 기존 데이터를 조합해서 관리자에게 흐름을 보여주는 MVP 타임라인입니다.
- 공개 페이지에 노출하지 않습니다.

## 상담 이력 inline edit

Phase 6에서 상담 이력 추가/삭제가 있었고, Phase 7에서 inline 수정 UI를 추가했습니다.

동작:

- 리드 상세의 상담 이력 항목마다 `수정` 버튼 표시
- inline form에서 상담 이력 수정
- 기존 `PATCH /api/admin/lead-communications/[id]` API 사용
- nextFollowUpAt 수정 시 기존 follow-up update rule에 따라 Lead.nextFollowUpAt 갱신

## 테스트 추가

추가된 테스트 파일:

- `src/test/sales-task-schema.test.ts`
- `src/test/sales-task.test.ts`
- `src/test/lead-timeline.test.ts`

검증한 내용:

- SalesTask schema validation
- PATCH schema validation
- task label helper
- due/overdue helper
- task sorting helper
- lead follow-up candidate builder
- revision request candidate builder
- quote proposal candidate builder
- share link expiry candidate builder
- duplicate prevention helper
- lead timeline build/sort/filter

## 최종 검증 결과

실행한 명령:

```bash
pnpm lint
pnpm test
pnpm run build
```

결과:

- `pnpm lint`: 통과
- `pnpm test`: 통과
  - 29 test files
  - 100 tests
- `pnpm run build`: 통과

빌드 route 목록에 포함된 새 route:

- `/admin/today`
- `/admin/tasks`
- `/admin/tasks/new`
- `/admin/tasks/[id]/edit`
- `/api/admin/tasks`
- `/api/admin/tasks/[id]`

로컬 HTTP 확인:

- `/admin/today`: 인증 전 307 redirect
- `/admin/tasks`: 인증 전 307 redirect

의미:

- 새 관리자 페이지도 기존 admin auth 보호를 받습니다.

## Vercel preview DB 참고

이전 배포 준비 과정에서 `prisma/preview.db`가 Vercel Preview용 sanitized SQLite DB로 사용되도록 구성되어 있었습니다.

Phase 7 이후 `preview.db`도 새 SalesTask 스키마를 포함하도록 갱신했고, 민감 데이터 테이블은 비워 두었습니다.

확인된 count:

```json
{
  "leads": 0,
  "salesTasks": 0,
  "proposals": 0,
  "portfolioCases": 0,
  "quoteRules": 0
}
```

주의:

- 운영 DB로 SQLite를 계속 쓸지, PostgreSQL로 전환할지는 별도 결정이 필요합니다.
- Preview DB에는 실제 고객 데이터나 민감 데이터를 넣지 않는 것이 원칙입니다.

## 주요 변경 파일 목록

Prisma:

- `prisma/schema.prisma`
- `prisma/migrations/20260620093935_add_sales_tasks/migration.sql`
- `prisma/preview.db`

Lib:

- `src/lib/sales-task.ts`
- `src/lib/sales-task-schema.ts`
- `src/lib/lead-timeline.ts`

Components:

- `src/components/SalesTaskForm.tsx`
- `src/components/TaskQuickActions.tsx`
- `src/components/LeadCommunicationEditor.tsx`
- `src/components/AdminNav.tsx`

Admin pages:

- `src/app/admin/today/page.tsx`
- `src/app/admin/tasks/page.tsx`
- `src/app/admin/tasks/new/page.tsx`
- `src/app/admin/tasks/[id]/edit/page.tsx`
- `src/app/admin/leads/[id]/page.tsx`
- `src/app/admin/quote-proposals/[id]/page.tsx`

API:

- `src/app/api/admin/tasks/route.ts`
- `src/app/api/admin/tasks/[id]/route.ts`

Tests:

- `src/test/sales-task-schema.test.ts`
- `src/test/sales-task.test.ts`
- `src/test/lead-timeline.test.ts`

Docs:

- `README.md`
- `GPT_HANDOFF_PHASE_7.md`

## Phase 7 수동 테스트 절차

### 오늘 할 일 대시보드

1. 관리자 로그인
2. `/admin/today` 접속
3. Summary card 확인
4. 신규 문의, 후속 연락 필요, 고객 수정 요청, 견적안 조치 필요, 공유 링크 만료 섹션 확인
5. 각 action item에서 업무 만들기 버튼이 동작하는지 확인
6. 같은 sourceType/sourceId의 미완료 업무가 이미 있으면 중복 생성 버튼이 숨겨지는지 확인

### 업무 관리

1. `/admin/tasks/new` 접속
2. 업무 생성
3. `/admin/tasks`에서 생성된 업무 확인
4. 검색/필터/정렬 확인
5. 업무 수정
6. 완료 처리
7. 취소 처리
8. 삭제 처리

### 리드 연결 업무

1. `/admin/leads/[id]` 접속
2. 연결 업무 섹션 확인
3. 후속 연락 업무 만들기 클릭
4. prefill된 `/admin/tasks/new` 확인
5. 업무 저장 후 리드 상세에서 연결 업무 표시 확인

### 견적안 연결 업무

1. `/admin/quote-proposals/[id]` 접속
2. 연결 업무 섹션 확인
3. 고객 확인 업무 만들기 또는 수정 요청 검토 업무 만들기 클릭
4. prefill된 `/admin/tasks/new` 확인
5. 업무 저장 후 견적안 상세에서 연결 업무 표시 확인

### 상담 이력 inline edit

1. `/admin/leads/[id]` 접속
2. 상담 이력 항목의 `수정` 클릭
3. 상담 채널, 방향, 요약, 상세 내용, 상담 일시, 다음 연락 예정일 수정
4. 저장
5. 리드 상세에 변경 사항이 반영되는지 확인
6. 다음 연락 예정일이 더 빠른 날짜이면 Lead.nextFollowUpAt에 반영되는지 확인

### 전체 활동 타임라인

1. 리드 상세에서 전체 활동 타임라인 확인
2. 문의 접수, 상담 이력, 견적안, 고객 응답, 업무 생성/완료 항목이 최신순으로 표시되는지 확인
3. 견적안 또는 업무 관련 항목이 관련 상세/수정 페이지로 연결되는지 확인

## 남은 제한사항 / TODO

- 업무 알림은 외부 발송이 아닙니다. 관리자 화면에서만 확인합니다.
- 후속 연락 일정은 고객에게 자동 메시지를 보내지 않습니다.
- 고객 수정 요청이 있어도 수정 견적안은 자동 생성하지 않습니다. 관리자가 직접 생성해야 합니다.
- 견적안 공유 링크 만료 임박 알림도 외부로 자동 발송하지 않습니다.
- 배치 작업, cron job, background job은 없습니다.
- 업무 담당자는 문자열 메모 수준이며 multi-user assignment는 구현하지 않았습니다.
- 전체 활동 타임라인은 MVP용 조합 타임라인입니다. 완전한 audit/event sourcing 구조는 아닙니다.
- 상담 이력과 업무 데이터는 개인정보 또는 민감한 고객 요청을 포함할 수 있으므로 관리자 화면에서만 노출해야 합니다.

## 다음 Phase 후보

Phase 8에서 고려할 수 있는 작업:

- 업무 dashboard 통계 고도화
- 업무 담당자별 필터
- follow-up 자동 후보를 더 정교하게 계산
- 리드 상태 변경 자체를 별도 activity log로 기록
- quote proposal과 sales task 간 action 상태 동기화 강화
- 관리자 알림 inbox
- 단, 외부 자동 발송은 별도 정책 확정 후 진행

