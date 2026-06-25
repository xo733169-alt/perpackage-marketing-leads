# GPT Handoff - PerPackage Marketing Lead Management System Phase 2.5

이 문서는 GPT 또는 다른 개발 에이전트에게 현재 프로젝트 상태를 전달하기 위한 Phase 2.5 인수인계 문서입니다.

## 프로젝트 기본 정보

- 프로젝트명: PerPackage Marketing Lead Management System
- 회사명: 페르패키지
- 사업: 맞춤 패키지 박스 제작 업체
- 위치: 서울 중구 을지로
- 프로젝트 경로: `C:\Users\inh78\OneDrive\문서\홈페이지 개발\perpackage-marketing-leads`
- 현재 완료 단계: Phase 2.5

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
- 최종 견적은 종이, 구조, 인쇄, 후가공, 수량, 제작 난이도 확인 후 상담으로 확정된다.
- 고객사명, 고객 정보, 제품 민감 정보는 공개 승인 없이 public page에 노출하지 않는다.
- 고객사명은 `isClientNamePublic=true`일 때만 공개한다.
- Phase 2.5에서는 이미지 업로드/스토리지, 외부 AI 생성, KakaoTalk API, 결제, 풀 CMS, 자동 견적 엔진을 구현하지 않았다.

## 현재 구현 완료 기능

### 기존 Phase 1 / 1.5 / 2 기능

- 공개 랜딩 페이지: `/`
- 견적 문의 폼
- 리드 DB 저장
- 개인정보 필수 동의
- 마케팅 수신 선택 동의
- UTM/referrer/landingPath 추적
- 참고용 예상 범위 미리보기
- 문의 완료 페이지: `/thanks`
- 개인정보 안내 페이지: `/privacy`
- 관리자 로그인: `/admin/login`
- 관리자 리드 목록: `/admin/leads`
- 관리자 리드 상세: `/admin/leads/[id]`
- CSV export
- 후속 연락일, 마지막 연락일, 영업 메모
- 리드 삭제
- 선택형 리드 알림 웹훅
- `PortfolioCase` 모델
- 관리자 제작 사례 목록/등록/편집
- 공개 제작 사례 목록/상세
- 포트폴리오 CTA에서 견적 문의 출처 추적
- sitemap route

### Phase 2.5 신규 기능

- 제작 사례 공개 승인 workflow
- 승인 없는 `PUBLISHED` 제작 사례 public 노출 차단
- 관리자 포트폴리오 목록에 공개 승인 상태 표시
- 관리자 포트폴리오 목록에 SEO 상태 표시
- 관리자 포트폴리오 폼에 공개 승인 확인 섹션 추가
- 관리자 포트폴리오 폼에 SEO 미리보기와 체크리스트 추가
- 대표 이미지 alt text와 이미지 설명 필드 추가
- 공개 포트폴리오 필터 UX 개선
- 포트폴리오 유입 견적 폼 안내 문구 개선
- 제작 사례 JSON import workflow 추가
- `robots.txt` route 추가
- 관리자 운영 체크리스트 페이지 추가
- README Phase 2.5 기준 업데이트

## 새 데이터베이스 필드

`PortfolioCase` 모델에 다음 필드가 추가됐다.

```text
publicApprovalConfirmed Boolean @default(false)
publicApprovalMemo      String?
publicApprovedAt        DateTime?
publicApprovalBy        String?
mainImageAlt            String?
imageCaption            String?
```

인덱스:

```text
@@index([publicApprovalConfirmed])
```

## 마이그레이션

생성 및 적용된 마이그레이션:

```text
prisma/migrations/20260620054012_add_portfolio_approval_seo_image_fields/migration.sql
```

다른 환경에서 적용:

```bash
pnpm db:migrate
pnpm exec prisma generate
```

## 공개 승인 workflow

관리자 제작 사례 등록/편집 폼에 `공개 승인 확인` 섹션이 추가됐다.

필드:

- 공개 승인 확인 checkbox
- 공개 승인 메모
- 공개 확인자

공개 승인 checkbox 문구:

```text
고객사명, 제품 정보, 이미지, 제작 사양의 공개 가능 여부를 확인했습니다.
```

규칙:

- `DRAFT`는 공개 승인 없이 저장 가능
- `PUBLISHED`는 `publicApprovalConfirmed=true`일 때만 저장 가능
- 승인 없이 공개하려고 하면 다음 메시지 표시:

```text
제작 사례를 공개하려면 공개 승인 확인이 필요합니다.
```

public page 노출 조건:

```ts
status === "PUBLISHED" && publicApprovalConfirmed === true
```

이 조건은 `src/lib/portfolio-utils.ts`의 `PUBLIC_PORTFOLIO_WHERE`와 `isPublishedPortfolioCase()`에서 관리한다.

## SEO helper

파일:

```text
src/lib/portfolio-seo.ts
```

주요 함수:

- `getPortfolioSeoStatus(case)`
- `getPortfolioSeoChecklist(case)`
- `getPortfolioSeoPreview(case)`

SEO 상태:

- `GOOD`: 좋음
- `NEEDS_WORK`: 보완필요
- `MISSING_REQUIRED`: 필수누락

체크 항목:

- SEO 제목 있음
- SEO 설명 있음
- 슬러그 있음
- 짧은 설명 있음
- 대표 이미지 또는 placeholder 준비
- 대표 이미지 alt 문구 있음
- 태그 2개 이상
- 업종 있음
- 박스 종류 있음
- 제작 포인트 있음
- 사양 요약 있음

SEO 제목/설명 길이는 경고만 표시하고 저장을 막지 않는다.

## 이미지 alt/caption

새 필드:

- `mainImageAlt`
- `imageCaption`

public detail page 동작:

- 대표 이미지 alt는 `mainImageAlt`를 우선 사용
- 없으면 `{title} 제작 사례 이미지` fallback 사용
- `imageCaption`이 있으면 대표 이미지 아래에 표시
- `mainImageUrl`이 없으면 broken image 대신 placeholder UI 표시

관련 helper:

```text
src/lib/portfolio-utils.ts
getPortfolioImageAlt()
```

## 공개 포트폴리오 필터

경로:

```text
/portfolio
```

지원 query parameter:

- `boxType`
- `industry`
- `q`
- `sort`

정렬값:

- `latest`: 최신순
- `featured`: 추천순
- `title`: 제목순

빈 결과 문구:

```text
조건에 맞는 제작 사례가 없습니다.
```

빈 결과 CTA:

```text
견적 문의하기
```

## 포트폴리오에서 견적 문의 전환

제작 사례 상세 CTA:

```text
비슷한 패키지 견적 문의하기
```

전달 query:

- `sourceCaseSlug`
- `sourceCaseTitle`
- `industry`
- `boxType`
- `utm_source=portfolio`
- `utm_medium=case_detail`
- `utm_campaign=portfolio_case`

견적 폼 안내 문구:

```text
‘{sourceCaseTitle}’ 제작 사례를 보고 문의 중입니다.
유사한 구조와 사양을 참고해 상담을 도와드리겠습니다.
```

리드 저장:

- `sourceCaseSlug`
- `sourceCaseTitle`

관리자 리드 목록에서는 `제작사례 유입` 배지를 표시한다.

## 제작 사례 import workflow

예시 JSON:

```text
scripts/portfolio-cases.example.json
```

import script:

```text
scripts/import-portfolio-cases.ts
```

package script:

```json
"portfolio:import": "node --experimental-strip-types scripts/import-portfolio-cases.ts"
```

실행:

```bash
pnpm portfolio:import scripts/portfolio-cases.example.json
```

dry-run:

```bash
pnpm portfolio:import scripts/portfolio-cases.example.json --dry-run
```

동작:

- JSON 배열 또는 `{ "cases": [...] }` 형식 지원
- slug 기준 upsert
- 기본 import record는 `DRAFT`, `publicApprovalConfirmed=false`
- `PUBLISHED` import는 `publicApprovalConfirmed=true`일 때만 가능
- summary 출력:
  - totalRead
  - created
  - updated
  - skipped
  - errors

주의:

- 예시 데이터는 모두 비공개 placeholder 브랜드 기준이다.
- 실제 고객사명은 승인 없이 넣지 않는다.
- 이미지 URL은 공개 사용 허가가 있는 것만 사용한다.

## robots/sitemap

robots route:

```text
src/app/robots.ts
```

규칙:

- allow: `/`, `/portfolio`, `/privacy`
- disallow: `/admin`, `/api/admin`
- sitemap URL 포함

sitemap route:

```text
src/app/sitemap.ts
```

포함:

- `/`
- `/privacy`
- `/portfolio`
- 승인된 공개 제작 사례 상세 페이지만 포함

`NEXT_PUBLIC_SITE_URL`이 없으면 개발용 `http://127.0.0.1:3000`을 fallback으로 사용한다.

## 관리자 운영 체크리스트

경로:

```text
/admin/checklist
```

섹션:

1. 운영 전 필수 설정
2. 제작 사례 공개 전 확인
3. 문의 관리 확인

DB 없이 정적 페이지로 구현됐다.

## 주요 변경 파일

### Prisma

- `prisma/schema.prisma`
- `prisma/migrations/20260620054012_add_portfolio_approval_seo_image_fields/migration.sql`

### Lib

- `src/lib/portfolio-utils.ts`
- `src/lib/portfolio-schema.ts`
- `src/lib/portfolio-seo.ts`
- `src/lib/portfolio-import.ts`
- `src/lib/portfolio-options.ts`

### Components

- `src/components/PortfolioCaseForm.tsx`
- `src/components/PortfolioCaseImage.tsx`
- `src/components/QuoteInquiryForm.tsx`

### Admin Pages

- `src/app/admin/portfolio/page.tsx`
- `src/app/admin/portfolio/new/page.tsx`
- `src/app/admin/portfolio/[id]/edit/page.tsx`
- `src/app/admin/checklist/page.tsx`
- `src/app/admin/leads/page.tsx`

### Public Pages

- `src/app/portfolio/page.tsx`
- `src/app/portfolio/[slug]/page.tsx`
- `src/app/page.tsx`
- `src/app/sitemap.ts`
- `src/app/robots.ts`

### API

- `src/app/api/admin/portfolio/route.ts`
- `src/app/api/admin/portfolio/[id]/route.ts`

### Scripts

- `scripts/import-portfolio-cases.ts`
- `scripts/portfolio-cases.example.json`

### Tests

- `src/test/portfolio-utils.test.ts`
- `src/test/portfolio-schema.test.ts`
- `src/test/portfolio-seo.test.ts`
- `src/test/portfolio-import.test.ts`

### Docs

- `README.md`
- `GPT_HANDOFF_PHASE_2_5.md`

## 검증 완료 결과

실행 완료:

```bash
pnpm lint
pnpm test
pnpm build
pnpm portfolio:import scripts/portfolio-cases.example.json --dry-run
```

결과:

- `pnpm lint`: 통과
- `pnpm test`: 통과
  - 10개 test file
  - 33개 test
- `pnpm build`: 통과
- import dry-run: 통과
  - totalRead: 3
  - created: 3
  - updated: 0
  - skipped: 0
  - errors: []

실제 API/페이지 흐름 검증:

- 관리자 로그인 성공
- `/admin/checklist` 접근 200 확인
- 제작 사례 DRAFT 생성 성공
- 승인 없는 PUBLISHED 요청 400 확인
- 미승인 public detail 404 확인
- 승인 후 public detail 200 확인
- `/portfolio?boxType=...&industry=...&q=...&sort=featured` 필터 결과 확인
- sitemap에 승인된 공개 사례 포함 확인
- robots에서 `/admin`, `/api/admin` disallow 확인
- 포트폴리오 query를 통한 견적 문의 제출 확인
- 리드에 `sourceCaseSlug`, `sourceCaseTitle` 저장 확인
- 보관 처리 후 public detail 404 확인
- 검증용 테스트 데이터 삭제 확인

## 현재 dev server

마지막 작업 시점에 개발 서버가 실행 중이었다.

```text
http://127.0.0.1:3000
```

다시 실행:

```bash
pnpm dev
```

## 다음 작업 후보

1. 실제 제작 사례 5~10개 입력
2. 이미지 URL 정리 및 alt text 보강
3. 공개 승인 메모 운영 규칙 정리
4. 포트폴리오 SEO 제목/설명 실데이터 기준 개선
5. 운영 DB 전환 검토
6. 관리자 접근 URL/비밀번호 운영 정책 정리
7. 고객사 공개 승인 체크리스트를 내부 Notion 운영 문서와 연결
8. Phase 3 자동 견적 엔진 설계

## 남은 한계

- 이미지 업로드/스토리지는 구현하지 않았다.
- 외부 AI 콘텐츠 생성은 구현하지 않았다.
- KakaoTalk API 연동은 구현하지 않았다.
- 결제는 구현하지 않았다.
- 풀 CMS는 구현하지 않았다.
- 자동 견적 엔진은 구현하지 않았다.
- 운영 DB는 SQLite 유지 여부를 검토해야 한다.
