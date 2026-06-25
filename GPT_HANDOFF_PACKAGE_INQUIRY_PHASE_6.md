# GPT Handoff - 패키지 구조 선택형 문의폼 / 제작 준비 체크리스트 Phase 6

이 문서는 GPT 또는 다른 개발 에이전트가 현재 프로젝트 상태와 최근 추가된 “패키지 구조 선택형 문의폼” 작업을 빠르게 이해하고 이어서 작업할 수 있도록 만든 인수인계 문서입니다.

## 프로젝트 기본 정보

- 프로젝트명: PerPackage Marketing Lead Management System
- 회사명: 페르패키지
- 사업: 맞춤 패키지 박스 제조 / 패키지 제작 상담
- 위치: 서울 중구 을지로
- 프로젝트 경로: `C:\Users\inh78\OneDrive\문서\홈페이지 개발\perpackage-marketing-leads`
- 기준 날짜: 2026-06-21
- 현재 작업 상태: 패키지 구조 선택형 문의폼 1~6단계 완료

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
- 고객이 “잘 모르겠어요”를 선택해도 부정적으로 보이지 않게 표시한다.

## 이번 기능의 목적

고객이 패키지 제작을 처음 문의하더라도 상담에 필요한 기본 정보를 쉽게 남길 수 있도록 고객 문의폼에 아래 기능을 추가했다.

- 패키지 종류 선택
- 패키지 구조 선택
- 제작 수량/사이즈/실물/디자인 파일/도면 여부 입력
- 후가공 다중 선택
- 제작 준비 체크리스트
- readinessScore 계산 및 저장
- 관리자 리드 목록/상세 화면에서 빠른 확인

## 완료된 단계 요약

### 1단계: Prisma DB 필드 확장

`Lead` 모델에 아래 필드를 추가했다.

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

기존 필드 중 `budgetRange`, `finishingOptions`는 새 문의폼 흐름에서도 함께 사용한다.

생성된 migration:

- `prisma/migrations/20260621021252_add_package_structure_readiness_fields/migration.sql`

### 2단계: 문의 생성 API / validation 수정

수정 파일:

- `src/app/api/leads/route.ts`
- `src/lib/lead-schema.ts`
- `src/test/lead-schema.test.ts`

주요 내용:

- 새 패키지 관련 필드를 `/api/leads`에서 받을 수 있게 수정
- 대부분 optional 처리
- `finishingOptions`는 배열을 JSON 문자열로 저장
- `readinessChecklist`는 배열/객체/문자열을 안전하게 문자열화해 저장
- `readinessScore`는 0~100 정수로 validation
- 빈 필수 DB 값은 기존 fallback 유지
  - `industry`: `기타`
  - `boxType`: `아직 모르겠음`
  - `quantityRange`: `아직 미정`
  - `printOption`: `아직 미정`

### 3단계: 고객 문의폼 UI 추가

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

고객 안내 문구:

- “패키지 제작이 처음이어도 괜찮습니다. 알고 계신 정보만 입력해주시면 상담 시 필요한 내용을 함께 정리해드립니다.”
- “정확한 견적은 제품 실측, 도면, 재질, 수량, 인쇄/후가공 조건 확인 후 안내됩니다.”
- “최종 견적은 상담 후 확정됩니다.”

readinessScore 계산:

- 체크된 항목 수 / 전체 7개 항목 * 100
- `Math.round()`로 정수 처리
- hidden input으로 `readinessChecklist`, `readinessScore`를 payload에 포함

### 4단계: 관리자 리드 상세 화면 표시

수정 파일:

- `src/app/admin/leads/[id]/page.tsx`
- `src/lib/admin-leads.ts`
- `src/test/admin-leads.test.ts`

추가된 상세 섹션:

- `기본 문의 정보`
- `패키지 제작 정보`
- `제작 준비도`
- `내부 상담 메모`

표시 방식:

- 값이 없으면 `미입력`
- `readinessScore`가 없으면 `미계산`
- `잘 모르겠어요`는 그대로 표시
- checklist JSON 파싱 실패 시 빈 배열 처리
- finishingOptions JSON 파싱 실패 시 빈 배열 처리

관리자용 준비도 문구:

- 0~30: `상담 전 추가 확인이 많이 필요한 문의입니다.`
- 31~70: `기본 상담이 가능한 문의입니다.`
- 71~100: `상담 준비도가 높은 문의입니다.`

### 5단계: 관리자 리드 목록 화면 표시 / 필터 추가

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
  - 전체
  - 단상자
  - 쇼핑백
  - 싸바리박스
  - 골판지박스
  - 내부 트레이
  - 봉투/파우치
  - 스티커/라벨
  - 잘 모르겠어요
  - 기타
- 상담 준비도
  - 전체
  - 0~30
  - 31~70
  - 71~100
  - 미계산

목록 준비도 라벨:

- null: `미계산`
- 0~30: `준비 낮음`
- 31~70: `기본 상담 가능`
- 71~100: `준비 높음`

### 6단계: 전체 기능 테스트 / 안정화

확인한 흐름:

1. 고객 문의 생성 API 제출
2. 새 필드 DB 저장 확인
3. 최소 입력 리드 저장 확인
4. 관리자 목록 렌더링 확인
5. 관리자 상세 렌더링 확인
6. 빈 값 `미입력` 표시 확인
7. readinessScore 없음 `미계산` 표시 확인
8. JSON 파싱 오류 없음 확인
9. migration 상태 확인
10. lint/test/build 확인

테스트용으로 생성한 리드:

- `Phase6Test-*`
- `Phase6Minimal-*`

테스트 후 삭제 완료.

## 주요 파일별 역할

### DB / Prisma

- `prisma/schema.prisma`
  - `Lead` 모델에 패키지 제작 정보와 준비도 필드가 추가되어 있다.

- `prisma/migrations/20260621021252_add_package_structure_readiness_fields/migration.sql`
  - 새 Lead 필드 추가 migration.

### 고객 문의폼

- `src/components/QuoteInquiryForm.tsx`
  - 고객용 견적 문의폼.
  - 패키지 제작 정보 UI와 제작 준비 체크리스트 UI가 들어 있다.
  - readinessScore를 프론트에서 계산해 hidden input으로 전달한다.

- `src/lib/lead-options.ts`
  - 기존 리드 option 상수.
  - 예산 범위 option에 새 선택지가 추가되어 validation이 통과하도록 되어 있다.

### 문의 생성 API / validation

- `src/app/api/leads/route.ts`
  - 공개 문의 생성 API.
  - 새 패키지 정보 필드를 Lead에 저장한다.

- `src/lib/lead-schema.ts`
  - Zod validation.
  - 새 필드는 대부분 optional.
  - `finishingOptions`, `readinessChecklist`, `readinessScore` validation 포함.

### 관리자 리드 화면

- `src/app/admin/leads/page.tsx`
  - 관리자 리드 목록.
  - 패키지 정보 배지, 상담 준비도 배지, 패키지 종류 필터, 준비도 필터가 들어 있다.

- `src/app/admin/leads/[id]/page.tsx`
  - 관리자 리드 상세.
  - 패키지 제작 정보, 제작 준비도, 내부 상담 메모 섹션이 들어 있다.

- `src/lib/admin-leads.ts`
  - 관리자 리드 목록 query helper.
  - finishingOptions/readinessChecklist 파싱 helper.
  - readiness 상태/목록 라벨 helper.

### 테스트

- `src/test/lead-schema.test.ts`
  - 문의 validation 테스트.

- `src/test/admin-leads.test.ts`
  - 관리자 표시 helper, JSON 파싱, 목록 필터 query 테스트.

## 검증 결과

최종 확인 명령어:

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
  - 112개 테스트 통과
- Prisma migration status 통과
  - DB schema up to date
- Next production build 통과
- 실제 `POST /api/leads` 제출 테스트 성공
  - 201 응답
  - DB 저장 확인
- 관리자 목록/상세 HTML 렌더링 확인
  - 200 응답
  - 새 패키지 정보 표시 확인

주의:

- 현재 작업 환경에서 전역 `pnpm`이 PATH에 잡히지 않을 수 있다.
- 필요 시 로컬 바이너리와 번들 Node를 사용했다.
- `DATABASE_URL`이 없으면 Prisma 관련 build/sitemap에서 문제가 날 수 있으므로 로컬 검증 시 `DATABASE_URL=file:./dev.db`를 설정해야 한다.

## 발견된 오류와 해결

### 1. 테스트용 dev 서버 실행 시 node PATH 문제

증상:

- `next.CMD dev` 실행 중 `node`를 찾지 못함.

해결:

- 번들 Node 직접 실행 방식 사용:

```powershell
C:\Users\inh78\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\next\dist\bin\next dev -p 3101
```

### 2. Prisma generate 중 Windows 파일 잠금

증상:

- `EPERM: operation not permitted, rename ... query_engine-windows.dll.node`

원인:

- 테스트용 dev 서버가 Prisma engine 파일을 잡고 있었음.

해결:

- 테스트 서버 종료 후 `prisma generate && next build` 재실행.
- 최종 build 통과.

### 3. Browser plugin 연결 실패

증상:

- Windows sandbox 문제로 인앱 브라우저 자동화 연결 실패.

대체 검증:

- API 제출
- DB 직접 조회
- 관리자 HTML 렌더링 확인
- Chrome headless screenshot 생성

## 현재 남은 문제

기능상 확인된 문제는 없다.

다만 운영 전 사람이 브라우저에서 직접 한 번 확인하면 좋은 항목:

- 문의폼 체크리스트 클릭 시 준비도 점수 변화
- 문의 제출 후 `/thanks` 이동
- 관리자 목록 필터 동작
- 관리자 상세 카드 표시
- 모바일에서 폼 하단까지 직접 스크롤 확인

## 다음 단계 추천 순서

현실적인 다음 단계는 아래 순서가 좋다.

### 1. 문의 데이터 CSV 내보내기 보강

새 패키지 필드와 readinessScore를 CSV export에 포함한다.

추천 이유:

- 지금까지 저장한 새 데이터가 관리자 외부 분석에도 쓰일 수 있다.
- 작업 범위가 작고 실무 효과가 크다.

수정 후보:

- `src/app/api/admin/leads/export/route.ts`
- 필요 시 `src/lib/admin-leads.ts`

CSV에 추가할 후보 필드:

- `packageType`
- `packageStructure`
- `quantity`
- `sizeInfo`
- `hasPhysicalProduct`
- `hasDesignFile`
- `hasDieline`
- `desiredDueDate`
- `isUrgent`
- `budgetRange`
- `finishingOptions`
- `readinessScore`
- `readinessChecklist`
- `consultationNotes`

### 2. AI 견적 요청 자동 정리

고객 입력값을 바탕으로 관리자에게 보여줄 상담 요약을 자동 생성하거나 규칙 기반으로 정리한다.

주의:

- 외부 AI API 연동은 아직 하지 않는 편이 안전하다.
- 먼저 규칙 기반 요약 helper로 시작하는 것이 좋다.

### 3. 제작 사례 필터 기능 보강

패키지 종류/업종/구조 기준으로 공개 제작 사례 탐색성을 높인다.

### 4. 파일 업로드 기능

도면, 제품 사진, 참고 이미지 업로드.

주의:

- storage, 개인정보, 파일 크기 제한, 보안 정책이 필요하므로 별도 단계로 진행한다.

### 5. 채널톡/이메일 연동

문의 알림/상담 연결 자동화.

주의:

- 자동 발송 전 운영 문구와 개인정보 처리 기준을 먼저 확정해야 한다.

### 6. 이미지 리사이즈 도구

제작 사례 이미지 운영이 많아질 때 추가.

### 7. 도면/전개도 생성기

범위가 매우 크므로 CRM 안정화 이후 독립 프로젝트 또는 별도 Phase로 진행하는 것이 맞다.

## 다음 GPT에게 바로 줄 수 있는 작업 지시 예시

```text
너는 기존 PerPackage Marketing Lead Management System을 이어서 개발하는 senior full-stack developer다.

현재 패키지 구조 선택형 문의폼 1~6단계는 완료되어 있다.

이번 작업은 관리자 리드 CSV export에 새 패키지 문의 필드를 추가하는 것이다.

절대 기존 기능을 삭제하거나 재작성하지 말 것.
고객-facing UI 문구는 한국어를 유지할 것.
가격 계산, 결제, 세금계산서, 전자계약, 파일 업로드는 이번 범위가 아니다.

먼저 아래 파일을 확인하라.

1. package.json
2. prisma/schema.prisma
3. src/app/api/admin/leads/export/route.ts
4. src/lib/admin-leads.ts
5. src/app/admin/leads/page.tsx
6. src/app/admin/leads/[id]/page.tsx
7. src/test/admin-leads.test.ts

작업 목표:

1. 기존 CSV export 기능을 유지한다.
2. 새 Lead 필드를 CSV에 추가한다.
3. finishingOptions와 readinessChecklist는 JSON 문자열이 깨지지 않도록 안전하게 export한다.
4. readinessScore가 없으면 빈 값 또는 미계산으로 처리한다.
5. isUrgent는 한국어로 급건/일반 일정처럼 보기 좋게 export한다.
6. 기존 상태/status/filter/search CSV 조건은 깨뜨리지 않는다.
7. 관련 테스트를 추가하거나 기존 테스트를 보강한다.
8. lint/test/build를 실행한다.

CSV 추가 필드 후보:

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

작업 후 한국어로 다음을 보고하라.

1. 수정한 파일
2. CSV에 추가한 컬럼
3. JSON 필드 처리 방식
4. 실행한 명령어와 결과
5. 남은 문제
```

