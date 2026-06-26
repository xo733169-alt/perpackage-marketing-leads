# Cafe24 OAuth/Webhook + 업로드 허브 변경분 push 결과 보고서

작성일: 2026-06-26  
프로젝트: `perpackage-marketing-leads`  
브랜치: `main`  
원격 저장소: `origin`

## 1. 작업 목적

고객 인쇄파일 업로드 허브와 Cafe24 OAuth/Webhook 연동 기반이 포함된 로컬 commit을 GitHub `origin/main`에 push하고, 이후 Vercel 배포와 운영 설정에 필요한 항목을 정리하는 작업이다.

이번 작업에서는 새 기능 개발, DB schema 변경, 신규 migration 생성, 고객 파일 삭제/이동/이름 변경 기능 추가, Cafe24 결제/주문상태 변경 구현은 하지 않았다.

## 2. push 전 git status 결과

push 전 마지막 commit:

```txt
2a70d99 feat: add cafe24 oauth webhook upload linking foundation
```

push 전 확인 결과:

```txt
main 브랜치
마지막 commit: 2a70d99
로컬에 untracked 문서 1개 존재
```

untracked 문서:

```txt
docs/gpt-report-cafe24-deploy-push-handoff-20260626.md
```

이 문서는 이전 요청에서 만든 GPT 인계용 문서이며, 이번 push 대상 commit에는 포함되지 않았다.

## 3. 마지막 commit 확인 결과

최근 commit:

```txt
2a70d99 feat: add cafe24 oauth webhook upload linking foundation
bf4d81c Log lead creation failures
68922b2 Reduce Vercel function tracing size
```

push 대상 commit은 `2a70d99`다.

## 4. secret 포함 여부 자체 점검 결과

push 전 secret 패턴을 점검했다.

확인한 항목:

- `.env`, `.env.local`이 commit 대상에 포함되지 않았는지
- DB password가 코드/보고서에 직접 들어가지 않았는지
- Cafe24 client secret/webhook secret이 하드코딩되지 않았는지
- Naver Object Storage secret key가 하드코딩되지 않았는지
- Supabase service role key가 하드코딩되지 않았는지
- GitHub token, private key, 일반적인 secret 패턴이 포함되지 않았는지

결과:

```txt
실제 운영 secret 하드코딩 발견 없음
```

스캔에서 잡힌 항목은 `.env.example`의 예시 URL, 기존 문서의 예시 DATABASE_URL 표기, 테스트 파일의 테스트용 문자열이었다. 실제 secret 값은 출력하지 않았고 push를 막을 항목으로 판단하지 않았다.

## 5. git push origin main 실행 결과

실행 명령:

```bash
git push origin main
```

결과:

```txt
성공
bf4d81c..2a70d99  main -> main
```

GitHub `origin/main`에 반영된 commit:

```txt
2a70d99 feat: add cafe24 oauth webhook upload linking foundation
```

## 6. push 후 상태

push 후 원격 추적 상태:

```txt
main...origin/main
```

즉, commit 기준으로는 로컬 `main`과 `origin/main`이 같은 commit을 가리킨다.

push 후 로컬에 남은 untracked 문서:

```txt
docs/gpt-report-cafe24-deploy-push-handoff-20260626.md
docs/gpt-report-cafe24-push-result-20260626.md
```

주의:

- `docs/gpt-report-cafe24-push-result-20260626.md`는 push 이후 작성한 이 보고서이므로 아직 commit/push되지 않은 로컬 문서다.
- 기능 코드 commit은 이미 GitHub main에 올라갔다.

## 7. Vercel 배포 확인 필요 URL

기준 도메인:

```txt
https://perpackage-marketing-leads.vercel.app
```

배포 완료 후 확인할 URL:

```txt
https://perpackage-marketing-leads.vercel.app/upload
https://perpackage-marketing-leads.vercel.app/upload/success
https://perpackage-marketing-leads.vercel.app/admin/uploads
https://perpackage-marketing-leads.vercel.app/admin/cafe24
https://perpackage-marketing-leads.vercel.app/api/cafe24/oauth/start
https://perpackage-marketing-leads.vercel.app/api/cafe24/webhooks/orders
```

확인 기준:

- `/upload`: 404가 아니어야 한다.
- `/upload/success`: 업로드 완료 화면 접근이 가능해야 한다.
- `/admin/uploads`: 관리자 로그인 보호가 유지되어야 한다.
- `/admin/cafe24`: 404가 아니어야 한다.
- `/api/cafe24/oauth/start`: Cafe24 인증 화면으로 이동해야 한다.
- `/api/cafe24/webhooks/orders`: GET 직접 접근으로 확인하는 route가 아니며, Cafe24 Developers Webhook TEST로 확인해야 한다.

## 8. Vercel 환경변수 등록 필요 목록

기본 운영:

```env
DATABASE_URL=
DIRECT_URL=
ADMIN_PASSWORD=
NEXT_PUBLIC_SITE_URL=
SITE_ACCESS_ENABLED=
```

site access 사용 시:

```env
SITE_ACCESS_PASSWORD=
SITE_ACCESS_SECRET=
```

인쇄파일 업로드:

```env
UPLOAD_MAX_FILE_SIZE_MB=
UPLOAD_MAX_ZIP_SIZE_MB=
UPLOAD_MAX_PROJECT_SIZE_MB=
UPLOAD_ALLOWED_EXTENSIONS=
UPLOAD_SIGNED_URL_EXPIRES_SECONDS=
PRINT_FILE_STORAGE_PROVIDER=
UPLOAD_LOCAL_STORAGE_DIR=
UPLOAD_LOCAL_STORAGE_SECRET=
ADMIN_UPLOAD_ACCESS_MODE=
```

Naver Object Storage:

```env
NAVER_OBJECT_STORAGE_ENDPOINT=
NAVER_OBJECT_STORAGE_REGION=
NAVER_OBJECT_STORAGE_BUCKET=
NAVER_OBJECT_STORAGE_ACCESS_KEY=
NAVER_OBJECT_STORAGE_SECRET_KEY=
```

Cafe24:

```env
CAFE24_MALL_ID=
CAFE24_CLIENT_ID=
CAFE24_CLIENT_SECRET=
CAFE24_REDIRECT_URI=
CAFE24_WEBHOOK_SECRET=
CAFE24_API_VERSION=
CAFE24_SCOPES=
```

권장값:

```env
CAFE24_MALL_ID=peerl
CAFE24_REDIRECT_URI=https://perpackage-marketing-leads.vercel.app/api/cafe24/oauth/callback
CAFE24_API_VERSION=2024-06-01
PRINT_FILE_STORAGE_PROVIDER=naver-object-storage
NAVER_OBJECT_STORAGE_ENDPOINT=https://kr.object.ncloudstorage.com
NAVER_OBJECT_STORAGE_REGION=kr-standard
```

주의:

- Vercel Value 입력 칸에는 `KEY=` 없이 값만 입력해야 한다.
- 실제 secret 값은 보고서나 채팅에 출력하지 않는다.

## 9. Supabase migration 적용 필요 목록

아직 Supabase migration은 이 작업에서 직접 적용하지 않았다.

적용 대상 migration:

```txt
prisma/migrations/20260625090000_add_print_file_upload_hub/migration.sql
prisma/migrations/20260626093000_add_upload_customer_contact_fields/migration.sql
prisma/migrations/20260626143000_add_cafe24_integration/migration.sql
```

적용 명령:

```bash
pnpm exec prisma migrate deploy
```

적용 조건:

- Supabase/PostgreSQL `DATABASE_URL`이 정확히 설정되어 있어야 한다.
- Supabase/PostgreSQL `DIRECT_URL`이 정확히 설정되어 있어야 한다.
- 기존 SQLite archive migration은 적용하지 않는다.
- 실제 secret 값은 로그/보고서에 출력하지 않는다.

## 10. Cafe24 Developers 등록값

App URL:

```txt
https://perpackage-marketing-leads.vercel.app/admin/cafe24
```

Redirect URI:

```txt
https://perpackage-marketing-leads.vercel.app/api/cafe24/oauth/callback
```

Webhook URL:

```txt
https://perpackage-marketing-leads.vercel.app/api/cafe24/webhooks/orders
```

권장 권한:

```txt
Application: 읽기 + 쓰기
Order: 읽기
Customer: 읽기
Product: 읽기
Shipping: 읽기
Customer Identifier: 읽기
```

Webhook 이벤트:

```txt
주문 생성
```

추후 필요 시 추가:

```txt
주문 결제 완료
```

## 11. 남은 작업

1. Vercel production 자동 배포 완료 확인
2. Vercel 환경변수 등록/확인
3. Supabase migration deploy
4. `/upload` production 접근 확인
5. `/admin/uploads` 관리자 로그인 보호 확인
6. `/admin/cafe24` 접근 확인
7. Cafe24 Developers App URL/Redirect URI/Webhook URL 등록
8. Cafe24 OAuth 승인 테스트
9. Cafe24 Webhook TEST 실행
10. 주문 메모의 `PP-UP-YYYYMMDD-001` 기반 자동 연결 QA
11. 필요 시 현재 로컬에 남은 GPT 보고서 문서 2개를 별도 docs commit으로 정리

## 12. 발견한 문제

- push 전 작업 트리가 완전히 clean은 아니었다. 이전 요청에서 만든 GPT 인계용 보고서 1개가 untracked로 남아 있었다.
- 해당 문서는 secret 파일이 아니며, 기능 commit push에는 영향을 주지 않았다.
- 이 push 결과 보고서도 push 후 작성한 문서이므로 현재 로컬 untracked 상태다.
- 운영 DB migration과 Vercel 환경변수 등록은 아직 별도 작업으로 남아 있다.

## 13. 최종 요약

Cafe24 OAuth/Webhook + 고객 인쇄파일 업로드 허브 변경분은 `2a70d99` commit으로 GitHub `origin/main`에 push 완료됐다. 다음 단계는 Vercel production 배포 확인, Vercel 환경변수 등록, Supabase migration 적용, Cafe24 Developers 설정 및 OAuth/Webhook 실제 QA다.

