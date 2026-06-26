# PerPackage Marketing Leads 운영 연동 확인 보고서

작성일: 2026-06-25

이 문서는 다음 GPT/Codex가 현재 `perpackage-marketing-leads` 프로젝트의 운영 전환 상태를 바로 이해할 수 있도록 정리한 보고서입니다.

실제 secret 값, DB password, API key, storage secret key는 포함하지 않습니다.

---

## 1. 현재 결론

`perpackage-marketing-leads` 프로젝트는 현재 아래 운영 인프라와의 1차 연동 확인이 완료되었습니다.

- Vercel 배포 프로젝트 접속 성공
- Supabase Postgres 연결 성공
- 견적 문의 저장 성공
- Supabase `Lead` 테이블 저장 확인
- 관리자 페이지 접속 성공
- Naver Object Storage 제작 사례 이미지 업로드 성공
- 네이버 클라우드 버킷에 실제 파일 저장 확인

현재까지의 문제는 코드 구조보다는 `DATABASE_URL` / `DIRECT_URL` 값 입력 방식 문제였습니다.

---

## 2. 프로젝트 기준

프로젝트명:

```txt
perpackage-marketing-leads
```

기술 스택:

```txt
Next.js App Router
TypeScript
Tailwind CSS
Prisma
PostgreSQL via Supabase
Zod
Vitest
Sharp
Naver Object Storage via S3-compatible SDK
```

GitHub 저장소:

```txt
xo733169-alt/perpackage-marketing-leads
```

Vercel 프로젝트:

```txt
perpackage-marketing-leads
```

현재 테스트에 사용된 배포 URL 예시:

```txt
https://perpackage-marketing-leads-hwvdfxdey.vercel.app
```

주의:

- Vercel 배포 URL은 새 배포마다 바뀔 수 있음
- 실제 운영 기준 `NEXT_PUBLIC_SITE_URL`은 현재 대표 Production URL에 맞춰야 함

---

## 3. Supabase Postgres 상태

Supabase 프로젝트가 생성되어 있고, PostgreSQL baseline schema 적용이 완료된 상태입니다.

확인된 테이블 예시:

```txt
Lead
LeadCommunicationLog
MarketingCost
PortfolioCase
QuoteActivityLog
QuoteProposal
QuoteProposalCustomerResponse
QuoteProposalItem
QuoteProposalShareLink
QuoteRule
QuoteRuleChangeLog
SalesTask
```

적용 기준 migration:

```txt
prisma/migrations/20260625000000_init_postgres_baseline/migration.sql
```

중요:

```txt
기존 SQLite migration을 Supabase에 적용하지 말 것.
새 Supabase DB에는 init_postgres_baseline 기준으로만 적용한다.
```

---

## 4. DB 연결 문제와 해결 내용

초기 Vercel runtime 오류는 아래 계열이었습니다.

```txt
Environment variable not found: DATABASE_URL
invalid port number in database URL
Authentication failed against database server
```

최종 원인:

```txt
Vercel DATABASE_URL / DIRECT_URL 값에 Supabase placeholder인 [YOUR-PASSWORD]가 남아 있거나,
실제 DB password가 올바르게 반영되지 않은 상태였음.
```

해결 방향:

1. Supabase Database password를 명확히 설정
2. Supabase `Connect` → `ORMs` → `Prisma`의 `.env.local` 예시 확인
3. `[YOUR-PASSWORD]` 부분만 실제 DB password로 교체
4. Vercel Environment Variables에 따옴표 없이 주소만 입력
5. Vercel Production redeploy

Vercel Value 칸에는 아래처럼 주소만 넣어야 합니다.

```txt
postgresql://postgres.<project-ref>:<password>@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

주의:

```txt
DATABASE_URL=
"..."
[YOUR-PASSWORD]
```

위 값들이 Vercel Value 안에 들어가면 안 됩니다.

---

## 5. Prisma 설정 상태

파일:

```txt
prisma/schema.prisma
```

현재 datasource:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

즉, 앱 코드는 `DATABASE_URL`, `DIRECT_URL` 환경변수를 읽도록 되어 있습니다.

---

## 6. Vercel 필수 환경변수

현재 운영 구조에서 필요한 핵심 변수입니다.

### 필수

```txt
DATABASE_URL
DIRECT_URL
ADMIN_PASSWORD
NEXT_PUBLIC_SITE_URL
SITE_ACCESS_ENABLED
```

### private preview 사용 시 필수

```txt
SITE_ACCESS_PASSWORD
SITE_ACCESS_SECRET
```

### Naver Object Storage 사용 시 필수

```txt
PORTFOLIO_STORAGE_PROVIDER=naver-object-storage
NAVER_OBJECT_STORAGE_ACCESS_KEY
NAVER_OBJECT_STORAGE_SECRET_KEY
NAVER_OBJECT_STORAGE_BUCKET
NAVER_OBJECT_STORAGE_ENDPOINT
NAVER_OBJECT_STORAGE_REGION
NAVER_OBJECT_STORAGE_PUBLIC_BASE_URL
```

### 선택

```txt
NEXT_PUBLIC_KAKAO_CHANNEL_URL
LEAD_NOTIFICATION_WEBHOOK_URL
QUOTE_RESPONSE_WEBHOOK_URL
PLUGO_API_BASE_URL
PLUGO_REQUESTS_PATH
PLUGO_API_KEY
PLUGO_SECRET_KEY
PLUGO_API_KEY_HEADER_NAME
PLUGO_SECRET_KEY_HEADER_NAME
PLUGO_FORWARD_QUERY_KEYS
PLUGO_TIMEOUT_MS
```

---

## 7. 관리자 URL

정상 관리자 URL:

```txt
/admin/login
/admin/leads
/admin/today
/admin/tasks
/admin/portfolio
/admin/portfolio/new
/admin/quote-proposals
/admin/quote-rules
/admin/quote-calculator
```

주의:

```txt
/admin/lead
```

이 주소는 존재하지 않으며 404가 정상입니다.

정확한 리드 목록 주소는:

```txt
/admin/leads
```

---

## 8. 현재 실제 확인된 기능

### 8.1 관리자 페이지

확인 결과:

```txt
/admin/today 정상 렌더링
관리자 메뉴 정상 표시
대시보드 카운트 0 표시
```

새 DB이므로 `0` 표시는 정상입니다.

### 8.2 견적 문의 저장

확인 결과:

```txt
고객 견적문의 제출 성공
Supabase Lead 테이블에 문의 데이터 저장 확인
```

이로써 아래 흐름은 정상입니다.

```txt
고객 문의폼
→ POST /api/leads
→ Prisma
→ Supabase Postgres Lead 테이블
```

### 8.3 Naver Object Storage 업로드

확인 결과:

```txt
관리자 제작 사례 대표 이미지 업로드
→ Naver Object Storage 버킷에 실제 파일 저장 확인
```

현재 업로드 API:

```txt
POST /api/admin/uploads/portfolio
```

storage adapter 파일:

```txt
src/lib/storage/portfolio-storage.ts
```

사용 provider:

```txt
PORTFOLIO_STORAGE_PROVIDER=naver-object-storage
```

업로드 파일 경로 규칙:

```txt
portfolio/portfolio-YYYYMMDD-uuid.webp
portfolio/portfolio-YYYYMMDD-uuid-thumb.webp
```

---

## 9. Storage 코드 구조

파일:

```txt
src/lib/storage/portfolio-storage.ts
```

지원 provider:

```txt
local
vercel-blob
naver-object-storage
naver
```

동작:

```txt
PORTFOLIO_STORAGE_PROVIDER가 없거나 local이면 local adapter
PORTFOLIO_STORAGE_PROVIDER=vercel-blob이면 Vercel Blob adapter
PORTFOLIO_STORAGE_PROVIDER=naver-object-storage이면 Naver Object Storage adapter
```

Naver Object Storage adapter는 AWS S3-compatible SDK를 사용합니다.

관련 dependency:

```txt
@aws-sdk/client-s3
```

이미지 최적화:

```txt
sharp 기반 WebP 변환
대표 이미지 최대 1600px
썸네일 최대 600px
```

DB 저장 필드:

```txt
PortfolioCase.mainImageUrl
```

주의:

```txt
thumbnailUrl은 API 응답에는 포함되지만 현재 DB에는 저장하지 않음.
```

---

## 10. 아직 추가 확인하면 좋은 항목

아래는 운영 전 최종 확인 항목입니다.

### 제작 사례 저장과 표시

1. `/admin/portfolio/new` 접속
2. 제작 사례 필수 정보 입력
3. 대표 이미지 업로드
4. 제작 사례 저장
5. `/admin/portfolio` 목록에서 사례 확인
6. `/portfolio` 고객 화면에서 사례 표시 확인
7. `/portfolio/[slug]` 상세 페이지에서 이미지 표시 확인

### 견적 룰 / 견적 계산

새 Supabase DB라 `QuoteRule` 데이터가 비어 있을 수 있습니다.

앱에는 fallback quote rule이 있어 문의 저장은 가능하지만, 운영 전 관리자 견적 룰 화면에서 기본 룰 데이터를 확인하거나 seed를 적용하는 것이 좋습니다.

확인 경로:

```txt
/admin/quote-rules
/admin/quote-calculator
```

### private access 설정

현재 private preview 모드 사용 시:

```txt
/access
```

를 먼저 통과해야 합니다.

운영 공개 전에는 `SITE_ACCESS_ENABLED` 값을 의도적으로 결정해야 합니다.

---

## 11. 현재 남은 위험 요소

1. 기존 SQLite 데이터는 자동 이관되지 않음
2. 새 Supabase DB는 운영 데이터가 거의 없는 상태
3. QuoteRule seed 적용 여부 확인 필요
4. PortfolioCase 기존 제작 사례 데이터가 없다면 새로 등록하거나 이관 필요
5. `NEXT_PUBLIC_SITE_URL`이 최종 대표 Vercel Production URL과 맞는지 확인 필요
6. Naver Object Storage 버킷/파일 public 접근 정책 확인 필요
7. Production/Preview 환경변수 scope가 의도와 맞는지 확인 필요

---

## 12. 다음 GPT가 이어서 할 일

추천 순서:

1. `/admin/portfolio/new`에서 제작 사례 저장까지 최종 확인
2. `/portfolio`, `/portfolio/[slug]`에서 Naver 이미지 표시 확인
3. `/admin/quote-rules`에서 기본 견적 룰 데이터 존재 여부 확인
4. 필요 시 `quote-rules:seed` 또는 운영용 룰 수동 등록 진행
5. `/admin/leads`에서 신규 문의 상세 확인
6. 관리자 CSV export 확인
7. 운영 전 `SITE_ACCESS_ENABLED` 공개 여부 결정
8. 기존 SQLite 데이터 이관 필요 여부 결정

---

## 13. 테스트 완료 체크리스트

현재 완료:

- [x] Supabase baseline schema 적용
- [x] Vercel DB 환경변수 수정
- [x] Vercel redeploy 후 관리자 화면 접속
- [x] `/admin/today` 렌더링
- [x] 고객 견적문의 제출
- [x] Supabase `Lead` 저장 확인
- [x] Naver Object Storage 파일 업로드 확인

추가 확인 필요:

- [ ] 제작 사례 저장 후 `/admin/portfolio` 목록 확인
- [ ] `/portfolio` 고객 화면 이미지 표시 확인
- [ ] `/portfolio/[slug]` 상세 이미지 표시 확인
- [ ] QuoteRule 데이터/계산기 확인
- [ ] 운영 공개 전 private access 설정 최종 결정

---

## 14. 최종 상태 요약

현재 `perpackage-marketing-leads`는 새 운영 구조의 핵심 축인:

```txt
Vercel
Supabase Postgres
Naver Object Storage
```

세 가지 연동이 1차로 성공한 상태입니다.

이제 남은 일은 기능 추가가 아니라 운영 데이터/공개 설정/최종 화면 확인에 가깝습니다.

