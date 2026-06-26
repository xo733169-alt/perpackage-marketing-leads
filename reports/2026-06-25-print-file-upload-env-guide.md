# 페르패키지 인쇄파일 업로드 허브 환경변수 가이드

작성일: 2026-06-25  
대상 프로젝트: `perpackage-marketing-leads`

## 필요한 환경변수

```env
DATABASE_URL=""
DIRECT_URL=""
ADMIN_PASSWORD=""
NEXT_PUBLIC_SITE_URL=""

NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""

NAVER_OBJECT_STORAGE_ENDPOINT="https://kr.object.ncloudstorage.com"
NAVER_OBJECT_STORAGE_REGION="kr-standard"
NAVER_OBJECT_STORAGE_BUCKET=""
NAVER_OBJECT_STORAGE_ACCESS_KEY=""
NAVER_OBJECT_STORAGE_SECRET_KEY=""

UPLOAD_MAX_FILE_SIZE_MB="100"
UPLOAD_MAX_ZIP_SIZE_MB="300"
UPLOAD_MAX_PROJECT_SIZE_MB="1024"
UPLOAD_ALLOWED_EXTENSIONS="ai,pdf,eps,psd,zip,jpg,jpeg,png,svg"
UPLOAD_SIGNED_URL_EXPIRES_SECONDS="900"
ADMIN_UPLOAD_ACCESS_MODE="admin-password"
```

## Naver Object Storage 설정값

- `NAVER_OBJECT_STORAGE_ENDPOINT`: Naver Object Storage S3-compatible endpoint
- `NAVER_OBJECT_STORAGE_REGION`: bucket region
- `NAVER_OBJECT_STORAGE_BUCKET`: 실제 인쇄파일 저장 bucket
- `NAVER_OBJECT_STORAGE_ACCESS_KEY`: 서버 전용 access key
- `NAVER_OBJECT_STORAGE_SECRET_KEY`: 서버 전용 secret key

운영 전 bucket CORS에서 Vercel 운영 도메인과 Preview 도메인의 `PUT`, `GET`, `HEAD` 요청을 허용해야 한다. 고객 브라우저가 signed URL로 직접 PUT 업로드하므로 CORS 설정이 없으면 업로드가 실패한다.

## Supabase 설정값

- `DATABASE_URL`: Prisma가 사용하는 Supabase pooled connection string
- `DIRECT_URL`: migration용 direct connection string
- `NEXT_PUBLIC_SUPABASE_URL`: 추후 Supabase Auth 또는 클라이언트 기능 확장용
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 추후 Supabase Auth 또는 클라이언트 기능 확장용
- `SUPABASE_SERVICE_ROLE_KEY`: 서버 전용 키이며 브라우저에 노출하면 안 된다

이번 MVP의 DB 접근은 기존 프로젝트 구조에 맞춰 Prisma를 사용한다.

## 로컬 개발 시 주의사항

- `.env.local`에는 실제 값을 넣되 Git에 커밋하지 않는다.
- Naver Object Storage 키가 없으면 파일 업로드 준비 API가 안전한 서버 에러를 반환한다.
- 대용량 파일은 Vercel API route가 직접 받지 않는다.
- 로컬에서 실제 업로드까지 테스트하려면 Naver bucket CORS에 로컬 origin을 임시로 허용해야 한다.

## Vercel 배포 시 등록 항목

Production과 Preview에 아래 항목을 등록한다.

- `DATABASE_URL`
- `DIRECT_URL`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_SITE_URL`
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

Preview를 외부에 공유하지 않을 경우 기존 `SITE_ACCESS_ENABLED=true` 흐름을 함께 사용할 수 있다.

## 파일 업로드 용량 제한

- 일반 파일: 기본 100MB
- ZIP 파일: 기본 300MB
- 프로젝트 전체: 기본 1GB

제한값은 환경변수로 조정한다. 단, 너무 큰 값을 허용하면 고객 브라우저 네트워크, Naver Object Storage CORS, 운영 비용을 함께 검토해야 한다.

## 운영 전 확인해야 할 보안 항목

- 실제 키가 코드, 보고서, Git 이력에 들어가지 않았는지 확인
- Naver Object Storage bucket public access 차단 여부 확인
- signed URL 만료 시간이 과도하게 길지 않은지 확인
- 관리자 API가 `ADMIN_PASSWORD` 세션 없이 접근되지 않는지 확인
- 고객 화면에 관리자 URL이 노출되지 않는지 확인
- Cafe24 주문번호는 1차에서 고객 입력값이므로 관리자가 Cafe24 주문관리에서 별도 확인
- 파일 다운로드는 public URL이 아니라 관리자 인증 서버 route를 통해 발급
- SVG 파일은 업로드 가능하지만 제작 전 확인 필요 안내 유지
