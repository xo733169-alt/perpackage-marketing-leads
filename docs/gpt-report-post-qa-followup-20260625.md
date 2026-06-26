# PerPackage Marketing Leads 운영 공개 전 후속 QA 보고서

작성일: 2026-06-26  
프로젝트: `perpackage-marketing-leads`  
작업 성격: 새 기능 개발이 아닌 운영 공개 전 최종 확인 및 최소 보고서 갱신

## 1. 작업 목적

이번 작업은 Vercel + Supabase Postgres + Naver Object Storage 전환 후 운영 공개 전에 남은 핵심 흐름을 확인하는 것이다.

확인 대상은 제작 사례 저장/노출, Naver Object Storage 이미지 URL, 견적 룰/견적 계산기, 리드 상세, CSV export, 공개 접근 설정이다. DB schema 변경, 새 migration 생성, 결제/세금계산서/전자계약/고객 파일 업로드 기능 추가는 하지 않았다.

Notion 확인은 시도했다. 변경 기록 DB의 직접 query는 Notion 플랜 제한으로 실패했고, workspace search 기준으로 2026-06-25 일일 변경 기록이 검색됐다. 현재 첨부 지시와 충돌하는 최신 변경 기록은 확인되지 않았다.

## 2. 확인한 배포 URL

첨부 지시문에 적힌 배포 URL:

```txt
https://perpackage-marketing-leads-hwdfxdey.vercel.app
```

실제 HTTP 확인 결과 위 URL은 주요 경로가 모두 404였다.

```txt
/                 404
/access           404
/portfolio        404
/admin/login      404
/admin/lead       404
/api/health       404
```

따라서 위 hash 배포 URL은 현재 유효한 확인 대상이 아닌 것으로 판단된다.

추가로 확인한 프로젝트 기본 alias:

```txt
https://perpackage-marketing-leads.vercel.app
```

기본 alias 응답:

```txt
/                 307
/access           200
/portfolio        307
/admin/login      307
/api/health       401
```

해석:

- 프로젝트 기본 alias는 살아 있다.
- `SITE_ACCESS_ENABLED=true` 상태로 보이며 `/access` 접근 보호가 작동한다.
- 현재 로컬 `.env.local`의 `SITE_ACCESS_PASSWORD` 값은 비어 있어 접근 보호를 통과하지 못했다.
- 관리자 로그인과 내부 화면 확인은 `/access` 통과 후 다시 진행해야 한다.

Vercel 연결 도구로 최신 배포 조회도 시도했지만, 현재 Codex Vercel 연결이 `peerl` team scope 권한을 갖고 있지 않아 403으로 실패했다.

## 3. 제작 사례 저장 테스트 결과

실제 원격 저장 테스트는 완료하지 못했다.

사유:

- 기본 alias는 접근 가능하지만 `/access` 보호가 켜져 있다.
- 현재 로컬 환경에는 `SITE_ACCESS_PASSWORD` 값이 없어 `/access`를 통과할 수 없다.
- 첨부된 hash 배포 URL은 전체 404라 테스트 대상이 아니다.

코드 기준 저장 흐름은 확인했다.

1. `/admin/portfolio/new`에서 제작 사례 정보를 입력한다.
2. 대표 이미지를 업로드하면 `POST /api/admin/uploads/portfolio`가 호출된다.
3. 이미지는 WebP로 최적화된다.
4. storage adapter가 대표 이미지와 썸네일을 저장한다.
5. 업로드 API 응답의 `url`이 `PortfolioCaseForm`의 `mainImageUrl`에 들어간다.
6. 제작 사례 저장 버튼을 눌러야 `POST /api/admin/portfolio`가 호출된다.
7. `PortfolioCase.mainImageUrl`, `slug`, `status`, `publicApprovalConfirmed`가 DB에 저장된다.

확인한 코드:

- `src/app/api/admin/uploads/portfolio/route.ts`
- `src/components/PortfolioCaseForm.tsx`
- `src/app/api/admin/portfolio/route.ts`
- `src/lib/portfolio-schema.ts`

주의:

이미지 업로드 성공은 제작 사례 저장 완료가 아니다. 업로드 후 제작 사례 저장 버튼을 눌러야 `PortfolioCase` row가 생성된다.

## 4. `/admin/portfolio` 목록 확인 결과

실제 원격 화면 확인은 `/access` 보호 때문에 완료하지 못했다.

코드 기준 확인:

- 관리자 제작 사례 목록 경로는 `/admin/portfolio`이다.
- 관리자 인증이 없으면 `/admin/login`으로 redirect된다.
- 목록은 `PortfolioCase`를 최신순으로 조회한다.
- 상태, 공개 승인, SEO 상태, 업종, 박스 종류, 패키지 구조, 제작 목적, 대표 이미지 여부를 표시한다.
- 공개 조건을 만족하는 경우에만 `공개 페이지 보기` 링크가 표시된다.

확인한 코드:

- `src/app/admin/portfolio/page.tsx`
- `src/lib/portfolio-utils.ts`

남은 실제 확인:

- `/access` 통과
- `/admin/login` 로그인
- `/admin/portfolio`에서 최근 등록 사례 표시 확인
- 대표 이미지가 `있음`으로 표시되는지 확인
- 상태가 `PUBLISHED`, 공개 승인이 `승인됨`인지 확인

## 5. `/portfolio` 고객 화면 표시 결과

첨부된 hash 배포 URL에서는 `/portfolio`가 404였다.

기본 alias에서는 `/portfolio`가 307 redirect로 `/access` 보호에 걸렸다. 접근 보호 통과 전에는 고객 화면 표시 여부를 확인할 수 없다.

코드 기준 고객 화면 노출 조건:

```txt
status = PUBLISHED
publicApprovalConfirmed = true
```

`/portfolio`는 `buildPortfolioCaseWhere(searchParams, { publicOnly: true })`를 사용하며, `PUBLIC_PORTFOLIO_WHERE`는 위 두 조건으로 정의되어 있다.

이미지는 `PortfolioCase.mainImageUrl`을 `PortfolioCaseImage`에 전달해 표시한다.

확인한 코드:

- `src/app/portfolio/page.tsx`
- `src/components/PortfolioCaseImage.tsx`
- `src/lib/portfolio-utils.ts`

남은 실제 확인:

- `/access` 통과 후 `/portfolio` 접속
- 공개 조건을 만족하는 사례가 목록에 표시되는지 확인
- 대표 이미지가 깨지지 않는지 확인
- 필터/정렬 후에도 목록이 정상 표시되는지 확인

## 6. `/portfolio/{slug}` 상세 페이지 확인 결과

실제 원격 상세 페이지 확인은 완료하지 못했다.

사유:

- 공개 사례 slug를 원격 관리자 목록에서 확인할 수 없었다.
- 기본 alias는 접근 보호가 켜져 있고, 로컬에 site access password가 없다.

코드 기준:

- 상세 페이지 경로는 `/portfolio/[slug]`이다.
- `getPublicCase(slug)`가 `PUBLIC_PORTFOLIO_WHERE`와 slug를 함께 조회한다.
- 조건을 만족하지 않으면 `notFound()`가 실행된다.
- 상세 대표 이미지는 `PortfolioCase.mainImageUrl`을 사용한다.
- Open Graph 이미지도 `mainImageUrl`을 사용한다.

확인한 코드:

- `src/app/portfolio/[slug]/page.tsx`
- `src/lib/portfolio-utils.ts`

남은 실제 확인:

- `/admin/portfolio`에서 공개 사례 slug 확인
- `/portfolio/{slug}` 직접 접속
- 404 없이 열리는지 확인
- 대표 이미지와 상세 내용 표시 확인

## 7. Naver Object Storage 이미지 URL 확인 결과

실제 원격 DB의 `mainImageUrl` 값은 확인하지 못했다.

코드 기준 Naver Object Storage 저장 구조:

- `PORTFOLIO_STORAGE_PROVIDER=naver-object-storage` 또는 `naver`일 때 Naver adapter를 사용한다.
- 저장 key는 `portfolio/{filename}` 형식이다.
- 대표 이미지와 썸네일은 아래 형태로 저장된다.

```txt
portfolio/portfolio-...webp
portfolio/portfolio-...-thumb.webp
```

Naver public URL 생성 방식:

- `NAVER_OBJECT_STORAGE_PUBLIC_BASE_URL` 뒤에 object key를 붙인다.
- DB에 저장되는 값은 업로드 API 응답의 `url`이고, 이 값이 `mainImageUrl`로 저장된다.

확인한 코드:

- `src/lib/storage/portfolio-storage.ts`
- `src/app/api/admin/uploads/portfolio/route.ts`
- `src/components/PortfolioCaseForm.tsx`

주의:

- `thumbnailUrl`은 업로드 API 응답에 포함되지만 현재 DB에는 저장하지 않는다.
- 고객 화면은 `PortfolioCase.mainImageUrl`만 사용한다.
- 로컬 `.env.local`에는 `NAVER_OBJECT_STORAGE_PUBLIC_BASE_URL` 값이 없었다. 다만 실제 Vercel 환경변수는 Vercel 권한 부족으로 확인하지 못했다.

## 8. QuoteRule 데이터 확인 결과

실제 원격 `QuoteRule` 데이터 존재 여부는 확인하지 못했다.

사유:

- 기본 alias는 `/access` 보호가 켜져 있고, 현재 로컬에 site access password가 없다.
- Supabase 직접 조회는 실행하지 않았다.
- DB schema 변경과 migration 생성은 금지되어 있으므로 데이터 보정 작업도 하지 않았다.

코드 기준:

- `/admin/quote-rules`는 `prisma.quoteRule.findMany()`로 DB의 견적 룰을 조회한다.
- 조건에 맞는 데이터가 없으면 “조건에 맞는 견적 룰이 없습니다.” 상태가 표시된다.
- seed 스크립트는 `pnpm quote-rules:seed`로 존재하지만 이번 작업에서 실행하지 않았다.

확인한 코드:

- `src/app/admin/quote-rules/page.tsx`
- `scripts/seed-quote-rules.ts` 존재는 `package.json` script로 확인

남은 실제 확인:

- `/access` 통과 후 `/admin/quote-rules` 접속
- 운영 DB에 `QuoteRule` row가 있는지 확인
- 운영 수치를 임의로 넣지 말고 seed 실행 여부를 별도 결정

## 9. `/admin/quote-calculator` 확인 결과

실제 원격 계산 테스트는 완료하지 못했다.

코드 기준:

- `/admin/quote-calculator`는 관리자 인증이 필요하다.
- 활성화된 `QuoteRule`이 있으면 DB 룰을 사용한다.
- 활성화된 DB 룰이 없으면 `DEFAULT_QUOTE_RULES` fallback을 사용한다.
- 계산기 안내 문구에는 내부 도구이며 고객에게 확정 견적으로 전달하면 안 된다는 문구가 있다.

확인한 코드:

- `src/app/admin/quote-calculator/page.tsx`
- `src/lib/default-quote-rules.ts`
- `src/components/QuoteCalculatorClient.tsx`

남은 실제 확인:

- `/access` 통과
- 관리자 로그인
- 단상자/수량/사이즈 등 간단한 입력으로 계산 결과 확인
- 운영용 견적 룰이 비어 있을 경우 fallback 결과와 실제 상담 기준 차이 검토

## 10. `/admin/leads` 리드 상세 확인 결과

실제 원격 리드 목록/상세 확인은 완료하지 못했다.

코드 기준:

- 정상 리드 목록 경로는 `/admin/leads`이다.
- `/admin/lead`는 존재하지 않는 경로다.
- 목록은 고객명, 연락처, 유입, 제작 사례 유입, 업종, 박스 종류, 패키지 정보, 상담 준비도, 제작 수량, 리드 점수, 상담 상태, 후속 연락일을 표시한다.
- 상세 페이지는 고객 기본 정보, 제작 정보, 패키지 제작 정보, 제작 준비도, 상담 정리, 참고 자료, 연결 제작 사례, 개인정보 동의, 유입 정보, 견적안, 상담 이력 등을 표시한다.

확인한 코드:

- `src/app/admin/leads/page.tsx`
- `src/app/admin/leads/[id]/page.tsx`
- `src/lib/admin-leads.ts`

남은 실제 확인:

- `/admin/leads`에서 최근 테스트 문의가 보이는지 확인
- 리드 상세 페이지가 열리는지 확인
- 고객명, 연락처, 문의 내용, 패키지 제작 정보, 제작 준비도 값이 한글 깨짐 없이 표시되는지 확인

## 11. CSV export 확인 결과

실제 CSV 다운로드는 완료하지 못했다.

사유:

- 기본 alias의 `/api/health`도 401로 막히는 상태라 `/api/admin/leads/export`는 접근 보호와 관리자 인증을 모두 통과해야 한다.
- 현재 site access password가 없어 원격 export API까지 도달하지 못했다.

코드 기준:

- CSV export API는 `/api/admin/leads/export`이다.
- 관리자 인증이 없으면 401을 반환한다.
- CSV는 UTF-8 BOM(`\uFEFF`)을 붙여 반환한다.
- 각 값은 double quote escape 처리된다.
- 패키지 문의 필드가 CSV 뒤쪽 컬럼에 포함된다.

확인한 코드:

- `src/app/api/admin/leads/export/route.ts`
- `src/lib/admin-leads.ts`

남은 실제 확인:

- `/access` 통과
- 관리자 로그인
- `/admin/leads`에서 CSV 다운로드
- Excel 또는 Google Sheets에서 한글 표시 확인
- 패키지 종류, 수량, 후가공, 체크리스트 필드 포함 확인

## 12. `SITE_ACCESS_ENABLED` / `NEXT_PUBLIC_SITE_URL` 확인 결과

원격 기본 alias 기준:

- `/portfolio`가 307 redirect
- `/admin/login`이 307 redirect
- `/api/health`가 401
- `/access`는 200

따라서 현재 원격 배포는 `SITE_ACCESS_ENABLED=true`로 동작 중인 것으로 판단된다.

로컬 `.env.local` 기준:

```txt
SITE_ACCESS_ENABLED=false
SITE_ACCESS_PASSWORD=empty
NEXT_PUBLIC_SITE_URL_matches_alias=false
PORTFOLIO_STORAGE_PROVIDER=local
```

해석:

- 로컬 `.env.local`과 현재 원격 배포 환경변수는 서로 다르다.
- 원격 Vercel 환경변수는 Vercel team scope 권한 문제로 직접 확인하지 못했다.
- 최종 운영 공개 전에는 Vercel Dashboard에서 `SITE_ACCESS_ENABLED`, `SITE_ACCESS_PASSWORD`, `NEXT_PUBLIC_SITE_URL`, `PORTFOLIO_STORAGE_PROVIDER`, Naver Object Storage 환경변수를 직접 확인해야 한다.

운영 공개 판단 기준:

```txt
Preview / 내부 테스트: SITE_ACCESS_ENABLED=true
외부 고객 공개: SITE_ACCESS_ENABLED=false 또는 공개 범위 재검토
```

운영 공개 여부는 사용자가 직접 결정해야 한다.

## 13. 발견한 문제

1. 첨부 지시문의 hash 배포 URL `https://perpackage-marketing-leads-hwdfxdey.vercel.app`는 현재 주요 경로가 모두 404다.
2. 프로젝트 기본 alias `https://perpackage-marketing-leads.vercel.app`는 살아 있지만 `/access` 보호가 켜져 있다.
3. 현재 로컬 `.env.local`에는 `SITE_ACCESS_PASSWORD` 값이 없어 원격 `/access`를 통과할 수 없다.
4. Vercel 연결 도구는 `peerl` team scope 권한 부족으로 최신 배포 목록과 원격 환경변수를 확인하지 못했다.
5. `pnpm`, `node`, `corepack`이 현재 Codex 셸 PATH에 없어 `pnpm deployment:check`, `pnpm test`, `pnpm build`를 실행하지 못했다.
6. 로컬 `.env.local`의 `NEXT_PUBLIC_SITE_URL`은 프로젝트 기본 alias와 일치하지 않는다.
7. 로컬 `.env.local`의 `PORTFOLIO_STORAGE_PROVIDER`는 `local`이다. 원격이 Naver Object Storage로 설정되어 있는지는 Vercel Dashboard에서 확인해야 한다.

## 14. 수정한 파일 목록

이번 작업에서 기능 코드는 수정하지 않았다.

수정한 파일:

```txt
docs/gpt-report-post-qa-followup-20260625.md
```

수정하지 않은 항목:

- DB schema 변경 없음
- 새 migration 생성 없음
- 결제 기능 추가 없음
- 세금계산서 기능 추가 없음
- 전자계약 기능 추가 없음
- 고객 파일 업로드 기능 추가 없음
- PDF/AI/SVG/DXF/ZIP 업로드 기능 추가 없음
- CRM/견적/포트폴리오 대규모 재작성 없음
- 운영용 견적 룰 수치 임의 추가 없음
- 실제 DB password, API key, Storage secret key 출력 없음

## 15. 실행한 명령과 결과

로컬/코드 확인:

```txt
git status --short
Get-Content package.json
Test-Path docs/gpt-report-post-qa-followup-20260625.md
rg --files src prisma docs reports
Get-Content docs/gpt-report-post-qa-followup-20260625.md
Get-Content src/lib/deployment-env.ts
Get-Content src/middleware.ts
Get-Content src/lib/site-access.ts
Get-Content src/lib/auth.ts
Get-Content src/app/api/admin/login/route.ts
Get-Content src/app/api/site-access/login/route.ts
Get-Content src/app/api/admin/leads/export/route.ts
Get-Content src/app/admin/portfolio/page.tsx
Get-Content src/app/portfolio/page.tsx
Get-Content src/app/portfolio/[slug]/page.tsx
Get-Content src/app/api/admin/uploads/portfolio/route.ts
Get-Content src/app/api/admin/portfolio/route.ts
Get-Content src/app/api/admin/portfolio/[id]/route.ts
Get-Content src/app/admin/quote-rules/page.tsx
Get-Content src/app/admin/quote-calculator/page.tsx
Get-Content src/app/admin/leads/page.tsx
Get-Content src/app/admin/leads/[id]/page.tsx
Get-Content src/lib/portfolio-utils.ts
Get-Content src/lib/storage/portfolio-storage.ts
```

원격 HTTP 확인:

```txt
https://perpackage-marketing-leads-hwdfxdey.vercel.app/               404
https://perpackage-marketing-leads-hwdfxdey.vercel.app/access         404
https://perpackage-marketing-leads-hwdfxdey.vercel.app/portfolio      404
https://perpackage-marketing-leads-hwdfxdey.vercel.app/admin/login    404
https://perpackage-marketing-leads-hwdfxdey.vercel.app/admin/lead     404
https://perpackage-marketing-leads-hwdfxdey.vercel.app/api/health     404
```

```txt
https://perpackage-marketing-leads.vercel.app                         307
https://perpackage-marketing-leads.vercel.app/access                  200
https://perpackage-marketing-leads.vercel.app/portfolio               307
https://perpackage-marketing-leads.vercel.app/admin/login             307
https://perpackage-marketing-leads.vercel.app/api/health              401
```

실행 실패:

```txt
pnpm deployment:check
```

결과:

```txt
pnpm: command not found
```

추가 확인:

```txt
node --version
corepack --version
```

결과:

```txt
node: command not found
corepack: command not found
```

Vercel 도구 확인:

```txt
list deployments for project prj_g2I3OO1YIdLJRDyMfhGsWUba6fy7
```

결과:

```txt
403 Forbidden
Not authorized: Trying to access resource under scope "peerl".
```

Notion 확인:

```txt
Notion data source query
```

결과:

```txt
Business plan or higher with Notion AI required.
```

```txt
Notion workspace search
```

결과:

```txt
2026-06-25 일일 변경 기록 검색됨.
현재 첨부 지시와 충돌하는 내용은 확인되지 않음.
```

## 16. 남은 위험 요소

1. 실제 최신 Production Deployment URL을 확인하지 않으면 잘못된 URL 기준으로 QA를 반복할 수 있다.
2. `SITE_ACCESS_ENABLED=true` 상태에서는 외부 고객이 `/access` 비밀번호 없이 사이트를 볼 수 없다.
3. 제작 사례 공개 조건이 맞지 않으면 관리자에는 보여도 고객 화면에는 보이지 않는다.
4. `mainImageUrl`이 비어 있거나 Naver public URL이 아니면 고객 화면 이미지가 깨질 수 있다.
5. Naver Object Storage bucket/object public 접근 정책이 맞지 않으면 이미지 URL이 직접 열리지 않을 수 있다.
6. `QuoteRule` 운영 데이터가 비어 있으면 계산기는 fallback으로 열리더라도 실제 상담 기준과 다를 수 있다.
7. CSV는 코드상 BOM/escape 처리가 되어 있으나 실제 Excel 확인은 아직 필요하다.
8. `NEXT_PUBLIC_SITE_URL`이 최종 도메인과 다르면 canonical URL, 공유 링크, 알림 링크가 틀어질 수 있다.

## 17. 다음 작업 제안

운영 공개 전 권장 순서:

1. Vercel Dashboard에서 최신 Production Deployment URL 확인
2. `SITE_ACCESS_PASSWORD` 확인 또는 임시로 접근 보호 해제 여부 결정
3. `/access` 통과 후 `/admin/login` 로그인
4. `/admin/portfolio/new`에서 테스트 제작 사례 저장
5. `/admin/portfolio` 목록에서 저장된 사례 확인
6. 해당 사례의 `status=PUBLISHED`, `publicApprovalConfirmed=true` 확인
7. `/portfolio`에서 목록 표시 확인
8. `/portfolio/{slug}`에서 상세 페이지와 이미지 표시 확인
9. `mainImageUrl`을 브라우저에서 직접 열어 Naver Object Storage public 접근 확인
10. `/admin/quote-rules`에서 운영 룰 데이터 존재 여부 확인
11. `/admin/quote-calculator`에서 간단 계산 테스트
12. `/admin/leads`에서 최근 문의와 상세 페이지 확인
13. CSV export 다운로드 후 Excel/Google Sheets 한글 표시 확인
14. 외부 고객 공개 전 `SITE_ACCESS_ENABLED` 값을 사용자가 최종 결정
15. 최종 도메인 확정 후 `NEXT_PUBLIC_SITE_URL` 재설정 및 redeploy

