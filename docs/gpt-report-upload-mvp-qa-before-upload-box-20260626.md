# 페르패키지 업로드 박스 구현 전 `/upload` MVP 선행 QA 보고서

작성일: 2026-06-26

## 1. 작업 목적

웹하드형 UploadBox를 바로 구현하기 전에, 기존 주문번호 기반 인쇄파일 업로드 MVP가 Supabase/PostgreSQL 환경에서 실제 저장, 조회, 다운로드까지 갈 수 있는 상태인지 확인했다.

이번 작업에서는 UploadBox 신규 모델/API/화면을 만들지 않고, 기존 `/upload` MVP의 입력 항목을 조정하고 QA 가능한 범위와 막힌 지점을 정리했다.

## 2. 현재 DB 환경 확인 결과

- `prisma/schema.prisma` datasource는 PostgreSQL 기준이다.
- Prisma datasource는 `DATABASE_URL`과 `DIRECT_URL`을 모두 요구한다.
- 로컬 `.env.local`의 `DATABASE_URL`은 SQLite 형식으로 확인됐다.
- 로컬 `.env.local`에 `DIRECT_URL`은 없다.
- `UploadProject` 모델에는 `cafe24OrderNumber`, `productName`이 DB 레벨에서 non-null 문자열로 남아 있다.
- `kakaoId` 필드는 optional로 남아 있다.

주의: 실제 DB 비밀번호, API key, storage secret 값은 확인 결과와 보고서에 출력하지 않았다.

## 3. Supabase/PostgreSQL 설정 필요 여부

필요하다.

현재 Prisma schema는 PostgreSQL 기준인데 로컬 DB URL은 SQLite 형식이므로, 실제 업로드 프로젝트 생성 단계에서 DB 저장이 실패한다. QA 가능한 환경을 만들려면 최소한 아래가 필요하다.

- Supabase PostgreSQL `DATABASE_URL`
- Supabase PostgreSQL `DIRECT_URL`
- Supabase에 현재 Prisma migration 적용
- 운영/스테이징용 관리자 인증 환경변수
- Naver Object Storage 환경변수 또는 QA용 local storage provider 명시

`pnpm prisma migrate status` 실행 결과도 `DIRECT_URL` 누락으로 실패했다. 따라서 Supabase migration 적용 여부는 현재 로컬 환경만으로는 확인하지 못했다.

## 4. `/upload` 고객 화면 QA 결과

확인 URL: `http://127.0.0.1:3100/upload`

확인 결과:

- `/upload` 렌더링: 정상, HTTP 200
- 고객 화면 카카오톡 문구: 없음
- `TODO`, `placeholder`, `미구현` 문구: 없음
- 파일 업로드 input: 있음
- 개인정보 동의 체크박스: 있음
- 주문번호: optional 처리 확인
- 이메일: optional 처리 확인
- 상품명: optional 처리 확인
- 요청사항: optional 처리 확인

필수 입력 확인:

- `업체명 또는 고객명`: required
- `담당자명`: required
- `연락처`: required
- 파일 업로드: UI 존재
- 개인정보 동의: 체크박스 존재

선택 입력 확인:

- `Cafe24 주문번호`: required 아님
- `이메일`: required 아님
- `상품명`: required 아님
- `요청사항`: required 아님

## 5. `/upload/success` 확인 결과

확인 URL: `http://127.0.0.1:3100/upload/success`

확인 결과:

- `/upload/success` 렌더링: 정상, HTTP 200
- 모바일 390px 기준 가로 overflow 없음
- 콘솔 오류 없음
- 제작 확정, 바로 제작, 자동 제작 확정처럼 보이는 문구 없음

단, 실제 업로드 완료 후 sessionStorage 기반 접수 정보와 파일 목록 표시까지의 왕복은 DB 저장 실패로 끝까지 확인하지 못했다.

## 6. 실제 업로드 왕복 테스트 결과

결론: 현재 로컬 환경에서는 실제 업로드 왕복 테스트가 완료되지 않았다.

확인한 흐름:

- 필수 고객 정보만 넣고 `/api/uploads/projects` 호출
- 주문번호, 이메일, 상품명, 요청사항 없이 요청
- Zod 입력 검증은 통과하는 구조
- DB 저장 단계에서 HTTP 500 발생

원인:

- Prisma schema는 PostgreSQL 기준
- 로컬 `.env.local`의 `DATABASE_URL`은 SQLite 형식
- `DIRECT_URL` 없음

따라서 프로젝트 생성, 파일 메타데이터 저장, 관리자 목록 조회, 관리자 상세 조회까지 이어지는 DB 왕복 QA는 Supabase/PostgreSQL 환경 설정 후 재검증해야 한다.

별도 확인:

- local storage provider 기준 signed object PUT/GET 흐름은 확인했다.
- PUT: HTTP 204
- GET: HTTP 200
- 다운로드 응답에 `content-disposition` 있음
- `cache-control: private, no-store`

## 7. `/admin/uploads` 목록 확인 결과

확인 URL: `http://127.0.0.1:3100/admin/uploads`

확인 결과:

- 비로그인 접근 시 `/admin/login`으로 redirect
- 모바일 390px 기준 로그인 redirect 화면 overflow 없음
- 기존 관리자 인증 흐름이 무방비 공개 상태로 바뀌지는 않았다.

제한:

- 관리자 로그인 후 실제 업로드 목록 데이터 조회는 DB 설정 문제로 확인하지 못했다.
- 업체명/담당자명/주문번호 검색의 실제 DB 결과는 Supabase 연결 후 재확인이 필요하다.

## 8. `/admin/uploads/[id]` 상세 확인 결과

빌드 결과에서 `/admin/uploads/[id]` route는 정상 포함됐다.

코드상 확인:

- 상세 제목은 주문번호가 없으면 업체명 또는 고객명으로 표시된다.
- 주문번호와 상품명은 빈 값일 때 `-`로 표시되도록 조정했다.
- 연락처, 이메일, 카카오톡 아이디, 상품명, 요청사항, 파일 목록, 검수 로그 표시 구조는 유지했다.

제한:

- 실제 DB 레코드가 없어 상세 페이지 데이터 로드는 확인하지 못했다.

## 9. 관리자 다운로드 확인 결과

완전한 관리자 다운로드 왕복은 확인하지 못했다.

이유:

- 관리자 다운로드 API는 DB에서 파일 메타데이터를 찾은 뒤 signed URL을 발급하는 구조다.
- 현재 DB 저장과 조회가 실패하므로 실제 관리자 다운로드 API E2E는 막힌다.

대신 확인한 것:

- local object route에서 signed PUT/GET은 정상 동작했다.
- public direct URL을 노출하는 방식이 아니라 서버가 검증한 URL을 통해 접근하는 구조를 유지한다.

## 10. 상태 변경/검수 메모 확인 결과

코드상 상태 변경/검수 메모 route와 UI는 빌드에 포함되어 있다.

확인된 route:

- `/api/admin/uploads/[id]/status`
- `/api/admin/uploads/[id]/review-log`

제한:

- 실제 상태 변경, 검수 메모 저장, 검수 로그 생성은 DB 연결 문제로 E2E 확인하지 못했다.
- Supabase/PostgreSQL 연결 후 관리자 로그인 상태에서 재검증해야 한다.

## 11. 위험 파일 차단 확인 결과

API 및 유틸 테스트로 확인했다.

API 차단 확인:

- `script.js`: HTTP 400
- `malware.exe`: HTTP 400
- `shell.sh`: HTTP 400
- `design.pdf` + `text/html`: HTTP 400
- `image.png` + `application/pdf`: HTTP 400
- `../escape.pdf`: HTTP 400

회귀 테스트로 확인한 차단 확장자:

- HTML
- JS
- EXE
- BAT
- CMD
- SH
- PHP

## 12. MIME mismatch 확인 결과

확인 결과:

- `proof.pdf` + `text/html`: 차단
- `proof.pdf` + `image/png`: 차단
- `image.png` + `application/pdf`: API에서 HTTP 400
- 정상 `image/png`: 허용

MIME mismatch는 DB 조회 전에 차단된다.

## 13. 주문번호 optional 처리 결과

고객 화면과 API 스키마를 조정했다.

변경 내용:

- 고객 화면의 `Cafe24 주문번호` required 제거
- `uploadProjectCreateSchema.cafe24OrderNumber` optional 처리
- API 저장 시 주문번호가 없으면 기존 DB non-null 구조를 깨지 않도록 빈 문자열로 저장
- 관리자 목록/상세에서는 빈 주문번호를 `-`로 표시
- 업로드 완료 redirect는 주문번호가 있을 때만 query string에 포함

주의:

- DB schema의 `cafe24OrderNumber String`은 이번 작업에서 nullable로 바꾸지 않았다.
- 기존 데이터와 migration 충돌을 피하기 위해 DB 구조 변경은 보류했다.

## 14. 카카오톡 아이디 고객 화면 제거 결과

고객 업로드 화면에서 카카오톡 아이디 입력을 제거했다.

변경 내용:

- 고객 form payload에서 `kakaoId` 제거
- 고객 화면 입력 필드 제거
- 고객 화면에서 `카카오톡` 문구 미노출 확인

유지한 내용:

- `UploadProject.kakaoId` DB 필드는 삭제하지 않았다.
- API schema의 `kakaoId` optional 필드는 유지했다.
- 관리자 상세의 기존 카카오톡 아이디 표시 row는 유지했다.

## 15. 모바일 390px 확인 결과

Playwright/Chrome 기준 390px viewport로 확인했다.

확인 결과:

- `/upload`: `clientWidth 390`, `scrollWidth 390`, overflow 없음
- `/upload/success`: `clientWidth 390`, `scrollWidth 390`, overflow 없음
- `/admin/uploads`: 비로그인 상태에서 `/admin/login` redirect, overflow 없음
- 콘솔 오류 없음

## 16. 실행한 명령과 결과

실행 명령:

```bash
pnpm test
```

결과:

- 통과
- 37 test files passed
- 179 tests passed

실행 명령:

```bash
pnpm exec vitest run src/test/print-file-upload.test.ts
```

결과:

- 통과
- `src/test/print-file-upload.test.ts` 18 tests passed

실행 명령:

```bash
pnpm exec tsc --noEmit
```

결과:

- 통과

실행 명령:

```bash
pnpm build
```

결과:

- 통과
- `/upload`, `/upload/success`, `/admin/uploads`, `/admin/uploads/[id]`, 업로드 API/admin API route 포함 확인

참고:

- dev server를 켠 상태에서 첫 `pnpm build`는 Prisma client DLL 파일 잠금으로 실패했다.
- QA dev server를 종료한 뒤 다시 실행하니 정상 통과했다.

실행 명령:

```bash
pnpm deployment:check
```

결과:

- 실패
- 현재 shell 기준 필수 환경변수 누락
- 누락 항목: `DATABASE_URL`, `DIRECT_URL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`, `SITE_ACCESS_ENABLED`, Naver Object Storage 설정값

실행 명령:

```bash
pnpm prisma migrate status
```

결과:

- 실패
- `DIRECT_URL` 누락

## 17. 수정한 파일 목록

수정:

- `src/app/upload/page.tsx`
- `src/components/PrintFileUploadForm.tsx`
- `src/components/PrintFileUploadSuccessDetails.tsx`
- `src/app/api/uploads/projects/route.ts`
- `src/app/admin/uploads/page.tsx`
- `src/app/admin/uploads/[id]/page.tsx`
- `src/lib/print-file-upload-schema.ts`
- `src/test/print-file-upload.test.ts`

생성:

- `docs/gpt-report-upload-mvp-qa-before-upload-box-20260626.md`

## 18. 발견한 문제

핵심 문제:

- 현재 로컬 DB 환경이 Prisma PostgreSQL schema와 맞지 않는다.
- `.env.local`의 DB URL은 SQLite 형식이고 `DIRECT_URL`이 없다.
- 이 상태에서는 `/api/uploads/projects`가 실제 DB 저장 단계에서 500으로 실패한다.

추가로 발견한 문제:

- 기존에는 `../escape.pdf` 같은 path traversal 스타일 파일명이 API prepare 단계에서 DB 조회까지 내려갈 수 있었다.
- 이번 작업에서 파일 검증 유틸과 prepare schema에 경로 문자 차단을 추가해 HTTP 400으로 일찍 막도록 보강했다.

## 19. 남은 위험 요소

- Supabase migration 적용 여부 미확인
- 실제 Supabase DB 저장/조회/다운로드 미확인
- 관리자 로그인 후 목록/상세/상태 변경/검수 로그 E2E 미확인
- Naver Object Storage 실제 signed PUT/GET 미확인
- 운영 관리자 인증/권한 정책 최종 확인 필요
- DB의 `cafe24OrderNumber`, `productName` non-null 구조를 장기적으로 어떻게 유지할지 결정 필요

## 20. UploadBox 구현 착수 가능 여부

판단: 아직 바로 착수하지 않는 것이 맞다.

이유:

- 기존 `/upload` MVP의 UI, 파일 검증, 빌드, 타입 검사는 안정화됐다.
- 하지만 실제 DB 저장/조회/관리자 검수/다운로드 왕복이 현재 환경에서 완료되지 않았다.
- UploadBox는 이 MVP보다 권한/토큰/폴더형 UX/다운로드 제한이 더 중요하므로, 먼저 Supabase/PostgreSQL QA 환경을 맞추고 기존 MVP 왕복을 통과시켜야 한다.

조건부 착수 가능 기준:

1. Supabase `DATABASE_URL`, `DIRECT_URL` 등록
2. migration 적용
3. `/upload` 프로젝트 생성 성공
4. 파일 prepare, signed PUT, complete 성공
5. `/upload/success` 접수 정보와 파일 목록 표시
6. `/admin/uploads` 목록 조회 성공
7. `/admin/uploads/[id]` 상세 조회 성공
8. 관리자 다운로드 성공
9. 상태 변경/검수 메모/검수 로그 저장 성공

위 9개가 통과하면 UploadBox 설계 구현으로 넘어가도 된다.

## 21. 다음 단계 제안

1. Supabase/PostgreSQL QA 환경을 먼저 연결한다.
2. `DIRECT_URL`을 포함해 Prisma migration 상태를 확인한다.
3. Naver Object Storage QA bucket 또는 local provider 중 하나를 명확히 선택한다.
4. 기존 `/upload` MVP 실제 왕복 QA를 다시 실행한다.
5. 관리자 로그인 후 목록/상세/다운로드/상태 변경까지 확인한다.
6. 통과 후 UploadBox를 별도 feature로 시작한다.

UploadBox 다음 설계 방향은 기존 보고서의 방향을 유지한다.

- 관리자 생성형 업로드 박스
- 고객 전용 `/upload/box/[token]`
- PUT 전용 signed URL
- 고객은 업로드만 가능
- 관리자만 다운로드/검수/수정 요청 가능
- 고객 삭제/이동/이름 변경/다운로드 권한 없음
