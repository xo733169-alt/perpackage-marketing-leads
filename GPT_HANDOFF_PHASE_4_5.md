# GPT Handoff - PerPackage Marketing Lead Management System Phase 4.5

이 문서는 GPT 또는 다른 개발 에이전트에게 현재 프로젝트 상태를 전달하기 위한 Phase 4.5 인수인계 문서입니다.

## 프로젝트 기본 정보

- 프로젝트명: PerPackage Marketing Lead Management System
- 회사명: 페르패키지
- 사업: 맞춤 패키지 박스 제조업
- 위치: 서울 중구 을지로
- 프로젝트 경로: `C:\Users\inh78\OneDrive\문서\홈페이지 개발\perpackage-marketing-leads`
- 현재 완료 단계: Phase 4.5

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
- 고객 화면의 견적 문구에는 항상 참고용 예상 범위라는 disclaimer가 포함되어야 한다.
- 내부 견적 룰, 배율, 계산 메모, 원가성 판단 로직은 공개 화면에 노출하지 않는다.
- 견적안은 관리자 검토 후 작성하는 내부 운영 문서다.
- 견적안은 고객에게 자동 발송하지 않는다.
- 개인정보, 고객명, 회사명, 민감한 제품 정보는 공개 페이지에 노출하지 않는다.
- 결제, 외부 API, KakaoTalk API, ERP, 재고관리, 이미지 업로드/스토리지는 아직 구현하지 않는다.
- 기존 Phase 1, 1.5, 2, 2.5, 3, 4 기능은 제거하거나 재작성하지 않는다.

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
- 견적안/견적 보정 관리자 내비게이션 추가
- Phase 4.5 README 문서화
- 관련 helper와 테스트 추가

## Phase 4.5 핵심 구현 내용

### 새 Prisma 모델: QuoteProposal

`QuoteProposal`은 관리자 전용 견적안입니다. 공개 페이지에 노출되지 않습니다.

주요 필드:

```text
id
leadId
proposalNumber
status
title
customerNameSnapshot
companyNameSnapshot
phoneSnapshot
emailSnapshot
kakaoIdSnapshot
boxType
industry
quantityLabel
quantityCount
specificationSummary
productionNotes
deliveryEstimateText
paymentTerms
validUntil
subtotalAmountKrw
vatAmountKrw
totalAmountKrw
vatIncluded
customerMessage
internalMemo
basedOnEstimateLabel
basedOnUnitPriceMinKrw
basedOnUnitPriceMaxKrw
basedOnTotalPriceMinKrw
basedOnTotalPriceMaxKrw
estimateComparisonStatus
createdAt
updatedAt
```

상태값:

```text
DRAFT           임시작성
READY_TO_SEND   발송준비
SENT            발송완료
ACCEPTED        수락
REJECTED        거절
EXPIRED         만료
CANCELLED       취소
```

주의:

- `SENT`는 자동 발송이 아니라 관리자가 수동 발송 후 표시하는 내부 상태다.
- 고객 스냅샷 필드는 견적안 작성 당시의 리드 정보를 보존하기 위한 필드다.
- 견적안은 공개 견적 미리보기나 자동 계산 결과와 다를 수 있다.

### 새 Prisma 모델: QuoteProposalItem

`QuoteProposalItem`은 견적안의 line item입니다.

주요 필드:

```text
id
quoteProposalId
sortOrder
itemName
description
quantity
unitPriceKrw
amountKrw
createdAt
updatedAt
```

계산 규칙:

- `amountKrw = quantity * unitPriceKrw`
- `subtotalAmountKrw = sum(item.amountKrw)`
- `vatAmountKrw = round(subtotalAmountKrw * 0.1)`
- `totalAmountKrw = subtotalAmountKrw + vatAmountKrw`
- 클라이언트의 합계 미리보기는 UX용이다.
- 저장되는 금액은 서버에서 다시 계산한 값이 기준이다.

### 새 Prisma 모델: QuoteRuleChangeLog

`QuoteRuleChangeLog`는 견적 룰 변경 내역을 보관합니다.

주요 필드:

```text
id
quoteRuleId
quoteRuleNameSnapshot
changeType
beforeJson
afterJson
changeReason
changedBy
createdAt
```

변경 유형:

```text
CREATED       생성
UPDATED       수정
DEACTIVATED   비활성화
REACTIVATED   재활성화
DELETED       삭제
```

주의:

- `/admin/quote-rules`와 `/api/admin/quote-rules`를 통해 생성/수정/삭제한 변경은 로그가 남는다.
- 기본 seed 스크립트로 들어간 placeholder 룰 생성은 운영 초기 데이터 성격이므로 변경 로그 대상이 아니다.

## 새 관리자 경로

```text
/admin/quote-proposals
/admin/leads/[id]/quote-proposals/new
/admin/quote-proposals/[id]
/admin/quote-proposals/[id]/edit
/admin/quote-proposals/[id]/print
/admin/quote-calibration
/admin/quote-rules/history
```

## 새 API 경로

```text
GET    /api/admin/quote-proposals
POST   /api/admin/quote-proposals
GET    /api/admin/quote-proposals/[id]
PATCH  /api/admin/quote-proposals/[id]
DELETE /api/admin/quote-proposals/[id]
GET    /api/admin/quote-rule-logs
```

기존 quote rule API도 변경되었습니다.

```text
POST   /api/admin/quote-rules
PATCH  /api/admin/quote-rules/[id]
DELETE /api/admin/quote-rules/[id]
```

위 mutation routes는 관리자 인증과 Origin/Referer 검사를 사용합니다.

## 주요 파일

### Prisma

```text
prisma/schema.prisma
prisma/migrations/20260620071940_add_quote_proposals_and_rule_history/migration.sql
```

### 새 helper

```text
src/lib/proposal-number.ts
src/lib/quote-proposal.ts
src/lib/quote-proposal-schema.ts
src/lib/quote-calibration.ts
src/lib/quote-rule-log.ts
```

### 새 컴포넌트

```text
src/components/QuoteProposalForm.tsx
src/components/QuoteProposalActions.tsx
src/components/PrintButton.tsx
```

### 새 관리자 페이지

```text
src/app/admin/quote-proposals/page.tsx
src/app/admin/leads/[id]/quote-proposals/new/page.tsx
src/app/admin/quote-proposals/[id]/page.tsx
src/app/admin/quote-proposals/[id]/edit/page.tsx
src/app/admin/quote-proposals/[id]/print/page.tsx
src/app/admin/quote-calibration/page.tsx
src/app/admin/quote-rules/history/page.tsx
```

### 새 API route

```text
src/app/api/admin/quote-proposals/route.ts
src/app/api/admin/quote-proposals/[id]/route.ts
src/app/api/admin/quote-rule-logs/route.ts
```

### 수정된 기존 파일

```text
src/components/AdminNav.tsx
src/components/QuoteRuleForm.tsx
src/app/admin/leads/[id]/page.tsx
src/app/admin/quote-rules/page.tsx
src/app/admin/quote-rules/[id]/edit/page.tsx
src/app/api/admin/quote-rules/route.ts
src/app/api/admin/quote-rules/[id]/route.ts
README.md
```

### 테스트

```text
src/test/proposal-number.test.ts
src/test/quote-proposal.test.ts
src/test/quote-proposal-schema.test.ts
src/test/quote-calibration.test.ts
src/test/quote-rule-log.test.ts
```

## 견적안 workflow

1. 관리자가 `/admin/leads/[id]`에서 리드 상세를 확인한다.
2. “견적안 작성” 버튼을 누른다.
3. `/admin/leads/[id]/quote-proposals/new`에서 견적안을 작성한다.
4. 리드의 고객 정보, 박스 종류, 업종, 수량, 접수 당시 참고 견적 스냅샷이 자동으로 반영된다.
5. 기본 항목은 `{boxType} 제작`으로 생성된다.
6. 수량과 단가를 관리자가 검토하고 수정한다.
7. “임시저장” 또는 “발송준비로 저장”을 누른다.
8. `/admin/quote-proposals/[id]`에서 상세 확인, 상태 변경, 프린트 보기를 사용한다.

## 견적안 상태와 Lead 연동

`QuoteProposal` 상태 변경 시 관련 `Lead`도 일부 자동 갱신됩니다.

### SENT

조건:

- 관련 Lead가 존재한다.
- Lead 상태가 `NEW` 또는 `CONTACTING`이다.

동작:

- Lead status -> `QUOTED`
- `quotedAt`이 비어 있으면 현재 시각 저장

### ACCEPTED

조건:

- 관련 Lead가 존재한다.

동작:

- Lead status -> `ORDER_CONFIRMED`
- `orderConfirmedAt`이 비어 있으면 현재 시각 저장
- `confirmedOrderAmountKrw`가 비어 있으면 견적안 total 금액 저장

주의:

- `REJECTED`, `EXPIRED`, `CANCELLED`은 리드 상태를 자동 종료 처리하지 않는다.
- 종료/실패 사유 관리는 리드 상세에서 별도 처리한다.

## 프린트용 견적안

경로:

```text
/admin/quote-proposals/[id]/print
```

특징:

- 관리자 전용 페이지
- 서버 사이드 PDF 생성 없음
- 브라우저 인쇄 또는 PDF 저장을 위한 HTML 페이지
- A4 친화적인 black/white 스타일
- 관리자 내비게이션은 출력 화면에서 숨김

프린트 페이지에 표시되는 disclaimer:

> 본 견적안은 입력된 사양 기준의 안내 금액이며, 최종 제작 조건, 원자재, 후가공, 일정 확인에 따라 조정될 수 있습니다.

## 견적 보정 대시보드

경로:

```text
/admin/quote-calibration
```

목적:

- 리드 접수 당시 저장된 참고 견적 스냅샷과 실제 관리자 견적안 금액을 비교한다.
- 어떤 박스 종류/수량 구간에서 참고 견적이 실제 견적보다 낮거나 높은지 운영자가 파악한다.
- 견적 룰 자동 변경은 하지 않는다.

비교 상태:

```text
IN_RANGE     예상 범위 내
ABOVE_RANGE  예상보다 높음
BELOW_RANGE  예상보다 낮음
NO_ESTIMATE  예상 데이터 없음
NO_PROPOSAL  견적안 없음
```

표시 항목:

- 분석 대상 견적안 수
- 예상 범위 내/초과/미만/데이터 없음 수
- 평균 차이율
- 박스 종류별 보정 현황
- 수량 구간별 보정 현황
- 최근 이상치

운영 주의:

> 견적 룰 보정은 자동으로 적용하지 않습니다. 실제 제작 단가와 공정 기준을 확인한 뒤 관리자가 수동으로 조정해야 합니다.

## 견적 룰 변경 이력

변경 이력 전체 페이지:

```text
/admin/quote-rules/history
```

견적 룰 수정 페이지에도 최근 변경 이력이 표시됩니다.

견적 룰 form에는 “변경 사유” 입력란이 추가되었습니다.

예시:

```text
실제 견적 대비 예상가가 낮아 기본 단가 조정
```

## 제안 번호 생성

helper:

```text
src/lib/proposal-number.ts
```

형식:

```text
PPQ-YYYYMMDD-0001
```

예시:

```text
PPQ-20260620-0001
```

생성 시 같은 날짜 prefix 기준으로 중복을 확인해 unique proposal number를 만듭니다.

## 마이그레이션

생성된 마이그레이션:

```text
prisma/migrations/20260620071940_add_quote_proposals_and_rule_history/migration.sql
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
```

운영 전에는 반드시 실제 값으로 교체해야 합니다.

특히:

- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_KAKAO_CHANNEL_URL`

## Phase 4.5 검증 결과

다음 검증을 완료했습니다.

```text
pnpm lint  -> 통과
pnpm test  -> 통과, 19 files / 65 tests
pnpm build -> 통과
```

실제 개발 서버 검증:

- 공개 `/` 응답 확인
- 인증 없는 `/api/admin/quote-proposals` 접근이 401 반환 확인
- 관리자 로그인 확인
- 테스트 리드 생성 확인
- 테스트 리드 기반 견적안 생성 확인
- 견적안 번호 생성 확인: `PPQ-20260620-0001`
- 견적 항목 합계 확인
  - 공급가: 1,500,000
  - 부가세: 150,000
  - 합계: 1,650,000
- 견적안 `SENT` 처리 후 Lead status가 `QUOTED`로 변경되는 것 확인
- 견적안 `ACCEPTED` 처리 후 Lead status가 `ORDER_CONFIRMED`로 변경되는 것 확인
- `confirmedOrderAmountKrw`에 1,650,000 저장 확인
- 프린트 페이지 200 응답 확인
- QA 테스트 리드와 견적안 삭제 확인

## 다음 GPT가 작업할 때 주의할 점

- Phase 4.5 기능을 다시 구현하지 말고 현재 상태 위에서 이어서 작업한다.
- 견적안은 공개 페이지가 아니라 관리자 전용이다.
- 견적안은 자동 발송하지 않는다.
- 프린트 페이지는 브라우저 인쇄/PDF 저장용 HTML이다. 서버 PDF 생성은 아직 하지 않는다.
- 견적 보정 대시보드는 룰 자동 변경 도구가 아니다.
- 견적 룰 변경은 반드시 수동 검토 후 진행해야 한다.
- 공개 견적 미리보기는 참고용 예상 범위로만 유지한다.
- 고객 화면에 내부 견적 룰, 배율, 계산 메모, rule ID를 노출하지 않는다.
- 기존 Lead quote snapshot은 quote rule 변경으로 다시 계산하지 않는다.
- 기존 Phase 1-4 기능을 삭제하거나 구조적으로 갈아엎지 않는다.

## 남은 제한 사항

- 견적안 자동 이메일 발송은 구현하지 않았다.
- KakaoTalk API 연동은 구현하지 않았다.
- 서버 사이드 PDF 생성은 구현하지 않았다.
- 전자서명/수락 링크는 구현하지 않았다.
- 결제 기능은 구현하지 않았다.
- ERP, 생산관리, 재고관리 기능은 구현하지 않았다.
- 견적 보정 결과로 QuoteRule을 자동 수정하지 않는다.
- 기본 QuoteRule seed 숫자는 placeholder 기준이므로 운영 전 실제 단가 검토가 필요하다.

## 다음 단계 후보

아래는 아직 구현하지 않은 다음 단계 후보입니다. 사용자가 별도로 요청할 때만 진행하세요.

### Phase 5 후보: 견적안 발송/고객 확인 workflow

- 견적안 공유용 제한 링크
- 고객 확인/수락/거절 응답 저장
- 관리자 알림
- PDF export 개선
- 견적안 만료 자동 표시

### Phase 5 후보: 상담/영업 follow-up 강화

- 리드 활동 로그
- 상담 이력 timeline
- 견적안 변경 revision 관리
- follow-up 알림
- 주문확정 이후 production handoff checklist

### Phase 5 후보: 운영 DB/배포 준비

- SQLite에서 PostgreSQL로 전환 검토
- 운영 백업 정책
- admin 접근 제한 강화
- 배포 환경 변수 점검
- 운영 로그/모니터링

## 다음 GPT에게 보낼 수 있는 요청 예시

```text
You are a senior full-stack developer continuing the existing “PerPackage Marketing Lead Management System”.

The current completed phase is Phase 4.5.
Do not rewrite the app.
Do not remove Phase 1, 1.5, 2, 2.5, 3, 4, or 4.5 features.
Read GPT_HANDOFF_PHASE_4_5.md first.
Then inspect package.json, prisma/schema.prisma, README.md, and the current app routes.

All customer-facing UI text must be Korean.
Never present reference estimates as confirmed quotes.
Quote proposals are admin-only and must not be publicly exposed.
Do not add payment, KakaoTalk API, external APIs, ERP, inventory, or image upload unless explicitly requested.

Continue from the current codebase and implement only the next requested phase.
```
