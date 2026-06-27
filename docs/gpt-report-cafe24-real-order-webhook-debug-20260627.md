# GPT 보고서: Cafe24 실제 주문 Webhook 수신 및 주문 상세 조회 점검

작성일: 2026-06-27
프로젝트: `perpackage-marketing-leads`

## 1. 작업 목적

Cafe24 Webhook TEST 요청이 `SKIPPED_TEST_PAYLOAD`로 정상 처리되는 것을 확인한 뒤, 실제 운영 주문 Webhook 수신 시 주문 상세 조회 흐름을 점검하고 관리자 화면에서 안전하게 확인할 수 있는 진단 정보를 추가했다.

이번 작업의 핵심은 TEST payload 처리는 유지하면서, 실제 주문 payload에 대해서만 Cafe24 주문 상세 조회를 시도하고 그 결과를 관리자 로그에서 확인할 수 있게 만드는 것이다.

## 2. 현재 기준

- Cafe24 Webhook 인증: 정상
- Cafe24 TEST payload: `SKIPPED_TEST_PAYLOAD` 처리 확인 완료
- OAuth token 상태: `mallId=peerl` 기준 연결됨
- 이번 작업 대상:
  - 실제 운영 주문 Webhook 수신
  - 주문 상세 조회 시도 여부
  - token lookup mallId 확인
  - 주문 상세 조회 성공/실패 상태 표시

## 3. 수정한 파일

- `src/lib/cafe24.ts`
- `src/app/api/cafe24/webhooks/orders/route.ts`
- `src/app/admin/cafe24/page.tsx`
- `src/test/cafe24-integration.test.ts`

## 4. 주요 변경 내용

### 4.1 TEST payload 처리 유지

Cafe24 TEST payload는 기존처럼 실제 주문 상세 조회를 시도하지 않는다.

상태:

```txt
SKIPPED_TEST_PAYLOAD
```

메시지:

```txt
Cafe24 test payload cannot be fetched as real order.
```

### 4.2 실제 운영 주문 payload만 주문 상세 조회 시도

Webhook route는 아래 조건일 때만 Cafe24 주문 상세 조회를 시도한다.

- TEST payload가 아님
- `order_id`가 있음
- payload 안에 업로드 접수번호가 아직 없음
- Cafe24 필수 환경변수가 모두 설정되어 있음

주문 상세 조회는 기존 `fetchCafe24OrderDetail` 흐름을 사용한다.

```txt
fetchCafe24OrderDetail({
  orderId,
  mallId: resolvedMallId
})
```

여기서 `resolvedMallId`는 다음 기준으로 결정된다.

1. payload의 `mall_id`
2. 없으면 `CAFE24_MALL_ID`

`client_id`만으로 OAuth token을 찾지 않는다.

### 4.3 안전한 debug 정보 저장

DB schema 변경 없이 기존 `cafe24_webhook_events.payload_json` 안에 안전한 `_perpackage_debug` 블록을 추가했다.

저장되는 debug 항목:

```txt
mallId
orderId
eventType
tokenLookupMallId
orderDetailLookupStatus
orderDetailLookupMessage
orderDetailLookupAt
```

저장하지 않는 항목:

```txt
access token
refresh token
signature
webhook secret
client secret
authorization header value
```

### 4.4 주문 상세 조회 상태값

주문 상세 조회 상태는 아래 값으로 남는다.

```txt
NOT_ATTEMPTED
SKIPPED_TEST_PAYLOAD
NOT_ATTEMPTED_UPLOAD_CODE_PRESENT
NOT_ATTEMPTED_NO_ORDER_ID
NOT_ATTEMPTED_CONFIG_MISSING
ATTEMPTING
SUCCESS
FAILED
```

실패 시 Webhook event status는 아래처럼 저장한다.

```txt
ORDER_DETAIL_SYNC_FAILED
```

이렇게 하면 Webhook 인증 실패와 주문 상세 조회 실패를 구분할 수 있다.

### 4.5 관리자 화면 표시

`/admin/cafe24`의 최근 Webhook 수신 로그에 아래 컬럼을 추가했다.

- `event type`
- `mall_id`
- `order_no`
- `order_id`
- `tokenLookupMallId`
- `주문 상세 조회`
- `received_at`
- `processed_at`
- `메시지`

관리자 화면은 기존처럼 관리자 인증이 필요하다.

## 5. 실제 주문 상세 조회 이후 흐름

주문 상세 조회가 성공하면 `extractCafe24OrderInfo`로 상세 응답에서 주문 정보와 업로드 접수번호를 다시 추출한다.

그 다음 기존 함수로 이어진다.

```txt
linkCafe24OrderToUploadProject
```

따라서 실제 주문 상세 조회가 성공하고 주문 메모 또는 payload 안에서 업로드 접수번호가 추출되면, 다음 단계에서 업로드 접수번호 기반 프로젝트 연결로 이어질 수 있는 구조다.

## 6. 보안 주의사항

이번 작업에서 secret, access token, refresh token, signature 값은 화면이나 신규 로그에 노출하지 않는다.

신규 console 로그에는 아래 값만 남긴다.

- `mallId`
- `orderId`
- `eventType`
- `tokenLookupMallId`

payload 저장 전에는 기존 `redactSensitivePayload`를 계속 사용한다.

## 7. 테스트 결과

아래 검증을 통과했다.

```bash
vitest run src/test/cafe24-integration.test.ts
tsc --noEmit
npm run build
```

검증 요약:

- Cafe24 integration test: 11 tests 통과
- TypeScript 검사 통과
- Next.js production build 통과
- `/admin/cafe24` route build 포함 확인
- `/api/cafe24/webhooks/orders` route build 포함 확인

## 8. 현재 Git 상태

현재 수정 파일:

```txt
src/app/admin/cafe24/page.tsx
src/app/api/cafe24/webhooks/orders/route.ts
src/lib/cafe24.ts
src/test/cafe24-integration.test.ts
```

현재 미추적 보고서 파일:

```txt
docs/gpt-report-cafe24-real-order-webhook-debug-20260627.md
docs/gpt-report-cafe24-webhook-test-payload-token-lookup-20260627.md
docs/gpt-report-cafe24-webhook-x-api-key-20260627.md
```

아직 이번 변경분은 commit/push 하지 않았다.

## 9. 운영에서 확인할 항목

실제 Cafe24 운영 주문 Webhook이 들어오면 `/admin/cafe24`에서 아래를 확인한다.

1. `status`
2. `event type`
3. `mall_id`
4. `order_id`
5. `tokenLookupMallId`
6. `주문 상세 조회` 상태
7. `received_at`
8. `processed_at`
9. `메시지`

기대 흐름:

- TEST 요청: `SKIPPED_TEST_PAYLOAD`
- 실제 주문 payload + 주문 상세 조회 성공: `SUCCESS` 이후 접수번호 연결 시도
- 실제 주문 payload + 주문 상세 조회 실패: `ORDER_DETAIL_SYNC_FAILED`
- 주문 상세 조회가 필요 없는 payload: `NOT_ATTEMPTED_UPLOAD_CODE_PRESENT`

## 10. 남은 작업

1. 실제 Cafe24 주문 이벤트를 등록하고 운영 주문으로 Webhook 수신 확인
2. Cafe24 실제 payload에서 `mall_id`, `order_id`, `event type` 구조 확인
3. 주문 상세 조회 응답에서 업로드 접수번호가 어디에 들어오는지 확인
4. 업로드 접수번호가 안정적으로 추출되면 자동 프로젝트 연결 흐름 검증
5. 주문 상세 조회 성공 후 업로드 프로젝트가 없을 때 자동 생성할지, 기존 프로젝트만 연결할지 정책 결정

## 11. 다음 단계 제안

다음 단계는 실제 Cafe24 운영 주문 Webhook 1건을 발생시킨 뒤 `/admin/cafe24` 로그를 확인하는 것이다.

확인 결과에 따라 아래 중 하나로 진행하면 된다.

- 주문 상세 조회 성공 + 업로드 접수번호 추출 성공: 업로드 프로젝트 자동 연결 QA
- 주문 상세 조회 성공 + 업로드 접수번호 없음: Cafe24 주문 메모 또는 주문완료 페이지에 접수번호 삽입 방식 설계
- 주문 상세 조회 실패: scope, token 만료, mallId, Cafe24 주문 API endpoint 로그 기준으로 재점검
