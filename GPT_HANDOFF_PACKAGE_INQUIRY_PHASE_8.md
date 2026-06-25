# PerPackage Marketing Lead Management System - GPT Handoff

## 목적

이 파일은 다음 GPT/Codex 세션에 현재 프로젝트 상태와 최근 작업 내용을 전달하기 위한 handoff 문서다.

프로젝트명: PerPackage Marketing Lead Management System  
회사: 페르패키지  
업무 영역: 맞춤 패키지 제작 문의/리드 관리/관리자 CRM  
기술 스택: Next.js App Router, TypeScript, Tailwind CSS, Prisma, SQLite, Zod, Vitest

---

## 현재 완료된 작업 범위

“패키지 구조 선택형 문의폼 / 제작 준비 체크리스트” Phase 1~8까지 완료되어 있다.

### Phase 1~7 요약

이미 완료된 주요 기능:

- Lead 모델에 패키지 제작 문의 필드 추가
- 문의 생성 API에서 새 필드 저장
- 고객 문의폼에 패키지 종류/구조/수량/사이즈/준비 체크리스트 추가
- readinessScore 계산 및 저장
- 관리자 리드 상세 화면에서 패키지 제작 정보 표시
- 관리자 리드 목록에서 패키지 종류/수량/상담 준비도/급건 표시
- 관리자 리드 목록 필터에 packageType/readiness 추가
- CSV export에 패키지 문의 필드 포함

Lead 모델에 추가된 주요 필드:

```prisma
packageType String?
packageStructure String?
quantity String?
sizeInfo String?
hasPhysicalProduct String?
hasDesignFile String?
hasDieline String?
desiredDueDate String?
isUrgent Boolean @default(false)
budgetRange String?
finishingOptions String?
readinessChecklist String?
readinessScore Int?
consultationNotes String?
```

기존 migration:

```txt
prisma/migrations/20260621021252_add_package_structure_readiness_fields/migration.sql
```

---

## 최근 완료 작업: Phase 8

Phase 8 목표:

외부 AI API를 붙이지 않고, 현재 Lead 데이터만 기반으로 관리자용 상담 요약을 생성하는 규칙 기반 helper를 만든다.

중요:

- 외부 AI API 연동 없음
- OpenAI API 연동 없음
- DB schema 변경 없음
- migration 생성 없음
- 고객-facing 페이지 노출 없음
- 관리자 리드 상세 화면에 읽기 전용 섹션만 추가

---

## Phase 8에서 수정한 파일

```txt
src/lib/admin-leads.ts
src/app/admin/leads/[id]/page.tsx
src/test/admin-leads.test.ts
```

---

## 추가된 helper

파일:

```txt
src/lib/admin-leads.ts
```

추가된 타입/함수:

```ts
export type LeadConsultationSummaryInput
export type LeadSummaryTone
export type LeadConsultationSummary

export function buildLeadConsultationSummary(lead)
export function getMissingConsultationItems(lead)
export function getPriorityConsultationNotes(lead)
export function getLeadSummaryTone(lead)
```

`buildLeadConsultationSummary()` 반환 구조:

```ts
type LeadConsultationSummary = {
  title: string;
  overview: string;
  priorityNotes: string[];
  missingItems: string[];
  riskNotes: string[];
  suggestedNextActions: string[];
};
```

---

## 상담 요약 생성 규칙

요약 helper는 아래 Lead 정보를 기반으로 관리자용 상담 정리를 생성한다.

- packageType
- packageStructure
- quantity
- sizeInfo
- hasPhysicalProduct
- hasDesignFile
- hasDieline
- desiredDueDate
- isUrgent
- budgetRange
- finishingOptions
- readinessScore
- message
- referenceNote
- consultationNotes

### title 규칙

상황에 따라 아래 제목 중 하나를 반환한다.

- 급건 일정 우선 확인 필요
- 상담 전 기본 조건 확인 필요
- 빠른 사양 검토 가능
- 기본 상담 진행 가능

### overview 규칙

고객 문의 내용을 한 문단으로 요약한다.

예:

```txt
고객은 단상자 제작을 문의했습니다. 수량은 1,000~3,000개로 입력했습니다. 패키지 구조는 삼면접착형으로 선택했습니다.
```

정보가 부족하면 자연스럽게 부족한 상태를 설명한다.

예:

```txt
고객은 패키지 제작을 문의했지만, 패키지 종류와 수량 정보가 아직 충분히 입력되지 않았습니다. 상담을 통해 제품 종류, 수량, 사이즈를 먼저 확인하는 것이 좋습니다.
```

### priorityNotes 규칙

상담자가 먼저 확인해야 할 메모를 생성한다.

예:

- 급건 문의입니다. 희망 납기와 제작 가능 일정을 먼저 확인하세요.
- 패키지 종류가 명확하지 않습니다. 제품 특성과 사용 목적을 먼저 확인하세요.
- 수량이 확정되지 않았습니다. 샘플, 소량, 본생산 중 어느 단계인지 확인하세요.
- 상담 준비도가 낮습니다. 기본 제작 조건부터 차근차근 정리해야 합니다.
- 상담 준비도가 높은 문의입니다. 도면, 디자인 파일, 납기 조건을 중심으로 빠르게 검토할 수 있습니다.

### missingItems 규칙

상담 전 부족한 정보를 배열로 생성한다.

후보:

- 패키지 종류
- 패키지 구조
- 수량
- 사이즈
- 제품 실물/이미지
- 디자인 파일
- 도면
- 희망 납기
- 예산 범위
- 후가공
- 제품 무게/내용물 특성

### riskNotes 규칙

제작 상담 시 주의사항을 생성한다.

예:

- 급건은 샘플, 후가공, 건조 시간, 배송 일정에 제한이 있을 수 있습니다.
- 후가공이 포함된 문의입니다. 제작 기간과 최소 수량, 도면 위치 확인이 필요합니다.
- 실물 없이 진행하는 경우 실제 제품 핏, 여유 공간, 오차 확인에 제한이 있을 수 있습니다.
- 이미지 파일만 있는 경우 인쇄용 원본 데이터 확인이 필요합니다.
- 도면 제작이 필요한 문의입니다. 구조 상담과 샘플 확인 과정이 필요할 수 있습니다.

### suggestedNextActions 규칙

담당자가 다음으로 할 일을 생성한다.

예:

- 희망 납기와 실제 제작 가능 일정을 먼저 확인한다.
- 제품 특성과 사용 목적에 맞는 패키지 종류와 구조를 정리한다.
- 제품의 실제 사이즈와 무게, 내용물 특성을 확인한다.
- 희망 수량과 납기일을 확인한다.
- 디자인 파일 보유 여부와 파일 형식을 확인한다.
- 도면 보유 여부와 구조 설계 필요 여부를 확인한다.
- 후가공 위치와 제작 가능 여부를 확인한다.
- 상담 후 견적 검토 단계로 넘긴다.

---

## 관리자 상세 화면 변경

파일:

```txt
src/app/admin/leads/[id]/page.tsx
```

추가된 섹션:

```txt
관리자용 상담 정리
```

표시 항목:

- 요약 제목
- 요약 문장
- 우선 확인 메모
- 부족한 정보
- 제작 주의사항
- 다음 상담 액션

섹션 안내 문구:

```txt
상담 참고용 요약입니다. 최종 견적은 관리자 검토 후 확정됩니다.
```

중요:

- 이 섹션은 관리자 리드 상세 화면에만 있다.
- 고객 문의폼이나 public 페이지에는 노출하지 않는다.
- 기존 패키지 제작 정보, 제작 준비도, 상담 메모, 견적 정보 섹션은 유지되어 있다.

---

## 추가/수정한 테스트

파일:

```txt
src/test/admin-leads.test.ts
```

추가된 테스트 내용:

- 충분한 정보가 있는 lead에서 overview 생성 확인
- isUrgent true일 때 급건 메모/주의사항 생성 확인
- packageType이 “잘 모르겠어요”일 때 패키지 종류 확인 메모 생성
- quantity가 “아직 미정”일 때 수량 확인 메모 생성
- sizeInfo가 비어 있을 때 missingItems에 사이즈 포함
- hasDesignFile이 “디자인 의뢰 필요”일 때 디자인 관련 메모 생성
- hasDieline이 “도면 제작 필요”일 때 도면 관련 메모/주의사항 생성
- readinessScore 낮음/높음에 따른 메모 생성
- finishingOptions에 “박”, “창/PET” 포함 시 후가공 주의사항 생성
- 잘못된 finishingOptions JSON이어도 helper가 throw하지 않음
- 기존 sparse lead 데이터에서도 안전하게 결과 반환

---

## 실행한 검증 명령어와 결과

실행 환경에서 전역 pnpm이 PATH에 없을 수 있어 로컬 `node_modules/.bin` 명령으로 검증했다.

### 단일 테스트

```powershell
vitest run src/test/admin-leads.test.ts
```

결과:

```txt
1 file passed
12 tests passed
```

### 전체 lint

```powershell
next lint
```

결과:

```txt
No ESLint warnings or errors
```

### 전체 test

```powershell
vitest run
```

결과:

```txt
32 files passed
119 tests passed
```

### Prisma migration 상태

```powershell
DATABASE_URL=file:./dev.db prisma migrate status
```

결과:

```txt
Database schema is up to date
```

### build

```powershell
DATABASE_URL=file:./dev.db prisma generate && next build
```

결과:

```txt
Prisma Client generated
Next.js build succeeded
```

---

## 주의할 점

다음 작업자는 아래 사항을 지켜야 한다.

- DB schema 변경 금지 unless 명확히 요청됨
- migration 생성 금지 unless 명확히 요청됨
- 외부 AI API 연동 금지
- 고객-facing 페이지에 상담 요약 노출 금지
- 가격 계산/결제/세금계산서/전자계약 기능 추가 금지
- 기존 CRM, 포트폴리오, 견적 룰, 견적안, 영업 업무 기능 삭제 금지
- 기존 테스트를 삭제해서 통과시키는 방식 금지

---

## 다음 단계 추천

현실적인 다음 작업 순서:

1. AI 견적 요청 자동 정리 2단계: 관리자 수동 요약 저장 기능
   - 현재 Phase 8은 규칙 기반 자동 표시만 한다.
   - 다음 단계에서는 관리자가 요약을 수정/저장할 수 있게 할 수 있다.
   - 이 경우 DB 필드 추가가 필요할 수 있으므로 별도 migration 계획이 필요하다.

2. 제작 사례 필터 기능
   - 포트폴리오/제작사례 탐색성을 높일 수 있다.

3. 파일 업로드 기능
   - 고객 참고 이미지, 도면, 디자인 파일 접수용.
   - 단, 저장소/보안/용량 정책이 필요하다.

4. 채널톡/이메일 연동
   - 문의 접수 알림 및 상담 흐름 개선.
   - 자동 발송 정책과 개인정보 주의 필요.

5. 이미지 리사이즈 도구
   - 포트폴리오 이미지 운영 편의성 개선.

6. 도면/전개도 생성기
   - 별도 큰 기능으로 분리해서 설계 필요.

---

## 다음 GPT에게 바로 줄 수 있는 요청 예시

```txt
너는 기존 프로젝트 “PerPackage Marketing Lead Management System”을 이어서 개발하는 senior full-stack developer다.

현재까지 패키지 구조 선택형 문의폼 / 제작 준비 체크리스트 Phase 1~8이 완료되어 있다.

Phase 8에서는 외부 AI API 없이 src/lib/admin-leads.ts에 buildLeadConsultationSummary helper를 만들었고,
관리자 리드 상세 화면 src/app/admin/leads/[id]/page.tsx에 “관리자용 상담 정리” 읽기 전용 섹션을 추가했다.

이번 다음 작업은 “AI 견적 요청 자동 정리 2단계: 관리자 수동 요약 저장 기능”이다.

먼저 아래 파일을 확인하라.

1. package.json
2. prisma/schema.prisma
3. src/lib/admin-leads.ts
4. src/app/admin/leads/[id]/page.tsx
5. src/app/api/admin/leads/[id]/route.ts
6. src/components/AdminLeadEditor.tsx
7. src/test/admin-leads.test.ts

주의:
- 기존 기능 삭제 금지
- 고객-facing 페이지에 관리자 요약 노출 금지
- 외부 AI API 연동 금지
- 가격 계산/결제/전자계약 기능 추가 금지
- DB 변경이 필요하면 optional 필드 중심으로 최소 migration만 만들 것
- 최종 견적은 관리자 검토 후 확정된다는 원칙을 유지할 것
```

