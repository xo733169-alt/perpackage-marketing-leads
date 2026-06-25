# PostgreSQL 전환 계획

이 문서는 `PerPackage Marketing Lead Management System`을 실제 운영 DB로 전환할 때 사용할 계획서입니다.

현재 프로젝트는 Prisma + SQLite 기준으로 동작합니다. Vercel Preview에서는 sanitized `prisma/preview.db`를 사용해 화면과 라우팅을 확인할 수 있지만, 실제 고객 문의 저장과 관리자 운영에는 PostgreSQL 같은 운영 DB가 적합합니다.

## PostgreSQL이 필요한 이유

- Vercel serverless 환경에서 SQLite 파일 DB는 장기 저장소로 적합하지 않습니다.
- 고객 문의, 상담 이력, 견적안, 업무 기록은 유실되면 안 되는 운영 데이터입니다.
- 운영 DB는 백업, 복구, 동시 접근, 마이그레이션 관리가 가능해야 합니다.
- 추후 관리자 계정, 권한, 감사 로그, 알림 기능 확장에 유리합니다.

## 변경이 필요한 항목

- `prisma/schema.prisma` datasource provider 변경
  - 현재: `sqlite`
  - 전환 후: `postgresql`
- Vercel `DATABASE_URL` 변경
- Prisma migration 재생성 또는 별도 전환 migration 작성
- 기존 SQLite 데이터 export/import 계획
- quote rule seed 재실행 여부 결정
- Vercel Preview에서 관리자 주요 화면 검증

## 권장 전환 순서

1. 별도 브랜치를 생성합니다.
2. Neon, Supabase, Vercel Marketplace Postgres 등 관리형 PostgreSQL을 준비합니다.
3. `DATABASE_URL`을 PostgreSQL 연결 문자열로 설정합니다.
4. `prisma/schema.prisma` provider를 `postgresql`로 변경합니다.
5. Prisma migration을 생성합니다.
6. 로컬에서 PostgreSQL 기준으로 `pnpm db:migrate`를 실행합니다.
7. `pnpm quote-rules:seed`로 기본 견적 룰을 확인합니다.
8. 필요한 경우 sanitized portfolio/lead 데이터를 import합니다.
9. `pnpm lint`, `pnpm test`, `pnpm build`를 실행합니다.
10. Vercel Preview에 배포합니다.
11. `/admin/leads`, `/admin/portfolio`, `/admin/quote-proposals`, `/admin/today`를 확인합니다.
12. 테스트 문의를 넣고 삭제까지 확인합니다.
13. 백업 정책을 확인한 뒤 Production으로 승격합니다.

## 데이터 이전 고려사항

- SQLite와 PostgreSQL의 DateTime 처리 방식 차이를 확인합니다.
- JSON처럼 문자열로 저장하는 필드는 import/export 시 깨지지 않는지 확인합니다.
- 기존 lead quote snapshot은 변경하지 않고 그대로 보존해야 합니다.
- quote proposal, share link, customer response는 관계가 많으므로 import 순서가 중요합니다.
- 민감한 고객 데이터가 포함된 SQLite DB는 public repo나 외부 공유 폴더에 올리면 안 됩니다.

## 롤백 고려사항

- Production 전환 전 기존 DB 백업을 생성합니다.
- Vercel Production alias를 이전 배포로 rollback할 수 있는지 확인합니다.
- DB schema migration은 되돌리기 어려울 수 있으므로 Preview에서 충분히 검증합니다.
- 전환 중 테스트 데이터와 실제 고객 데이터를 명확히 구분합니다.

## 전환 전 백업 체크리스트

- 현재 운영 DB 백업 생성
- lead CSV export 확인
- portfolio case export 또는 import JSON 보관
- quote rule 설정값 보관
- quote proposal 및 response 데이터 보존 방식 결정
- 복구 테스트용 staging DB 준비

## 운영 원칙

PostgreSQL 전환은 Phase 8에서 바로 수행하지 않았습니다. 이후 사용자가 Supabase 프로젝트와 운영 인프라를 준비하면서, 현재 코드는 Supabase Postgres 기준으로 전환되었습니다.

## 2026-06-25 전환 상태

- `prisma/schema.prisma` datasource provider는 `postgresql`입니다.
- `DATABASE_URL`과 `DIRECT_URL`을 모두 사용합니다.
- 기존 SQLite migration은 `prisma/migrations_sqlite_archive`에 보존합니다.
- 새 Supabase Postgres 빈 DB에는 `prisma/migrations/20260625000000_init_postgres_baseline`을 적용합니다.
- 기존 SQLite 데이터는 자동 이전되지 않습니다.

Supabase 적용 순서:

1. Supabase ORM > Prisma 화면에서 `DATABASE_URL`과 `DIRECT_URL`을 확인합니다.
2. Vercel Preview/Production 환경변수에 두 값을 모두 입력합니다.
3. 빈 Supabase DB에 `pnpm prisma migrate deploy` 또는 동일한 Prisma migrate deploy 명령을 실행합니다.
4. `pnpm quote-rules:seed`가 필요한지 결정합니다.
5. 기존 SQLite 고객/견적/포트폴리오 데이터가 필요하면 별도 export/import 절차를 진행합니다.

주의:

- 기존 SQLite migration SQL을 Supabase Postgres에 직접 적용하지 않습니다.
- `migrations_sqlite_archive`는 이력 보존용입니다.
- 실제 운영 데이터가 있다면 전환 전 반드시 백업합니다.
