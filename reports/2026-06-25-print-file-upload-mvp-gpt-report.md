# GPT 보고용: 페르패키지 주문번호 기반 인쇄파일 업로드 허브 1차 MVP

작성일: 2026-06-25  
프로젝트 위치: `C:\Users\inh78\OneDrive\문서\홈페이지 개발\perpackage-marketing-leads`

## 1. 작업 목표

Cafe24에서 고객이 기성품을 주문한 뒤 발급받은 주문번호를 기준으로 인쇄파일을 업로드하고, 관리자가 파일 목록과 상세 정보를 확인해 검수 상태를 변경할 수 있는 1차 MVP 뼈대를 구현했다.

이번 단계는 Cafe24 주문, 결제, OAuth, Webhook, 전개도 에디터를 대체하거나 연동하는 작업이 아니다. 고객이 주문번호를 직접 입력하고, 파일은 Naver Object Storage에 저장하는 방향의 adapter를 통해 처리하며, DB에는 파일 메타데이터와 검수 상태만 저장하는 구조다.

## 2. 구현 완료 요약

- 고객용 업로드 페이지 `/upload` 추가
- 업로드 완료 페이지 `/upload/success` 추가
- 주문번호 기반 업로드 프로젝트 생성 API 추가
- 파일 업로드 API 추가
- Naver Object Storage용 S3-compatible storage adapter 뼈대 추가
- Prisma 기반 DB 모델과 migration 추가
- 관리자 업로드 목록 페이지 `/admin/uploads` 추가
- 관리자 업로드 상세 페이지 `/admin/uploads/[id]` 추가
- 관리자 검수 상태 변경, 관리자 메모, 수정 요청 로그 저장 API 추가
- 관리자 파일 다운로드는 public direct URL 대신 서버 경유 signed URL 구조로 설계
- `.env.example`에 필요한 환경변수 예시 추가
- MVP 보고서와 환경변수 가이드 문서 추가
- 테스트, 타입체크, 린트, 빌드 검증 완료

## 3. 새로 만든 페이지

- `/upload`
  - 고객이 주문번호, 고객명, 연락처, 이메일, 상품명, 요청사항, 인쇄파일을 입력한다.
  - 금지 문구와 미구현 문구가 고객 화면에 노출되지 않도록 작성했다.
  - 390px 모바일 폭에서 가로 overflow가 없음을 확인했다.

- `/upload/success`
  - 업로드 완료 안내 페이지다.
  - 제작 확정, 확정 견적, 즉시 제작처럼 보이는 문구를 넣지 않았다.

- `/admin/uploads`
  - 관리자 업로드 목록 페이지다.
  - 주문번호, 고객명, 상품명, 파일 수, 상태, 검수 상태, 최근 업로드 일시, 상세 보기 구조를 준비했다.
  - 기존 관리자 인증 흐름이 적용되어 비로그인 접근 시 관리자 로그인 화면으로 연결되는 것을 확인했다.

- `/admin/uploads/[id]`
  - 관리자 업로드 상세 페이지다.
  - 고객 정보, 요청사항, 파일 목록, 파일 크기, 파일 형식, 버전, 업로드 일시, 검수 상태, 관리자 메모, 수정 요청 메시지, 상태 변경 UI를 제공한다.

## 4. 새로 만든 API route

- `POST /api/uploads/projects`
  - 주문번호 기반 업로드 프로젝트를 생성한다.
  - Cafe24 API 검증은 하지 않고 고객 입력값을 저장한다.

- `POST /api/uploads/files`
  - 업로드 파일을 storage adapter로 저장하고 DB에는 메타데이터만 저장한다.
  - 확장자, 용량, 파일명 sanitize 검사를 적용했다.

- `GET /api/admin/uploads`
  - 관리자 업로드 목록 조회 API다.
  - 검색어와 상태 필터 구조를 지원한다.

- `GET /api/admin/uploads/[id]`
  - 관리자 업로드 상세 조회 API다.

- `PATCH /api/admin/uploads/[id]/status`
  - 검수 상태와 관리자 메모를 변경한다.

- `POST /api/admin/uploads/[id]/review-log`
  - 수정 요청 메시지 또는 검수 로그를 저장한다.

- `GET /api/admin/uploads/[id]/files/[fileId]/download`
  - 관리자 파일 다운로드용 API다.
  - storage key를 고객 화면이나 public URL로 직접 노출하지 않는 방향이다.

## 5. DB 설계 방식

Prisma schema에 다음 모델을 추가했다.

- `UploadProject`
  - 주문번호, 고객명, 연락처, 이메일, 상품명, 상품 옵션, 요청사항, 상태, 검수 상태, 관리자 메모, 생성/수정 일시를 저장한다.

- `UploadedFile`
  - 프로젝트 ID, 원본 파일명, 저장 파일명, bucket, storage key, 파일 크기, MIME type, 확장자, 버전, 검수 상태, 업로드 일시를 저장한다.

- `FileReviewLog`
  - 프로젝트 ID, 파일 ID, 상태, 메시지, 작성자, 생성 일시를 저장한다.

추가 migration:

- `prisma/migrations/20260625090000_add_print_file_upload_hub/`

중요: 파일 바이너리는 DB에 저장하지 않는다. 운영 DB에는 migration 적용이 별도로 필요하다.

## 6. Storage adapter 방식

추가 파일:

- `src/lib/storage/storage-adapter.ts`
- `src/lib/storage/naver-object-storage.ts`
- `src/lib/storage/upload-path.ts`

설계 방향:

- `@aws-sdk/client-s3` 기반 S3-compatible client 구조
- Naver Object Storage endpoint, region, bucket, access key, secret key는 환경변수로만 주입
- 실제 인증키 하드코딩 없음
- 저장 경로는 `print-files/{projectId}/{version}/{safeFilename}` 형식
- 파일명 sanitize 처리
- 추후 Supabase Storage, Vercel Blob, AWS S3로 교체할 수 있도록 adapter 인터페이스 분리
- 다운로드는 `@aws-sdk/s3-request-presigner` 기반 signed URL 구조

## 7. 파일 업로드 제한

허용 확장자:

- `ai`, `pdf`, `eps`, `psd`, `zip`, `jpg`, `jpeg`, `png`, `svg`

용량 기준:

- 일반 파일 최대 100MB
- ZIP 파일 최대 300MB
- 프로젝트 전체 1GB 제한으로 확장 가능한 구조

SVG는 업로드 가능하지만 제작 전 확인이 필요한 파일 형식으로 안내한다.

## 8. 환경변수 목록

`.env.example`에 예시 변수명만 추가했다.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NAVER_OBJECT_STORAGE_ENDPOINT`
- `NAVER_OBJECT_STORAGE_REGION`
- `NAVER_OBJECT_STORAGE_BUCKET`
- `NAVER_OBJECT_STORAGE_ACCESS_KEY`
- `NAVER_OBJECT_STORAGE_SECRET_KEY`
- `UPLOAD_MAX_FILE_SIZE_MB`
- `UPLOAD_MAX_ZIP_SIZE_MB`
- `UPLOAD_ALLOWED_EXTENSIONS`
- `ADMIN_UPLOAD_ACCESS_MODE`

실제 운영 키, secret key, service role key는 코드와 문서에 넣지 않았다.

## 9. 주요 수정 파일

- `.env.example`
- `package.json`
- `pnpm-lock.yaml`
- `prisma/schema.prisma`
- `src/app/globals.css`
- `src/components/AdminNav.tsx`
- `src/lib/deployment-env.ts`

## 10. 주요 신규 파일

- `src/app/upload/page.tsx`
- `src/app/upload/success/page.tsx`
- `src/components/PrintFileUploadForm.tsx`
- `src/app/api/uploads/projects/route.ts`
- `src/app/api/uploads/files/route.ts`
- `src/app/admin/uploads/page.tsx`
- `src/app/admin/uploads/[id]/page.tsx`
- `src/components/AdminUploadReviewPanel.tsx`
- `src/app/api/admin/uploads/route.ts`
- `src/app/api/admin/uploads/[id]/route.ts`
- `src/app/api/admin/uploads/[id]/status/route.ts`
- `src/app/api/admin/uploads/[id]/review-log/route.ts`
- `src/app/api/admin/uploads/[id]/files/[fileId]/download/route.ts`
- `src/lib/admin-uploads.ts`
- `src/lib/print-file-upload-schema.ts`
- `src/lib/storage/storage-adapter.ts`
- `src/lib/storage/naver-object-storage.ts`
- `src/lib/storage/upload-path.ts`
- `src/test/print-file-upload.test.ts`
- `reports/2026-06-25-print-file-upload-mvp-report.md`
- `reports/2026-06-25-print-file-upload-env-guide.md`

## 11. 검증 결과

실행 완료:

- `pnpm test`
  - 37개 test file, 170개 test 통과
- `pnpm exec tsc --noEmit`
  - 통과
- `pnpm lint`
  - warning/error 없음
- `pnpm build`
  - 통과

브라우저/HTTP 확인:

- `/upload` 200 확인
- `/upload/success` 200 확인
- `/admin/uploads`는 비로그인 상태에서 관리자 로그인 흐름으로 연결 확인
- `/upload` 390px 모바일 폭에서 `scrollWidth=390`, 가로 overflow 없음 확인

문구/보안 확인:

- 고객 화면에 `TODO`, `placeholder`, `미구현` 문구 없음
- 고객 화면에 관리자 URL, Cafe24 관리자 경로 노출 없음
- 금지 표현 없음
- 실제 secret hardcoding 없음

## 12. 이번에 일부러 제외한 기능

- Cafe24 API 자동연동
- Cafe24 OAuth 토큰 연동
- Cafe24 Webhook 연동
- Cafe24 주문, 결제, 회원, 장바구니 대체 기능
- 전개도 에디터
- 자동 인쇄용 PDF 생성
- 세금계산서, 환불계좌, 가상계좌 기능
- Vercel Blob 기본 저장소 사용
- Supabase Storage 기본 저장소 사용

제외 이유:

- 이번 1차 목표는 주문번호 기반 업로드와 관리자 검수 뼈대를 먼저 안정화하는 것이다.
- Cafe24 연동은 주문번호 검증, 주문 완료 페이지 링크 삽입, Webhook 자동 생성 등 별도 단계로 분리하는 편이 안전하다.
- 전개도 에디터와 인쇄용 PDF 생성은 상품별 템플릿, 편집 데이터, 검수, 출력 규격이 함께 맞물리므로 1차 MVP 범위에서 제외했다.

## 13. 기존 기능 보호 상태

보호 대상:

- Cafe24 스마트디자인 스니펫 구조
- `cafe24-snippets` 계열 폴더
- Pluuug/Plugo 견적문의 iframe 구조
- 기존 메인, 카테고리, 상품상세, FAQ, support, guide 페이지
- 카테고리 검색, 필터, 정렬
- 상품 상세 상담형 CTA
- 공통 퀵메뉴

이번 작업에서는 기존 Cafe24/Pluuug 관련 폴더를 수정하지 않았다.

## 14. 운영 전 남은 확인사항

- Supabase 또는 운영 DB에 Prisma migration 적용
- Naver Object Storage bucket, endpoint, region, access key, secret key 등록
- Vercel Production/Preview 환경변수 등록
- Naver Object Storage CORS와 signed URL 정책 확인
- 관리자 인증 정책 최종 확정
- 업로드 최대 용량이 Vercel Function 제한과 충돌하지 않는지 운영 환경에서 확인
- 대용량 파일은 추후 direct-to-storage signed upload 방식 검토
- 관리자 다운로드 로그와 파일 접근 감사 로그 추가 검토

## 15. 다음 단계 제안

1. 운영 DB migration 적용과 Supabase connection 확인
2. Naver Object Storage 실제 bucket 연결 테스트
3. 관리자 권한 정책 확정
4. Cafe24 주문 완료 화면에 `/upload` 안내 링크 삽입
5. Cafe24 주문 API 기반 주문번호 검증 추가
6. Cafe24 Webhook 기반 `upload_project` 자동 생성 검토
7. 상품별 전개도 템플릿 관리와 에디터 MVP 별도 설계

