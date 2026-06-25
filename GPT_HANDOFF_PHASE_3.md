# GPT Handoff - PerPackage Marketing Lead Management System Phase 3

이 문서는 GPT 또는 다른 개발 에이전트에게 현재 프로젝트 상태를 전달하기 위한 Phase 3 인수인계 문서입니다.

## 프로젝트 기본 정보

- 프로젝트명: PerPackage Marketing Lead Management System
- 회사명: 페르패키지
- 사업: 맞춤 패키지 박스 제조업
- 위치: 서울 중구 을지로
- 프로젝트 경로: `C:\Users\inh78\OneDrive\문서\홈페이지 개발\perpackage-marketing-leads`
- 현재 완료 단계: Phase 3

## 기술 스택

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- Zod
- Vitest

## 중요한 운영 원칙

- 고객-facing UI 문구는 한국어로 작성한다.
- 예상 가격은 확정 견적으로 표현하지 않는다.
- 최종 견적은 상담 후 확정된다.
- 개인정보, 고객명, 회사명, 민감한 제품 정보는 공개 페이지에 노출하지 않는다.
- 분석 페이지는 관리자 전용이다.
- 광고비와 매출 성과는 수동 입력 데이터 기준의 참고 지표로만 해석한다.
- 외부 광고 API, KakaoTalk API, 결제, 자동 견적 엔진은 아직 구현하지 않았다.
- 기존 Phase 1, Phase 1.5, Phase 2, Phase 2.5 기능을 삭제하거나 재작성하지 않는다.

## 현재 구현 완료 기능

### Phase 1 / 1.5 / 2 / 2.5 기반 기능

- 공개 랜딩 페이지: `/`
- 견적 문의 폼
- 리드 DB 저장
- 개인정보 필수 동의
- 마케팅 수신 선택 동의
- UTM/referrer/landingPath 추적
- 참고용 예상 가격 범위 미리보기
- 문의 완료 페이지: `/thanks`
- 개인정보 안내 페이지: `/privacy`
- 관리자 로그인: `/admin/login`
- 관리자 리드 목록: `/admin/leads`
- 관리자 리드 상세: `/admin/leads/[id]`
- CSV export
- 후속 연락일, 마지막 연락일, 영업 메모, 관리자 메모
- 리드 삭제
- 선택적 리드 알림 웹훅
- `PortfolioCase` 모델
- 관리자 제작 사례 목록/등록/편집
- 공개 제작 사례 목록/상세 페이지
- 포트폴리오에서 리드로 이어지는 sourceCase 추적
- 제작 사례 공개 승인 workflow
- 제작 사례 SEO 체크리스트
- 제작 사례 import workflow
- robots.txt route
- sitemap route
- 관리자 운영 체크리스트

### Phase 3 신규 기능

- 관리자 성과 대시보드: `/admin/analytics`
- 수동 마케팅 비용 관리: `/admin/marketing-costs`
- 리드 전환 정보 관리
- MarketingCost 모델
- 관리자 공통 내비게이션
- 유입 출처별 성과 집계
- 캠페인별 성과 집계
- 제작 사례별 성과 집계
- 업종별 성과 집계
- 박스 종류별 성과 집계
- 일별 문의 추이
- 문의 전환 퍼널
- 후속 연락 필요 요약
- 확정 주문 금액 합계 표시
- 광고비, 문의당 비용, 주문당 비용, 참고 ROAS 계산

## 신규 데이터베이스 필드

Phase 3에서 `Lead` 모델에 추가된 내부 전용 필드:

```text
quotedAt DateTime?
orderConfirmedAt DateTime?
closedAt DateTime?
confirmedOrderAmountKrw Int?
lostReason String?
```

동작 규칙:

- 상태가 `QUOTED`로 변경되고 `quotedAt`이 비어 있으면 현재 시각을 자동 저장한다.
- 상태가 `ORDER_CONFIRMED`로 변경되고 `orderConfirmedAt`이 비어 있으면 현재 시각을 자동 저장한다.
- 상태가 `CLOSED`로 변경되고 `closedAt`이 비어 있으면 현재 시각을 자동 저장한다.
- 관리자가 날짜를 직접 입력하면 직접 입력값을 우선한다.
- `confirmedOrderAmountKrw`는 관리자 내부 기록용 금액이며 고객에게 자동 견적으로 표시하지 않는다.

## 신규 데이터베이스 모델

`MarketingCost`

```text
id String @id @default(cuid())
costDate DateTime
channel String
utmSource String?
utmMedium String?
utmCampaign String?
amountKrw Int
memo String?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

목적:

- 광고 플랫폼 API를 연동하지 않고 운영자가 수동으로 광고비를 입력한다.
- 대시보드에서 캠페인별 참고 비용 지표를 계산한다.

## 마이그레이션

생성 및 적용 완료된 Phase 3 마이그레이션:

```text
prisma/migrations/20260620061642_add_marketing_analytics_fields/migration.sql
```

다른 환경에서 적용:

```bash
pnpm db:migrate
pnpm exec prisma generate
```

## 신규 관리자 페이지

### `/admin/analytics`

관리자 전용 마케팅 성과 대시보드입니다.

표시 항목:

- 전체 문의 수
- 신규 문의 수
- 상담중 문의 수
- 견적완료 수
- 주문확정 수
- 보류/종료 수
- 평균 리드 점수
- 고점수 리드 수
- 제작사례 유입 문의 수
- 후속 연락 필요 수
- 마케팅 수신 동의 수
- 상담 전환율
- 견적 전환율
- 주문 전환율
- 확정 주문 금액 합계
- 문의 전환 퍼널
- 일별 문의 추이
- 유입 출처별 성과
- 캠페인별 성과
- 제작 사례별 성과
- 업종별 성과
- 박스 종류별 성과
- 후속 연락 요약

날짜 범위:

- 최근 7일
- 최근 30일
- 최근 90일
- 이번 달
- 지난 달
- 직접 선택: `from`, `to`

### `/admin/marketing-costs`

관리자 전용 수동 마케팅 비용 관리 페이지입니다.

기능:

- 비용 기록 목록
- 비용 기록 추가
- 비용 기록 수정
- 비용 기록 삭제
- 날짜 범위 필터
- 채널 필터
- utm_source 필터

입력 필드:

- 비용 날짜
- 채널
- utm_source
- utm_medium
- utm_campaign
- 비용
- 메모

채널 옵션:

- 네이버 검색광고
- 카카오
- 메타
- 구글
- 블로그/콘텐츠
- 직접 입력
- 기타

## 신규 API

관리자 인증 필요:

```text
GET    /api/admin/marketing-costs
POST   /api/admin/marketing-costs
GET    /api/admin/marketing-costs/[id]
PATCH  /api/admin/marketing-costs/[id]
DELETE /api/admin/marketing-costs/[id]
```

보안:

- 관리자 인증 필요
- mutation route는 기존 방식의 Origin/Referer 확인 적용
- Zod validation 사용
- 개인정보는 비용 API에 포함하지 않음

## 수정된 기존 API

```text
PATCH /api/admin/leads/[id]
```

추가 처리:

- `quotedAt`
- `orderConfirmedAt`
- `closedAt`
- `confirmedOrderAmountKrw`
- `lostReason`
- 상태 변경 시 전환 일시 자동 기록

```text
GET /api/admin/leads/export
```

CSV에 전환 필드 추가:

- 견적 발송일
- 주문 확정일
- 종료일
- 확정 주문 금액
- 종료/실패 사유

## 신규/수정 helper

### `src/lib/analytics.ts`

순수 함수 중심 분석 로직:

- `parseDateRange()`
- `getDateRangeLabel()`
- `calculateLeadKpis()`
- `calculateLeadFunnel()`
- `calculateDailyLeadTrend()`
- `groupLeadsBySource()`
- `groupLeadsByCampaign()`
- `groupLeadsByPortfolioCase()`
- `groupLeadsByIndustry()`
- `groupLeadsByBoxType()`
- `calculateConversionRate()`
- `calculateAverageLeadScore()`
- `calculateCostMetrics()`
- `sumCampaignCosts()`
- `sumSourceCosts()`
- `formatKrw()`
- `formatPercent()`

### `src/lib/marketing-cost-schema.ts`

마케팅 비용 입력 validation:

- `marketingCostSchema`
- `MARKETING_COST_CHANNELS`
- `toMarketingCostFieldErrors()`
- `toMarketingCostDate()`

### `src/lib/admin-leads.ts`

후속 연락 필터에서 기존 `needed`와 새 `due`를 모두 지원합니다.

```text
/admin/leads?followUp=due
```

## 관리자 내비게이션

신규 컴포넌트:

```text
src/components/AdminNav.tsx
```

링크:

- 리드 관리: `/admin/leads`
- 제작 사례: `/admin/portfolio`
- 성과 대시보드: `/admin/analytics`
- 마케팅 비용: `/admin/marketing-costs`
- 운영 체크리스트: `/admin/checklist`
- 로그아웃

## 주요 변경 파일

### Prisma

- `prisma/schema.prisma`
- `prisma/migrations/20260620061642_add_marketing_analytics_fields/migration.sql`

### Admin Pages

- `src/app/admin/analytics/page.tsx`
- `src/app/admin/marketing-costs/page.tsx`
- `src/app/admin/leads/page.tsx`
- `src/app/admin/leads/[id]/page.tsx`
- `src/app/admin/portfolio/page.tsx`
- `src/app/admin/checklist/page.tsx`

### API

- `src/app/api/admin/marketing-costs/route.ts`
- `src/app/api/admin/marketing-costs/[id]/route.ts`
- `src/app/api/admin/leads/[id]/route.ts`
- `src/app/api/admin/leads/export/route.ts`

### Components

- `src/components/AdminNav.tsx`
- `src/components/AdminLeadEditor.tsx`
- `src/components/MarketingCostManager.tsx`

### Lib

- `src/lib/analytics.ts`
- `src/lib/marketing-cost-schema.ts`
- `src/lib/admin-leads.ts`
- `src/lib/source.ts`

### Tests

- `src/test/analytics.test.ts`
- `src/test/marketing-cost-schema.test.ts`
- `src/test/source.test.ts`

### Docs

- `README.md`
- `GPT_HANDOFF_PHASE_3.md`

## 검증 완료 결과

실행 완료:

```bash
pnpm test
pnpm lint
pnpm build
```

결과:

- `pnpm test`: 통과
  - 12 test files
  - 42 tests
- `pnpm lint`: 통과
- `pnpm build`: 통과

로컬 HTTP 검증:

- dev server 응답 확인: `http://127.0.0.1:3000`
- `/admin/analytics` 비로그인 접근 시 `/admin/login`으로 307 redirect 확인
- 관리자 로그인 후 `/admin/analytics` 200 확인
- 관리자 로그인 후 `/admin/marketing-costs` 200 확인
- 마케팅 비용 API 테스트 레코드 생성 201 확인
- 테스트 마케팅 비용 삭제 200 확인

## 현재 dev server

마지막 작업 시점 기준 개발 서버가 실행 중입니다.

```text
http://127.0.0.1:3000
```

다시 실행:

```bash
pnpm dev
```

## 비용/성과 지표 해석 기준

캠페인 비용 매칭:

- 캠페인 행의 `utmSource`, `utmMedium`, `utmCampaign`과 비용 기록의 값이 모두 일치할 때 연결 광고비로 계산한다.

계산:

- 문의당 비용 = 연결 광고비 / 문의 수
- 주문당 비용 = 연결 광고비 / 주문확정 수
- 참고 ROAS = 확정 주문 금액 / 연결 광고비

주의:

- 광고비와 매출 성과는 수동 입력 데이터 기준의 참고 지표다.
- 실제 광고 플랫폼 데이터와 차이가 있을 수 있다.
- UTM 네이밍이 일관되지 않으면 캠페인 비용이 연결되지 않을 수 있다.
- 확정 주문 금액은 관리자 내부 기록용이며 고객에게 자동 견적으로 노출하지 않는다.

## 다음 작업 후보

1. 실제 리드 데이터를 기준으로 대시보드 수치 검수
2. 운영 광고 캠페인 UTM 네이밍 규칙 정리
3. 마케팅 비용 입력 기준 정리
4. 실제 포트폴리오 5~10개 등록
5. 운영 DB를 SQLite로 유지할지 PostgreSQL 등으로 전환할지 결정
6. 관리자 접근 URL 및 비밀번호 운영 정책 정리
7. Phase 3.5 또는 Phase 4에서 자동 견적 엔진 설계
8. 외부 광고 API 연동은 아직 보류
9. KakaoTalk CRM/API 연동은 아직 보류
10. 이미지 업로드/스토리지는 아직 보류

## 다음 GPT에게 주의할 점

- 이 프로젝트는 새로 만들지 말고 기존 앱 위에서만 이어서 작업한다.
- `perpackage-vercel-public` 폴더는 별도 정적 홈페이지 폴더이므로 이 앱 작업에서 건드리지 않는다.
- 고객-facing 문구는 한국어로 유지한다.
- 예상 가격은 절대 확정 견적으로 표현하지 않는다.
- 공개 제작 사례는 `status=PUBLISHED`와 `publicApprovalConfirmed=true`를 모두 만족할 때만 보여야 한다.
- 고객사명은 `isClientNamePublic=true`일 때만 공개한다.
- 분석 화면은 관리자 전용이고, 개인정보를 집계 테이블에 노출하지 않는다.
- 수동 비용/매출 지표는 참고 지표로만 표현한다.
- 작업 전 `package.json`, `prisma/schema.prisma`, 기존 route/API/helper를 먼저 확인한다.
