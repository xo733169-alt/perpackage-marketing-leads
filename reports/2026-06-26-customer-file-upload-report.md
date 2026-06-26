# 페르패키지 고객용 인쇄파일 업로드 운영 보강 보고서

작성일: 2026-06-26  
대상 프로젝트: `perpackage-marketing-leads`

## 1. 작업 목적

기존 주문번호 기반 인쇄파일 업로드 허브를 실제 운영에 더 가깝게 보강했다. 고객은 `/upload`에서 Cafe24 주문번호와 담당자 정보를 입력하고 파일을 올릴 수 있고, 관리자는 `/admin/uploads` 및 `/admin/uploads/[id]`에서 접수 건, 업로드 파일, 검수 상태, 수정 요청/검수 로그를 확인할 수 있는 흐름을 유지했다.

이번 작업은 결제, 세금계산서, 전자계약, 실시간 채팅, WebSocket, Supabase Realtime, Cafe24 API/Webhook 연동이 아니다.

## 2. 수정/추가한 주요 파일

수정:

- `.env.example`
- `.gitignore`
- `prisma/schema.prisma`
- `src/lib/deployment-env.ts`
- `src/lib/admin-uploads.ts`
- `src/test/deployment-env.test.ts`
- `src/test/print-file-upload.test.ts`
- `src/app/api/uploads/local-object/route.ts`
- `src/app/api/uploads/projects/route.ts`
- `src/components/PrintFileUploadForm.tsx`
- `src/app/upload/success/page.tsx`
- `src/app/admin/uploads/page.tsx`
- `src/app/admin/uploads/[id]/page.tsx`

추가:

- `prisma/migrations/20260626093000_add_upload_customer_contact_fields/migration.sql`
- `src/components/PrintFileUploadSuccessDetails.tsx`
- `src/lib/storage/local-print-file-storage.ts`
- `src/app/api/uploads/local-object/route.ts`
- `reports/2026-06-26-customer-file-upload-report.md`
- `reports/2026-06-26-customer-file-upload-gpt-report.md`

기존 MVP에서 이미 추가된 파일:

- `src/app/upload/page.tsx`
- `src/app/api/uploads/files/route.ts`
- `src/app/admin/uploads/page.tsx`
- `src/app/admin/uploads/[id]/page.tsx`
- `src/components/AdminUploadReviewPanel.tsx`
- `src/lib/print-file-upload-schema.ts`
- `src/lib/storage/storage-adapter.ts`
- `src/lib/storage/naver-object-storage.ts`
- `src/lib/storage/upload-path.ts`

## 3. 고객 화면 경로

선택 경로: `/upload`

선택 이유:

- 이전 MVP에서 이미 `/upload`로 설계되어 있었다.
- Cafe24 스마트디자인, Pluuug/Plugo 견적문의, 기존 홈페이지 페이지 구조와 충돌하지 않는다.
- 고객에게 안내하기 쉬운 짧은 공개 경로다.

보강 내용:

- 주문번호 필수 입력
- 업체명 또는 고객명, 담당자명, 연락처, 이메일, 카카오톡 아이디, 기타 연락 방법 입력
- 개인정보 수집/이용 동의 필수
- 여러 파일 드래그앤드롭 및 파일 선택 업로드
- 대용량 파일은 ZIP 압축 안내
- SVG 제작 전 확인 안내
- 업로드 완료 후 `/upload/success`에서 주문번호, 접수 시간, 업로드 파일 목록 표시

고객 화면 금지 문구 확인:

- `TODO`
- `placeholder`
- `미구현`
- `임시`
- `테스트`
- `확정 견적`
- `자동 제작`
- `제작 확정`
- `결제 완료 즉시 인쇄`
- `당일 제작`
- `무조건 제작`
- `인쇄 포함 확정가`
- `바로 제작`
- `파일 업로드 즉시 제작`

위 표현이 고객 업로드 화면에 노출되지 않도록 스캔했다.

## 4. API 보강

고객 API:

- `POST /api/uploads/projects`
  - 주문번호 기반 업로드 프로젝트 생성
  - 고객/담당자 연락 필드 저장
  - 개인정보 동의 저장

- `POST /api/uploads/files`
  - `prepare`: 파일 메타데이터 검증 후 저장소 업로드 URL 생성
  - `complete`: 저장소 업로드 확인 후 DB 메타데이터 확정
  - 파일 바이너리는 DB에 저장하지 않음

- `PUT /api/uploads/local-object`
  - `PRINT_FILE_STORAGE_PROVIDER=local`일 때만 동작
  - HMAC 토큰이 포함된 짧은 URL로 로컬 개발용 파일 저장

- `GET /api/uploads/local-object`
  - local provider용 다운로드 URL 처리
  - 관리자 다운로드 API가 발급한 signed URL을 통해서만 사용

관리자 API:

- `GET /api/admin/uploads`
- `GET /api/admin/uploads/[id]`
- `GET /api/admin/uploads/[id]/files/[fileId]/download`
- `PATCH /api/admin/uploads/[id]/status`
- `POST /api/admin/uploads/[id]/review-log`

관리자 다운로드는 관리자 인증 후 서버 API를 거쳐 signed URL 또는 local signed URL로 연결한다. 고객 화면에는 storage key나 public direct URL을 노출하지 않는다.

## 5. DB schema 변경

기존 모델은 재사용했다.

- `UploadProject`
- `UploadedFile`
- `FileReviewLog`

이번 보강에서 `UploadProject`에 최소 필드를 추가했다.

```txt
companyName
contactName
kakaoId
contactMethod
privacyAgreed
```

추가 migration:

```txt
prisma/migrations/20260626093000_add_upload_customer_contact_fields/migration.sql
```

설계 이유:

- 고객 업로드 접수에는 담당자명과 연락 방식이 필요하다.
- 개인정보 동의 여부는 운영 전 감사와 문의 대응에 필요하다.
- 기존 rows를 깨지 않도록 새 필드는 nullable 또는 default 값을 사용했다.
- 파일 바이너리는 계속 DB에 저장하지 않고, DB에는 storage key와 메타데이터만 저장한다.

## 6. 스토리지 저장 방식

기본 운영 방향:

- Naver Object Storage
- `@aws-sdk/client-s3`
- `@aws-sdk/s3-request-presigner`

Adapter 구조:

- `src/lib/storage/storage-adapter.ts`
- `src/lib/storage/naver-object-storage.ts`
- `src/lib/storage/local-print-file-storage.ts`
- `src/lib/storage/upload-path.ts`

저장 prefix:

```txt
print-files/{projectId}/{version}/{safeFilename}
```

첨부 요청서에는 `upload-files/{projectId}/{safeFilename}` 예시가 있었지만, 기존 MVP에서 이미 `print-files/{projectId}/{version}/{safeFilename}`로 설계되어 있었다. 인쇄파일 전용 prefix가 더 명확하고, 파일 재업로드/버전 관리에 유리해서 기존 prefix를 유지했다.

로컬 fallback:

- `PRINT_FILE_STORAGE_PROVIDER=local`
- `.local-print-file-storage` 아래 저장
- `.gitignore`에 `.local-print-file-storage` 추가
- signed token 검증 후 PUT/GET 허용
- 운영 기본 저장소는 local이 아니라 Naver Object Storage

## 7. 파일 허용/차단 정책

허용 확장자:

- `ai`
- `pdf`
- `eps`
- `svg`
- `dxf`
- `psd`
- `zip`
- `jpg`
- `jpeg`
- `png`

차단 확장자:

- `html`
- `htm`
- `js`
- `mjs`
- `cjs`
- `exe`
- `bat`
- `cmd`
- `sh`
- `php`
- `jar`
- `msi`
- `scr`
- `ps1`

검증 내용:

- 파일명 존재 여부
- 확장자 허용 여부
- 위험 확장자 차단
- 위험 MIME type 차단
- 확장자와 MIME type 불일치 차단
- 일반 파일 최대 용량
- ZIP 파일 최대 용량
- 프로젝트 전체 용량
- 저장 파일명 sanitize
- path traversal 방지

## 8. 관리자 확인 흐름

목록 `/admin/uploads`:

- 주문번호
- 업체명/고객명
- 담당자명
- 상품명
- 업로드 파일 수
- 업로드 상태
- 검수 상태
- 최근 업로드 시간
- 상세 보기

검색 보강:

- 주문번호
- 업체명
- 담당자명
- 고객명
- 상품명
- 상품 옵션

상세 `/admin/uploads/[id]`:

- 주문번호
- 업체명
- 업체명 또는 고객명
- 담당자명
- 연락처
- 이메일
- 카카오톡 아이디
- 기타 연락 방법
- 개인정보 동의 여부
- 상품명/상품 옵션
- 고객 요청사항
- 파일명, 확장자, MIME type, 용량, 버전, 업로드 시간
- 관리자 인증 후 다운로드 링크
- 검수 상태 변경
- 관리자 메모
- 수정 요청/검수 메모 작성
- FileReviewLog 기반 시간 표시

시간 표시:

- `Asia/Seoul`
- `오늘 15:32`
- `어제 18:10`
- `2026.06.25 15:32`

## 9. 환경변수

업로드 허브 관련:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
UPLOAD_MAX_FILE_SIZE_MB
UPLOAD_MAX_ZIP_SIZE_MB
UPLOAD_MAX_PROJECT_SIZE_MB
UPLOAD_ALLOWED_EXTENSIONS
UPLOAD_SIGNED_URL_EXPIRES_SECONDS
PRINT_FILE_STORAGE_PROVIDER
UPLOAD_LOCAL_STORAGE_DIR
UPLOAD_LOCAL_STORAGE_SECRET
ADMIN_UPLOAD_ACCESS_MODE
NAVER_OBJECT_STORAGE_ENDPOINT
NAVER_OBJECT_STORAGE_REGION
NAVER_OBJECT_STORAGE_BUCKET
NAVER_OBJECT_STORAGE_ACCESS_KEY
NAVER_OBJECT_STORAGE_SECRET_KEY
```

주의:

- 실제 key/secret/service role 값은 코드와 보고서에 넣지 않았다.
- `.env.example`에는 예시 변수명과 빈 값만 둔다.
- `PRINT_FILE_STORAGE_PROVIDER=naver-object-storage`가 운영 기본 방향이다.
- local provider는 개발용 fallback이다.

## 10. 검증 결과

실행한 명령:

```txt
git diff --check
pnpm test
pnpm exec tsc --noEmit
pnpm build
node --version
npm --version
corepack --version
```

결과:

- `git diff --check`: 통과
- `pnpm test`: 실행 불가
- `pnpm exec tsc --noEmit`: 실행 불가
- `pnpm build`: 실행 불가
- `node --version`: 실행 불가
- `npm --version`: 실행 불가
- `corepack --version`: 실행 불가

실행 불가 사유:

```txt
pnpm/node/npm/corepack이 현재 PowerShell PATH에 없어 명령을 찾을 수 없음
```

정적 확인:

- 고객 업로드 화면 금지 문구 스캔 완료
- 고객 화면에 관리자 URL/Cafe24 관리자 경로가 노출되지 않도록 확인
- 실제 secret hardcoding 없음
- `.local-print-file-storage` Git ignore 추가
- 관리자 검색 필드에 업체명/담당자명 포함
- 테스트 코드에 DXF, MIME 차단, 개인정보 동의, local signed token 검증 추가

브라우저 QA 미완료:

- 현재 셸에서 Node/pnpm이 없어 dev server를 시작하지 못했다.
- `/upload`, `/upload/success`, `/admin/uploads`, `/admin/uploads/[id]` 실제 렌더링과 390px 모바일 overflow 검증은 다음 실행 환경에서 확인해야 한다.

## 11. 운영 배포 전 확인 항목

- Prisma migration 적용
- Vercel 환경변수 등록
- Naver Object Storage bucket, endpoint, region, access key, secret key 등록
- Naver Object Storage CORS에서 signed PUT 허용 확인
- 업로드 최대 용량이 Vercel Function/브라우저/스토리지 정책과 충돌하지 않는지 확인
- 관리자 인증 정책 유지 확인
- 관리자 다운로드 API가 비로그인 상태에서 401을 반환하는지 확인
- local provider를 운영에 사용하지 않도록 확인
- 개인정보 보관 기간과 삭제 정책 확정

## 12. 이번에 만들지 않은 기능

- 결제 기능
- 세금계산서 기능
- 전자계약 기능
- 실시간 채팅
- WebSocket
- Supabase Realtime
- 읽음 처리
- 메시지 알림
- Cafe24 API 주문번호 자동 검증
- Cafe24 OAuth
- Cafe24 Webhook
- 고객 상태 조회 페이지
- 전개도 에디터
- 자동 인쇄용 PDF 생성

제외 이유:

- 이번 목표는 고객 업로드와 관리자 검수 흐름 안정화다.
- 결제/세금/계약은 업로드 허브와 책임 범위가 다르다.
- 실시간 채팅은 별도 메시지 테이블, 고객 인증, 읽음 처리, 알림 정책이 필요하다.
- Cafe24 API/Webhook은 주문 검증과 자동 프로젝트 생성 단계로 별도 분리하는 편이 안전하다.

## 13. 다음 작업 제안

1. Node/pnpm이 있는 환경에서 `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm build` 재실행
2. Prisma migration 운영 DB 적용
3. Naver Object Storage 실제 bucket으로 업로드/다운로드 왕복 테스트
4. 브라우저에서 `/upload` 실제 파일 업로드 QA
5. 관리자 다운로드/상태 변경/수정 요청 로그 QA
6. 모바일 390px overflow 및 콘솔 오류 확인
7. Cafe24 주문 완료 화면에 `/upload` 안내 링크 삽입
8. 다음 단계에서 Cafe24 주문 API 기반 주문번호 검증 설계
