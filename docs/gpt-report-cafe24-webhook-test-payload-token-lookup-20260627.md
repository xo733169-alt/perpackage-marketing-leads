# GPT 보고서: Cafe24 Webhook TEST payload 및 OAuth token lookup 처리

작성일: 2026-06-27
프로젝트: `perpackage-marketing-leads`

## 1. 작업 목적

Cafe24 Webhook 인증은 성공했지만, `/admin/cafe24` 최근 Webhook 수신 로그에서 TEST 요청이 `FAILED`로 표시되고 `Cafe24 token is not connected.` 오류가 남는 문제를 정리하고 수정했다.

이번 작업의 핵심은 Webhook 인증 문제가 아니라, 인증 이후 내부 처리 단계에서 Cafe24 TEST payload를 실제 주문 Webhook처럼 처리하면서 OAuth token 조회 및 주문 상세 조회가 잘못 진행되는 문제를 해결하는 것이다.

## 2. 확인된 현재 상태

- Cafe24 Developers WebHook TEST: 성공 `(200)`
- Vercel Logs: `POST /api/cafe24/webhooks/orders status=200`
- `/admin/cafe24` 상단 OAuth token 상태:
  - `mallId`: `peerl`
  - 연결 상태: 연결됨
  - 최근 갱신: 오늘 09:23
  - 만료 시각: 오늘 11:23
- 기존 문제:
  - 최근 Webhook 수신 로그에 `status: FAILED`
  - `orderId: Tb1dbe01667974041111`
  - `error: Cafe24 token is not connected.`

## 3. 원인

Cafe24 Webhook TEST payload는 실제 운영 주문 payload와 다를 수 있다.

TEST payload에는 샘플 성격의 값이 들어올 수 있다.

- `client_id`: `sample...`
- `order_id`: `Tb...`
- `app_name`: `app_name`

이 값은 실제 주문 상세 조회가 가능한 주문번호가 아니므로, 실제 운영 주문처럼 Cafe24 주문 상세 API를 호출하면 실패할 수 있다.

또한 token 조회 기준이 `client_id` 쪽으로 흐르면, 실제 저장된 OAuth token의 `mallId=peerl`과 맞지 않아 token을 찾지 못한 것처럼 보일 수 있다.

## 4. 수정 방향

Webhook 처리 기준을 아래처럼 정리했다.

1. token lookup 기준은 `client_id`가 아니라 `mallId` 기준으로 유지한다.
2. `payload.mall_id`가 있으면 우선 사용한다.
3. `payload.mall_id`가 없으면 `CAFE24_MALL_ID` fallback을 사용한다.
4. Cafe24 TEST payload로 판단되면 실제 주문 상세 조회를 시도하지 않는다.
5. TEST payload는 `SKIPPED_TEST_PAYLOAD` 상태로 저장한다.
6. 운영 Webhook은 기존처럼 resolved mallId 기준으로 OAuth token을 찾고 주문 상세 조회 단계로 넘어간다.

## 5. 수정한 파일

- `src/lib/cafe24.ts`
- `src/app/api/cafe24/webhooks/orders/route.ts`
- `src/test/cafe24-integration.test.ts`

## 6. 주요 변경 내용

### `src/lib/cafe24.ts`

- `isCafe24TestWebhookPayload` 함수를 추가했다.
- Cafe24 TEST payload 특징을 감지한다.
  - `client_id`가 `sample`로 시작
  - 또는 `order_id`가 `Tb`로 시작하고 `app_name`이 `app_name`

### `src/app/api/cafe24/webhooks/orders/route.ts`

- Webhook payload에서 resolved mallId를 안정적으로 계산한다.
- `payload.mall_id`가 없으면 `CAFE24_MALL_ID` fallback을 사용한다.
- Cafe24 TEST payload는 실제 주문 상세 조회를 건너뛴다.
- TEST payload는 아래 상태로 저장한다.

```txt
SKIPPED_TEST_PAYLOAD
```

- TEST payload 처리 시 관리자 로그에 남는 메시지는 아래처럼 명확하게 정리했다.

```txt
Cafe24 test payload cannot be fetched as real order.
```

### `src/test/cafe24-integration.test.ts`

- `mallId=peerl` fallback 확인 테스트를 추가했다.
- Cafe24 TEST payload 감지 테스트를 추가했다.
- 기존 `x-api-key` Webhook 인증 테스트는 유지했다.

## 7. 보안 처리

- secret, token, signature 값은 코드와 로그에 출력하지 않는다.
- 진단 로그에는 값이 아니라 상태와 header 이름만 남기는 기존 방향을 유지했다.
- 이번 작업에서는 DB schema 변경이나 migration을 만들지 않았다.
- Cafe24 결제, 취소, 환불, 배송 상태 변경 기능은 추가하지 않았다.

## 8. 검증 결과

아래 검증을 통과했다.

```bash
vitest run src/test/cafe24-integration.test.ts
tsc --noEmit
npm run build
```

검증 요약:

- Cafe24 integration test 통과
- TypeScript 검사 통과
- Next.js production build 통과
- 수정 파일 secret scan 이상 없음

## 9. GitHub 반영

최신 반영 커밋:

```txt
30c974633c44aa9ad25332b1ecae253d7a7c3b58
fix: handle cafe24 webhook test payloads
```

GitHub `main` 브랜치에 push 완료.

## 10. Vercel 배포 상태

Vercel Production 배포가 새로 생성되어 `Ready` 상태임을 확인했다.

배포 URL:

```txt
https://perpackage-marketing-leads-ee5p72if8-peerl.vercel.app
```

공식 alias:

```txt
https://perpackage-marketing-leads.vercel.app
https://perpackage-marketing-leads-peerl.vercel.app
https://perpackage-marketing-leads-xo733169-alt-peerl.vercel.app
```

`/upload`, `/admin/cafe24`는 Head 요청 기준 `307 Temporary Redirect` 응답을 확인했다. 404는 아니며, 접근 보호 또는 인증 흐름으로 리다이렉트되는 상태다.

## 11. 기대 동작

Cafe24 Developers에서 Webhook TEST를 다시 실행하면 다음 흐름이 기대된다.

1. Cafe24 Developers WebHook 로그: `성공(200)`
2. Vercel Logs: `POST /api/cafe24/webhooks/orders status=200`
3. `/admin/cafe24` 최근 Webhook 로그:
   - 기존 `FAILED` 대신 `SKIPPED_TEST_PAYLOAD`
   - 메시지: `Cafe24 test payload cannot be fetched as real order.`
4. 실제 운영 주문 Webhook:
   - `mallId=peerl` 기준 OAuth token lookup
   - token이 연결되어 있으면 주문 상세 조회 또는 저장 단계로 진행

## 12. 남은 확인 항목

사용자가 Cafe24 Developers에서 Webhook TEST를 다시 실행한 뒤 아래를 확인해야 한다.

- Cafe24 Developers WebHook 로그가 `성공(200)`인지
- Vercel Logs에서 route handler 내부 처리 로그가 남는지
- `/admin/cafe24` 최근 Webhook 로그가 `SKIPPED_TEST_PAYLOAD`로 표시되는지
- 실제 주문 이벤트에서는 `peerl` mallId 기준 token lookup이 성공하는지

## 13. 참고 사항

현재 작업트리에는 이번 커밋에 포함하지 않은 미추적 문서가 1개 남아 있다.

```txt
docs/gpt-report-cafe24-webhook-x-api-key-20260627.md
```

해당 문서는 이전 `x-api-key` 인증 처리 보고서이며, 이번 `test payload/token lookup` 코드 커밋에는 포함하지 않았다.

## 14. 다음 작업 제안

1. Cafe24 Developers Webhook TEST 재실행
2. `/admin/cafe24` 최근 로그에서 `SKIPPED_TEST_PAYLOAD` 표시 확인
3. 실제 운영 주문 이벤트 등록 후 실제 주문 payload 수신 확인
4. 실제 주문 payload에서 `mall_id`, `order_id`, `payed_date` 구조 확인
5. 운영 payload 기준으로 주문 상세 저장 또는 업로드 프로젝트 자동 생성 연결 여부 결정
