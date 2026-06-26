# GPT 보고용: 페르패키지 고객용 인쇄파일 업로드 운영 보강

작성일: 2026-06-26  
프로젝트: `perpackage-marketing-leads`

## 1. 한 줄 요약

Cafe24 주문번호를 기준으로 고객이 `/upload`에서 인쇄파일을 업로드하고, 관리자가 `/admin/uploads`에서 파일 확인, 다운로드, 상태 변경, 수정 요청/검수 메모를 남길 수 있도록 기존 MVP를 운영형에 가깝게 보강했다.

## 2. 이번에 완료한 일

- 고객 업로드 화면 `/upload` 유지 및 입력 항목 보강
- 업로드 완료 화면 `/upload/success`에 주문번호, 접수 시간, 파일 목록 표시
- 고객 연락 필드 추가
  - 업체명
  - 업체명 또는 고객명
  - 담당자명
  - 연락처
  - 이메일
  - 카카오톡 아이디
  - 기타 연락 방법
  - 개인정보 동의
- 허용 확장자 보강
  - `pdf`, `ai`, `eps`, `svg`, `dxf`, `psd`, `zip`, `jpg`, `jpeg`, `png`
- 위험 파일 차단
  - `html`, `js`, `exe`, `bat`, `cmd`, `sh`, `php` 등
- MIME type 검증과 확장자/MIME mismatch 차단 추가
- 로컬 개발용 private storage fallback 추가
- 관리자 다운로드 API가 local signed URL도 처리하도록 보강
- 관리자 목록 검색에 업체명/담당자명 포함
- `.local-print-file-storage`를 `.gitignore`에 추가
- 테스트 코드 보강
  - DXF 허용
  - 위험 MIME 차단
  - 개인정보 동의 필수
  - local signed token 검증
  - 관리자 검색 필드 확인
- 환경 체크에서 누락 변수 중복 제거
- 보고서 작성

## 3. 새 DB 변경

기존 `UploadProject` 모델에 운영 접수에 필요한 최소 필드를 추가했다.

```txt
companyName
contactName
kakaoId
contactMethod
privacyAgreed
```

Migration:

```txt
prisma/migrations/20260626093000_add_upload_customer_contact_fields/migration.sql
```

기존 데이터 보호:

- 새 문자열 필드는 nullable
- `privacyAgreed`는 `false` 기본값
- 기존 `UploadedFile`, `FileReviewLog` 구조는 유지
- 파일 바이너리는 DB에 저장하지 않음

## 4. 스토리지 방식

운영 기본:

- Naver Object Storage
- S3-compatible adapter
- signed URL 업로드/다운로드

저장 경로:

```txt
print-files/{projectId}/{version}/{safeFilename}
```

로컬 개발:

- `PRINT_FILE_STORAGE_PROVIDER=local`
- `.local-print-file-storage`에 저장
- HMAC token 기반 PUT/GET
- 관리자 다운로드 API를 통해서만 접근

## 5. 추가/보강 API

고객:

- `POST /api/uploads/projects`
- `POST /api/uploads/files`
- `PUT /api/uploads/local-object`
- `GET /api/uploads/local-object`

관리자:

- `GET /api/admin/uploads`
- `GET /api/admin/uploads/[id]`
- `GET /api/admin/uploads/[id]/files/[fileId]/download`
- `PATCH /api/admin/uploads/[id]/status`
- `POST /api/admin/uploads/[id]/review-log`

## 6. 고객 화면 정책

고객 화면에는 다음을 노출하지 않는다.

- 관리자 URL
- Cafe24 관리자 경로
- storage key
- public direct file URL
- TODO/placeholder/미구현/임시/테스트 문구
- 확정 견적, 자동 결제, 자동 제작, 제작 확정처럼 오해될 문구

업로드 완료 화면 문구는 “파일 접수”와 “담당자 확인 후 안내” 흐름으로 유지했다.

## 7. 환경변수

업로드 허브 관련:

```txt
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
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

실제 secret 값은 코드와 보고서에 기록하지 않았다.

## 8. 검증 결과

실행 성공:

```txt
git diff --check
```

결과:

```txt
통과
```

실행 실패:

```txt
pnpm test
pnpm exec tsc --noEmit
pnpm build
node --version
npm --version
corepack --version
```

사유:

```txt
현재 PowerShell PATH에 pnpm/node/npm/corepack이 없어 명령을 찾을 수 없음
```

정적 확인:

- 고객 화면 금지 문구 스캔 완료
- secret hardcoding 없음
- `.env.example`에는 예시 변수명만 유지
- local storage 폴더 Git ignore 처리
- 관리자 인증 필요한 다운로드 API 유지

미완료 검증:

- dev server 실행
- `/upload` 실제 렌더링
- 실제 파일 업로드 왕복
- `/upload/success` 실제 화면
- `/admin/uploads` 실제 목록 표시
- `/admin/uploads/[id]` 실제 상세 표시
- 390px 모바일 overflow 확인
- 브라우저 콘솔 오류 확인

## 9. 아직 만들지 않은 기능

- 결제
- 세금계산서
- 전자계약
- 실시간 채팅
- WebSocket
- Supabase Realtime
- 읽음 처리
- 메시지 알림
- Cafe24 API 자동 검증
- Cafe24 OAuth
- Cafe24 Webhook
- 고객 상태 조회 페이지
- 전개도 에디터
- 자동 인쇄용 PDF 생성

## 10. 다음 단계

1. Node/pnpm이 잡힌 환경에서 `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm build`
2. Prisma migration 적용
3. Naver Object Storage 실제 bucket 연결
4. `/upload`에서 실제 파일 업로드 QA
5. 관리자 다운로드, 상태 변경, 수정 요청 로그 QA
6. 390px 모바일 overflow와 콘솔 오류 확인
7. Cafe24 주문 완료 화면에 `/upload` 안내 링크 삽입
8. Cafe24 주문 API 기반 주문번호 검증을 다음 단계로 설계
