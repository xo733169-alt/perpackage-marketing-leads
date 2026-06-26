# GPT 보고서: 페르패키지 고객 인쇄파일 업로드 허브 운영 전 QA

작성일: 2026-06-26  
대상 프로젝트: `perpackage-marketing-leads`  
QA 대상: `/upload`, `/upload/success`, `/admin/uploads`, `/admin/uploads/[id]`, 업로드 API, 관리자 API, storage adapter

## 1. 작업 목적

기존에 구현된 주문번호 기반 인쇄파일 업로드 허브가 운영 전 기준에서 정상 동작하는지 확인했다.

이번 작업은 새 기능 개발이 아니다. 결제, 세금계산서, 전자계약, 실시간 채팅, WebSocket, Supabase Realtime, Cafe24 API/OAuth/Webhook, 고객 상태 조회, 전개도 에디터, 자동 인쇄용 PDF 생성은 추가하지 않았다.

## 2. 실행한 명령과 결과

Node/pnpm 확인:

```txt
node --version
corepack pnpm --version
```

결과:

```txt
Node v24.16.0
pnpm 11.0.7
```

주의:

- `node`, `pnpm`이 기본 PowerShell PATH에는 바로 잡히지 않았다.
- WinGet Node 설치 경로를 해당 셸의 PATH 앞에 붙인 뒤 `corepack pnpm`으로 실행했다.

테스트:

```txt
pnpm test
```

결과:

```txt
37 test files passed
177 tests passed
```

타입체크:

```txt
pnpm exec tsc --noEmit
```

결과:

- 1차 실행: 실패
- 원인: 기존 `.next/types/**/*.ts` include가 이전 빌드 산출물을 참조했으나 해당 파일들이 없는 상태
- `pnpm build` 이후 재실행: 통과

빌드:

```txt
pnpm build
```

결과:

```txt
Prisma Client generated
Next.js production build passed
/upload generated
/upload/success generated
/admin/uploads generated
/admin/uploads/[id] generated
/api/uploads/files generated
/api/uploads/projects generated
/api/uploads/local-object generated
```

배포 환경 체크:

```txt
pnpm deployment:check
```

결과:

```txt
failed
```

실패 사유:

- `DATABASE_URL`
- `DIRECT_URL`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_SITE_URL`
- `SITE_ACCESS_ENABLED`
- `NAVER_OBJECT_STORAGE_ACCESS_KEY`
- `NAVER_OBJECT_STORAGE_SECRET_KEY`
- `NAVER_OBJECT_STORAGE_BUCKET`
- `NAVER_OBJECT_STORAGE_ENDPOINT`
- `NAVER_OBJECT_STORAGE_REGION`

위 운영 환경변수가 현재 셸에 없었다. 실제 secret 값은 출력하지 않았다.

공백/패치 검증:

```txt
git diff --check
```

결과:

```txt
통과
```

## 3. migration 적용 확인 결과

확인 대상:

```txt
prisma/migrations/20260626093000_add_upload_customer_contact_fields/migration.sql
```

정적 확인 결과:

- `company_name TEXT`
- `contact_name TEXT`
- `kakao_id TEXT`
- `contact_method TEXT`
- `privacy_agreed BOOLEAN NOT NULL DEFAULT false`
- `company_name` index
- `contact_name` index

`prisma/schema.prisma` 확인 결과:

- `companyName String? @map("company_name")`
- `contactName String? @map("contact_name")`
- `kakaoId String? @map("kakao_id")`
- `contactMethod String? @map("contact_method")`
- `privacyAgreed Boolean @default(false) @map("privacy_agreed")`

기존 데이터 보호:

- 새 문자열 필드는 nullable
- `privacyAgreed`는 기본값 `false`
- 기존 row가 깨지지 않는 형태

실제 migration 적용 여부:

```txt
pnpm prisma migrate status
```

결과:

```txt
failed
```

사유:

- 현재 셸/로컬 환경에 `DIRECT_URL`이 설정되어 있지 않다.
- 또한 로컬 `.env.local`의 DB URL은 현재 PostgreSQL datasource와 맞지 않는 SQLite 형식이라 실제 업로드 DB QA가 불가능했다.

결론:

- migration SQL 자체는 기존 데이터 보호 기준에 맞다.
- 실제 적용 가능 여부는 Supabase/PostgreSQL `DATABASE_URL` 및 `DIRECT_URL`이 설정된 환경에서 다시 확인해야 한다.

## 4. `/upload` 고객 화면 QA 결과

dev server:

```txt
http://127.0.0.1:3100
```

확인 결과:

- `/upload`: HTTP 200
- 문서 title: `인쇄파일 업로드 | 페르패키지`
- 390px viewport: `clientWidth=390`, `scrollWidth=390`
- horizontal overflow 없음
- 브라우저 console error 없음
- page error 없음
- 고객 화면에서 ASCII 기준 `TODO`, `placeholder`, `/admin`, `storage key`, `public direct` 노출 없음

정적 금지 문구 스캔:

```txt
TODO
placeholder
미구현
임시
테스트
확정 견적
자동 제작
제작 확정
결제 완료 즉시 인쇄
당일 제작
무조건 제작
인쇄 포함 확정가
바로 제작
파일 업로드 즉시 제작
```

결과:

- 고객 업로드 화면 대상 파일에서 매칭 없음

## 5. 정상 업로드 테스트 결과

API 정상 업로드 시나리오를 시도했다.

입력:

- 주문번호: `TEST-20260626-*`
- 업체명: 테스트 업체
- 담당자명: 테스트 담당자
- 연락처: `010-0000-0000`
- 이메일: `test@example.com`
- 파일: 더미 PDF
- storage provider: `local`

결과:

```txt
POST /api/uploads/projects -> 500
```

원인:

```txt
Prisma datasource is PostgreSQL, but current local DATABASE_URL starts with file:
```

해석:

- 정상 업로드 기능의 코드 경로는 빌드와 테스트에서 통과했다.
- 그러나 현재 로컬 `.env.local` DB 설정이 PostgreSQL datasource와 맞지 않아 DB row 생성부터 실패했다.
- 따라서 실제 고객 업로드 왕복, `/upload/success` 자동 이동, 관리자 목록 반영은 이번 로컬 환경에서 끝까지 확인하지 못했다.

운영 전 필수 조치:

- Supabase/PostgreSQL `DATABASE_URL`
- Supabase/PostgreSQL `DIRECT_URL`
- 해당 DB에 migration 적용

이후 같은 정상 업로드 QA를 다시 실행해야 한다.

## 6. 위험 파일 차단 테스트 결과

DB 조회 전에 차단되는 API 경로로 확인했다.

```txt
POST /api/uploads/files
intent=prepare
projectId=qa-fake-project
```

결과:

| 케이스 | 결과 |
| --- | --- |
| `bad.html` + `text/html` | 400 차단 |
| `bad.js` + `application/javascript` | 400 차단 |
| `bad.exe` + `application/octet-stream` | 400 차단 |

응답 메시지:

```txt
보안상 업로드할 수 없는 파일 형식입니다. 인쇄용 파일만 업로드해 주세요.
```

## 7. MIME mismatch 차단 테스트 결과

케이스:

```txt
originalFilename=proof.pdf
fileType=image/png
```

결과:

```txt
400 차단
```

응답 메시지:

```txt
PDF 파일 형식과 실제 파일 정보가 맞지 않습니다. 파일을 다시 확인해 주세요.
```

DXF 확인:

- `dieline.dxf` + `application/dxf`는 파일 검증 단계는 통과한다.
- 이후 DB 조회 단계에서 현재 DB 설정 문제로 500이 발생했다.
- unit test에서는 DXF 허용 케이스가 통과했다.

## 8. `/upload/success` 확인 결과

확인 URL:

```txt
/upload/success?order=TEST-20260626-001
```

결과:

- HTTP 200
- 문서 title: `업로드 완료 | 페르패키지`
- 390px viewport: `clientWidth=390`, `scrollWidth=390`
- horizontal overflow 없음
- 브라우저 console error 없음
- page error 없음
- 고객 화면에서 ASCII 기준 `TODO`, `placeholder`, `/admin`, `storage key`, `public direct` 노출 없음

주의:

- 실제 업로드 완료 후 sessionStorage 기반 파일 목록 표시까지는 DB 생성 실패로 확인하지 못했다.

## 9. `/admin/uploads` 목록 확인 결과

비로그인 접근:

```txt
GET /admin/uploads
```

결과:

```txt
307 redirect -> /admin/login
```

브라우저 확인:

- 최종 URL: `/admin/login`
- 비로그인 보호 정상

관리자 로그인 후 목록 표시:

- 현재 DB 설정 문제로 실제 목록 조회는 확인하지 못했다.
- API 비인증 보호는 별도 확인했다.

## 10. `/admin/uploads/[id]` 상세 확인 결과

비인증 API:

```txt
GET /api/admin/uploads/qa-project
```

결과:

```txt
401
```

실제 상세 화면:

- 정상 업로드 프로젝트 row를 만들 수 없어 `/admin/uploads/[id]` 실제 상세 화면 데이터 렌더링은 확인하지 못했다.
- `pnpm build`에서는 `/admin/uploads/[id]` 라우트가 정상 포함됐다.

## 11. 관리자 다운로드 확인 결과

비인증 다운로드 API:

```txt
GET /api/admin/uploads/qa-project/files/qa-file/download
```

결과:

```txt
401
```

확인한 내용:

- 고객이나 비로그인 사용자가 관리자 다운로드 API에 접근할 수 없다.

미확인:

- 관리자 로그인 후 실제 파일 다운로드
- 실제 업로드 row 기반 signed download redirect

미확인 사유:

- 현재 로컬 DB 설정 문제로 실제 업로드 row와 file row를 만들 수 없었다.

## 12. 상태 변경/검수 메모 확인 결과

비인증 상태 변경 API:

```txt
PATCH /api/admin/uploads/qa-project/status
```

결과:

```txt
401
```

비인증 검수 메모 API:

```txt
POST /api/admin/uploads/qa-project/review-log
```

결과:

```txt
401
```

확인한 내용:

- 상태 변경과 검수 메모 작성 API는 비로그인 상태에서 막힌다.

미확인:

- 관리자 인증 후 실제 상태 변경
- `FileReviewLog` 실제 생성
- 수정 요청/검수 메모 실제 저장

미확인 사유:

- 현재 로컬 DB 설정 문제

## 13. Naver Object Storage 저장 확인 결과

운영 Naver Object Storage는 실제 key/secret이 없어서 연결하지 않았다.

`pnpm deployment:check` 기준 누락:

- `NAVER_OBJECT_STORAGE_ACCESS_KEY`
- `NAVER_OBJECT_STORAGE_SECRET_KEY`
- `NAVER_OBJECT_STORAGE_BUCKET`
- `NAVER_OBJECT_STORAGE_ENDPOINT`
- `NAVER_OBJECT_STORAGE_REGION`

결론:

- Naver Object Storage 운영 저장은 이번 로컬 QA에서 미확인
- 운영/Preview 환경변수 등록 후 signed upload/download를 다시 확인해야 한다.

## 14. local fallback 확인 결과

환경:

```txt
PRINT_FILE_STORAGE_PROVIDER=local
UPLOAD_LOCAL_STORAGE_SECRET=QA용 임시값
```

직접 확인:

- signed PUT
- signed GET
- `Content-Disposition`
- `Cache-Control: private, no-store`

결과:

```txt
PUT /api/uploads/local-object -> 204
GET /api/uploads/local-object -> 200
download bytes -> 33
Content-Disposition present -> true
Cache-Control -> private, no-store
```

추가 확인:

- `.local-print-file-storage`는 `.gitignore`에 포함되어 있다.
- QA로 생성한 더미 파일과 폴더는 정리했다.

## 15. 모바일 390px 확인 결과

Playwright + Chrome headless 기준:

| 화면 | clientWidth | scrollWidth | overflow |
| --- | ---: | ---: | --- |
| `/upload` | 390 | 390 | 없음 |
| `/upload/success` | 390 | 390 | 없음 |
| 개인정보 미동의 검증 상태 | 390 | 390 | 없음 |

관리자 목록 모바일:

- 비로그인 상태에서는 `/admin/login`으로 이동하는 것만 확인했다.
- 관리자 인증 후 실제 목록 테이블 모바일 확인은 DB 설정 문제로 미완료다.

## 16. 콘솔 오류 확인 결과

브라우저 page console:

- `/upload`: error 없음
- `/upload/success`: error 없음
- 개인정보 미동의 클라이언트 검증: error 없음

서버 로그:

- 정상 업로드 API 시도에서 Prisma datasource 오류 발생
- Chrome headless 접근 중 Next.js dev warning 발생:

```txt
Cross origin request detected from 127.0.0.1 to /_next/* resource.
```

해석:

- 브라우저 console error는 아니다.
- `localhost:3100`과 `127.0.0.1:3100` 혼용에 따른 Next dev warning으로 보인다.

## 17. Cafe24 주문 완료 화면 안내 문구 제안

주문 완료 화면 안내 문구:

```txt
인쇄파일 제출이 필요한 주문은 아래 업로드 페이지에서 주문번호와 함께 파일을 접수해 주세요.
업로드된 파일은 담당자가 확인한 뒤 제작 가능 여부와 수정 필요사항을 안내드립니다.
```

보조 안내:

```txt
AI, PDF, EPS, DXF, ZIP 형식을 권장합니다.
대용량 파일은 ZIP으로 압축해 업로드해 주세요.
파일 검수 후 수정 요청이 있을 수 있습니다.
```

CTA:

```txt
인쇄파일 업로드하기
```

연결 경로:

```txt
/upload
```

주의:

- Cafe24 API 자동 주문번호 검증 문구를 넣지 않는다.
- 제작 확정, 결제 확정, 당일 제작 확정처럼 보이는 표현을 쓰지 않는다.

## 18. 발견한 문제

1. 현재 로컬 DB 환경이 PostgreSQL schema와 맞지 않음
   - `.env.local`의 DB URL이 SQLite 형식이다.
   - 현재 Prisma datasource는 PostgreSQL이다.
   - `POST /api/uploads/projects`가 Prisma initialization 단계에서 500이 된다.

2. `DIRECT_URL` 미설정
   - `pnpm prisma migrate status`가 `DIRECT_URL` missing으로 실패한다.
   - migration 적용 상태를 로컬에서 확인할 수 없다.

3. 운영 Naver Object Storage 환경변수 미설정
   - Naver signed upload/download는 실제 운영 환경에서 재검증 필요

4. 관리자 인증 후 실제 상세/다운로드/상태 변경 QA 미완료
   - 업로드 프로젝트 row를 만들 수 없어 후속 관리자 데이터 흐름을 끝까지 확인하지 못했다.

5. 첫 `tsc --noEmit` 실행은 stale `.next/types` 참조로 실패
   - `pnpm build` 후 재실행하면 통과한다.
   - Next App Router 프로젝트에서는 clean 상태의 standalone `tsc --noEmit` 전에 `.next/types` 생성 여부를 확인해야 한다.

## 19. 수정한 파일 목록

이번 QA에서 새 기능 코드는 수정하지 않았다.

생성한 보고서:

```txt
docs/gpt-report-customer-file-upload-qa-20260626.md
```

QA 중 생성 후 정리한 임시 산출물:

- `qa-devserver.out.log`
- `qa-devserver.err.log`
- `.local-print-file-storage`

위 파일/폴더는 `.gitignore` 대상이거나 QA 종료 시 정리했다.

## 20. 남은 위험 요소

- 운영 PostgreSQL/Supabase 환경에서 migration이 아직 적용됐는지 미확인
- 실제 Naver Object Storage signed PUT/GET 미확인
- 실제 고객 업로드 후 DB row 생성 및 파일 complete 미확인
- 관리자 로그인 후 목록/상세/다운로드/상태 변경/검수 메모 미확인
- Vercel 배포 환경에서 upload body, signed URL, CORS 정책 미확인
- 개인정보 보관 기간과 삭제 정책 미정
- 로컬 `.env.local`이 현재 PostgreSQL schema와 맞지 않아 개발자가 그대로 사용하면 업로드 QA가 반복 실패할 수 있음

## 21. 다음 단계 제안

1. Supabase/PostgreSQL `DATABASE_URL`, `DIRECT_URL`을 로컬 또는 Preview 환경에 등록
2. `prisma/migrations/20260625090000_add_print_file_upload_hub`와 `20260626093000_add_upload_customer_contact_fields` 적용
3. `pnpm prisma migrate status` 재실행
4. `PRINT_FILE_STORAGE_PROVIDER=local`로 정상 업로드 왕복 재실행
5. 관리자 로그인 후 `/admin/uploads` 목록과 `/admin/uploads/[id]` 상세 QA
6. 관리자 다운로드 API signed URL redirect 확인
7. 상태 변경과 수정 요청/검수 메모 저장 후 `FileReviewLog.createdAt` 확인
8. Naver Object Storage 환경변수 등록 후 운영 저장소로 signed PUT/GET 재검증
9. Vercel Preview에서 390px 모바일 overflow와 브라우저 console 재확인
10. Cafe24 주문 완료 화면에 `/upload` 안내 링크 문구 삽입
