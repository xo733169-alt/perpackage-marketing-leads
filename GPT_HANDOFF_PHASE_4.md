# GPT Handoff - PerPackage Marketing Lead Management System Phase 4

이 문서는 GPT 또는 다른 개발 에이전트에게 현재 프로젝트 상태를 전달하기 위한 Phase 4 인수인계 문서입니다.

## 프로젝트 기본 정보

- 프로젝트명: PerPackage Marketing Lead Management System
- 회사명: 페르패키지
- 사업: 맞춤 패키지 박스 제조업
- 위치: 서울 중구 을지로
- 프로젝트 경로: `C:\Users\inh78\OneDrive\문서\홈페이지 개발\perpackage-marketing-leads`
- 현재 완료 단계: Phase 4

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
- 내부 견적 룰, 배율, 계산 메모는 공개 화면에 노출하지 않는다.
- 개인정보, 고객명, 회사명, 민감한 제품 정보는 공개 페이지에 노출하지 않는다.
- 결제, 외부 API, KakaoTalk API, ERP, 재고관리, 이미지 업로드/스토리지는 아직 구현하지 않는다.
- 기존 Phase 1, 1.5, 2, 2.5, 3 기능은 제거하거나 재작성하지 않는다.

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
- 견적 엔진 테스트 추가

## Phase 4 핵심 구현 내용

### 새 Prisma 모델: QuoteRule

`QuoteRule`은 관리자 전용 참고 견적 룰입니다. 공개 페이지에 직접 노출되지 않습니다.

주요 필드:

```text
id
name
isActive
boxType
quantityRange
minQuantity
maxQuantity
baseUnitPriceMinKrw
baseUnitPriceMaxKrw
sizeSmallThreshold
sizeMediumThreshold
sizeLargeThreshold
smallSizeMultiplier
mediumSizeMultiplier
largeSizeMultiplier
extraLargeSizeMultiplier
printNoneMultiplier
printOneColorMultiplier
printFullColorMultiplier
printFoilEmbossMultiplier
finishingBaseAddMinKrw
finishingBaseAddMaxKrw
complexityLowMultiplier
complexityNormalMultiplier
complexityHighMultiplier
complexityVeryHighMultiplier
minOrderPriceKrw
notes
createdAt
updatedAt
```

주의:

- 기본 룰은 placeholder 단가다.
- 운영 전 실제 제작 단가와 공정 기준에 맞게 반드시 검토해야 한다.
- 룰 삭제보다 비활성화를 우선한다.

### Lead 견적 스냅샷 필드

리드가 접수될 때 당시의 참고 견적 계산 결과를 Lead에 저장합니다.
이렇게 하면 나중에 견적 룰이 바뀌어도 과거 리드의 접수 당시 참고값이 바뀌지 않습니다.

추가된 필드:

```text
estimatedUnitPriceMinKrw
estimatedUnitPriceMaxKrw
estimatedTotalPriceMinKrw
estimatedTotalPriceMaxKrw
estimateLabel
estimateDisclaimer
quoteComplexityLevel
quoteConfidenceLevel
quoteCalculationNotes
quoteMissingFields
```

기존 `estimatedPriceRange`는 호환성을 위해 유지합니다.

## 새 주요 파일

### 견적 엔진

```text
src/lib/quote-engine.ts
```

주요 함수:

```text
calculateReferenceQuote()
selectQuoteRule()
calculateSizeCategory()
calculateComplexityLevel()
normalizeQuantityRange()
formatReferenceQuoteRange()
getQuoteDisclaimer()
getMissingQuoteFields()
getQuoteConfidenceLevel()
toPublicReferenceQuotePreview()
```

필수 disclaimer:

```text
표시된 금액은 참고용 예상 범위이며, 최종 견적은 종이, 구조, 인쇄, 후가공, 수량, 제작 난이도 확인 후 상담을 통해 안내드립니다.
```

### 기본 견적 룰

```text
src/lib/default-quote-rules.ts
```

기본 placeholder 룰을 생성하는 순수 helper입니다.

### 견적 룰 validation

```text
src/lib/quote-rule-schema.ts
```

Zod 기반 관리자 견적 룰 입력 검증입니다.

### 견적 룰 DB 변환 유틸

```text
src/lib/quote-rule-utils.ts
```

Prisma 모델과 quote engine config 사이 변환을 담당합니다.

### 기본 룰 seed 스크립트

```text
scripts/seed-quote-rules.ts
```

실행:

```bash
pnpm quote-rules:seed
```

이미 존재하는 룰은 덮어쓰지 않습니다.

강제 업데이트:

```bash
pnpm quote-rules:seed -- --force
```

## 새 관리자 페이지

### 견적 룰 목록

```text
/admin/quote-rules
```

기능:

- 견적 룰 목록
- 검색
- 활성/비활성 필터
- 박스 종류 필터
- 기본 단가 범위 확인
- 최소 주문 금액 확인
- 편집 페이지 이동

### 견적 룰 등록

```text
/admin/quote-rules/new
```

### 견적 룰 수정

```text
/admin/quote-rules/[id]/edit
```

기능:

- 룰 이름
- 활성 여부
- 박스 종류
- 수량 구간
- 수량 범위
- 기본 단가
- 사이즈 기준/배율
- 인쇄 배율
- 후가공 추가 금액
- 난이도 배율
- 최소 주문 금액
- 메모
- 삭제 버튼

### 관리자 견적 계산기

```text
/admin/quote-calculator
```

기능:

- 박스 종류, 수량, 사이즈, 인쇄, 후가공 입력
- 참고용 개당 예상 범위
- 참고용 총 예상 범위
- 난이도
- 신뢰도
- 누락된 항목
- 계산 메모
- 적용된 룰 표시

중요:

- 관리자 내부 참고용이다.
- 실제 견적 확정 도구가 아니다.
- 고객 화면에는 이 수준의 내부 정보가 노출되지 않는다.

## 새 API

### 공개 quote preview

```text
POST /api/quote-preview
```

용도:

- 공개 견적 폼에서 참고용 예상 범위 미리보기

주의:

- 내부 rule id, rule name, 배율, 계산 메모를 반환하지 않는다.
- 고객 화면에 안전한 필드만 반환한다.
- 개인정보를 받지 않는다.

### 관리자 견적 룰 API

```text
GET    /api/admin/quote-rules
POST   /api/admin/quote-rules
GET    /api/admin/quote-rules/[id]
PATCH  /api/admin/quote-rules/[id]
DELETE /api/admin/quote-rules/[id]
```

보안:

- 관리자 인증 필요
- mutation route는 기존 Origin/Referer 검증 스타일 사용
- Zod validation 사용

## 수정된 기존 흐름

### 공개 견적 폼

파일:

```text
src/components/QuoteInquiryForm.tsx
```

변경:

- 기존 단순 estimate helper 대신 `/api/quote-preview` 기반 새 견적 엔진 사용
- 박스 종류, 수량, 사이즈, 인쇄, 후가공 입력에 따라 참고용 예상 범위 표시
- 수량이 `아직 미정`이면 총 예상 범위는 표시하지 않음
- 누락 항목이 있으면 더 정확한 확인을 위한 안내 문구 표시
- 내부 룰 정보는 노출하지 않음

### 리드 저장

파일:

```text
src/app/api/leads/route.ts
```

변경:

- 서버 사이드에서 `calculateReferenceQuote()` 실행
- active `QuoteRule`을 DB에서 조회
- 계산 결과를 Lead 스냅샷 필드에 저장
- 기존 `estimatedPriceRange`도 호환용으로 저장

### 관리자 리드 상세

파일:

```text
src/app/admin/leads/[id]/page.tsx
```

변경:

- “참고 견적 정보” 섹션 추가
- 참고용 개당/총 예상 범위 표시
- 견적 신뢰도, 난이도 표시
- 누락된 항목, 계산 메모 표시
- 견적 계산기로 다시 확인 링크 추가

### CSV export

파일:

```text
src/app/api/admin/leads/export/route.ts
```

변경:

- 견적 스냅샷 필드 추가
- 개당 예상 최소/최대
- 총 예상 최소/최대
- 안내 문구
- 신뢰도
- 난이도
- 누락 항목
- 계산 메모

### 관리자 내비게이션

파일:

```text
src/components/AdminNav.tsx
```

추가 링크:

- 견적 룰: `/admin/quote-rules`
- 견적 계산기: `/admin/quote-calculator`

## 마이그레이션

Phase 4 마이그레이션:

```text
prisma/migrations/20260620065051_add_reference_quote_engine/migration.sql
```

적용 명령:

```bash
pnpm db:migrate
pnpm exec prisma generate
```

현재 Prisma migration 상태:

```text
Database schema is up to date.
```

## package.json 스크립트

추가된 스크립트:

```json
"quote-rules:seed": "node --experimental-strip-types scripts/seed-quote-rules.ts"
```

기존 주요 스크립트:

```bash
pnpm dev
pnpm lint
pnpm test
pnpm build
pnpm db:migrate
pnpm portfolio:import
pnpm quote-rules:seed
```

## 테스트

추가/수정된 테스트:

```text
src/test/quote-engine.test.ts
src/test/quote-rule-schema.test.ts
src/test/estimate.test.ts
```

검증 범위:

- 견적 룰 선택
- 사이즈 카테고리 계산
- 난이도 계산
- 신뢰도 계산
- 누락 항목 계산
- 참고 견적 범위 formatting
- 불완전 입력 fallback
- 공개용 quote preview 안전 출력
- quote rule schema validation

## 검증 결과

실행 완료:

```bash
pnpm lint
pnpm test
pnpm build
pnpm quote-rules:seed
```

결과:

- `pnpm lint`: 통과
- `pnpm test`: 통과
  - 14 test files
  - 53 tests
- `pnpm build`: 통과
- `pnpm quote-rules:seed`: 통과
  - 기본 placeholder 견적 룰 42개 생성

로컬 HTTP 검증:

- `/`: 200
- `POST /api/quote-preview`: 정상 응답
- 공개 quote preview 응답에 `appliedRuleName` 없음
- 공개 quote preview 응답에 `calculationNotes` 없음
- 관리자 로그인 후 `/admin/quote-rules`: 200
- 관리자 로그인 후 `/admin/quote-calculator`: 200
- 테스트 리드 생성 시 견적 스냅샷 저장 확인
- 테스트 리드 삭제 완료

## 현재 dev server

마지막 작업 시점 기준 개발 서버가 실행 중입니다.

```text
http://127.0.0.1:3000
```

다시 실행:

```bash
pnpm dev
```

## 운영 전 필수 확인

- `ADMIN_PASSWORD` 실제 값 설정
- `NEXT_PUBLIC_SITE_URL` 실제 배포 URL 설정
- `NEXT_PUBLIC_KAKAO_CHANNEL_URL` 실제 카카오톡 채널 URL 설정
- 운영 DB 결정
- 백업 정책 결정
- 개인정보 처리방침 내용 확인
- 테스트 문의 접수 후 삭제 확인
- 제작 사례 공개 승인 확인
- 기본 견적 룰 placeholder 단가 검토
- 공개 견적 미리보기가 확정 견적처럼 보이지 않는지 확인

## 다음 GPT에게 주의할 점

- 이 프로젝트를 새로 만들지 말고 기존 앱 위에만 이어서 작업한다.
- `perpackage-vercel-public` 폴더는 별도 정적 홈페이지 폴더이므로 이 앱 작업에서 건드리지 않는다.
- 고객-facing 문구는 한국어로 유지한다.
- 예상 가격은 어떤 경우에도 확정 견적처럼 쓰지 않는다.
- 공개 quote preview에는 내부 룰 이름, 배율, 계산 메모를 노출하지 않는다.
- 관리자 견적 계산기는 내부 참고용이다.
- 기본 견적 룰은 placeholder이므로 운영 전 실제 단가 검토가 필요하다.
- Lead에 저장된 견적 스냅샷은 과거 접수 시점 보존용이다. 룰이 바뀐다고 과거 Lead 값을 자동 변경하지 않는다.
- 공개 제작 사례는 `status=PUBLISHED`와 `publicApprovalConfirmed=true`를 모두 만족해야 한다.
- 고객사명은 `isClientNamePublic=true`일 때만 공개한다.
- 분석 화면은 관리자 전용이며 개인정보를 집계 테이블에 노출하지 않는다.

## 다음 작업 후보

1. 실제 페르패키지 제작 단가 기준으로 `QuoteRule` 값 조정
2. 견적 룰 변경 이력 관리
3. 관리자 견적 계산 결과를 내부 메모로 저장하는 기능
4. 리드별 실제 견적안 작성 workflow
5. 운영 DB를 SQLite에서 PostgreSQL로 전환할지 결정
6. 실제 제작 사례 5~10개 등록
7. 광고 캠페인 UTM 네이밍 규칙 정리
8. KakaoTalk CRM/API 연동은 아직 보류
9. 이미지 업로드/스토리지는 아직 보류
10. 자동 확정 견적 엔진은 아직 보류
