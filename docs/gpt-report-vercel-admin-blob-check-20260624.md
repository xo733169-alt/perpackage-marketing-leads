# GPT 보고 파일: Vercel 관리자 접속 및 Blob 업로드 점검

작성일: 2026-06-24  
프로젝트: PerPackage Marketing Lead Management System  
배포 URL: https://perpackage-marketing-leads.vercel.app

## 1. 작업 목적

이번 보고는 새 기능 개발이 아니라 Vercel 배포 환경, 관리자 접속 경로, 제작 사례 대표 이미지 Vercel Blob 업로드 테스트 절차를 다음 GPT가 바로 이해할 수 있도록 정리한 것이다.

현재 프로젝트는 Next.js App Router, TypeScript, Tailwind CSS, Prisma, SQLite, Zod, Vitest 기반이며 Phase 1~14까지 완료되어 있다.

최근 Phase 14에서 제작 사례 대표 이미지 업로드가 storage adapter 구조로 정리되었고, `PORTFOLIO_STORAGE_PROVIDER=vercel-blob`일 때 Vercel Blob에 저장되도록 구현되어 있다.

## 2. 현재 핵심 상태

- 관리자 로그인 URL: `/admin/login`
- 사이트 접근 보호 URL: `/access`
- 제작 사례 목록: `/admin/portfolio`
- 제작 사례 신규 등록: `/admin/portfolio/new`
- 제작 사례 수정: `/admin/portfolio/[id]/edit`
- 업로드 API: `POST /api/admin/uploads/portfolio`
- storage adapter: `src/lib/storage/portfolio-storage.ts`
- local provider 저장 위치: `public/uploads/portfolio`
- Vercel Blob provider 환경값: `PORTFOLIO_STORAGE_PROVIDER=vercel-blob`
- Blob token 환경변수: `BLOB_READ_WRITE_TOKEN`
- DB 저장 필드: `PortfolioCase.mainImageUrl`
- 썸네일 URL은 API 응답에는 포함되지만 DB에는 저장하지 않는다.

## 3. 현재 배포 URL 응답 확인 결과

2026-06-24 기준으로 아래 URL을 확인했다.

```txt
https://perpackage-marketing-leads.vercel.app/access
-> 200

https://perpackage-marketing-leads.vercel.app/admin/login
-> 307
-> /access?next=%2Fadmin%2Flogin

https://perpackage-marketing-leads.vercel.app/admin/portfolio/new
-> 307
-> /access?next=%2Fadmin%2Fportfolio%2Fnew

https://perpackage-marketing-leads.vercel.app/api/health
-> 401
-> {"error":"접근 권한이 필요합니다."}
```

이 결과는 사이트 접근 보호가 켜져 있다는 뜻이다. 관리자 화면도 먼저 `/access`를 통과해야 한다.

## 4. 관리자 접속 순서

사용자가 실제 Vercel에서 테스트할 때는 아래 순서로 들어가야 한다.

1. `https://perpackage-marketing-leads.vercel.app/access`
2. 사이트 접근 비밀번호 입력
3. `https://perpackage-marketing-leads.vercel.app/admin/login`
4. 관리자 비밀번호 입력
5. 로그인 성공 후 `/admin/leads` 이동 확인
6. `https://perpackage-marketing-leads.vercel.app/admin/portfolio/new` 접속

주의:

- `/admin` 루트 페이지는 현재 없다.
- 관리자 진입은 `/admin/login` 기준이다.
- `/access` 통과 후에도 `/admin/login`에서 별도 관리자 로그인이 필요하다.

## 5. Vercel 환경변수 확인 항목

Vercel Dashboard에서 아래 위치로 이동한다.

```txt
Vercel
-> perpackage-marketing-leads
-> Settings
-> Environment Variables
```

Production 환경에 아래 값이 있는지 확인한다.

```env
DATABASE_URL=
ADMIN_PASSWORD=
NEXT_PUBLIC_SITE_URL=https://perpackage-marketing-leads.vercel.app
PORTFOLIO_STORAGE_PROVIDER=vercel-blob
BLOB_READ_WRITE_TOKEN=
SITE_ACCESS_ENABLED=true
SITE_ACCESS_PASSWORD=
SITE_ACCESS_SECRET=
```

중요 확인 포인트:

- `PORTFOLIO_STORAGE_PROVIDER` 값이 정확히 `vercel-blob`인지 확인한다.
- `BLOB_READ_WRITE_TOKEN`이 Production 환경에 들어가 있는지 확인한다.
- Preview 배포를 테스트 중이면 Preview 환경에도 같은 값이 필요하다.
- 환경변수를 추가하거나 수정한 뒤에는 반드시 Redeploy해야 한다.
- 실제 token 값은 코드, 문서, 테스트에 절대 적지 않는다.

## 6. Vercel Blob 업로드 테스트 순서

1. Vercel Deployments에서 최신 Production 배포가 `Ready`인지 확인한다.
2. `/access`에서 사이트 접근 비밀번호를 입력한다.
3. `/admin/login`에서 관리자 비밀번호를 입력한다.
4. `/admin/portfolio/new`로 이동한다.
5. 제작 사례 필수 정보를 입력한다.
6. JPG, PNG, WebP 중 하나의 대표 이미지를 업로드한다.
7. 업로드 완료 메시지를 확인한다.
8. 대표 이미지 URL 입력칸이 아래 형태인지 확인한다.

```txt
https://...vercel-storage.com/portfolio/portfolio-날짜-uuid.webp
```

9. 제작 사례 저장 버튼을 누른다.
10. `/admin/portfolio`에서 저장된 사례를 확인한다.
11. `/portfolio` 또는 `/portfolio/[slug]`에서 이미지가 표시되는지 확인한다.
12. Vercel Dashboard > Storage > Blob Store에서 아래 파일이 생성됐는지 확인한다.

```txt
portfolio/portfolio-날짜-uuid.webp
portfolio/portfolio-날짜-uuid-thumb.webp
```

## 7. 업로드 성공 기준

성공 기준은 아래와 같다.

- 대표 이미지 URL이 `https://...vercel-storage.com/portfolio/...webp` 형태다.
- Blob Store에 대표 이미지와 thumb 이미지가 둘 다 생성된다.
- 제작 사례 저장 후 `PortfolioCase.mainImageUrl`에 Blob URL이 저장된다.
- 고객-facing `/portfolio` 또는 `/portfolio/[slug]`에서 이미지가 보인다.

## 8. 실패 증상별 확인 방법

### URL이 `/uploads/portfolio/...`로 나온다

원인:

- local provider로 동작 중이다.
- `PORTFOLIO_STORAGE_PROVIDER`가 비어 있거나 `local`일 수 있다.
- 환경변수를 수정했지만 Redeploy하지 않았을 수 있다.

확인:

- Production 환경에 `PORTFOLIO_STORAGE_PROVIDER=vercel-blob` 설정
- Redeploy 실행

### 이미지 저장소 설정 오류가 나온다

원인:

- `BLOB_READ_WRITE_TOKEN`이 없거나 잘못 설정됐을 가능성이 높다.

확인:

- Vercel Blob Store 연결 상태 확인
- Production 환경에 `BLOB_READ_WRITE_TOKEN` 존재 여부 확인
- Redeploy 실행

### 401이 나온다

원인:

- `/access`를 통과하지 않았거나 `/admin/login` 관리자 로그인을 하지 않았다.

확인:

- 먼저 `/access` 통과
- 그다음 `/admin/login` 통과
- 이후 `/admin/portfolio/new`에서 업로드 테스트

### 업로드는 됐는데 공개 화면에 이미지가 안 보인다

확인:

- 제작 사례 저장 버튼을 눌렀는지 확인
- `mainImageUrl`에 Blob URL이 들어갔는지 확인
- 제작 사례 공개 상태 또는 승인 상태가 public 노출 조건에 맞는지 확인

## 9. `/api/health` 401 분석

현재 로컬 코드 기준으로는 `/api/health`가 site access bypass 대상이다.

관련 파일:

```txt
src/lib/site-access.ts
src/middleware.ts
src/app/api/health/route.ts
src/lib/deployment-health.ts
```

로컬 코드에서는 `/api/health`가 관리자 인증을 요구하지 않고, middleware에서도 bypass되어야 한다.

그런데 실제 배포 URL에서는 아직 아래처럼 응답한다.

```txt
/api/health
-> 401
-> {"error":"접근 권한이 필요합니다."}
```

가능성이 높은 원인:

1. Production 배포본이 최신 코드가 아니다.
2. `/api/health` bypass가 추가되기 전 배포본이 현재 Production alias에 연결되어 있다.
3. 환경변수 수정 후 Redeploy가 되지 않았다.

조치:

1. Vercel Dashboard > Deployments에서 최신 Production 배포 시간을 확인한다.
2. 최신 코드로 Redeploy한다.
3. Redeploy 후 `/api/health`가 200으로 바뀌는지 다시 확인한다.
4. 그래도 401이면 Vercel Runtime Logs에서 실제 middleware 빌드가 최신인지 확인한다.

## 10. 로컬 검증 결과

이전 점검에서 아래 명령들이 통과했다.

```txt
tsc --noEmit
pnpm lint
pnpm test
DATABASE_URL=file:./dev.db prisma migrate status
DATABASE_URL=file:./dev.db pnpm build
```

참고:

- 현재 셸 PATH에 `pnpm`이 없을 수 있다.
- 이 경우 Codex Node/Corepack shim으로 `pnpm build`를 실행하면 된다.
- 로컬 build는 통과했으며 DB schema 변경이나 migration은 없었다.

## 11. 수정된 문서

최근 점검에서 보강된 문서:

```txt
docs/gpt-handoff-vercel-admin-blob-check.md
docs/portfolio-image-storage.md
```

이번 보고 파일:

```txt
docs/gpt-report-vercel-admin-blob-check-20260624.md
```

## 12. 다음 GPT가 이어서 할 일

다음 GPT는 새 기능 개발보다 아래 확인을 우선해야 한다.

1. Vercel Production 최신 Redeploy 여부 확인
2. `/api/health`가 200으로 바뀌었는지 확인
3. Production 환경변수에 `PORTFOLIO_STORAGE_PROVIDER=vercel-blob`이 들어갔는지 확인
4. `BLOB_READ_WRITE_TOKEN`이 Production 환경에 있는지 확인
5. 사용자에게 `/access`와 `/admin/login` 순서대로 접속하도록 안내
6. `/admin/portfolio/new`에서 실제 이미지 업로드 테스트 안내
7. URL이 `vercel-storage.com`인지 확인
8. Blob Store에 main/thumb 파일이 생겼는지 확인

## 13. 금지 사항

다음 GPT는 이 점검 작업에서 아래를 하면 안 된다.

- DB schema 변경
- migration 생성
- 고객 문의폼 파일 업로드 추가
- PDF, AI, SVG, DXF, ZIP 업로드 허용
- 결제, 세금계산서, 전자계약 기능 추가
- 외부 AI API 연동
- 실제 Blob token을 코드나 문서에 기록
- 기존 CRM/리드/견적안/영업 업무 기능 삭제
- 기존 포트폴리오 기능 대규모 수정

