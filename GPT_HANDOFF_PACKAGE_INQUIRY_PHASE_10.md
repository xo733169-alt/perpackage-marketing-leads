# PerPackage Marketing Lead Management System - GPT Handoff

## 목적

이 파일은 다음 GPT/Codex 세션에 현재 프로젝트 상태와 최근 완료된 “패키지 구조 선택형 문의폼 / 제작 준비 체크리스트” Phase 10 작업 내용을 전달하기 위한 handoff 문서다.

프로젝트명: PerPackage Marketing Lead Management System  
회사: 페르패키지  
업무 영역: 맞춤 패키지 제작 문의, 리드 CRM, 제작 사례, 관리자 운영 시스템  
기술 스택: Next.js App Router, TypeScript, Tailwind CSS, Prisma, SQLite, Zod, Vitest

---

## 현재 완료 범위

“패키지 구조 선택형 문의폼 / 제작 준비 체크리스트” Phase 1~10까지 완료되어 있다.

### Phase 1~9 요약

이미 완료된 주요 기능:

- Lead 모델에 패키지 제작 문의 필드 추가
- 문의 생성 API에서 패키지 제작 정보 저장
- 고객 문의폼에 패키지 종류, 구조, 수량, 사이즈, 제작 준비 체크리스트 추가
- readinessScore 계산 및 저장
- 관리자 리드 상세 화면에 패키지 제작 정보와 제작 준비도 표시
- 관리자 리드 목록에 패키지 종류, 수량, 급건, 상담 준비도 표시
- 관리자 리드 목록 필터 보강
- CSV export에 패키지 문의 필드 포함
- 외부 AI API 없이 규칙 기반 관리자용 상담 요약 helper 추가
- 관리자 리드 상세에서 자동 상담 정리 표시
- 관리자가 상담 요약을 직접 수정, 저장, 초기화할 수 있는 수동 상담 요약 기능 추가

중요:

- 외부 AI API는 연동하지 않았다.
- 고객-facing 페이지에는 관리자 상담 요약을 노출하지 않는다.
- 가격 계산, 결제, 세금계산서, 입출금, 전자계약 기능은 추가하지 않았다.
- 기존 CRM, 견적 룰, 견적안, 영업 업무 기능은 유지되어 있다.

---

## 최근 완료 작업: Phase 10

Phase 10 목표:

기존 제작 사례/포트폴리오 기능을 대규모로 갈아엎지 않고, 고객과 관리자가 제작 사례를 더 쉽게 찾을 수 있도록 필터 기능을 보강했다.

추가된 필터 기준:

- 패키지 종류
- 업종/제품군
- 패키지 구조
- 제작 목적

URL query parameter:

```txt
packageType
industry
packageStructure
casePurpose
q
status
seo
sort
```

예시:

```txt
/portfolio?packageType=단상자&industry=화장품&packageStructure=삼면접착형
/admin/portfolio?packageType=쇼핑백&casePurpose=브랜드%20런칭
```

---

## Phase 10에서 수정/추가한 파일

```txt
prisma/schema.prisma
prisma/migrations/20260621060245_add_portfolio_case_filter_fields/migration.sql
src/lib/portfolio-options.ts
src/lib/portfolio-utils.ts
src/lib/portfolio-schema.ts
src/components/PortfolioCaseForm.tsx
src/app/portfolio/page.tsx
src/app/portfolio/[slug]/page.tsx
src/app/admin/portfolio/page.tsx
src/app/admin/portfolio/[id]/edit/page.tsx
src/app/api/admin/portfolio/route.ts
src/app/api/admin/portfolio/[id]/route.ts
src/test/portfolio-utils.test.ts
src/test/portfolio-schema.test.ts
```

---

## DB 변경 내용

기존 `PortfolioCase` 모델에 이미 아래 필드가 있었다.

```prisma
industry String
boxType  String
```

그래서 패키지 종류는 기존 `boxType`, 업종은 기존 `industry`를 재사용했다.

필터에 부족한 아래 optional 필드만 추가했다.

```prisma
packageStructure String?
casePurpose      String?
```

index도 추가했다.

```prisma
@@index([packageStructure])
@@index([casePurpose])
```

Migration:

```txt
20260621060245_add_portfolio_case_filter_fields
```

Migration SQL:

```sql
ALTER TABLE "PortfolioCase" ADD COLUMN "casePurpose" TEXT;
ALTER TABLE "PortfolioCase" ADD COLUMN "packageStructure" TEXT;

CREATE INDEX "PortfolioCase_packageStructure_idx" ON "PortfolioCase"("packageStructure");
CREATE INDEX "PortfolioCase_casePurpose_idx" ON "PortfolioCase"("casePurpose");
```

---

## 포트폴리오 옵션 상수

파일:

```txt
src/lib/portfolio-options.ts
```

추가된 옵션 상수:

```ts
PORTFOLIO_PACKAGE_TYPE_OPTIONS
PORTFOLIO_INDUSTRY_OPTIONS
PORTFOLIO_STRUCTURE_OPTIONS
PORTFOLIO_PURPOSE_OPTIONS
```

패키지 종류 옵션에는 기존 제작 사례/견적 룰에서 쓰던 값과 새 문의폼 흐름을 고려해 아래 계열을 포함했다.

- 단상자
- 쇼핑백
- 싸바리박스
- 자석박스
- 상하짝박스
- 서랍형박스
- 골판지박스
- 내부 트레이
- 봉투/파우치
- 스티커/라벨
- 아직 모르겠음
- 기타

---

## 포트폴리오 필터 helper

파일:

```txt
src/lib/portfolio-utils.ts
```

추가/보강된 helper:

```ts
normalizePortfolioFilterValue(value, options)
getPortfolioFilterLabel(value)
buildPortfolioCaseWhere(searchParams, options)
```

### buildPortfolioCaseWhere 동작

`searchParams`를 받아 Prisma `PortfolioCaseWhereInput`을 만든다.

처리하는 값:

- `q`
- `packageType`
- legacy `boxType`
- `industry`
- `packageStructure`
- `casePurpose`
- `status`

public 목록에서는 아래 조건을 반드시 포함한다.

```ts
PUBLIC_PORTFOLIO_WHERE
```

즉 public `/portfolio`에는 `PUBLISHED`이면서 `publicApprovalConfirmed`가 true인 제작 사례만 나온다.

주의:

- public 검색에서는 비공개 고객사명인 `clientName`을 검색 조건에 넣지 않는다.
- admin 검색에서는 기존 관리자 검색 흐름 유지를 위해 `clientName` 검색을 유지한다.

---

## 고객-facing 제작 사례 화면 변경

파일:

```txt
src/app/portfolio/page.tsx
src/app/portfolio/[slug]/page.tsx
```

### `/portfolio`

추가된 필터 UI:

- 검색어
- 패키지 종류
- 업종
- 패키지 구조
- 제작 목적
- 정렬

특징:

- 필터는 URL query parameter에 반영된다.
- 새로고침하거나 링크를 공유해도 필터 상태가 유지된다.
- 모바일에서는 grid가 세로로 자연스럽게 쌓인다.
- 결과가 없으면 “선택한 조건에 맞는 제작 사례가 아직 없습니다.” 형태의 빈 상태가 표시된다.

### `/portfolio/[slug]`

제작 사례 상세에 아래 값을 추가 표시한다.

- 패키지 구조
- 제작 목적

값이 없으면 상세 스펙에서는 `-`로 표시된다.

주의:

- 고객-facing 페이지에는 관리자 상담 요약, 내부 메모, 내부 견적 정보가 노출되지 않는다.
- 새 필드는 마케팅용 분류 정보로만 사용된다.

---

## 관리자 제작 사례 화면 변경

파일:

```txt
src/app/admin/portfolio/page.tsx
```

관리자 제작 사례 목록에 필터가 추가되었다.

필터:

- 검색어
- 상태
- 패키지 종류
- 업종
- 패키지 구조
- 제작 목적
- SEO 상태

목록 테이블에 추가된 컬럼:

- 구조
- 제작 목적

값이 없으면 관리자 화면에서 `미입력`으로 표시한다.

기존 유지 항목:

- 상태 필터
- SEO 상태 필터
- 공개 승인 표시
- 공개 페이지 링크
- 수정 페이지 링크
- 대표 이미지 여부
- 추천 여부
- 공개일/수정일 표시

---

## 관리자 제작 사례 등록/수정 폼 변경

파일:

```txt
src/components/PortfolioCaseForm.tsx
src/app/admin/portfolio/[id]/edit/page.tsx
```

추가 입력 항목:

- 패키지 구조
- 제작 목적

처리 방식:

- 둘 다 optional이다.
- 기존 사례에 값이 없어도 정상 렌더링된다.
- 저장 payload에는 값이 있을 때만 전달하고, 없으면 `undefined`로 처리한다.
- API에서는 DB에 `null`로 저장한다.

---

## API 변경

파일:

```txt
src/app/api/admin/portfolio/route.ts
src/app/api/admin/portfolio/[id]/route.ts
```

### 생성 API

`toPortfolioData()`에 추가:

```ts
packageStructure: input.packageStructure ?? null
casePurpose: input.casePurpose ?? null
```

### 수정 API

`toPortfolioUpdateData()`에 추가:

```ts
packageStructure: input.packageStructure ?? null
casePurpose: input.casePurpose ?? null
```

### 목록 GET API

기존 수동 where 생성 로직을 `buildPortfolioCaseWhere(searchParams, { includeStatus: true })`로 통합했다.

---

## Validation 변경

파일:

```txt
src/lib/portfolio-schema.ts
```

추가:

```ts
packageStructure: z.preprocess(emptyToUndefined, z.enum(PORTFOLIO_STRUCTURE_OPTIONS).optional())
casePurpose: z.preprocess(emptyToUndefined, z.enum(PORTFOLIO_PURPOSE_OPTIONS).optional())
```

빈 문자열은 `undefined`로 처리하므로, 기존 데이터나 빈 선택 상태가 validation을 깨뜨리지 않는다.

---

## 테스트 변경

파일:

```txt
src/test/portfolio-utils.test.ts
src/test/portfolio-schema.test.ts
```

추가/보강 테스트:

- portfolio filter value normalize
- packageType / industry / packageStructure / casePurpose where 조건 생성
- public portfolio filter에서 공개 승인 조건 유지
- public 검색에서 `clientName` 검색 조건 제외
- admin 검색에서 `clientName` 검색 조건 유지
- schema에서 새 optional 필드 파싱
- 빈 `packageStructure`, `casePurpose`가 optional로 처리되는지 확인

---

## 실행한 검증 명령어와 결과

### lint

```powershell
next lint
```

결과:

```txt
통과
No ESLint warnings or errors
```

### test

```powershell
vitest run
```

결과:

```txt
32 test files passed
128 tests passed
```

### Prisma migration status

```powershell
DATABASE_URL=file:./dev.db prisma migrate status
```

결과:

```txt
Database schema is up to date!
```

### build

```powershell
DATABASE_URL=file:./dev.db prisma generate
next build
```

결과:

```txt
통과
Compiled successfully
41 pages generated
```

### local page smoke check

```txt
GET /portfolio?packageType=단상자&industry=화장품
```

결과:

```txt
200 OK
```

---

## 현재 주의할 점

1. 기존 제작 사례 데이터에는 새 필드가 비어 있다.
   - `packageStructure`
   - `casePurpose`

2. 필터를 실제 운영에서 제대로 쓰려면 관리자 제작 사례 수정 화면에서 기존 사례마다 구조/목적 값을 입력해야 한다.

3. public `/portfolio`에는 공개 승인된 PUBLISHED 사례만 노출된다.

4. 고객-facing 페이지에 내부 상담 요약, 내부 메모, 내부 견적 로직은 노출하지 않는다.

5. 이 Phase에서는 파일 업로드, AI API, 결제, 전자계약, 전개도 생성기는 추가하지 않았다.

---

## 다음 GPT가 이어서 볼 주요 파일

우선 확인:

```txt
prisma/schema.prisma
src/lib/portfolio-options.ts
src/lib/portfolio-utils.ts
src/lib/portfolio-schema.ts
src/app/portfolio/page.tsx
src/app/admin/portfolio/page.tsx
src/components/PortfolioCaseForm.tsx
```

필요 시 확인:

```txt
src/app/portfolio/[slug]/page.tsx
src/app/api/admin/portfolio/route.ts
src/app/api/admin/portfolio/[id]/route.ts
src/test/portfolio-utils.test.ts
src/test/portfolio-schema.test.ts
```

---

## 다음 단계 제안

현실적인 우선순위:

1. 파일 업로드 기능
   - 제작 사례 이미지 URL 수동 입력 대신 관리자 업로드/저장 흐름 필요
   - 단, 저장소 설계가 필요하므로 Vercel Blob 또는 별도 스토리지 검토 필요

2. 채널톡/이메일 연동
   - 문의 접수 후 관리자 알림 또는 고객 안내 자동화
   - 현재 외부 발송은 하지 않는 정책이므로 별도 확인 필요

3. 이미지 리사이즈 도구
   - 제작 사례 이미지 품질/속도 개선
   - 업로드 기능과 함께 설계하는 것이 좋음

4. 도면/전개도 생성기
   - 별도 대형 기능
   - 현재 CRM/마케팅 리드 시스템과 분리해서 설계하는 것이 안전함

---

## 다음 작업 시 유지해야 할 운영 규칙

- 기존 CRM, 리드, 견적 룰, 견적안, 영업 업무 기능을 삭제하거나 재작성하지 말 것.
- 고객-facing UI 문구는 한국어로 유지할 것.
- 관리자 상담 요약은 고객-facing 페이지에 노출하지 말 것.
- 외부 AI API, OpenAI API, ChatGPT API를 임의로 연동하지 말 것.
- 가격 계산, 결제, 세금계산서, 입출금, 전자계약 기능은 별도 요청 전까지 추가하지 말 것.
- 파일 업로드, 전개도 생성기, 3D 에디터는 별도 Phase로 다룰 것.
- 최종 견적은 관리자 검토 후 확정된다는 원칙을 유지할 것.
- 기존 테스트를 삭제해서 통과시키지 말 것.

