# 페르패키지 Cafe24 API/OAuth/Webhook 연동 기반 보고서

작성일: 2026-06-26

## 1. 작업 목적

고객이 주문 전에 발급받은 업로드 접수번호를 Cafe24 주문 메모에 남기면, Cafe24 주문 생성 Webhook 또는 관리자 수동 동기화를 통해 업로드 프로젝트와 Cafe24 주문을 자동 연결할 수 있는 기반을 추가했다.

이번 작업은 Cafe24 OAuth, token 저장, 주문 Webhook 수신, 주문 메모에서 업로드 접수번호 추출, UploadProject 연결 준비까지가 범위다. 고객 업로드 UI 전체 개편, 결제, 주문 상태 변경, 상품 수정, Cafe24 주문 대체 기능은 만들지 않았다.

## 2. 현재 Cafe24 Developers 설정 상태

사용자가 제공한 현재 설정 기준:

- 앱 생성 완료
- 앱 이름: 페르패키지
- 앱 유형: Web application / Authorization Code
- 타임존: Asia/Seoul
- Client ID 생성됨
- Client Secret Key 생성됨
- Webhook 인증정보 생성됨
- Webhook 등록은 아직 하지 않음
- 권한:
  - 앱(Application): 읽기+쓰기
  - 주문(Order): 읽기
  - 회원(Customer): 읽기
  - 상품(Product): 읽기
  - 배송(Shipping): 읽기
  - 고객 식별자(Customer Identifier): 읽기

주의: 실제 Client Secret, access token, refresh token, Webhook secret 값은 코드/보고서에 출력하지 않았다.

## 3. 추가/수정 파일

추가:

- `src/lib/cafe24.ts`
- `src/lib/upload-code.ts`
- `src/app/api/cafe24/oauth/start/route.ts`
- `src/app/api/cafe24/oauth/callback/route.ts`
- `src/app/api/cafe24/webhooks/orders/route.ts`
- `src/app/api/admin/cafe24/orders/[orderId]/sync/route.ts`
- `src/app/api/admin/uploads/[id]/link-order/route.ts`
- `src/app/admin/cafe24/page.tsx`
- `src/test/cafe24-integration.test.ts`
- `prisma/migrations/20260626143000_add_cafe24_integration/migration.sql`
- `reports/2026-06-26-cafe24-api-integration-report.md`

수정:

- `prisma/schema.prisma`
- `.env.example`
- `src/lib/deployment-env.ts`
- `src/lib/admin-uploads.ts`
- `src/components/AdminNav.tsx`
- `src/components/PrintFileUploadForm.tsx`
- `src/components/PrintFileUploadSuccessDetails.tsx`
- `src/app/api/uploads/projects/route.ts`
- `src/app/admin/uploads/page.tsx`
- `src/app/admin/uploads/[id]/page.tsx`

## 4. DB schema 변경 여부

변경함.

`UploadProject`에 추가한 필드:

- `uploadCode String? @unique`
- `cafe24MallId String?`
- `cafe24OrderId String?`
- `cafe24OrderNo String?`
- `cafe24MemberId String?`
- `cafe24OrderMemo String?`
- `linkedAt DateTime?`
- `linkSource String?`
- `orderSyncedAt DateTime?`

새 모델:

- `Cafe24Token`
- `Cafe24WebhookEvent`

`Cafe24WebhookEvent`는 Webhook payload를 비밀값 제거 후 저장하고, 처리 상태를 `RECEIVED`, `LINKED`, `SKIPPED`, `FAILED` 등으로 기록한다.

## 5. migration 생성 여부

생성함.

파일:

`prisma/migrations/20260626143000_add_cafe24_integration/migration.sql`

주의:

- PostgreSQL 기준 migration이다.
- 기존 SQLite migration을 만들거나 적용하지 않았다.
- 실제 Supabase/PostgreSQL 환경에는 배포 전 `DATABASE_URL`, `DIRECT_URL` 설정 후 migration 적용이 필요하다.

## 6. 추가한 환경변수 목록

`.env.example`에 추가:

- `CAFE24_MALL_ID`
- `CAFE24_CLIENT_ID`
- `CAFE24_CLIENT_SECRET`
- `CAFE24_REDIRECT_URI`
- `CAFE24_WEBHOOK_SECRET`
- `CAFE24_API_VERSION`
- `CAFE24_SCOPES`

`deployment-env` helper에도 Cafe24 환경변수 이름을 추가했다. 다만 전체 서비스 배포를 막는 필수값으로 강제하지 않고, Cafe24 값이 일부만 들어간 경우 누락 항목을 알려주도록 처리했다.

## 7. OAuth 흐름

추가 API:

- `GET /api/cafe24/oauth/start`
- `GET /api/cafe24/oauth/callback`

흐름:

1. 관리자가 `/admin/cafe24`에서 OAuth 연결 시작 클릭
2. `/api/cafe24/oauth/start`가 관리자 인증을 확인
3. HMAC 기반 state 생성
4. state를 httpOnly cookie에 저장
5. Cafe24 OAuth authorize URL로 redirect
6. Cafe24가 callback으로 `code`, `state` 전달
7. callback에서 state cookie 검증
8. token endpoint로 access token / refresh token 요청
9. `Cafe24Token`에 mallId 기준 upsert 저장
10. 성공 시 `/admin/cafe24`로 redirect

보안:

- Client Secret 값은 화면/로그/보고서에 출력하지 않는다.
- OAuth state는 10분 만료 구조다.
- token 응답은 DB 저장 외에는 노출하지 않는다.

## 8. Webhook 수신 흐름

추가 API:

- `POST /api/cafe24/webhooks/orders`

흐름:

1. Cafe24 주문 관련 Webhook 수신
2. Webhook 인증정보 검증
3. JSON payload parse
4. payload 비밀값 redaction
5. `Cafe24WebhookEvent`에 원문 성격의 redacted payload 저장
6. payload에서 mallId, orderId, orderNo, orderMemo, uploadCode 추출
7. payload만으로 uploadCode가 부족하고 orderId가 있으면 Cafe24 order detail API 조회 시도
8. 주문 메모/상세 텍스트에서 `PP-UP-YYYYMMDD-001` 패턴 추출
9. `UploadProject.uploadCode`와 매칭
10. 연결 가능하면 UploadProject에 Cafe24 주문 정보 저장
11. `FileReviewLog`에 시스템 로그 생성
12. WebhookEvent 상태를 `LINKED`, `SKIPPED`, `FAILED`로 갱신

실패 처리:

- 인증 실패는 401
- JSON 오류는 400
- 처리 실패는 WebhookEvent에 기록하고 무조건 500으로 반복 재시도시키지 않도록 200 응답을 기본으로 사용

## 9. 주문 자동 연결 로직

업로드 접수번호 패턴:

```txt
PP-UP-YYYYMMDD-001
```

정규식:

```txt
/PP-UP-\d{8}-\d{3,}/i
```

연결 규칙:

- uploadCode가 없으면 연결하지 않음
- uploadCode에 해당하는 UploadProject가 없으면 `SKIPPED`
- 이미 다른 Cafe24 주문과 연결된 프로젝트는 덮어쓰지 않고 `FAILED`
- 같은 주문과 이미 연결된 경우 idempotent 처리
- 신규 연결 시:
  - `cafe24MallId`
  - `cafe24OrderId`
  - `cafe24OrderNo`
  - `cafe24MemberId`
  - `cafe24OrderMemo`
  - `linkedAt`
  - `linkSource`
  - `orderSyncedAt`
  - `status = LINKED_TO_ORDER`
  를 저장
- `FileReviewLog`에 `SYSTEM` 로그 생성

## 10. 보안 처리

적용한 처리:

- OAuth state HMAC 서명 및 만료 검증
- Webhook direct token 또는 HMAC signature 검증 구조
- payload 저장 전 token/secret/password/authorization 계열 필드 redaction
- 관리자 API는 기존 관리자 인증 사용
- 관리자 mutation API는 기존 origin 검증 사용
- token/secret 값은 보고서와 화면에 출력하지 않음
- 관리자 페이지는 token 만료 시각과 설정 여부만 표시

추가 확인 필요:

- Cafe24 Webhook TEST에서 실제 인증 header 이름을 확인해야 한다.
- 현재 구현은 `x-cafe24-webhook-secret`, `x-cafe24-hmac-sha256`, `x-cafe24-signature`, `x-cafe24-webhook-signature`, `authorization` 등 여러 후보를 허용하는 방어적 구조다.

## 11. Cafe24 Developers에서 사용자가 해야 할 설정

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

권한:

- 앱(Application): 읽기+쓰기
- 주문(Order): 읽기
- 회원(Customer): 읽기
- 상품(Product): 읽기
- 배송(Shipping): 읽기
- 고객 식별자(Customer Identifier): 읽기

Webhook 이벤트:

- 1차 추천: 주문 생성
- 필요 시 이후 추가: 주문 결제 완료

주의:

- Webhook은 프로젝트 배포와 환경변수 설정, OAuth/API 검증 후 등록하는 순서가 맞다.

## 12. Vercel 환경변수 설정 목록

기존 운영 환경변수 외에 추가 등록:

- `CAFE24_MALL_ID`
- `CAFE24_CLIENT_ID`
- `CAFE24_CLIENT_SECRET`
- `CAFE24_REDIRECT_URI`
- `CAFE24_WEBHOOK_SECRET`
- `CAFE24_API_VERSION`
- `CAFE24_SCOPES` optional

기존 필수 환경변수도 함께 필요:

- `DATABASE_URL`
- `DIRECT_URL`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_SITE_URL`
- `SITE_ACCESS_ENABLED`
- Naver Object Storage 관련 값

## 13. 테스트/빌드 결과

실행:

```bash
pnpm test
```

결과:

- 통과
- 38 test files passed
- 186 tests passed

실행:

```bash
pnpm exec tsc --noEmit
```

결과:

- 통과

실행:

```bash
pnpm build
```

결과:

- 통과
- `/admin/cafe24`
- `/api/cafe24/oauth/start`
- `/api/cafe24/oauth/callback`
- `/api/cafe24/webhooks/orders`
- `/api/admin/cafe24/orders/[orderId]/sync`
- `/api/admin/uploads/[id]/link-order`
  route 포함 확인

실행:

```bash
pnpm deployment:check
```

결과:

- 실패
- 현재 shell에 운영 환경변수가 없어서 실패
- 누락 항목: `DATABASE_URL`, `DIRECT_URL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`, `SITE_ACCESS_ENABLED`, Naver Object Storage 관련 값
- 실제 secret 값은 출력하지 않음

## 14. 수동 QA 체크리스트

1. Vercel에 Supabase/PostgreSQL 환경변수 설정
2. Vercel에 Cafe24 환경변수 설정
3. Supabase/PostgreSQL에 migration 적용
4. Cafe24 Developers에 App URL 등록
5. Cafe24 Developers에 Redirect URI 등록
6. `/admin/cafe24` 접속
7. OAuth 연결 시작 버튼 클릭
8. Cafe24 권한 승인
9. callback 성공 확인
10. `/admin/cafe24`에서 token 상태 확인
11. Cafe24 Developers에 Webhook URL 등록
12. Webhook TEST 실행
13. `/admin/cafe24`에서 Webhook 로그 저장 확인
14. 샘플 주문 메모에 `PP-UP-YYYYMMDD-001` 포함
15. 해당 UploadProject와 주문 자동 연결 확인
16. 접수번호 없는 주문은 연결되지 않고 `SKIPPED` 기록되는지 확인
17. 이미 다른 주문과 연결된 업로드 건이 덮어써지지 않는지 확인

## 15. 아직 만들지 않은 것

이번 작업에서 만들지 않은 것:

- 고객 주문 전 파일 업로드 UI 전체 개편
- UploadBox 폴더형 웹하드 기능
- 파일 업로드 대용량 처리 변경
- Cafe24 결제 기능
- 세금계산서 기능
- 전자계약 기능
- 실시간 채팅
- Cafe24 주문 상태 변경
- Cafe24 주문 취소/환불/배송 상태 변경
- Cafe24 상품 수정
- Cafe24 회원 정보 수정

## 16. 다음 작업 제안

1. 현재 변경분 commit/push 후 Vercel 배포
2. Vercel에 DB/Naver/Cafe24 환경변수 등록
3. Supabase/PostgreSQL migration 적용
4. `/admin/cafe24`에서 OAuth 연결 QA
5. Cafe24 Developers Webhook TEST로 인증 header 확인
6. 실제 주문 메모에 업로드 접수번호를 넣어 자동 연결 QA
7. 통과 후 UploadBox 또는 주문 전 파일 업로드 UX 설계 착수
