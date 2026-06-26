# GPT 보고서: Cafe24 Webhook Middleware Bypass 적용

작성일: 2026-06-26  
프로젝트: `perpackage-marketing-leads`

## 1. 원인

Cafe24 Webhook TEST 요청은 `POST /api/cafe24/webhooks/orders`까지 도달했지만, route handler에 들어가기 전에 site access middleware에서 `401 Unauthorized`로 차단되고 있었다.

즉 기존 401의 1차 원인은 Cafe24 Webhook route 내부의 `CAFE24_WEBHOOK_SECRET` 검증이 아니라, `SITE_ACCESS_ENABLED=true` 상태에서 외부 Webhook API가 접근 보호 예외로 등록되어 있지 않았던 점이다.

## 2. 수정한 파일

```txt
src/lib/site-access.ts
src/test/site-access.test.ts
```

DB schema 변경이나 migration 생성은 하지 않았다.

## 3. Middleware 예외 처리한 경로

`src/lib/site-access.ts`에 site access bypass 경로를 명시했다.

```txt
/api/cafe24/webhooks/orders
/api/cafe24/oauth/start
/api/cafe24/oauth/callback
```

의도:

- Cafe24 Webhook API는 middleware에서 막지 않음
- Cafe24 OAuth start/callback도 site access 보호 때문에 흐름이 끊기지 않게 함
- `/admin/cafe24`, `/admin/uploads` 같은 관리자 화면은 계속 보호함

## 4. Webhook route secret 검증 유지 여부

유지했다.

이번 수정은 middleware 통과 예외만 추가한 것이다.

`/api/cafe24/webhooks/orders` route 내부에는 기존처럼 아래 검증이 남아 있다.

```txt
verifyCafe24WebhookRequest()
CAFE24_WEBHOOK_SECRET 기반 direct token 또는 HMAC 검증
검증 실패 시 route 내부에서 401 반환
```

따라서 구조는 아래처럼 바뀐다.

```txt
변경 전:
Cafe24 요청 -> middleware 401 -> route 진입 못 함

변경 후:
Cafe24 요청 -> middleware 통과 -> route 내부 CAFE24_WEBHOOK_SECRET 검증 -> 실패 시 route 401
```

## 5. 관리자 보호 유지 여부

테스트에서 아래 경로가 site access cookie 없이 허용되지 않음을 확인하도록 추가했다.

```txt
/admin/cafe24
/admin/uploads
```

즉 관리자 화면 보호는 유지된다.

## 6. 테스트 결과

요청된 명령:

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

현재 로컬 PowerShell PATH에서 `pnpm`과 `corepack`이 잡히지 않아 동일 목적의 로컬 바이너리/대체 명령으로 검증했다.

실행한 명령:

```bash
.\node_modules\.bin\vitest.CMD run
.\node_modules\.bin\tsc.CMD --noEmit
npm.cmd run build
```

결과:

```txt
vitest: 통과
Test Files: 38 passed
Tests: 188 passed

tsc --noEmit: 통과

npm run build: 통과
Next.js production build compiled successfully
```

## 7. 남은 확인 항목

배포 후 아래를 확인해야 한다.

1. Vercel Production에 이번 변경분 배포
2. Cafe24 Webhook TEST 재실행
3. Vercel Logs에서 `POST /api/cafe24/webhooks/orders`가 middleware 401이 아니라 route 로그까지 들어오는지 확인
4. secret이 틀리면 route 내부에서 401이 나는지 확인
5. secret이 맞으면 200 또는 정상 처리 응답으로 이어지는지 확인
6. route 내부 진단 로그에 아래 항목이 찍히는지 확인

```txt
reason
directTokenHeaderNames
signatureHeaderNames
unsupportedCafe24HeaderNames
receivedHeaderNames
```

주의:

- secret 값 출력 금지
- token 값 출력 금지
- signature 값 출력 금지
- 결제/환불/배송 상태 변경 기능 추가 금지

## 8. 결론

Cafe24 Webhook TEST 401의 현재 원인은 middleware 접근 제한 차단으로 확인되었다.

이번 수정으로 `/api/cafe24/webhooks/orders`는 site access middleware를 통과하고, 실제 인증 검증은 route 내부의 `CAFE24_WEBHOOK_SECRET` 검증이 담당하는 구조가 되었다.
