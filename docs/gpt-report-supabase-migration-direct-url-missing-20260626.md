# GPT 보고용: Supabase migration 재시도 결과 - DIRECT_URL 누락

작성일: 2026-06-26  
프로젝트: `perpackage-marketing-leads`  
상황: Vercel production env 임시 pull 후 Supabase migration 적용 시도

## 1. 작업 목적

Vercel 배포 후 `/admin/uploads`, `/admin/cafe24`에서 발생한 Prisma `P2021` 오류를 해결하기 위해 Supabase PostgreSQL migration을 적용하려고 했다.

관리자 오류:

```txt
/admin/uploads
P2021
The table public.upload_projects does not exist in the current database.
```

```txt
/admin/cafe24
P2021
The table public.cafe24_tokens does not exist in the current database.
```

## 2. 사용자 승인 내용

사용자는 아래 작업을 명시적으로 승인했다.

```txt
Vercel production env를 .env.migration.local로 임시 pull해서 Supabase migration 적용
secret 값은 출력하지 않음
작업 후 .env.migration.local 삭제
```

## 3. 실행한 작업

1. `.env.migration.local`이 `.env*.local` 규칙으로 gitignored 대상인지 확인
2. Vercel production env를 `.env.migration.local`로 임시 pull
3. secret 값은 출력하지 않고 필수 키 존재 여부만 확인
4. `DATABASE_URL`, `DIRECT_URL` 존재 여부 확인
5. `DIRECT_URL` 누락 확인 후 migration 실행 중단
6. `.env.migration.local` 삭제

## 4. 확인 결과

Vercel production env pull 결과:

```txt
.env.migration.local 생성 성공
```

필수 DB 환경변수 확인:

```txt
DATABASE_URL=present
DIRECT_URL=missing
```

추가 확인된 누락값:

```txt
NAVER_OBJECT_STORAGE_BUCKET=missing
CAFE24_MALL_ID=missing
```

실제 secret 값은 출력하지 않았다.

## 5. migration 적용 여부

적용하지 않았다.

이유:

```txt
DIRECT_URL이 Vercel production env에 없어서 Prisma migrate deploy를 실행하지 않았다.
```

Prisma schema는 아래처럼 `DIRECT_URL`을 요구한다.

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

`DATABASE_URL`만 있는 상태에서 억지로 migration을 실행하지 않았다. 운영 DB migration은 연결 문자열이 정확해야 하고, pooler URL과 direct URL 구분이 중요하기 때문이다.

## 6. 적용해야 하는 migration

아직 아래 migration은 Supabase DB에 적용되지 않은 상태로 봐야 한다.

```txt
prisma/migrations/20260625090000_add_print_file_upload_hub/migration.sql
prisma/migrations/20260626093000_add_upload_customer_contact_fields/migration.sql
prisma/migrations/20260626143000_add_cafe24_integration/migration.sql
```

이 migration들이 적용되어야 생성되는 테이블:

```txt
upload_projects
uploaded_files
file_review_logs
cafe24_tokens
cafe24_webhook_events
```

## 7. 현재 관리자 오류 상태

migration이 적용되지 않았기 때문에 아래 오류는 계속 발생할 가능성이 높다.

```txt
/admin/uploads
public.upload_projects does not exist
```

```txt
/admin/cafe24
public.cafe24_tokens does not exist
```

따라서 `/admin/uploads`, `/admin/cafe24` 재확인은 migration 적용 후 진행해야 한다.

## 8. 임시 파일 처리

작업 후 `.env.migration.local`은 삭제했다.

확인 결과:

```txt
env_file=deleted
```

## 9. Vercel에 먼저 추가해야 할 값

최우선 추가:

```env
DIRECT_URL=
```

Supabase 기준 권장:

- `DATABASE_URL`: pooler/transaction 또는 Vercel에서 앱이 사용할 연결 문자열
- `DIRECT_URL`: Prisma migration이 사용할 direct PostgreSQL 연결 문자열

추가로 운영 전 확인 필요:

```env
NAVER_OBJECT_STORAGE_BUCKET=
CAFE24_MALL_ID=
```

Naver Object Storage 전체:

```env
NAVER_OBJECT_STORAGE_ENDPOINT=
NAVER_OBJECT_STORAGE_REGION=
NAVER_OBJECT_STORAGE_BUCKET=
NAVER_OBJECT_STORAGE_ACCESS_KEY=
NAVER_OBJECT_STORAGE_SECRET_KEY=
```

Cafe24 전체:

```env
CAFE24_MALL_ID=
CAFE24_CLIENT_ID=
CAFE24_CLIENT_SECRET=
CAFE24_REDIRECT_URI=
CAFE24_WEBHOOK_SECRET=
CAFE24_API_VERSION=
CAFE24_SCOPES=
```

## 10. 다음 진행 순서

1. Vercel production env에 `DIRECT_URL` 추가
2. 필요 시 `NAVER_OBJECT_STORAGE_BUCKET`, `CAFE24_MALL_ID` 등 누락값 추가
3. 다시 Vercel production env를 `.env.migration.local`로 임시 pull
4. `DATABASE_URL`, `DIRECT_URL` 존재 여부만 마스킹 확인
5. `pnpm exec prisma migrate deploy` 실행
6. 필요 시 `pnpm exec prisma generate` 실행
7. 아래 테이블 생성 확인
   - `upload_projects`
   - `uploaded_files`
   - `file_review_logs`
   - `cafe24_tokens`
   - `cafe24_webhook_events`
8. `/admin/uploads` 재확인
9. `/admin/cafe24` 재확인
10. `/admin/leads` 재확인
11. `/upload` 재확인
12. `.env.migration.local` 삭제

## 11. 한 줄 요약

Vercel production env pull은 성공했지만 `DIRECT_URL`이 없어 Supabase migration은 실행하지 않았고, 관리자 500 오류는 migration 미적용 상태라 계속 남아 있을 가능성이 높다. 먼저 Vercel production env에 `DIRECT_URL`을 추가해야 한다.

