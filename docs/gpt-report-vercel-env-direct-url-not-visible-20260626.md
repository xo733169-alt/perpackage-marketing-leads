# GPT 보고용: Vercel production env 재확인 결과 - DIRECT_URL 미노출

작성일: 2026-06-26  
프로젝트: `perpackage-marketing-leads`  
상황: Supabase migration 적용 재시도

## 1. 작업 목적

Vercel production env에 `DIRECT_URL`을 추가/수정했다는 사용자 확인 이후, 다시 production env를 pull해서 `DATABASE_URL`, `DIRECT_URL` 존재 여부만 확인하고 Supabase migration을 적용하려고 했다.

목표:

- Vercel production env 임시 pull
- `DATABASE_URL`, `DIRECT_URL` 존재 여부만 마스킹 확인
- `prisma migrate deploy` 실행
- 필요 시 `prisma generate` 실행
- 테이블 생성 확인
- 관리자 URL 재확인
- 임시 env 파일 삭제

## 2. 실행한 작업

1. `.env.migration.local`이 gitignore 대상인지 확인
2. 기존 `.env.migration.local` 없음 확인
3. `npx vercel@latest env pull .env.migration.local --environment=production --yes` 실행
4. secret 값은 출력하지 않고 env 키 존재 여부만 확인
5. `DATABASE_URL`, `DIRECT_URL` 확인
6. `DIRECT_URL`이 pull 결과에 없어 migration 실행 중단
7. `.env.migration.local` 삭제
8. Vercel CLI 기준 env 목록에서 변수 이름만 확인

## 3. 결과 요약

Vercel production env pull:

```txt
env_pull=success
```

pull된 env에서 확인된 결과:

```txt
DATABASE_URL=present
DIRECT_URL=missing
```

임시 파일 삭제:

```txt
env_file=deleted
```

## 4. Vercel CLI env 목록 확인 결과

Vercel CLI로 env 목록을 확인했을 때 `DATABASE_URL`은 보였지만 `DIRECT_URL`은 보이지 않았다.

확인된 프로젝트:

```txt
projectId: prj_g2I3OO1YIdLJRDyMfhGsWUba6fy7
orgId/teamId: team_QWi58zyFyoFXAUGqDjVdLs4k
projectName: perpackage-marketing-leads
```

CLI 목록에서 확인된 상태:

```txt
DATABASE_URL: Production 존재
DATABASE_URL: Preview 존재
DIRECT_URL: 보이지 않음
```

즉, 사용자가 Vercel UI에서 `DIRECT_URL`을 추가/수정했다고 확인했지만, 현재 로컬 프로젝트가 연결된 Vercel project 기준 CLI pull 결과에는 아직 반영되지 않았다.

## 5. migration 적용 여부

적용하지 않았다.

사유:

```txt
DIRECT_URL이 pull 결과에 없어 Prisma migration 실행 조건을 만족하지 못함
```

실행하지 않은 명령:

```bash
pnpm exec prisma migrate deploy
```

`DATABASE_URL`만 있는 상태에서 migration을 강행하지 않았다. 현재 Prisma schema는 `directUrl = env("DIRECT_URL")`을 사용하고 있으며, 운영 DB migration은 direct PostgreSQL URL 기준으로 진행되어야 한다.

## 6. 아직 해결되지 않은 관리자 오류

migration이 적용되지 않았기 때문에 아래 오류는 계속 남아 있을 가능성이 높다.

```txt
/admin/uploads
P2021
public.upload_projects does not exist
```

```txt
/admin/cafe24
P2021
public.cafe24_tokens does not exist
```

## 7. 적용해야 할 migration

아직 적용되지 않은 것으로 봐야 하는 migration:

```txt
prisma/migrations/20260625090000_add_print_file_upload_hub/migration.sql
prisma/migrations/20260626093000_add_upload_customer_contact_fields/migration.sql
prisma/migrations/20260626143000_add_cafe24_integration/migration.sql
```

생성되어야 할 테이블:

```txt
upload_projects
uploaded_files
file_review_logs
cafe24_tokens
cafe24_webhook_events
```

## 8. 추가로 보이지 않는 운영 env

Vercel CLI env 목록 기준으로 아래 업로드/Cafe24 관련 env도 아직 보이지 않았다.

```txt
NAVER_OBJECT_STORAGE_ENDPOINT
NAVER_OBJECT_STORAGE_REGION
NAVER_OBJECT_STORAGE_BUCKET
NAVER_OBJECT_STORAGE_ACCESS_KEY
NAVER_OBJECT_STORAGE_SECRET_KEY
CAFE24_MALL_ID
CAFE24_CLIENT_ID
CAFE24_CLIENT_SECRET
CAFE24_REDIRECT_URI
CAFE24_WEBHOOK_SECRET
CAFE24_API_VERSION
CAFE24_SCOPES
```

이 값들은 migration 자체에는 필수는 아니지만, 배포 후 업로드 저장소와 Cafe24 OAuth/Webhook 실제 동작에는 필요하다.

## 9. 다음 확인 포인트

Vercel UI에서 아래를 다시 확인해야 한다.

1. 현재 보고 있는 프로젝트가 아래 projectId와 같은지 확인

```txt
prj_g2I3OO1YIdLJRDyMfhGsWUba6fy7
```

2. `DIRECT_URL`이 Production 대상에 추가되어 있는지 확인
3. 필요하면 Preview 대상에도 추가
4. 변수명이 정확히 `DIRECT_URL`인지 확인
5. 저장 후 Vercel CLI `env pull`에 반영될 때까지 잠시 대기
6. 다시 production env pull
7. `DATABASE_URL=present`, `DIRECT_URL=present` 확인 후 migration 실행

## 10. 다음 실행 순서

`DIRECT_URL`이 CLI pull 결과에 보이면 아래 순서로 진행한다.

```txt
1. Vercel production env pull
2. DATABASE_URL, DIRECT_URL 존재 여부만 마스킹 확인
3. prisma migrate deploy
4. prisma generate
5. 테이블 존재 확인
6. /admin/uploads 확인
7. /admin/cafe24 확인
8. /admin/leads 확인
9. /upload 확인
10. .env.migration.local 삭제
```

## 11. 한 줄 요약

Vercel production env pull은 성공했지만, 현재 CLI가 바라보는 `perpackage-marketing-leads` 프로젝트에는 `DIRECT_URL`이 아직 보이지 않아 Supabase migration을 실행하지 않았다. Vercel UI에서 projectId와 Production 대상 `DIRECT_URL` 등록 여부를 다시 확인해야 한다.

