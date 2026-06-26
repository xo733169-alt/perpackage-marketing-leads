# Supabase migration 적용 재시도 보고서

작성일: 2026-06-26  
프로젝트: `perpackage-marketing-leads`  
작업: DIRECT_URL 반영 확인 및 Supabase migration 재시도

## 1. 작업 목적

Vercel 배포 후 `/admin/uploads`, `/admin/cafe24`에서 발생한 Prisma `P2021` 오류를 해결하기 위해 Supabase PostgreSQL migration 적용을 재시도했다.

오류 요약:

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

원인 판단은 운영 Supabase DB에 업로드 허브/Cafe24 관련 migration이 아직 적용되지 않은 상태다.

## 2. Vercel production env pull 결과

실행한 명령:

```bash
npx vercel@latest env pull .env.migration.local --environment=production --yes
```

결과:

```txt
env_pull=success
```

주의사항 준수:

- secret 값 출력하지 않음
- `.env.migration.local`을 gitignored 임시 파일로만 사용
- 작업 후 `.env.migration.local` 삭제

## 3. DATABASE_URL, DIRECT_URL 존재 여부

production env pull 후 확인 결과:

```txt
DATABASE_URL=missing
DIRECT_URL=missing
```

추가로 키 목록만 확인한 결과:

```txt
DATABASE_URL key: exists
DIRECT_URL key: not visible
```

정리:

- Vercel CLI env pull 결과에서 `DATABASE_URL` 키는 보였지만, migration 실행에 사용할 수 있는 값으로는 확인되지 않았다.
- `DIRECT_URL`은 key 목록에도 보이지 않았다.
- 따라서 migration 실행 조건인 `DATABASE_URL=present`, `DIRECT_URL=present`를 만족하지 못했다.

## 4. migration 실행 여부

실행하지 않았다.

사유:

```txt
DATABASE_URL 또는 DIRECT_URL 중 하나라도 missing이면 migration을 실행하지 말라는 조건에 따라 중단
```

실행하지 않은 명령:

```bash
pnpm exec prisma migrate deploy
```

`DIRECT_URL` 없이 Supabase migration을 강행하지 않았다.

## 5. 적용된 migration 목록

이번 작업에서 새로 적용된 migration은 없다.

적용되어야 하는 migration:

```txt
20260625090000_add_print_file_upload_hub
20260626093000_add_upload_customer_contact_fields
20260626143000_add_cafe24_integration
```

## 6. 생성 확인된 테이블 목록

migration을 실행하지 않았으므로 테이블 생성 확인은 진행하지 않았다.

아직 생성되어야 하는 테이블:

```txt
upload_projects
uploaded_files
file_review_logs
cafe24_tokens
cafe24_webhook_events
```

## 7. /admin/uploads 재확인 결과

migration 미실행 상태라 `/admin/uploads` 재확인은 진행하지 않았다.

예상 상태:

```txt
public.upload_projects does not exist 오류가 계속 발생할 가능성 높음
```

## 8. /admin/cafe24 재확인 결과

migration 미실행 상태라 `/admin/cafe24` 재확인은 진행하지 않았다.

예상 상태:

```txt
public.cafe24_tokens does not exist 오류가 계속 발생할 가능성 높음
```

## 9. /admin/leads 재확인 결과

이번 오류 원인은 업로드/Cafe24 신규 테이블 누락이므로 `/admin/leads`는 직접 재확인하지 않았다.

## 10. /upload 재확인 결과

이번 migration이 실행되지 않았으므로 `/upload` 재확인은 진행하지 않았다.

## 11. 남은 오류

남아 있을 가능성이 높은 오류:

```txt
/admin/uploads
Prisma P2021
public.upload_projects does not exist
```

```txt
/admin/cafe24
Prisma P2021
public.cafe24_tokens does not exist
```

추가 확인 필요:

- Vercel UI에서 보고 있는 project가 로컬 `.vercel/project.json`의 projectId와 같은지 확인
- `DIRECT_URL`이 Production 대상에 저장되어 있는지 확인
- 저장 후 Vercel CLI `env pull`에 반영되는지 확인
- `DATABASE_URL` 값도 migration 실행 가능한 값으로 pull되는지 확인

현재 로컬 프로젝트 연결 정보:

```txt
projectId: prj_g2I3OO1YIdLJRDyMfhGsWUba6fy7
teamId/orgId: team_QWi58zyFyoFXAUGqDjVdLs4k
projectName: perpackage-marketing-leads
```

## 12. 임시 env 파일 삭제 여부

삭제 완료.

```txt
env_file=deleted
```

## 13. 다음 작업 제안

1. Vercel UI에서 현재 프로젝트가 `prj_g2I3OO1YIdLJRDyMfhGsWUba6fy7`인지 확인
2. `DIRECT_URL`이 Production에 실제 등록되어 있는지 다시 확인
3. `DATABASE_URL`도 Production에서 값이 비어 있지 않은지 확인
4. 저장 후 1분 정도 기다린 뒤 다시 `env pull`
5. `DATABASE_URL=present`, `DIRECT_URL=present`가 모두 확인되면 `prisma migrate deploy` 실행
6. migration 후 아래 테이블 확인
   - `upload_projects`
   - `uploaded_files`
   - `file_review_logs`
   - `cafe24_tokens`
   - `cafe24_webhook_events`
7. `/admin/uploads`, `/admin/cafe24`, `/admin/leads`, `/upload` 재확인

## 한 줄 요약

Vercel production env pull은 성공했지만 `DIRECT_URL`이 여전히 CLI pull 결과에 보이지 않고, `DATABASE_URL`도 migration 실행 가능 상태로 확인되지 않아 Supabase migration은 실행하지 않았다.

