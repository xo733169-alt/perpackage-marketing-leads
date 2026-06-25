# GPT 전달용 보고서: Vercel 관리자 URL 및 Blob 업로드 점검

작성일: 2026-06-21  
프로젝트: PerPackage Marketing Lead Management System  
회사: 페르패키지  
작업 위치: `C:\Users\inh78\OneDrive\문서\홈페이지 개발\perpackage-marketing-leads`

## 1. 이번 점검 목적

이번 작업은 새 기능 개발이 아니라 Vercel 배포 설정, 관리자 페이지 URL, 제작 사례 대표 이미지 Vercel Blob 업로드 테스트 준비 상태를 확인한 작업이다.

현재 프로젝트는 Phase 1~14까지 완료되어 있다.

Phase 14 핵심 상태:

- 업로드 API: `POST /api/admin/uploads/portfolio`
- storage adapter 파일: `src/lib/storage/portfolio-storage.ts`
- local provider 저장 위치: `public/uploads/portfolio`
- Vercel Blob provider: `PORTFOLIO_STORAGE_PROVIDER="vercel-blob"`
- Blob token 환경변수: `BLOB_READ_WRITE_TOKEN`
- DB 저장 필드: `PortfolioCase.mainImageUrl`
- 썸네일 URL은 API 응답에는 있으나 DB에는 저장하지 않음
- 고객-facing 제작 사례 화면은 기존처럼 `mainImageUrl`만 사용

## 2. 확인한 관리자 URL

코드 기준 실제 존재하는 관리자 URL은 아래와 같다.

```txt
/admin/login
/admin/leads
/admin/portfolio
/admin/portfolio/new
/admin/portfolio/[id]/edit
```

주의:

```txt
/admin
```

루트 페이지는 현재 없다.  
`src/app/admin/page.tsx`가 없으므로 관리자 진입은 `/admin/login`으로 해야 한다.

## 3. 관리자 로그인 흐름

관리자 로그인 URL:

```txt
https://perpackage-marketing-leads.vercel.app/admin/login
```

현재 배포 상태에서는 `SITE_ACCESS_ENABLED=true`로 보인다.  
따라서 `/admin/login`으로 바로 들어가면 먼저 아래로 redirect된다.

```txt
/access?next=%2Fadmin%2Flogin
```

실제 순서:

1. `/access`에서 사이트 접근 비밀번호 입력
2. `/admin/login`에서 관리자 비밀번호 입력
3. 로그인 성공 후 `/admin/leads`로 이동

로그인 성공 후 이동 경로는 `src/components/AdminLoginForm.tsx`에서 확인했다.

```ts
router.push("/admin/leads");
```

## 4. 제작 사례 관리 URL

제작 사례 목록:

```txt
https://perpackage-marketing-leads.vercel.app/admin/portfolio
```

제작 사례 신규 등록:

```txt
https://perpackage-marketing-leads.vercel.app/admin/portfolio/new
```

제작 사례 수정:

```txt
https://perpackage-marketing-leads.vercel.app/admin/portfolio/{id}/edit
```

관리자 제작 사례 목록의 수정 버튼도 아래 패턴으로 연결된다.

```txt
/admin/portfolio/${caseItem.id}/edit
```

## 5. 현재 배포 URL에서 확인한 결과

확인한 배포 URL:

```txt
https://perpackage-marketing-leads.vercel.app
```

확인 결과:

```txt
/access
상태: 200
결과: private access page 열림

/admin/login
상태: 307
Location: /access?next=%2Fadmin%2Flogin

/admin/portfolio
상태: 307
결과: /access로 redirect

/admin/portfolio/new
상태: 307
Location: /access?next=%2Fadmin%2Fportfolio%2Fnew

/api/admin/uploads/portfolio
상태: 401
응답: {"error":"접근 권한이 필요합니다."}

/robots.txt
상태: 200
내용: User-Agent: * / Disallow: /

/sitemap.xml
상태: 200
내용: 빈 urlset
```

해석:

- 현재 배포는 private preview 보호가 켜져 있다.
- 관리자 URL에 들어가기 전 `/access` 비밀번호가 먼저 필요하다.
- 업로드 API는 인증 없이 접근하면 차단된다.
- 검색엔진에는 전체 비공개 처리되어 있다.

## 6. 발견한 특이사항

`/api/health`는 배포 환경에서 401을 반환했다.

로컬 코드 기준으로는 `src/lib/site-access.ts`에서 `/api/health`가 bypass 대상이다.

```ts
if (pathname === "/api/health") return true;
```

따라서 아래 가능성이 있다.

- 배포본이 로컬 최신 코드와 다를 수 있음
- Vercel 재배포가 아직 최신 커밋으로 되지 않았을 수 있음
- private access 관련 이전 빌드가 배포되어 있을 수 있음

큰 기능 장애로 보이진 않지만, 최신 코드로 redeploy 후 다시 확인하는 것이 좋다.

## 7. Vercel 환경변수 확인 목록

Vercel Project Settings > Environment Variables에서 아래 값을 확인해야 한다.

필수:

```env
DATABASE_URL=
ADMIN_PASSWORD=
NEXT_PUBLIC_SITE_URL=https://perpackage-marketing-leads.vercel.app
PORTFOLIO_STORAGE_PROVIDER=vercel-blob
BLOB_READ_WRITE_TOKEN=
```

private preview 사용 시 추가 필수:

```env
SITE_ACCESS_ENABLED=true
SITE_ACCESS_PASSWORD=
SITE_ACCESS_SECRET=
```

확인 포인트:

1. `PORTFOLIO_STORAGE_PROVIDER` 값이 정확히 `vercel-blob`인지 확인
2. `BLOB_READ_WRITE_TOKEN`이 존재하는지 확인
3. Blob token이 코드나 문서에 노출되지 않았는지 확인
4. 환경변수가 Production/Preview 중 실제 테스트할 배포 환경에 들어갔는지 확인
5. 환경변수 추가 후 Redeploy 했는지 확인
6. `NEXT_PUBLIC_SITE_URL`이 실제 배포 주소와 맞는지 확인

## 8. Vercel Blob provider 선택 방식

파일:

```txt
src/lib/storage/portfolio-storage.ts
```

provider 선택 로직:

- `PORTFOLIO_STORAGE_PROVIDER`가 비어 있거나 `local`이면 local adapter
- `PORTFOLIO_STORAGE_PROVIDER="vercel-blob"`이면 Vercel Blob adapter
- 미지원 provider는 명확한 에러 발생

local provider 결과:

```txt
/uploads/portfolio/portfolio-날짜-uuid.webp
```

Vercel Blob provider 결과:

```txt
https://...vercel-storage.com/portfolio/portfolio-날짜-uuid.webp
```

## 9. 업로드 성공 시 기대 결과

관리자 제작 사례 대표 이미지 업로드가 성공하면 아래가 기대된다.

1. 관리자 폼에 업로드 성공 메시지가 표시된다.
2. 대표 이미지 URL 입력칸 값이 Vercel Blob URL로 바뀐다.
3. URL 형태는 아래와 같아야 한다.

```txt
https://...vercel-storage.com/portfolio/portfolio-날짜-uuid.webp
```

4. `/uploads/portfolio/...` 형태라면 아직 local provider로 동작 중이다.
5. 제작 사례 저장 버튼을 눌러야 `PortfolioCase.mainImageUrl`에 최종 저장된다.
6. Vercel Storage > Blob Store에서 아래 파일이 보여야 한다.

```txt
portfolio/portfolio-날짜-uuid.webp
portfolio/portfolio-날짜-uuid-thumb.webp
```

7. 고객-facing `/portfolio` 또는 `/portfolio/[slug]`에서 이미지가 보여야 한다.

## 10. 사용자가 직접 테스트할 순서

1. 아래 URL 접속

```txt
https://perpackage-marketing-leads.vercel.app/access
```

2. 사이트 접근 비밀번호 입력
3. 아래 URL 접속

```txt
https://perpackage-marketing-leads.vercel.app/admin/login
```

4. 관리자 비밀번호 입력
5. 아래 URL 접속

```txt
https://perpackage-marketing-leads.vercel.app/admin/portfolio/new
```

6. 제작 사례 필수 정보 입력
7. JPG, PNG, WebP 중 하나로 대표 이미지 업로드
8. 업로드 성공 후 대표 이미지 URL 입력칸 확인
9. URL이 `vercel-storage.com/portfolio/...webp`인지 확인
10. 제작 사례 저장 버튼 클릭
11. Vercel Dashboard > Storage > Blob Store에서 main/thumb 파일 확인
12. `/portfolio` 또는 `/portfolio/[slug]`에서 이미지 표시 확인

## 11. 로컬 검증 결과

실행한 명령어와 결과:

```txt
tsc --noEmit
결과: 통과

pnpm lint
결과: 통과, ESLint warning/error 없음

pnpm test
결과: 35개 테스트 파일, 149개 테스트 통과

DATABASE_URL=file:./dev.db prisma migrate status
결과: Database schema is up to date

DATABASE_URL=file:./dev.db pnpm build
결과: 통과
```

참고:

- 로컬 환경에서 `pnpm`이 PATH에 바로 잡히지 않아 Corepack shim 경로로 실행했다.
- Vercel CLI는 로컬에 설치되어 있지 않아 `vercel env ls`는 실행하지 못했다.
- `.vercel/project.json` 기준 프로젝트는 `perpackage-marketing-leads`에 연결되어 있다.

## 12. 수정한 파일

이번 점검 작업에서 애플리케이션 코드는 수정하지 않았다.

이 문서만 새로 추가했다.

```txt
docs/gpt-handoff-vercel-admin-blob-check.md
```

## 13. 다음 GPT가 이어서 확인할 때 주의할 점

금지사항:

- DB schema 변경 금지
- migration 생성 금지
- 고객 문의폼 파일 업로드 기능 추가 금지
- PDF, AI, SVG, DXF, ZIP 업로드 허용 금지
- 실제 Blob token을 코드/문서/테스트에 넣지 말 것
- 기존 포트폴리오 기능 대규모 수정 금지

우선 확인할 것:

1. Vercel 환경변수에 `PORTFOLIO_STORAGE_PROVIDER=vercel-blob`이 들어갔는지
2. Vercel 환경변수에 `BLOB_READ_WRITE_TOKEN`이 들어갔는지
3. 환경변수 적용 후 redeploy 했는지
4. 관리자에서 업로드한 URL이 `vercel-storage.com`인지
5. Blob Store에 main/thumb 파일이 생성됐는지
6. `/api/health` 401 문제가 최신 재배포 후에도 남아 있는지

## 14. 추천 다음 조치

가장 현실적인 다음 순서:

1. Vercel 환경변수 재확인
2. 최신 코드 redeploy
3. 관리자 제작 사례 이미지 업로드 실테스트
4. Vercel Blob Store 파일 생성 확인
5. 기존 local 업로드 이미지가 있다면 Blob 마이그레이션 도구 설계

현재 바로 해야 할 핵심은 Vercel Dashboard에서 환경변수를 확인하고 redeploy한 뒤, `/admin/portfolio/new`에서 실제 이미지 업로드를 테스트하는 것이다.

## 15. 추가 점검 결과: 2026-06-21 재확인

이번 재점검에서도 배포 URL은 아래처럼 동작했다.

```txt
https://perpackage-marketing-leads.vercel.app/access
200 OK

https://perpackage-marketing-leads.vercel.app/admin/login
307 -> /access?next=%2Fadmin%2Flogin

https://perpackage-marketing-leads.vercel.app/admin/portfolio/new
307 -> /access?next=%2Fadmin%2Fportfolio%2Fnew

https://perpackage-marketing-leads.vercel.app/api/health
401 {"error":"접근 권한이 필요합니다."}

https://perpackage-marketing-leads.vercel.app/api/health/
308 Redirecting...
```

`/api/health/`가 308인 것은 trailing slash 정규화 동작이다. 핵심은 `/api/health` 자체가 401이라는 점이다.

현재 로컬 코드에서는 `/api/health`가 site access bypass 대상이다.

```ts
if (pathname === "/api/health") return true;
```

따라서 배포 환경에서 `/api/health`가 401을 반환하는 가장 가능성 높은 원인은 아래다.

1. Vercel Production 배포본이 현재 로컬 코드보다 이전 버전이다.
2. `/api/health` bypass가 추가되기 전 빌드가 아직 Production alias에 연결되어 있다.
3. 환경변수 수정 후 redeploy가 되지 않았다.

현재 코드 구조상 `/api/health`는 관리자 인증을 요구하지 않는다.

파일 기준:

```txt
src/app/api/health/route.ts
src/lib/deployment-health.ts
src/middleware.ts
src/lib/site-access.ts
```

## 16. Vercel에서 실제로 눌러야 하는 순서

### A. 최신 배포 확인

1. Vercel Dashboard 접속
2. `perpackage-marketing-leads` 프로젝트 선택
3. Deployments 탭 이동
4. 가장 최신 Production 배포가 `Ready`인지 확인
5. 최신 커밋/배포 시간이 현재 코드 수정 이후인지 확인
6. 아니라면 최신 코드로 다시 Redeploy

### B. 환경변수 확인

1. Project Settings 이동
2. Environment Variables 이동
3. Production 환경에 아래 값이 있는지 확인

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

4. Preview 배포를 테스트 중이면 Preview 환경에도 같은 값이 들어갔는지 확인
5. 환경변수 수정 후 반드시 Redeploy

### C. 관리자 접속

1. `https://perpackage-marketing-leads.vercel.app/access`
2. 사이트 접근 비밀번호 입력
3. `https://perpackage-marketing-leads.vercel.app/admin/login`
4. 관리자 비밀번호 입력
5. 로그인 후 `/admin/leads`로 이동하는지 확인
6. 직접 `https://perpackage-marketing-leads.vercel.app/admin/portfolio/new`로 이동

주의:

```txt
/admin
```

루트 페이지는 현재 없다. 관리자 진입은 `/admin/login`으로 해야 한다.

### D. Vercel Blob 업로드 실테스트

1. `/admin/portfolio/new`에서 제작 사례 필수값 입력
2. 대표 이미지로 JPG, PNG, WebP 중 하나 선택
3. 업로드 완료 메시지 확인
4. 대표 이미지 URL 입력칸 확인
5. URL이 아래 형태인지 확인

```txt
https://...vercel-storage.com/portfolio/portfolio-날짜-uuid.webp
```

6. 제작 사례 저장 버튼 클릭
7. `/admin/portfolio` 목록에서 저장된 사례 확인
8. `/portfolio` 또는 `/portfolio/[slug]`에서 이미지 표시 확인
9. Vercel Dashboard > Storage > Blob Store에서 아래 파일 확인

```txt
portfolio/portfolio-날짜-uuid.webp
portfolio/portfolio-날짜-uuid-thumb.webp
```

## 17. 실패 증상별 확인 방법

### URL이 `/uploads/portfolio/...`로 나온다

원인:

- `PORTFOLIO_STORAGE_PROVIDER`가 `local`이거나 비어 있다.
- 환경변수를 수정했지만 redeploy하지 않았다.
- 테스트 중인 배포 환경과 환경변수 적용 환경이 다르다.

조치:

- Production 또는 Preview 환경에 `PORTFOLIO_STORAGE_PROVIDER=vercel-blob` 설정
- Redeploy

### “이미지 저장소 설정” 오류가 나온다

원인:

- `BLOB_READ_WRITE_TOKEN` 누락 가능성이 높다.

조치:

- Vercel Blob Store 연결 확인
- `BLOB_READ_WRITE_TOKEN`이 해당 환경에 설정되어 있는지 확인
- Redeploy

### 401이 나온다

원인:

- `/access` 사이트 접근 인증을 통과하지 않았다.
- `/admin/login` 관리자 인증을 통과하지 않았다.

조치:

- `/access` 먼저 통과
- `/admin/login`에서 관리자 로그인

### 업로드는 됐지만 public 화면에서 이미지가 안 보인다

확인:

- 제작 사례 저장 버튼을 눌렀는지
- `mainImageUrl`에 Blob URL이 저장됐는지
- 제작 사례 status가 공개 가능한 상태인지
- `publicApprovalConfirmed`가 필요한 화면 정책에 맞게 설정됐는지

### `/api/health`가 계속 401이다

원인:

- 현재 로컬 코드 기준으로는 200이어야 하므로 배포본이 최신이 아닐 가능성이 높다.

조치:

- 최신 코드 redeploy
- redeploy 후 다시 `/api/health` 확인
- 그래도 401이면 Vercel의 배포 로그와 실제 배포 커밋을 확인
