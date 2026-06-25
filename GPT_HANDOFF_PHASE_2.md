# GPT Handoff - PerPackage Marketing Lead Management System Phase 2

이 문서는 GPT 또는 다른 개발 에이전트에게 현재 프로젝트 상태를 전달하기 위한 인수인계 문서입니다.

## 프로젝트 기본 정보

- 프로젝트명: PerPackage Marketing Lead Management System
- 회사명: 페르패키지
- 사업: 맞춤 패키지 박스 제작 업체
- 위치: 서울 중구 을지로
- 프로젝트 경로: `C:\Users\inh78\OneDrive\문서\홈페이지 개발\perpackage-marketing-leads`
- 현재 완료 단계: Phase 2

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
- 개인정보, 고객사명, 제품 민감 정보는 공개 전에 반드시 확인한다.
- 고객사명은 공개 허용된 경우에만 공개 페이지에 노출한다.
- Phase 2 범위에서는 이미지 업로드, 외부 AI, KakaoTalk API, 결제, 풀 CMS를 구현하지 않는다.

## 현재 구현 완료 기능

### Phase 1 / 1.5 기존 기능

- 공개 랜딩 페이지: `/`
- 견적 문의 폼
- 리드 DB 저장
- honeypot 스팸 방어
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

### Phase 2 신규 기능

- 제작 사례 포트폴리오 모델 추가
- 관리자 제작 사례 목록: `/admin/portfolio`
- 관리자 제작 사례 등록: `/admin/portfolio/new`
- 관리자 제작 사례 편집: `/admin/portfolio/[id]/edit`
- 공개 제작 사례 목록: `/portfolio`
- 공개 제작 사례 상세: `/portfolio/[slug]`
- 공개 상태인 제작 사례만 public page에 노출
- `DRAFT`, `ARCHIVED` 제작 사례는 public page에서 404 처리
- 랜딩 페이지에 대표 제작 사례 섹션 추가
- 제작 사례 CTA에서 견적 폼으로 출처 정보 전달
- 견적 폼이 `sourceCaseSlug`, `sourceCaseTitle` 저장
- 관리자 리드 상세에 연결 제작 사례 표시
- CSV export에 연결 제작 사례 필드 추가
- 제작 사례 템플릿 기반 콘텐츠 생성 helper 추가
- SEO metadata와 structured data 추가
- sitemap route 추가: `/sitemap.xml`

## 새 데이터 모델

### PortfolioCase

Prisma model: `PortfolioCase`

주요 필드:

- `id`
- `title`
- `slug`
- `status`
- `featured`
- `sortOrder`
- `industry`
- `boxType`
- `productName`
- `clientName`
- `isClientNamePublic`
- `quantityRange`
- `widthMm`
- `depthMm`
- `heightMm`
- `paperType`
- `boardThickness`
- `printOption`
- `finishingOptions`
- `mainImageUrl`
- `imageUrls`
- `shortDescription`
- `projectOverview`
- `productionPoint`
- `specificationSummary`
- `seoTitle`
- `seoDescription`
- `tags`
- `publishedAt`
- `createdAt`
- `updatedAt`

상태값:

- `DRAFT`: 임시저장
- `PUBLISHED`: 공개
- `ARCHIVED`: 보관

### Lead 신규 필드

Lead 모델에 다음 필드가 추가됐다.

- `sourceCaseSlug`
- `sourceCaseTitle`

이 필드는 제작 사례 상세 페이지에서 견적 문의로 전환된 리드를 추적하기 위한 값이다.

## 마이그레이션

생성 및 적용된 마이그레이션:

```text
prisma/migrations/20260620045654_add_portfolio_cases/migration.sql
```

다른 환경에서 적용할 때:

```bash
pnpm db:migrate
```

Prisma Client 재생성:

```bash
pnpm exec prisma generate
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

주의:

- 실제 `ADMIN_PASSWORD`는 커밋하지 않는다.
- `NEXT_PUBLIC_SITE_URL`은 sitemap과 admin URL 생성에 사용된다.
- `LEAD_NOTIFICATION_WEBHOOK_URL`은 선택 기능이다.

## 주요 파일

### Prisma

- `prisma/schema.prisma`
- `prisma/migrations/20260620045654_add_portfolio_cases/migration.sql`

### 포트폴리오 로직

- `src/lib/portfolio-content.ts`
- `src/lib/portfolio-options.ts`
- `src/lib/portfolio-schema.ts`
- `src/lib/portfolio-utils.ts`

### 포트폴리오 UI

- `src/components/PortfolioCaseForm.tsx`
- `src/components/PortfolioCaseImage.tsx`
- `src/app/admin/portfolio/page.tsx`
- `src/app/admin/portfolio/new/page.tsx`
- `src/app/admin/portfolio/[id]/edit/page.tsx`
- `src/app/portfolio/page.tsx`
- `src/app/portfolio/[slug]/page.tsx`

### API

- `src/app/api/admin/portfolio/route.ts`
- `src/app/api/admin/portfolio/[id]/route.ts`
- `src/app/api/leads/route.ts`
- `src/app/api/admin/leads/export/route.ts`

### 리드 연동

- `src/components/QuoteInquiryForm.tsx`
- `src/app/admin/leads/page.tsx`
- `src/app/admin/leads/[id]/page.tsx`
- `src/lib/lead-schema.ts`

### SEO

- `src/app/sitemap.ts`
- `src/app/portfolio/page.tsx`
- `src/app/portfolio/[slug]/page.tsx`

### 문서

- `README.md`
- `.env.example`
- `GPT_HANDOFF_PHASE_2.md`

## 포트폴리오 생성 흐름

1. `/admin/login`에서 로그인한다.
2. `/admin/portfolio`로 이동한다.
3. `제작 사례 등록`을 클릭한다.
4. 필수값을 입력한다.
   - 제목
   - 슬러그
   - 상태
   - 업종
   - 박스 종류
   - 짧은 설명
5. 필요하면 `슬러그 자동 생성`을 사용한다.
6. 필요하면 `사양 기반 초안 생성`을 사용한다.
7. `저장` 또는 `저장 후 공개`를 클릭한다.

## 공개 페이지 노출 규칙

- `PUBLISHED`만 `/portfolio` 목록과 `/portfolio/[slug]` 상세에 노출된다.
- `DRAFT`, `ARCHIVED`는 public detail page에서 `notFound()` 처리된다.
- 고객사명은 `isClientNamePublic=true`이고 `clientName`이 있을 때만 공개된다.
- 공개 허용이 없으면 `브랜드 비공개`로 표시한다.

## 포트폴리오 CTA 추적 흐름

제작 사례 상세 페이지의 CTA:

```text
비슷한 패키지 견적 문의하기
```

이 버튼은 랜딩 페이지 견적 폼으로 이동하면서 다음 query parameter를 전달한다.

- `sourceCaseSlug`
- `sourceCaseTitle`
- `industry`
- `boxType`
- `utm_source=portfolio`
- `utm_medium=case_detail`
- `utm_campaign=portfolio_case`

견적 폼 동작:

- `industry`와 `boxType`이 기존 옵션과 일치하면 미리 선택한다.
- 사용자가 직접 바꾸면 수동 선택을 우선한다.
- `sourceCaseSlug`, `sourceCaseTitle`은 hidden field로 저장한다.
- 저장 후 관리자 리드 상세의 `연결 제작 사례` 섹션에서 볼 수 있다.
- CSV에도 포함된다.

## SEO 동작

### `/portfolio`

Title:

```text
제작 사례 | 페르패키지
```

Description:

```text
싸바리박스, 자석박스, 상하짝박스, 서랍형박스 등 페르패키지의 맞춤 패키지 제작 사례를 확인해보세요.
```

### `/portfolio/[slug]`

우선순위:

1. `seoTitle`
2. fallback: `{title} | 페르패키지`

Description 우선순위:

1. `seoDescription`
2. fallback: `shortDescription`

추가:

- Open Graph metadata
- BreadcrumbList structured data
- CreativeWork structured data

### sitemap

`src/app/sitemap.ts`에서 생성한다.

포함 페이지:

- `/`
- `/privacy`
- `/portfolio`
- 공개 상태인 `/portfolio/[slug]`

`NEXT_PUBLIC_SITE_URL`이 없으면 `http://127.0.0.1:3000`을 fallback으로 사용한다.

## 테스트 파일

추가/수정된 테스트:

- `src/test/portfolio-content.test.ts`
- `src/test/portfolio-utils.test.ts`
- `src/test/portfolio-schema.test.ts`
- `src/test/lead-schema.test.ts`

검증 내용:

- 포트폴리오 slug 생성
- 포트폴리오 콘텐츠 생성
- 공개 상태 helper
- 고객사명 공개/비공개 처리
- CTA URL source tracking
- list field serialize/parse
- 포트폴리오 입력 schema
- 리드 sourceCase 필드 validation

## 검증 완료 결과

실행 완료:

```bash
pnpm lint
pnpm test
pnpm build
```

결과:

- `pnpm lint`: 통과
- `pnpm test`: 통과
  - 8개 test file
  - 23개 test
- `pnpm build`: 통과

실제 흐름 검증:

- 관리자 로그인 성공
- 관리자 API로 포트폴리오 생성 성공
- `DRAFT` 상세 public 접근 404 확인
- `PUBLISHED` 전환 후 public detail 200 확인
- `/portfolio` 목록 노출 확인
- 제작 사례 CTA query URL 접근 확인
- 리드 제출 후 `sourceCaseSlug`, `sourceCaseTitle` 저장 확인
- 관리자 리드 상세 접근 200 확인
- `ARCHIVED` 전환 후 public detail 404 확인
- sitemap에 공개 사례 포함 확인
- CSV에 연결 제작 사례 필드와 값 포함 확인
- 검증용 테스트 데이터 삭제 확인

## 현재 dev server

마지막 작업 시점에 개발 서버가 다음 주소에서 실행 중이었다.

```text
http://127.0.0.1:3000
```

필요하면 다시 실행:

```bash
pnpm dev
```

## 남은 한계 및 TODO

- 이미지 업로드/스토리지는 구현하지 않았다.
- 이미지 URL 또는 placeholder UI를 사용한다.
- 외부 AI 콘텐츠 생성은 구현하지 않았다.
- 콘텐츠 생성 helper는 deterministic template 기반이다.
- KakaoTalk API 연동은 구현하지 않았다.
- 풀 CMS는 구현하지 않았다.
- 결제는 구현하지 않았다.
- 자동 견적 엔진은 구현하지 않았다.
- 운영 DB는 SQLite 유지 여부를 검토해야 한다.
- 실제 운영 전 개인정보 처리방침과 고객사명 공개 승인 프로세스를 확인해야 한다.

## 다음 단계 제안

Phase 2 이후 작업 후보:

1. 실제 제작 사례 데이터 5~10개 입력
2. 포트폴리오 이미지 URL 정리
3. 제작 사례 SEO 제목/설명 다듬기
4. 포트폴리오 목록 필터 UX 개선
5. 운영 DB 전환 검토
6. 관리자 접근 URL/비밀번호 운영 정책 정리
7. 고객사 공개 승인 체크리스트 도입
8. Phase 3 자동 견적 엔진 설계
