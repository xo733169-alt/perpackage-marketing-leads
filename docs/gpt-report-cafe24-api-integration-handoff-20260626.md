# GPT 보고용: 페르패키지 Cafe24 OAuth/Webhook 연동 기반 작업 요약

작성일: 2026-06-26

## 1. 현재 상황

프로젝트는 `perpackage-marketing-leads`다.

기존에는 고객이 `/upload`에서 인쇄파일을 올리고, 관리자가 `/admin/uploads`에서 검수하는 1차 업로드 허브 MVP가 로컬 코드에 구현되어 있었다. 이번 작업에서는 그 위에 Cafe24 주문과 업로드 접수번호를 자동 연결할 수 있는 OAuth/Webhook 기반을 추가했다.

중요: 아직 변경분이 GitHub/Vercel production에 배포된 상태는 아니다. 외부 URL에서 `/upload`가 404로 보이는 이유는 업로드 허브 파일들이 아직 untracked/local 상태이기 때문이다.

## 2. 이번에 구현한 것

Cafe24 연동 기반:

- Cafe24 OAuth 시작 API
- Cafe24 OAuth callback API
- Cafe24 access token / refresh token 저장 모델
- Cafe24 주문 Webhook 수신 API
- Webhook 인증정보 검증 구조
- Webhook payload redaction 저장
- 주문 메모에서 업로드 접수번호 추출
- UploadProject와 Cafe24 주문 자동 연결
- 관리자 수동 주문 동기화 API
- 관리자 수동 주문 연결 API
- 관리자 Cafe24 연동 상태 페이지

업로드 접수번호:

- 형식: `PP-UP-YYYYMMDD-001`
- 추출 정규식: `/PP-UP-\d{8}-\d{3,}/i`
- 신규 UploadProject 생성 시 `uploadCode`를 자동 생성하도록 준비했다.

## 3. 새로 만든 주요 URL

관리자 페이지:

```txt
/admin/cafe24
```

Cafe24 OAuth:

```txt
GET /api/cafe24/oauth/start
GET /api/cafe24/oauth/callback
```

Cafe24 Webhook:

```txt
POST /api/cafe24/webhooks/orders
```

관리자 API:

```txt
POST /api/admin/cafe24/orders/[orderId]/sync
POST /api/admin/uploads/[id]/link-order
```

## 4. Cafe24 Developers에 등록할 값

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

주의: Webhook은 프로젝트 배포와 환경변수 등록 후 Cafe24 Developers에 등록해야 한다.

## 5. 추가한 환경변수 이름

실제 값은 보고서에 넣지 않는다.

```txt
CAFE24_MALL_ID
CAFE24_CLIENT_ID
CAFE24_CLIENT_SECRET
CAFE24_REDIRECT_URI
CAFE24_WEBHOOK_SECRET
CAFE24_API_VERSION
CAFE24_SCOPES
```

기존 운영 필수값도 필요하다.

```txt
DATABASE_URL
DIRECT_URL
ADMIN_PASSWORD
NEXT_PUBLIC_SITE_URL
SITE_ACCESS_ENABLED
NAVER_OBJECT_STORAGE_ACCESS_KEY
NAVER_OBJECT_STORAGE_SECRET_KEY
NAVER_OBJECT_STORAGE_BUCKET
NAVER_OBJECT_STORAGE_ENDPOINT
NAVER_OBJECT_STORAGE_REGION
```

## 6. DB 변경

`UploadProject`에 추가한 필드:

```txt
uploadCode
cafe24MallId
cafe24OrderId
cafe24OrderNo
cafe24MemberId
cafe24OrderMemo
linkedAt
linkSource
orderSyncedAt
```

새 모델:

```txt
Cafe24Token
Cafe24WebhookEvent
```

생성된 migration:

```txt
prisma/migrations/20260626143000_add_cafe24_integration/migration.sql
```

주의:

- PostgreSQL/Supabase 기준 migration이다.
- SQLite migration은 만들지 않았다.
- Supabase에 적용하려면 `DATABASE_URL`, `DIRECT_URL`이 맞게 설정되어 있어야 한다.

## 7. 보안 처리

적용된 보안 방향:

- OAuth state HMAC 서명
- OAuth state 10분 만료
- Cafe24 token은 DB에만 저장
- token/secret/password/authorization 계열 payload 필드는 저장 전 redaction
- Webhook 인증정보 검증
- 관리자 API는 기존 관리자 인증 사용
- 관리자 mutation API는 기존 origin 검증 사용
- 화면과 보고서에 실제 secret/token 값 출력 금지

추가 확인 필요:

- Cafe24 Webhook TEST에서 실제 인증 header 이름을 확인해야 한다.
- 현재 구현은 여러 후보 header를 허용하는 방어적 구조다.

## 8. 검증 결과

실행 완료:

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

결과:

- `pnpm test`: 통과, 38 test files / 186 tests
- `pnpm exec tsc --noEmit`: 통과
- `pnpm build`: 통과

`pnpm deployment:check` 결과:

- 실패
- 현재 shell에 운영 환경변수가 없기 때문
- 실제 secret 값은 출력하지 않음

## 9. 아직 배포/확인되지 않은 것

아직 완료되지 않은 것:

- Git commit/push
- Vercel production 재배포
- Supabase migration 적용
- Vercel 환경변수 등록
- Cafe24 OAuth 실제 승인 테스트
- Cafe24 Webhook TEST
- 실제 주문 메모 기반 자동 연결 QA

브라우저에서 `https://perpackage-marketing-leads.vercel.app/upload`가 404로 보이는 것은 현재 production 배포본에 `/upload` 코드가 아직 올라가지 않았기 때문이다.

## 10. 이번 작업에서 만들지 않은 것

의도적으로 제외:

- 고객 주문 전 파일 업로드 UI 전체 개편
- 웹하드형 UploadBox
- 고객 파일 삭제/이동/이름 변경/다운로드 기능
- Cafe24 결제 기능
- 세금계산서 기능
- 전자계약 기능
- 실시간 채팅
- Cafe24 주문 상태 변경
- Cafe24 주문 취소/환불/배송 상태 변경
- Cafe24 상품 수정
- Cafe24 회원 정보 수정

## 11. 다음 GPT가 이어서 할 일

추천 순서:

1. 현재 변경분의 git status 확인
2. 업로드 허브/Cafe24 연동 변경분을 commit
3. GitHub main에 push
4. Vercel 새 배포 확인
5. Vercel 환경변수 등록
6. Supabase/PostgreSQL migration 적용
7. `/admin/cafe24` 접속
8. OAuth 연결 시작
9. Cafe24 권한 승인
10. `/admin/cafe24`에서 token 상태 확인
11. Cafe24 Developers에 Webhook URL 등록
12. Webhook TEST 실행
13. Webhook 로그 저장 확인
14. 주문 메모에 `PP-UP-YYYYMMDD-001` 넣고 자동 연결 QA

## 12. 참고 보고서

상세 보고서:

```txt
reports/2026-06-26-cafe24-api-integration-report.md
```

업로드 MVP QA 보고서:

```txt
docs/gpt-report-upload-mvp-qa-before-upload-box-20260626.md
```
