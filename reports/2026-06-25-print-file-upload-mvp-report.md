# 페르패키지 주문번호 기반 인쇄파일 업로드 허브 1차 MVP 보고서

작성일: 2026-06-25  
대상 프로젝트: `perpackage-marketing-leads`

## 이번 작업 목적

Cafe24에서 기성품을 주문한 고객이 주문번호를 기준으로 인쇄파일을 업로드하고, 관리자가 해당 파일을 확인하고 검수 상태를 관리할 수 있는 1차 MVP 뼈대를 만들었다. 이번 단계는 Cafe24 주문 API 연동 없이 고객이 주문번호를 직접 입력하는 방식이다.

## 만든 페이지

- 고객용 업로드 페이지: `/upload`
- 업로드 완료 페이지: `/upload/success`
- 관리자 업로드 목록: `/admin/uploads`
- 관리자 업로드 상세: `/admin/uploads/[id]`

고객 화면에는 관리자 URL, Cafe24 관리자 경로, TODO, 미구현 안내를 노출하지 않는다.

## 만든 API

- `POST /api/uploads/projects`: 주문번호 기반 업로드 프로젝트 생성
- `POST /api/uploads/files`: Naver Object Storage presigned PUT URL 발급 및 업로드 완료 확인
- `GET /api/admin/uploads`: 관리자 업로드 목록 조회
- `GET /api/admin/uploads/[id]`: 관리자 업로드 상세 조회
- `PATCH /api/admin/uploads/[id]/status`: 검수 상태 및 관리자 메모 저장
- `POST /api/admin/uploads/[id]/review-log`: 수정 요청 또는 검수 메모 기록
- `GET /api/admin/uploads/[id]/files/[fileId]/download`: 관리자 인증 후 signed download URL 발급

## DB 설계

Prisma 모델을 추가했고 실제 테이블명은 snake_case로 매핑했다.

- `upload_projects`: 주문번호, 고객 정보, 상품 정보, 요청사항, 업로드 상태, 검수 상태, 관리자 메모 저장
- `uploaded_files`: 원본 파일명, 안전 저장 파일명, bucket, object key, 파일 크기, 파일 형식, 버전, 업로드 상태, 검수 상태 저장
- `file_review_logs`: 프로젝트 또는 파일 단위 검수 상태와 수정 요청 메시지 기록

파일 바이너리는 DB에 저장하지 않는다. DB에는 파일 메타데이터와 상태만 저장한다.

## Storage adapter 설계

Naver Object Storage를 S3-compatible adapter로 분리했다.

- `src/lib/storage/storage-adapter.ts`: 공통 adapter 타입과 에러
- `src/lib/storage/naver-object-storage.ts`: Naver Object Storage presigned PUT/GET, HeadObject 확인
- `src/lib/storage/upload-path.ts`: `print-files/{projectId}/{version}/{safeFilename}` 경로 생성

Vercel Functions의 요청 본문 제한 때문에 100MB/300MB 파일을 API route가 직접 받지 않는다. API가 signed URL을 발급하고 브라우저가 Naver Object Storage로 직접 PUT 업로드한다.

## 환경변수 목록

- `DATABASE_URL`
- `DIRECT_URL`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_SITE_URL`
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
- `UPLOAD_MAX_PROJECT_SIZE_MB`
- `UPLOAD_ALLOWED_EXTENSIONS`
- `UPLOAD_SIGNED_URL_EXPIRES_SECONDS`
- `ADMIN_UPLOAD_ACCESS_MODE`

실제 비밀키는 코드와 보고서에 넣지 않았다.

## 고객용 업로드 흐름

1. 고객이 Cafe24에서 주문한다.
2. Cafe24 주문 완료 화면 또는 주문 내역에서 주문번호를 확인한다.
3. `/upload`에서 주문번호, 고객 정보, 상품명, 요청사항을 입력한다.
4. 인쇄파일을 선택한다.
5. 서버가 업로드 프로젝트를 생성하고 파일별 presigned URL을 발급한다.
6. 브라우저가 Naver Object Storage로 직접 파일을 전송한다.
7. 서버가 object 존재 여부를 확인하고 파일 메타데이터를 DB에 저장한다.
8. `/upload/success`에서 업로드 완료 안내를 보여준다.

## 관리자 검수 흐름

1. 관리자는 `/admin/login`으로 기존 관리자 인증을 통과한다.
2. `/admin/uploads`에서 주문번호, 고객명, 상품명, 상태 기준으로 업로드 목록을 확인한다.
3. `/admin/uploads/[id]`에서 고객 정보, 요청사항, 파일 목록, 다운로드 링크를 확인한다.
4. 검수 상태를 `검수중`, `수정 요청`, `파일 확인 완료`, `제작 진행 가능`, `보류`로 변경한다.
5. 수정 요청 메시지나 검수 메모를 `file_review_logs`에 저장한다.

## Cafe24와 연결되는 방식

이번 1차에서는 Cafe24 API를 붙이지 않는다.

초기 방식:

- 고객이 Cafe24에서 주문
- 주문번호 확인
- `/upload`에서 주문번호 직접 입력
- 파일 업로드
- 관리자는 Cafe24 주문관리에서 주문번호를 별도로 확인
- 외부 업로드 시스템에서 주문번호와 파일을 연결해 관리

추후 확장:

- Cafe24 주문 API로 주문번호 검증
- Cafe24 Webhook으로 주문 생성 시 `upload_projects` 자동 생성
- 주문 완료 페이지에 업로드 링크 자동 삽입
- 마이페이지 주문 상세에서 파일 업로드 링크 연결

## 이번 작업에서 일부러 만들지 않은 기능

- Cafe24 API 자동연동
- Cafe24 OAuth 토큰 연동
- Cafe24 Webhook 연동
- 전개도 에디터
- 자동 인쇄용 PDF 생성
- Cafe24 주문, 결제, 회원, 장바구니 대체 기능
- 세금계산서, 환불계좌, 가상계좌 기능
- Vercel Blob 또는 Supabase Storage를 인쇄파일 기본 저장소로 사용하는 기능

## 전개도 에디터 추후 확장 계획

- 상품별 전개도 템플릿 관리
- Cafe24 상품 ID와 전개도 템플릿 연결
- 로고, 이미지, 텍스트 배치
- 미리보기 저장
- 에디터 저장 데이터와 주문번호 연결
- 관리자 검수
- 최종 인쇄용 PDF 생성은 별도 단계로 분리

## API/Webhook 추후 확장 계획

- Cafe24 주문번호 검증 API 추가
- Cafe24 주문 생성 Webhook 수신
- 주문 상품별 업로드 프로젝트 자동 생성
- 고객 마이페이지 또는 주문 완료 페이지 업로드 링크 연결
- 검수 상태 알림을 문자, 카카오톡, 이메일, 내부 알림으로 확장

## 보안 주의사항

- 실제 API Key, Secret Key, Supabase Service Role Key는 코드에 하드코딩하지 않는다.
- 고객 업로드 파일은 public direct URL로 노출하지 않는다.
- 관리자 다운로드는 인증된 서버 route에서 signed URL을 발급한다.
- Naver Object Storage bucket CORS에서 운영 도메인의 PUT 요청만 허용해야 한다.
- 관리자 API는 기존 `ADMIN_PASSWORD` 세션을 사용한다.
- Production 배포 전 관리자 비밀번호, site access, storage bucket 권한, signed URL 만료 시간을 확인해야 한다.

## 테스트 결과

추가한 테스트:

- 파일 확장자 허용 목록 확인
- 일반 파일과 ZIP 파일 용량 제한 확인
- 프로젝트 전체 용량 제한 확인
- SVG 안내 조건 확인
- 안전 저장 파일명 생성 확인
- storage key 경로 안전성 확인
- Naver Object Storage 환경변수 누락 시 안전 에러 확인

최종 실행 결과는 작업 완료 보고에서 별도로 정리한다.

## 다음 작업 제안

1. Naver Object Storage bucket CORS와 lifecycle 정책 설정
2. Supabase Production DB에 migration 적용
3. Vercel Preview에서 `/upload` 실제 presigned 업로드 테스트
4. Cafe24 주문 완료 페이지 또는 안내 문구에 `/upload` 링크 연결
5. 검수 상태 알림 자동화 설계
6. Cafe24 주문 API 검증을 2차 범위로 분리
