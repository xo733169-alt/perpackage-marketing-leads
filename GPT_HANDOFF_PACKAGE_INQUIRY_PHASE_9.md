# PerPackage Marketing Lead Management System - GPT Handoff

## 목적

이 파일은 다음 GPT/Codex 세션에 현재 프로젝트 상태와 최근 Phase 9 작업 내용을 전달하기 위한 handoff 문서다.

프로젝트명: PerPackage Marketing Lead Management System  
회사: 페르패키지  
업무 영역: 맞춤 패키지 제작 문의/리드 관리/관리자 CRM  
기술 스택: Next.js App Router, TypeScript, Tailwind CSS, Prisma, SQLite, Zod, Vitest

---

## 현재 완료된 작업 범위

“패키지 구조 선택형 문의폼 / 제작 준비 체크리스트” Phase 1~9까지 완료되어 있다.

### Phase 1~8 요약

이미 완료된 주요 기능:

- Lead 모델에 패키지 제작 문의 필드 추가
- 문의 생성 API에서 새 필드 저장
- 고객 문의폼에 패키지 종류/구조/수량/사이즈/준비 체크리스트 추가
- readinessScore 계산 및 저장
- 관리자 리드 상세 화면에서 패키지 제작 정보 표시
- 관리자 리드 목록에서 패키지 종류/수량/상담 준비도/급건 표시
- 관리자 리드 목록 필터에 packageType/readiness 추가
- CSV export에 패키지 문의 필드 포함
- 외부 AI API 없이 규칙 기반 관리자용 상담 요약 helper 추가
- 관리자 리드 상세 화면에 “관리자용 상담 정리” 읽기 전용 섹션 추가

Phase 8 helper:

```ts
buildLeadConsultationSummary(lead)
getMissingConsultationItems(lead)
getPriorityConsultationNotes(lead)
getLeadSummaryTone(lead)
```

---

## 최근 완료 작업: Phase 9

Phase 9 목표:

Phase 8의 자동 상담 정리를 기반으로, 관리자가 상담 요약/확인 메모/부족한 정보/제작 주의사항/다음 액션을 직접 수정해서 저장할 수 있게 한다.

중요:

- 외부 AI API 연동 없음
- OpenAI API 연동 없음
- 고객-facing 페이지 노출 없음
- 가격 계산/결제/전자계약 기능 없음
- 기존 `consultationNotes` 필드는 덮어쓰지 않음
- 수동 요약은 관리자 내부 기록 전용

---

## Phase 9에서 수정/추가한 파일

```txt
prisma/schema.prisma
prisma/migrations/20260621045824_add_manual_consultation_summary_fields/migration.sql
src/lib/admin-leads.ts
src/app/api/admin/leads/[id]/route.ts
src/app/admin/leads/[id]/page.tsx
src/components/AdminConsultationSummaryEditor.tsx
src/test/admin-leads.test.ts
```

---

## 추가된 DB 필드

Lead 모델에 optional 필드가 추가되었다.

```prisma
consultationSummaryTitle     String?
consultationSummaryOverview  String?
consultationPriorityNotes    String?
consultationMissingItems     String?
consultationRiskNotes        String?
consultationNextActions      String?
consultationSummaryUpdatedAt DateTime?
```

Migration:

```txt
20260621045824_add_manual_consultation_summary_fields
```

Migration SQL:

```sql
ALTER TABLE "Lead" ADD COLUMN "consultationMissingItems" TEXT;
ALTER TABLE "Lead" ADD COLUMN "consultationNextActions" TEXT;
ALTER TABLE "Lead" ADD COLUMN "consultationPriorityNotes" TEXT;
ALTER TABLE "Lead" ADD COLUMN "consultationRiskNotes" TEXT;
ALTER TABLE "Lead" ADD COLUMN "consultationSummaryOverview" TEXT;
ALTER TABLE "Lead" ADD COLUMN "consultationSummaryTitle" TEXT;
ALTER TABLE "Lead" ADD COLUMN "consultationSummaryUpdatedAt" DATETIME;
```

---

## 추가된 helper

파일:

```txt
src/lib/admin-leads.ts
```

추가된 helper:

```ts
hasManualConsultationSummary(lead)
parseManualConsultationSummary(lead)
getDisplayConsultationSummary(lead)
splitConsultationTextareaLines(value)
formatConsultationSummaryListForTextarea(items)
```

### hasManualConsultationSummary

수동 요약 필드 중 의미 있는 값이 하나라도 있으면 `true`.

판단 대상:

- consultationSummaryTitle
- consultationSummaryOverview
- consultationPriorityNotes
- consultationMissingItems
- consultationRiskNotes
- consultationNextActions

`[]`, `null`, 빈 문자열은 의미 없는 값으로 본다.

### parseManualConsultationSummary

수동 저장 요약을 `LeadConsultationSummary` 형태로 파싱한다.

JSON 문자열 필드는 안전하게 파싱한다.

파싱 실패 시:

- throw하지 않음
- 줄바꿈 기반 배열 또는 원본 문자열 기반 배열로 fallback

### getDisplayConsultationSummary

관리자 화면 표시용 요약을 선택한다.

동작:

- 수동 저장 요약이 있으면 `{ source: "manual" }`
- 없으면 Phase 8 자동 요약을 사용하고 `{ source: "auto" }`

### splitConsultationTextareaLines

textarea 입력을 줄 단위 배열로 변환한다.

규칙:

- 줄바꿈 기준 split
- 앞뒤 공백 제거
- 빈 줄 제거

### formatConsultationSummaryListForTextarea

배열을 textarea 표시용 줄바꿈 문자열로 변환한다.

---

## 관리자 API 변경

파일:

```txt
src/app/api/admin/leads/[id]/route.ts
```

기존 `PATCH /api/admin/leads/[id]`에 상담 요약 저장 필드를 추가했다.

추가로 받을 수 있는 payload:

```ts
{
  consultationSummaryTitle?: string;
  consultationSummaryOverview?: string;
  consultationPriorityNotes?: string[] | string;
  consultationMissingItems?: string[] | string;
  consultationRiskNotes?: string[] | string;
  consultationNextActions?: string[] | string;
  resetConsultationSummary?: boolean;
}
```

저장 방식:

- `consultationSummaryTitle`: 문자열 또는 null
- `consultationSummaryOverview`: 문자열 또는 null
- 배열 필드: JSON.stringify 배열 또는 null
- `consultationSummaryUpdatedAt`: 수동 요약 저장 시 서버 현재 시간
- `resetConsultationSummary: true`: 수동 요약 필드 전체 null

중요 구현 포인트:

기존 PATCH API는 상태/메모 저장용으로 쓰이고 있었다.  
Phase 9에서 상담 요약만 저장할 때 기존 `adminMemo`, `salesNote` 등이 지워지지 않도록 “전송된 필드만 업데이트”하는 방식으로 보강했다.

---

## 관리자 상세 화면 변경

파일:

```txt
src/app/admin/leads/[id]/page.tsx
```

기존 “관리자용 상담 정리” 섹션을 보강했다.

표시 항목:

- 요약 출처
  - 수동 저장 요약
  - 자동 정리 요약
- 마지막 수동 수정일
- 요약 제목
- 요약 문장
- 우선 확인 메모
- 부족한 정보
- 제작 주의사항
- 다음 상담 액션

안내 문구:

```txt
상담 참고용 요약입니다. 최종 견적은 관리자 검토 후 확정됩니다.
```

수동 저장 요약이 있으면 수동 요약을 우선 표시한다.  
수동 저장 요약이 없으면 기존 Phase 8 자동 요약을 표시한다.

---

## 추가된 클라이언트 컴포넌트

파일:

```txt
src/components/AdminConsultationSummaryEditor.tsx
```

역할:

- 관리자 상담 요약 수정 폼 렌더링
- 자동 요약을 편집란에 채우기
- 수동 요약 저장
- 수동 요약 초기화
- 저장 후 `router.refresh()`

입력 필드:

- 요약 제목: input
- 요약 문장: textarea
- 우선 확인 메모: textarea
- 부족한 정보: textarea
- 제작 주의사항: textarea
- 다음 상담 액션: textarea

버튼:

- 상담 정리 저장
- 자동 요약으로 채우기
- 수동 요약 초기화

textarea 저장 규칙:

```txt
한 줄 = 배열 항목 1개
빈 줄은 제거
서버 저장 시 JSON 문자열로 저장
```

예:

textarea:

```txt
급건 문의입니다. 희망 납기와 제작 가능 일정을 먼저 확인하세요.
패키지 구조가 정해지지 않았습니다.
```

DB 저장:

```json
[
  "급건 문의입니다. 희망 납기와 제작 가능 일정을 먼저 확인하세요.",
  "패키지 구조가 정해지지 않았습니다."
]
```

---

## 수동 요약과 자동 요약 선택 기준

화면 표시 기준:

1. `hasManualConsultationSummary(lead)`가 true이면 수동 저장 요약 표시
2. false이면 `buildLeadConsultationSummary(lead)` 자동 정리 요약 표시

수동 요약 초기화 시:

아래 필드를 null로 업데이트한다.

```txt
consultationSummaryTitle
consultationSummaryOverview
consultationPriorityNotes
consultationMissingItems
consultationRiskNotes
consultationNextActions
consultationSummaryUpdatedAt
```

이후 화면은 자동 정리 요약으로 돌아간다.

---

## 테스트

파일:

```txt
src/test/admin-leads.test.ts
```

추가된 테스트:

- 수동 요약 필드가 없으면 `hasManualConsultationSummary()` false
- 수동 요약 필드가 있으면 true
- `[]`만 있는 경우 수동 요약으로 보지 않음
- 수동 요약 JSON 배열 파싱
- 잘못된 JSON이어도 throw하지 않고 fallback
- 수동 요약이 있으면 `getDisplayConsultationSummary()`가 manual 반환
- 수동 요약이 없으면 auto 반환
- textarea 줄바꿈 문자열을 배열로 변환
- 배열을 textarea 표시용 문자열로 변환

---

## 실행한 검증 명령어와 결과

전역 pnpm이 PATH에 없을 수 있어 로컬 `node_modules/.bin` 기반으로 검증했다.

### migration 생성

```powershell
DATABASE_URL=file:./dev.db prisma migrate dev --name add_manual_consultation_summary_fields
```

결과:

```txt
20260621045824_add_manual_consultation_summary_fields 생성 및 적용 완료
Prisma Client generated
```

### Prisma format

```powershell
DATABASE_URL=file:./dev.db prisma format
```

결과:

```txt
Formatted prisma/schema.prisma
```

### 단일 테스트

```powershell
vitest run src/test/admin-leads.test.ts
```

결과:

```txt
1 file passed
16 tests passed
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
123 tests passed
```

### migration 상태

```powershell
DATABASE_URL=file:./dev.db prisma migrate status
```

결과:

```txt
12 migrations found
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

## 다음 작업 시 주의사항

다음 GPT/Codex는 아래 사항을 지켜야 한다.

- 고객-facing 페이지에 관리자 상담 요약을 노출하지 말 것
- 외부 AI API를 연결하지 말 것 unless 명확히 요청됨
- OpenAI API를 연결하지 말 것 unless 명확히 요청됨
- `consultationNotes`는 기존 내부 상담 메모 용도이므로 덮어쓰거나 의미 변경하지 말 것
- 수동 상담 요약 필드는 관리자 내부 기록 전용
- 기존 CRM/포트폴리오/견적 룰/견적안/영업 업무 기능 삭제 금지
- “자동 견적”, “확정 견적”, “AI가 견적 산출” 같은 표현 금지
- 최종 견적은 관리자 검토 후 확정된다는 원칙 유지

---

## 다음 단계 추천

현실적인 다음 작업 순서:

1. 제작 사례 필터 기능
   - 공개 포트폴리오/관리자 제작사례 탐색성 개선

2. 파일 업로드 기능
   - 고객 참고 이미지, 도면, 디자인 파일 접수
   - 저장소/보안/용량 정책 필요

3. 채널톡/이메일 연동
   - 문의 접수 알림 및 상담 흐름 개선
   - 개인정보와 자동 발송 정책 주의

4. 이미지 리사이즈 도구
   - 포트폴리오 이미지 운영 편의성 개선

5. 도면/전개도 생성기
   - 별도 큰 기능으로 분리해서 설계 필요

---

## 다음 GPT에게 바로 줄 수 있는 요청 예시

```txt
너는 기존 프로젝트 “PerPackage Marketing Lead Management System”을 이어서 개발하는 senior full-stack developer다.

현재까지 패키지 구조 선택형 문의폼 / 제작 준비 체크리스트 Phase 1~9가 완료되어 있다.

Phase 9에서는 관리자 리드 상세 화면에서 자동 상담 정리를 바탕으로 수동 상담 요약을 저장/수정/초기화할 수 있게 했다.

관련 파일:
1. prisma/schema.prisma
2. prisma/migrations/20260621045824_add_manual_consultation_summary_fields/migration.sql
3. src/lib/admin-leads.ts
4. src/app/api/admin/leads/[id]/route.ts
5. src/app/admin/leads/[id]/page.tsx
6. src/components/AdminConsultationSummaryEditor.tsx
7. src/test/admin-leads.test.ts

다음 작업은 [원하는 기능명]이다.

주의:
- 기존 CRM/포트폴리오/견적 기능 삭제 금지
- 고객-facing 페이지에 관리자 상담 요약 노출 금지
- 외부 AI API 연동 금지 unless 명확히 요청됨
- 가격 계산/결제/전자계약 기능 추가 금지
- 최종 견적은 관리자 검토 후 확정된다는 원칙 유지
```

