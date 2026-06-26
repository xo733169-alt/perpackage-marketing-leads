# GPT 보고용: Cafe24 Webhook 401 인증 실패 확인 및 최소 수정 보고서

작성일: 2026-06-26  
프로젝트: `perpackage-marketing-leads`  
대상 URL: `https://perpackage-marketing-leads-omega.vercel.app/api/cafe24/webhooks/orders`

## 1. 작업 목적

Cafe24 Developers Webhook TEST가 서버까지 도달하지만 HTTP 401로 실패하는 문제를 확인했다.

현재 Cafe24 Developers Webhook 로그:

```txt
구분: 테스트
상태: 실패(401)
이벤트: 쇼핑몰에 설치된 앱이 결제된 경우
```

이번 작업은 Cafe24 Webhook 인증 실패 원인을 좁히고, 실제 TEST 요청의 header 이름을 이후 Vercel Logs에서 확인할 수 있도록 최소 수정하는 것이 목적이다.

## 2. 확인한 코드 흐름

Webhook route:

```txt
src/app/api/cafe24/webhooks/orders/route.ts
```

인증 검증 함수:

```txt
src/lib/cafe24.ts
verifyCafe24WebhookRequest()
```

기존 흐름:

1. route가 request body를 raw text로 읽음
2. `verifyCafe24WebhookRequest({ rawBody, headers })` 실행
3. 검증 실패 시 `UNAUTHORIZED` 401 반환
4. 검증 성공 후 JSON parse 및 webhook event 저장 진행

따라서 현재 401은 DB 저장 전 인증 단계에서 발생한다.

## 3. 401 원인 판단

정확한 원인은 아직 확정하지 못했다.

이유:

- 사용자가 준 Vercel pasted log에는 header 이름이 포함되어 있지 않았다.
- Vercel runtime logs API 조회는 권한 `403 Forbidden`으로 실패했다.
- 따라서 Cafe24 TEST 요청이 실제 어떤 인증 header를 보내는지는 아직 확인하지 못했다.

현재 가능한 원인:

```txt
secret_missing
auth_header_missing_or_unsupported
auth_mismatch
```

이번 수정으로 다음 401 발생 시 Vercel logs에 위 사유와 header 이름만 남게 했다.

## 4. 서버가 검사하는 인증 방식

서버는 `CAFE24_WEBHOOK_SECRET` 기준으로 아래 두 방식 중 하나를 허용한다.

1. 직접 토큰 방식
2. HMAC signature 방식

직접 토큰 후보 header:

```txt
x-cafe24-webhook-secret
x-cafe24-webhook-auth
x-cafe24-webhook-token
x-cafe24-webhook-key
x-cafe24-webhook-authentication
x-cafe24-auth
x-cafe24-authentication
x-cafe24-token
x-cafe24-secret
x-webhook-secret
x-webhook-token
authorization
```

HMAC signature 후보 header:

```txt
x-cafe24-hmac-sha256
x-cafe24-hmac
x-cafe24-signature
x-cafe24-webhook-signature
x-cafe24-webhook-hmac
x-cafe24-webhook-hmac-sha256
x-cafe24-sha256
x-hub-signature-256
x-webhook-signature
x-signature
```

값은 어떤 경우에도 로그에 출력하지 않는다.

## 5. Cafe24 TEST 요청의 인증 header 이름

아직 미확인이다.

확인하지 못한 이유:

```txt
Vercel runtime logs API 권한 403
기존 Vercel pasted log에 header 정보 없음
```

이번 수정 후 다시 Cafe24 Webhook TEST를 실행하면 Vercel Logs에 아래 정보가 값 없이 기록된다.

```txt
reason
directTokenHeaderNames
signatureHeaderNames
unsupportedCafe24HeaderNames
receivedHeaderNames
```

## 6. 수정한 파일

```txt
src/lib/cafe24.ts
src/app/api/cafe24/webhooks/orders/route.ts
src/test/cafe24-integration.test.ts
```

## 7. 수정 내용

`src/lib/cafe24.ts`:

- Webhook 직접 토큰 header 후보 확장
- Webhook HMAC signature header 후보 확장
- `inspectCafe24WebhookAuthHeaders()` 추가
- `getCafe24WebhookAuthFailureReason()` 추가
- 인증 실패 원인을 `secret_missing`, `auth_header_missing_or_unsupported`, `auth_mismatch`로 분류

`src/app/api/cafe24/webhooks/orders/route.ts`:

- 401 반환 직전에 Vercel Logs용 진단 로그 추가
- header 값은 출력하지 않고 header 이름만 기록

`src/test/cafe24-integration.test.ts`:

- 새 header 후보 검증 추가
- 인증 실패 사유 분류 테스트 추가
- 진단 객체에 secret 값이 포함되지 않는지 확인

## 8. 테스트 결과

실행한 테스트:

```bash
vitest run src/test/cafe24-integration.test.ts
tsc --noEmit
```

결과:

```txt
vitest: 통과, 8 tests
tsc --noEmit: 통과
```

## 9. 아직 남은 작업

이번 수정은 로컬 작업 상태다.

Vercel에서 확인하려면 아래가 필요하다.

```txt
commit
push origin main
Vercel production 배포
Cafe24 Developers Webhook TEST 재실행
Vercel Logs에서 값 없는 인증 진단 로그 확인
```

## 10. Cafe24 Developers 이벤트 주의

현재 TEST 이벤트는 아래 성격이다.

```txt
쇼핑몰에 설치된 앱이 결제된 경우
```

이 이벤트는 주문 업로드 연동용으로는 부적절하다.

업로드 허브와 Cafe24 주문 연결에는 별도로 아래 이벤트를 등록해야 한다.

```txt
주문 생성 이벤트
```

필요 시 추후:

```txt
주문 결제 완료 이벤트
```

단, 이번 작업에서는 Cafe24 결제/취소/환불/배송 상태 변경 기능은 만들지 않았다.

## 11. 다음 진행 순서

1. 현재 Webhook 401 진단 코드 commit
2. GitHub main push
3. Vercel production 배포 확인
4. Cafe24 Webhook TEST 재실행
5. Vercel Logs에서 `reason`, header 이름 목록 확인
6. `auth_header_missing_or_unsupported`이면 Cafe24가 보내는 header 이름을 허용 후보에 추가
7. `auth_mismatch`이면 Cafe24 Developers 인증정보와 `CAFE24_WEBHOOK_SECRET` 값 일치 여부 확인
8. `secret_missing`이면 Vercel production env의 `CAFE24_WEBHOOK_SECRET` 등록 확인
9. 401 해결 후 주문 생성 이벤트를 별도로 등록

## 12. 한 줄 요약

Cafe24 Webhook 401은 인증 검증 단계에서 발생하며, 실제 Cafe24 TEST header 이름은 아직 확인하지 못했다. 이번 수정은 허용 header 후보를 넓히고, 다음 TEST 때 Vercel Logs에 secret 값 없이 인증 실패 사유와 header 이름만 남기도록 한 최소 수정이다.

