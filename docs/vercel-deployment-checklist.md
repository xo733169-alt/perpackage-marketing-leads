# Vercel 배포 환경 변수 체크리스트

이 문서는 Vercel 빌드 실패 중 `Environment variable not found: DATABASE_URL` 오류를 해결하기 위한 운영 체크리스트입니다.

## 현재 오류 원인

Vercel 빌드에서 `pnpm run build`가 실행되면 먼저 `prisma generate`가 실행됩니다.

```json
"build": "prisma generate && next build"
```

`prisma/schema.prisma`는 아래 설정으로 `DATABASE_URL`을 필수 환경 변수로 읽습니다.

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

Vercel Project Environment Variables에 `DATABASE_URL`이 없으면 Prisma가 schema를 읽는 단계에서 빌드가 실패합니다.

## Vercel Dashboard 설정 순서

1. Vercel Dashboard에서 `perpackage-marketing-leads` 프로젝트를 엽니다.
2. `Settings`로 이동합니다.
3. `Environment Variables`로 이동합니다.
4. 아래 변수를 `Production`과 `Preview`에 추가합니다.
5. 저장 후 실패한 Deployment에서 `Redeploy`를 실행합니다.

## 필수 환경 변수

임시 Vercel Preview/build 테스트 기준:

```env
DATABASE_URL="file:/var/task/prisma/preview.db?mode=ro"
ADMIN_PASSWORD="관리자 로그인 비밀번호"
NEXT_PUBLIC_SITE_URL="https://perpackage-marketing-leads-iaj8xg6ly-peerl.vercel.app"
NEXT_PUBLIC_KAKAO_CHANNEL_URL=""

SITE_ACCESS_ENABLED="true"
SITE_ACCESS_PASSWORD="사이트 전체 접근 비밀번호"
SITE_ACCESS_SECRET="충분히 긴 랜덤 문자열"

LEAD_NOTIFICATION_WEBHOOK_URL=""
QUOTE_RESPONSE_WEBHOOK_URL=""
```

## 비밀번호 역할 구분

- `SITE_ACCESS_PASSWORD`: 앱 전체 비공개 테스트 접근용 비밀번호입니다.
- `ADMIN_PASSWORD`: `/admin/login` 관리자 로그인용 비밀번호입니다.
- 두 비밀번호는 서로 다르게 설정해야 합니다.
- `SITE_ACCESS_SECRET`은 로그인 비밀번호가 아니라 site access cookie 서명용 secret입니다.
- `NEXT_PUBLIC_`으로 시작하는 값은 브라우저에 노출될 수 있으므로 secret을 넣으면 안 됩니다.

## Private preview 주의사항

`SITE_ACCESS_ENABLED="true"`이면 고객도 접근 비밀번호 없이는 아래 페이지를 볼 수 없습니다.

- 랜딩 페이지
- 견적 문의 form
- 제작 사례
- 개인정보 안내
- 견적 공유 링크 `/q/[token]`
- 관리자 로그인 페이지

실제 고객에게 공개하기 전에는 `SITE_ACCESS_ENABLED` 값을 반드시 확인해야 합니다.

## SQLite 주의사항

`DATABASE_URL="file:/var/task/prisma/preview.db?mode=ro"`는 임시 Vercel Preview/build 테스트용입니다.

이 프로젝트는 `.vercelignore`에서 `prisma/dev.db`를 배포 제외하고, `next.config.mjs`에서 `prisma/preview.db`만 배포 trace에 포함하도록 설정되어 있습니다. 따라서 Vercel 런타임에서는 `file:./dev.db`가 아니라 `file:/var/task/prisma/preview.db?mode=ro`를 사용해야 합니다.

실제 고객 문의를 운영 저장하려면 Vercel serverless 환경에서 SQLite를 장기 운영 DB로 사용하는 것은 적합하지 않을 수 있습니다. 실제 운영 전 PostgreSQL 전환을 계획해야 합니다.

## Redeploy 방법

환경 변수를 저장한 뒤 다음 중 하나로 재배포합니다.

- Vercel Dashboard -> Deployments -> 실패한 배포 선택 -> Redeploy
- 또는 Vercel CLI 사용 가능 시 `vercel --prod`

기대 결과:

- `Environment variable not found: DATABASE_URL` 오류가 사라집니다.
- `pnpm run build`가 통과합니다.
- 배포 상태가 `Ready`가 됩니다.

## 배포 전후 점검 명령

로컬 또는 Vercel 환경에서 필수 환경변수 누락 여부를 확인할 수 있습니다.

```bash
pnpm deployment:check
```

이 명령은 누락된 변수명과 경고만 출력하며 실제 비밀번호나 secret 값은 출력하지 않습니다.

배포 후 최소 health check는 아래 경로에서 확인합니다.

```text
https://your-domain.com/api/health
```

`/api/health`는 `DATABASE_URL` 값이나 고객 데이터를 노출하지 않고, DB 설정 여부와 private access 활성 여부만 반환합니다.

## Supabase Postgres + Naver Object Storage 운영 전환 체크리스트

새 Vercel Pro 계정으로 이전할 때는 SQLite preview 기준이 아니라 Supabase Postgres와 네이버 Object Storage 기준으로 설정합니다.

### Vercel Environment Variables

Production과 Preview에 아래 값을 입력합니다. 실제 secret 값은 코드나 문서에 기록하지 않습니다.

```env
DATABASE_URL=""
DIRECT_URL=""
ADMIN_PASSWORD=""
NEXT_PUBLIC_SITE_URL=""
SITE_ACCESS_ENABLED="true"
SITE_ACCESS_PASSWORD=""
SITE_ACCESS_SECRET=""

PORTFOLIO_STORAGE_PROVIDER="naver-object-storage"
NAVER_OBJECT_STORAGE_ACCESS_KEY=""
NAVER_OBJECT_STORAGE_SECRET_KEY=""
NAVER_OBJECT_STORAGE_BUCKET=""
NAVER_OBJECT_STORAGE_ENDPOINT="https://kr.object.ncloudstorage.com"
NAVER_OBJECT_STORAGE_REGION="kr-standard"
NAVER_OBJECT_STORAGE_PUBLIC_BASE_URL=""

NEXT_PUBLIC_KAKAO_CHANNEL_URL=""
LEAD_NOTIFICATION_WEBHOOK_URL=""
QUOTE_RESPONSE_WEBHOOK_URL=""
```

Plugo API를 운영할 경우에만 아래 값을 추가합니다.

```env
PLUGO_API_BASE_URL=""
PLUGO_REQUESTS_PATH="/requests"
PLUGO_API_KEY=""
PLUGO_SECRET_KEY=""
PLUGO_API_KEY_HEADER_NAME="X-API-Key"
PLUGO_SECRET_KEY_HEADER_NAME="X-Secret-Key"
PLUGO_FORWARD_QUERY_KEYS="page,limit,offset,cursor,status,from,to,startDate,endDate,createdFrom,createdTo,updatedFrom,updatedTo,sort,order,q"
PLUGO_TIMEOUT_MS="10000"
```

### Supabase 확인 항목

1. Supabase 프로젝트가 생성되어 있는지 확인합니다.
2. ORM > Prisma 화면에서 `DATABASE_URL`과 `DIRECT_URL`을 복사합니다.
3. Vercel에는 pooled URL을 `DATABASE_URL`, direct URL을 `DIRECT_URL`로 넣습니다.
4. 빈 Supabase DB에는 `prisma/migrations/20260625000000_init_postgres_baseline`을 적용합니다.
5. 기존 SQLite 데이터가 필요하면 별도 이관 작업으로 진행합니다.

### Naver Object Storage 확인 항목

1. Object Storage 버킷이 생성되어 있는지 확인합니다.
2. API 인증키 access key/secret key를 발급합니다.
3. endpoint, region, bucket, public base URL을 Vercel 환경변수에 입력합니다.
4. `/admin/portfolio/new`에서 대표 이미지 업로드를 테스트합니다.
5. Object Storage 콘솔에서 `portfolio/...webp`와 `portfolio/...-thumb.webp` 파일이 생성됐는지 확인합니다.

### 배포 후 테스트

1. `pnpm deployment:check`
2. `pnpm test`
3. `pnpm build`
4. Vercel Preview 배포
5. `/access` 통과
6. `/admin/login` 통과
7. 문의 저장 테스트
8. 관리자 리드 목록 확인
9. 제작 사례 등록 테스트
10. 제작 사례 이미지 업로드 테스트
11. 고객-facing `/portfolio` 이미지 표시 확인
