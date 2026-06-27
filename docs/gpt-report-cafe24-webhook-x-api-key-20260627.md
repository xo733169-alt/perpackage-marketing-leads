# GPT 보고서: Cafe24 Webhook x-api-key 인증 header 반영

작성일: 2026-06-27  
프로젝트: `perpackage-marketing-leads`  
관련 커밋: `e09105a fix: accept cafe24 webhook x-api-key header`

## 1. 작업 배경

Cafe24 Webhook TEST 요청은 이제 site access middleware를 정상 통과하고 route handler까지 도달한다.

Vercel Logs에서 확인된 route 내부 진단 결과:

```txt
POST /api/cafe24/webhooks/orders
status: 401
reason: auth_header_missing_or_unsupported
directTokenHeaderNames: []
signatureHeaderNames: []
unsupportedCafe24HeaderNames: []
receivedHeaderNames includes:
- x-api-key
```

즉 Cafe24 TEST 요청은 인증정보를 `x-api-key` header로 보내고 있었지만, 서버의 Webhook 직접 토큰 header 후보에 `x-api-key`가 없어 401이 발생했다.

## 2. 수정한 파일

```txt
src/lib/cafe24.ts
src/test/cafe24-integration.test.ts
```

## 3. 추가한 header 후보

Webhook 직접 토큰 인증 후보에 아래 header를 추가했다.

```txt
x-api-key
```

처리 방식:

```txt
x-api-key 값
-> Bearer prefix normalize 처리
-> CAFE24_WEBHOOK_SECRET과 safeEqual 비교
-> 일치하면 Webhook 인증 통과
```

기존 HMAC signature 인증 후보와 검증 로직은 유지했다.

## 4. 보안 유지 사항

이번 변경에서도 아래 원칙을 유지했다.

```txt
secret 값 로그 출력 금지
token 값 로그 출력 금지
signature 값 로그 출력 금지
진단 로그에는 header 이름과 reason만 남김
```

`inspectCafe24WebhookAuthHeaders()`는 `x-api-key`의 값이 아니라 header 이름만 반환한다.

## 5. 테스트 추가 내용

`src/test/cafe24-integration.test.ts`에 아래 케이스를 추가했다.

```txt
x-api-key가 CAFE24_WEBHOOK_SECRET과 같으면 direct token 인증 성공
x-api-key가 틀리면 값 노출 없이 auth_mismatch로 진단
directTokenHeaderNames에 x-api-key가 표시됨
JSON.stringify(inspection)에 잘못된 token 값이 포함되지 않음
```

## 6. 검증 결과

실행한 명령:

```bash
.\node_modules\.bin\vitest.CMD run src/test/cafe24-integration.test.ts
.\node_modules\.bin\tsc.CMD --noEmit
npm.cmd run build
```

결과:

```txt
vitest: 통과
Test Files: 1 passed
Tests: 9 passed

tsc --noEmit: 통과
npm run build: 통과
secret scan: clean
```

## 7. GitHub 반영 결과

커밋:

```txt
e09105a
fix: accept cafe24 webhook x-api-key header
```

원격 `origin/main` 확인:

```txt
e09105a8af0a0fc4c93a8734acb77e5ce409a843
```

GitHub `main` push는 완료되었다.

## 8. Vercel 배포 상태

GitHub push 후 Vercel deployment 목록을 확인했지만, 아직 `e09105a` 기준 새 Production deployment는 확인되지 않았다.

현재 Vercel 목록에는 기존 Production deployment만 보인다.

따라서 다음 단계는 Vercel Dashboard에서 `main` 최신 커밋 `e09105a` 기준 Production Redeploy를 실행하는 것이다.

## 9. 배포 후 Cafe24 Webhook TEST 확인 항목

Vercel Production Redeploy 후 Cafe24 Developers에서 Webhook TEST를 다시 실행한다.

Vercel Logs에서 확인할 항목:

```txt
POST /api/cafe24/webhooks/orders
directTokenHeaderNames includes x-api-key
reason
status
```

기대 결과:

```txt
x-api-key 값이 CAFE24_WEBHOOK_SECRET과 같으면 인증 통과
x-api-key 값이 다르면 route 내부에서 auth_mismatch 401
middleware 401은 발생하지 않아야 함
```

## 10. 이번 작업에서 하지 않은 것

이번 작업에서는 아래를 하지 않았다.

```txt
DB schema 변경
새 migration 생성
Cafe24 결제 기능 추가
Cafe24 환불 기능 추가
Cafe24 배송 상태 변경 기능 추가
secret/token/signature 값 출력
```

## 11. 다음 작업

1. Vercel Production을 `e09105a` 기준으로 Redeploy
2. Cafe24 Webhook TEST 재실행
3. Vercel Logs에서 `directTokenHeaderNames`에 `x-api-key`가 잡히는지 확인
4. 인증 통과 후 저장/연동 단계에서 새 오류가 있는지 확인
5. 만약 route 내부 401이 계속되면 `auth_mismatch` 여부를 보고 Cafe24 인증정보와 Vercel `CAFE24_WEBHOOK_SECRET` 값 일치 여부 확인

## 12. 결론

Cafe24 TEST 요청의 실제 인증 header가 `x-api-key`로 확인되었고, 서버 Webhook 인증 후보에 `x-api-key`를 직접 토큰 방식으로 추가했다.

코드와 테스트는 GitHub `main`에 반영되었으며, 실제 운영 확인은 Vercel Production Redeploy 후 Cafe24 Webhook TEST를 다시 실행해야 한다.
