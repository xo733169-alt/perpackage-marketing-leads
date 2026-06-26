# Supabase 수동 migration 실행 가이드

작성일: 2026-06-26  
대상: Supabase SQL Editor  
SQL 파일: `docs/supabase-manual-migration-upload-cafe24-20260626.sql`

## 목적

Vercel production env pull 방식으로 `DATABASE_URL`, `DIRECT_URL`을 안정적으로 가져오지 못해 `prisma migrate deploy` 실행이 막혔다. 현재 운영 Supabase DB에는 업로드 허브/Cafe24 관련 테이블이 없어 관리자 페이지에서 Prisma `P2021` 오류가 발생한다.

오류 대상:

```txt
/admin/uploads: public.upload_projects 없음
/admin/cafe24: public.cafe24_tokens 없음
```

## 포함한 migration

이 가이드는 아래 PostgreSQL migration 3개만 순서대로 합친 SQL 파일을 실행하는 절차다.

```txt
prisma/migrations/20260625090000_add_print_file_upload_hub/migration.sql
prisma/migrations/20260626093000_add_upload_customer_contact_fields/migration.sql
prisma/migrations/20260626143000_add_cafe24_integration/migration.sql
```

SQLite archive migration은 포함하지 않았다.

## 실행 전 주의사항

- Supabase 프로젝트가 실제 운영 DB인지 확인한다.
- SQL Editor에서 실행 전 DB 백업 또는 restore point를 준비한다.
- 이미 일부 테이블이나 컬럼이 만들어져 있으면 이 SQL은 `already exists` 오류를 낼 수 있다.
- 실제 DB password, API key, secret 값은 SQL에 포함되어 있지 않다.
- Cafe24 결제, 주문 상태 변경, Webhook 신규 기능, 고객 파일 삭제/이동/이름 변경 기능은 포함하지 않는다.
- 이 SQL은 Prisma `_prisma_migrations` 기록을 자동으로 갱신하지 않는다.

## 실행 방법

1. Supabase Dashboard에서 해당 프로젝트를 연다.
2. SQL Editor로 이동한다.
3. `docs/supabase-manual-migration-upload-cafe24-20260626.sql` 전체 내용을 붙여넣는다.
4. 실행 전 선택된 프로젝트가 운영 DB인지 다시 확인한다.
5. SQL을 실행한다.
6. 오류 없이 완료되면 아래 테이블 존재 여부를 확인한다.

## 실행 후 확인할 테이블

아래 테이블이 생성되어야 한다.

```txt
upload_projects
uploaded_files
file_review_logs
cafe24_tokens
cafe24_webhook_events
```

확인용 SQL:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'upload_projects',
    'uploaded_files',
    'file_review_logs',
    'cafe24_tokens',
    'cafe24_webhook_events'
  )
ORDER BY table_name;
```

## 실행 후 확인할 URL

Vercel 배포 URL에서 아래 경로를 확인한다.

```txt
/admin/uploads
/admin/cafe24
/admin/leads
/upload
```

확인 기준:

- `/admin/uploads`: `public.upload_projects does not exist` 오류가 없어야 한다.
- `/admin/cafe24`: `public.cafe24_tokens does not exist` 오류가 없어야 한다.
- `/admin/leads`: 기존 리드 관리자 화면이 정상 렌더링되어야 한다.
- `/upload`: 기존처럼 접근 가능해야 한다.

## Prisma migration 기록 주의

Supabase SQL Editor에서 수동 실행하면 실제 DB schema는 만들어지지만 Prisma의 `_prisma_migrations` 테이블에는 해당 migration이 적용된 것으로 기록되지 않을 수 있다.

그 상태에서 나중에 `prisma migrate deploy`를 실행하면 Prisma가 같은 migration을 다시 적용하려고 하거나, 이미 존재하는 테이블/컬럼 때문에 실패할 수 있다.

수동 SQL 실행 후 Prisma migration 기록을 맞춰야 하는 경우, 추후 아래 migration 이름들에 대해 `prisma migrate resolve --applied`가 필요할 수 있다.

```txt
20260625090000_add_print_file_upload_hub
20260626093000_add_upload_customer_contact_fields
20260626143000_add_cafe24_integration
```

예시:

```bash
pnpm exec prisma migrate resolve --applied 20260625090000_add_print_file_upload_hub
pnpm exec prisma migrate resolve --applied 20260626093000_add_upload_customer_contact_fields
pnpm exec prisma migrate resolve --applied 20260626143000_add_cafe24_integration
```

단, 이 명령도 Supabase/PostgreSQL `DATABASE_URL`, `DIRECT_URL`이 정확히 설정된 환경에서만 실행해야 한다. 현재 이 연결값을 로컬에서 안정적으로 확보하지 못해 SQL Editor 수동 실행 파일을 만든 것이다.

## 실패 시 대응

`relation already exists` 또는 `column already exists`가 나오면 일부 SQL이 이미 적용된 상태일 수 있다. 이 경우 중복 적용하지 말고, 어떤 테이블/컬럼까지 생성되었는지 먼저 확인해야 한다.

`upload_projects`가 이미 있는데 `cafe24_tokens`만 없다면, 전체 SQL을 다시 실행하지 말고 남은 migration 범위만 별도 검토해야 한다.

## 한 줄 요약

`docs/supabase-manual-migration-upload-cafe24-20260626.sql`은 업로드 허브/Cafe24 관련 PostgreSQL migration 3개를 Supabase SQL Editor에서 직접 실행할 수 있게 합친 파일이며, 실행 후 Prisma migration 기록과 실제 DB 상태를 맞추는 작업이 추가로 필요할 수 있다.
