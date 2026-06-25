# GPT Handoff - 패키지 구조 선택형 문의폼 / CSV Export Phase 7

이 문서는 GPT 또는 다른 개발 에이전트가 현재 프로젝트 상태와 최근 완료된 “패키지 구조 선택형 문의폼 / 제작 준비 체크리스트” Phase 7 작업을 빠르게 이해하고 이어서 작업할 수 있도록 만든 인수인계 문서입니다.

## 프로젝트 기본 정보

- 프로젝트명: PerPackage Marketing Lead Management System
- 회사명: 페르패키지
- 사업: 맞춤 패키지 박스 제조 / 패키지 제작 상담
- 위치: 서울 중구 을지로
- 프로젝트 경로: `C:\Users\inh78\OneDrive\문서\홈페이지 개발\perpackage-marketing-leads`
- 기준 날짜: 2026-06-21
- 현재 작업 상태: 패키지 구조 선택형 문의폼 Phase 1~7 완료

## 기술 스택

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- Zod
- Vitest

## 반드시 유지해야 하는 운영 규칙

- 기존 CRM, 포트폴리오, 견적 룰, 견적안, 영업 업무 기능을 삭제하거나 재작성하지 않는다.
- 고객-facing UI 문구는 한국어를 유지한다.
- 참고 견적/예상 범위는 확정 견적으로 보이면 안 된다.
- 최종 견적은 상담과 관리자 검토 후 확정된다.
- 가격 계산, 결제, 세금계산서, 입출금, 전자계약 기능은 이번 패키지 문의폼 작업 범위가 아니다.
- 전개도 생성기, 3D 에디터, 파일 업로드는 이번 작업 범위가 아니다.
- 기존 데이터가 깨지지 않도록 새 Lead 필드는 optional 중심으로 유지한다.
- 고객이 “잘 모르겠어요”를 선택한 값은 그대로 존중해서 표시한다.
- 실제 고객 데이터가 들어간 DB 파일을 Git, public repo, 외부 공유 링크에 올리지 않는다.

## 현재 완료된 기능 요약

### Phase 1: Prisma DB 필드 확장

`Lead` 모델에 패키지 문의 관련 필드가 추가되어 있다.

- `packageType String?`
- `packageStructure String?`
- `quantity String?`
- `sizeInfo String?`
- `hasPhysicalProduct String?`
- `hasDesignFile String?`
- `hasDieline String?`
- `desiredDueDate String?`
- `isUrgent Boolean @default(false)`
- `readinessChecklist String?`
- `readinessScore Int?`
- `consultationNotes String?`

기존 필드 중 아래 필드도 패키지 문의 흐름에서 함께 사용한다.

- `budgetRange String?`
- `finishingOptions String?`

기존 migration:

- `prisma/migrations/20260621021252_add_package_structure_readiness_fields/migration.sql`

### Phase 2: 문의 생성 API / validation 수정

수정 파일:

- `src/app/api/leads/route.ts`
- `src/lib/lead-schema.ts`
- `src/test/lead-schema.test.ts`

주요 내용:

- `/api/leads`에서 패키지 문의 필드를 저장한다.
- 대부분 optional 처리.
- `finishingOptions`는 배열을 JSON 문자열로 저장.
- `readinessChecklist`는 배열/객체/문자열을 안전하게 문자열화해 저장.
- `readinessScore`는 0~100 정수로 validation.

### Phase 3: 고객 문의폼 UI 추가

수정 파일:

- `src/components/QuoteInquiryForm.tsx`
- `src/lib/lead-options.ts`
- `src/test/lead-schema.test.ts`

추가된 고객 문의폼 섹션:

- `패키지 제작 정보`
- `제작 준비 체크리스트`

추가된 입력 항목:

- 패키지 종류
- 패키지 구조
- 수량
- 사이즈 정보
- 제품 실물 여부
- 디자인 파일 여부
- 도면 여부
- 희망 납기
- 급건 여부
- 예산 범위
- 후가공 다중 선택
- 제작 준비 체크리스트

readinessScore 계산:

- 체크된 항목 수 / 전체 7개 항목 * 100
- `Math.round()`로 정수 처리
- hidden input으로 `readinessChecklist`, `readinessScore`를 payload에 포함

### Phase 4: 관리자 리드 상세 표시

수정 파일:

- `src/app/admin/leads/[id]/page.tsx`
- `src/lib/admin-leads.ts`
- `src/test/admin-leads.test.ts`

상세 화면 추가 섹션:

- `기본 문의 정보`
- `패키지 제작 정보`
- `제작 준비도`
- `내부 상담 메모`

표시 방식:

- 값이 없으면 `미입력`
- `readinessScore`가 없으면 `미계산`
- JSON 파싱 실패 시 빈 배열 처리
- `잘 모르겠어요`는 그대로 표시

### Phase 5: 관리자 리드 목록 표시 / 필터

수정 파일:

- `src/app/admin/leads/page.tsx`
- `src/lib/admin-leads.ts`
- `src/test/admin-leads.test.ts`

목록에 추가된 표시 항목:

- 패키지 종류
- 고객 입력 수량
- 급건 배지
- 상담 준비도 배지
- readinessScore 점수

추가된 필터:

- 패키지 종류
- 상담 준비도

목록 준비도 라벨:

- null: `미계산`
- 0~30: `준비 낮음`
- 31~70: `기본 상담 가능`
- 71~100: `준비 높음`

### Phase 6: 전체 기능 테스트 / 안정화

확인한 흐름:

- 고객 문의 생성 API 제출
- 새 필드 DB 저장 확인
- 최소 입력 리드 저장 확인
- 관리자 목록 렌더링 확인
- 관리자 상세 렌더링 확인
- 빈 값 `미입력` 표시 확인
- readinessScore 없음 `미계산` 표시 확인
- JSON 파싱 오류 없음 확인
- lint/test/build 확인

테스트용 리드:

- `Phase6Test-*`
- `Phase6Minimal-*`

테스트 후 삭제 완료.

## Phase 7: 관리자 리드 CSV export 보강

이번 Phase 7의 목표는 관리자가 CSV로 리드 데이터를 내려받았을 때 새 패키지 문의 정보와 제작 준비도까지 함께 확인할 수 있게 만드는 것이었다.

### 수정 파일

- `src/app/api/admin/leads/export/route.ts`
- `src/lib/admin-leads.ts`
- `src/test/admin-leads.test.ts`

### 변경 내용

기존 CSV export 기능은 유지하고, 기존 컬럼 뒤쪽에 패키지 문의 컬럼을 append했다.

기존 CSV 다운로드 조건은 그대로 유지한다.

- 검색 조건
- 상태 필터
- 후속 연락 필터
- 패키지 종류 필터
- 상담 준비도 필터
- 정렬 조건

CSV query는 기존과 동일하게 `buildLeadListQuery(searchParams)`를 사용한다.

### CSV에 추가된 컬럼

아래 컬럼이 기존 CSV 컬럼 뒤에 추가되었다.

- 패키지 종류
- 패키지 구조
- 고객 입력 수량
- 사이즈 정보
- 제품 실물 여부
- 디자인 파일 여부
- 도면 여부
- 희망 납기
- 급건 여부
- 예산 범위
- 후가공
- 제작 준비도 점수
- 제작 준비 체크리스트
- 내부 상담 메모

### 필드 매핑

- 패키지 종류 -> `lead.packageType`
- 패키지 구조 -> `lead.packageStructure`
- 고객 입력 수량 -> `lead.quantity`
- 사이즈 정보 -> `lead.sizeInfo`
- 제품 실물 여부 -> `lead.hasPhysicalProduct`
- 디자인 파일 여부 -> `lead.hasDesignFile`
- 도면 여부 -> `lead.hasDieline`
- 희망 납기 -> `lead.desiredDueDate`
- 급건 여부 -> `lead.isUrgent`
- 예산 범위 -> `lead.budgetRange`
- 후가공 -> `lead.finishingOptions`
- 제작 준비도 점수 -> `lead.readinessScore`
- 제작 준비 체크리스트 -> `lead.readinessChecklist`
- 내부 상담 메모 -> `lead.consultationNotes`

### CSV helper

`src/lib/admin-leads.ts`에 CSV export용 helper가 추가되었다.

- `PACKAGE_INQUIRY_CSV_HEADERS`
- `formatCsvEmptyValue(value)`
- `formatJsonArrayForCsv(value)`
- `formatFinishingOptionsForCsv(value)`
- `formatReadinessChecklistForCsv(value)`
- `formatUrgentForCsv(isUrgent)`
- `formatReadinessScoreForCsv(score)`

### JSON 필드 처리 방식

#### finishingOptions

DB 저장 예:

```json
["무광코팅","박","창/PET"]
```

CSV 표시:

```text
무광코팅, 박, 창/PET
```

처리 규칙:

- JSON.parse 성공 + 배열이면 `", "`로 join
- JSON.parse 성공 + 문자열이면 그대로 사용
- JSON.parse 실패 시 원본 문자열 유지
- 전체 CSV export는 실패하지 않음

#### readinessChecklist

DB 저장 예 1:

```json
["제품 실물 또는 정확한 사이즈가 있나요?","희망 수량이 정해졌나요?"]
```

DB 저장 예 2:

```json
[
  {"label":"제품 실물 또는 정확한 사이즈가 있나요?","checked":true},
  {"label":"희망 수량이 정해졌나요?","checked":false}
]
```

CSV 표시:

- 문자열 배열이면 전체 label join
- 객체 배열이면 `checked !== false`인 항목의 `label`만 join
- JSON.parse 실패 시 원본 문자열 유지

### 급건/readinessScore 표시

- `isUrgent: true` -> `급건`
- `isUrgent: false` -> `일반 일정`
- `readinessScore: number` -> `85`처럼 숫자 문자열
- `readinessScore: null/undefined` -> `미계산`

### CSV 안전성

기존 `escapeCsv(value)`는 유지되어 있다.

현재 export route는 모든 값을 큰따옴표로 감싸고, 값 안의 큰따옴표는 `""`로 escape한다.

따라서 아래 케이스는 기존 방식으로 안전하게 처리된다.

- 쉼표
- 줄바꿈
- 따옴표
- 한글
- JSON 문자열

## 주요 파일별 역할

### `src/app/api/admin/leads/export/route.ts`

관리자 리드 CSV 다운로드 API.

Phase 7에서 새 패키지 문의 컬럼을 CSV 뒤쪽에 추가했다.

중요 사항:

- 기존 인증 `isAdminAuthenticated()` 유지
- 기존 `buildLeadListQuery(searchParams)` 유지
- 기존 CSV escape 유지
- 새 컬럼만 append

### `src/lib/admin-leads.ts`

관리자 리드 관련 helper.

현재 포함된 주요 기능:

- 관리자 리드 목록 query 구성
- 패키지 종류 필터
- readinessScore 필터
- `finishingOptions` 파싱
- `readinessChecklist` 파싱
- readiness 표시 라벨
- CSV export용 formatter

### `src/test/admin-leads.test.ts`

관리자 리드 helper 테스트.

Phase 7에서 CSV formatter 관련 테스트가 추가되었다.

## 테스트 결과

실행 명령:

```bash
next lint
vitest run
DATABASE_URL=file:./dev.db prisma migrate status
DATABASE_URL=file:./dev.db prisma generate && next build
```

결과:

- ESLint 통과
- Vitest 통과
  - 32개 테스트 파일
  - 115개 테스트 통과
- Prisma migration status 통과
  - DB schema up to date
- Next production build 통과

주의:

- 현재 작업 환경에서 전역 `pnpm`이 PATH에 없을 수 있다.
- 검증 시 `node_modules/.bin` 로컬 바이너리와 번들 Node 경로를 사용했다.
- 로컬 build 시 `DATABASE_URL=file:./dev.db`를 명시해야 Prisma 관련 오류를 피할 수 있다.

## 추가된 테스트 항목

`src/test/admin-leads.test.ts`에 아래 케이스가 추가되었다.

- `finishingOptions` JSON 배열이 CSV 문자열로 변환되는지
- 잘못된 JSON일 때 원본 문자열 fallback 되는지
- `isUrgent` true가 `급건`으로 표시되는지
- `isUrgent` false가 `일반 일정`으로 표시되는지
- `readinessScore` 숫자가 문자열로 표시되는지
- `readinessScore` null이 `미계산`으로 표시되는지
- `readinessChecklist` 문자열 배열이 join 되는지
- `readinessChecklist` 객체 배열에서 checked true 항목만 표시되는지
- 패키지 문의 CSV 헤더가 포함되는지

## 현재 남은 문제

기능상 확인된 문제는 없다.

CSV export는 현재 새 패키지 문의 컬럼을 포함한다.

운영 전 사람이 직접 확인하면 좋은 항목:

- 관리자 로그인 후 `/admin/leads`에서 CSV 다운로드
- CSV 파일을 Excel 또는 Google Sheets에서 열기
- 한글 깨짐 여부 확인
- 패키지 종류/준비도 필터 적용 후 CSV 다운로드 확인
- `후가공`, `제작 준비 체크리스트` 컬럼이 쉼표 포함 값이어도 한 칸에 유지되는지 확인

## 다음 단계 추천 순서

### 1. AI 견적 요청 자동 정리

고객 입력값을 관리자용 상담 요약으로 자동 정리한다.

추천 이유:

- 고객이 적은 패키지 정보, 준비도 체크리스트, 추가 요청사항을 상담자가 빠르게 이해할 수 있다.
- 외부 AI API 연동 전에도 규칙 기반 요약 helper부터 시작할 수 있다.

주의:

- 외부 AI 연동은 별도 승인 후 진행.
- 고객-facing 페이지에 AI 결과를 바로 노출하지 말 것.

### 2. 제작 사례 필터 기능

공개 포트폴리오에서 패키지 종류/업종/구조별 탐색성을 강화한다.

추천 이유:

- 마케팅 전환에 직접 도움이 된다.
- 이미 PortfolioCase 시스템이 있으므로 확장성이 좋다.

### 3. 파일 업로드 기능

도면, 제품 사진, 참고 이미지 업로드.

주의:

- storage, 파일 크기 제한, 개인정보, 악성 파일 방어, Vercel 배포 구조를 함께 설계해야 한다.

### 4. 채널톡/이메일 연동

문의 알림이나 상담 연결 자동화.

주의:

- 자동 발송 문구와 개인정보 처리 기준을 먼저 확정해야 한다.

### 5. 이미지 리사이즈 도구

제작 사례 이미지 운영량이 늘어날 때 유용하다.

### 6. 도면/전개도 생성기

범위가 큰 별도 기능이므로 CRM 안정화 이후 독립 Phase로 진행하는 것이 좋다.

## 다음 GPT에게 줄 수 있는 작업 지시 예시

```text
너는 기존 프로젝트 “PerPackage Marketing Lead Management System”을 이어서 개발하는 senior full-stack developer다.

현재 “패키지 구조 선택형 문의폼 / 제작 준비 체크리스트” Phase 1~7은 완료되어 있다.

이번 작업은 “AI 견적 요청 자동 정리”의 1단계로, 외부 AI API를 붙이지 않고 규칙 기반 관리자용 문의 요약 helper를 만드는 것이다.

중요:
- 기존 기능 삭제/재작성 금지
- 고객-facing UI 변경 최소화
- 외부 AI API 연동 금지
- 가격 계산, 결제, 세금계산서, 전자계약, 파일 업로드 금지
- 관리자 화면에서만 보이는 내부 요약으로 구현

먼저 아래 파일을 확인하라.

1. package.json
2. prisma/schema.prisma
3. src/app/admin/leads/[id]/page.tsx
4. src/lib/admin-leads.ts
5. src/lib/lead-schema.ts
6. src/test/admin-leads.test.ts

작업 목표:

1. Lead 데이터를 받아 관리자용 상담 요약을 만드는 순수 helper를 추가한다.
2. helper는 외부 API를 호출하지 않는다.
3. 패키지 종류, 구조, 수량, 사이즈, 실물/디자인/도면 여부, 희망 납기, 급건 여부, 후가공, readinessScore, message를 기반으로 요약한다.
4. “상담 전 확인할 항목”과 “우선 확인 메모”를 생성한다.
5. 관리자 리드 상세 화면에 읽기 전용 섹션으로 표시한다.
6. 관련 테스트를 추가한다.
7. lint/test/build를 실행한다.

작업 후 한국어로 보고하라.
```

