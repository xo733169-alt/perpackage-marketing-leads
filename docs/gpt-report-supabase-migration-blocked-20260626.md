# GPT 보고용: Supabase migration 적용 차단 및 관리자 오류 원인 보고서

작성일: 2026-06-26  
프로젝트: `perpackage-marketing-leads`  
상황: Vercel 배포 후 관리자 페이지 500 오류 발생

## 1. 현재 문제

Vercel 배포 후 `/upload`는 열리지만 관리자 페이지에서 서버 오류가 발생하고 있다.

Vercel Logs 기준 오류:

```txt
/admin/uploads
PrismaClientKnownRequestError P2021
The table public.upload_projects does not exist in the current database.
modelName: UploadProject
table: public.upload_projects
digest: 411174553
```

```txt
/admin/cafe24
PrismaClientKnownRequestError P2021
The table public.cafe24_tokens does not exist in the current database.
modelName: Cafe24Token
table: public.cafe24_tokens
digest: 1907638815
```

## 2. 원인 판단

코드 배포는 되었지만 Supabase PostgreSQL DB에 업로드 허브/Cafe24 관련 migration이 아직 적용되지 않았다.

즉, Next.js route와 Prisma Client는 새 모델을 기준으로 실행되고 있으나, 운영 DB에는 아래 테이블이 없다.

```txt
upload_projects
uploaded_files
file_review_logs
cafe24_tokens
cafe24_webhook_events
```

## 3. 적용해야 할 migration

아래 migration 3개가 Supabase PostgreSQL DB에 적용되어야 한다.

```txt
prisma/migrations/20260625090000_add_print_file_upload_hub/migration.sql
prisma/migrations/20260626093000_add_upload_customer_contact_fields/migration.sql
prisma/migrations/20260626143000_add_cafe24_integration/migration.sql
```

역할:

- `20260625090000_add_print_file_upload_hub`: `upload_projects`, `uploaded_files`, `file_review_logs` 생성
- `20260626093000_add_upload_customer_contact_fields`: 업체명/담당자명/개인정보 동의 등 업로드 고객 연락 필드 추가
- `20260626143000_add_cafe24_integration`: Cafe24 주문 연결 필드, `cafe24_tokens`, `cafe24_webhook_events` 생성

## 4. 시도한 작업

로컬 환경 확인:

```txt
.env.local의 DATABASE_URL: SQLite 형식
DIRECT_URL: 누락
```

따라서 현재 로컬 환경에서 바로 아래 명령을 실행하면 안 된다.

```bash
pnpm exec prisma migrate deploy
```

이유:

- Supabase 운영 DB가 아니라 SQLite/잘못된 환경을 향할 수 있다.
- Prisma schema는 PostgreSQL `DATABASE_URL`, `DIRECT_URL`을 요구한다.
- `DIRECT_URL` 누락 상태에서는 migration 상태 확인도 실패한다.

## 5. 차단된 지점

Vercel production env를 임시 파일로 내려받아 migration을 실행하려고 했으나 중단했다.

중단 이유:

```txt
Vercel production env pull은 운영 secret을 로컬 파일에 materialize하는 작업이다.
사용자가 해당 secret-retrieval 단계를 명시적으로 승인해야 한다.
```

요청했던 안전 조건:

- secret 값은 출력하지 않음
- `.env.migration.local` 같은 gitignored 임시 파일 사용
- migration 완료 후 임시 env 파일 삭제
- migration 결과만 보고

## 6. 계속 진행하려면 필요한 승인 문구

아래처럼 명확히 승인하면 진행 가능하다.

```txt
Vercel production env를 .env.migration.local로 임시 pull해서 Supabase migration 적용해줘. secret 값은 출력하지 말고 끝나면 임시 파일 삭제해줘.
```

승인 후 진행 순서:

1. Vercel production env를 `.env.migration.local`로 임시 pull
2. `DATABASE_URL`, `DIRECT_URL` 존재 여부만 마스킹 확인
3. `prisma migrate deploy` 실행
4. 필요 시 `prisma generate` 실행
5. 생성 테이블 확인
6. `/admin/uploads`, `/admin/cafe24`, `/admin/leads`, `/upload` 재확인
7. 임시 env 파일 삭제
8. 결과 보고

## 7. 사용자가 직접 실행할 경우

Supabase/PostgreSQL `DATABASE_URL`, `DIRECT_URL`이 설정된 안전한 환경에서 아래 명령을 실행한다.

```bash
pnpm exec prisma migrate deploy
```

주의:

- SQLite archive migration은 적용하지 않는다.
- 새 migration을 만들지 않는다.
- schema를 임의로 수정하지 않는다.
- 실제 DB password/API key/secret 값을 로그나 보고서에 남기지 않는다.

## 8. migration 후 확인할 경로

```txt
https://perpackage-marketing-leads.vercel.app/admin/uploads
https://perpackage-marketing-leads.vercel.app/admin/cafe24
https://perpackage-marketing-leads.vercel.app/admin/leads
https://perpackage-marketing-leads.vercel.app/upload
```

확인 기준:

- `/admin/uploads`: `upload_projects` 테이블 없음 오류가 없어야 한다.
- `/admin/cafe24`: `cafe24_tokens` 테이블 없음 오류가 없어야 한다.
- `/admin/leads`: 기존 관리자 리드 화면이 정상 렌더링되어야 한다.
- `/upload`: 기존처럼 정상 접근되어야 한다.

## 9. Supabase에서 확인할 테이블

migration 적용 후 아래 테이블이 생성되어야 한다.

```txt
upload_projects
uploaded_files
file_review_logs
cafe24_tokens
cafe24_webhook_events
```

## 10. 현재 결론

관리자 500 오류는 코드 배포 문제가 아니라 Supabase PostgreSQL migration 미적용 문제다.

현재 Codex는 운영 DB URL/secret을 알 수 없고, 로컬 `.env.local`은 SQLite 형식이므로 migration을 바로 적용하지 않았다. Vercel production env 임시 pull 및 secret 처리에 대한 명시 승인이 있으면 migration 적용을 이어갈 수 있다.

## 11. 한 줄 요약

`/admin/uploads`, `/admin/cafe24` 500 오류는 `upload_projects`, `cafe24_tokens` 테이블이 운영 DB에 없어서 발생했으며, Supabase PostgreSQL에 업로드 허브/Cafe24 migration 3개를 적용하면 해결될 가능성이 높다.

