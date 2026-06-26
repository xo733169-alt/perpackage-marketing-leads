# GPT 보고서: Cafe24 Webhook 401 재테스트 후 Vercel Logs 확인 결과

작성일: 2026-06-26  
프로젝트: `perpackage-marketing-leads`  
대상 Webhook URL: `https://perpackage-marketing-leads-omega.vercel.app/api/cafe24/webhooks/orders`  
관련 커밋: `93cd6a1 fix: add cafe24 webhook auth diagnostics`

## 1. 작업 배경

Cafe24 Developers에서 Webhook TEST를 다시 실행했지만 Cafe24 로그에는 계속 `실패(401)`만 반복되고 있다.

Cafe24 Developers 로그에서 확인된 상태:

```txt
상태: 실패(401)
이벤트: 쇼핑몰에 설치된 앱이 결제된 경우
전송일시: 2026-06-26 18:47:34 등
```

Cafe24 화면은 HTTP 상태만 보여주므로, 실제 원인 확인은 Vercel Runtime Logs에서 해야 한다.

## 2. 현재 GitHub 상태

Webhook 인증 진단 변경분은 GitHub `main`에 push 완료된 상태다.

커밋:

```txt
93cd6a1
fix: add cafe24 webhook auth diagnostics
```

해당 커밋에는 401 발생 시 아래 진단 로그를 남기는 변경이 포함되어 있다.

```txt
reason
directTokenHeaderNames
signatureHeaderNames
unsupportedCafe24HeaderNames
receivedHeaderNames
```

로그에는 secret, token, signature 값이 아니라 header 이름과 실패 사유만 남도록 설계되어 있다.

## 3. Vercel 최신 Production deployment 확인 결과

Vercel CLI로 `perpackage-marketing-leads` deployment 목록을 확인했다.

확인 결과:

- 최신으로 보이는 Production deployment는 `Ready`
- 그러나 목록상 최신 Production deployment 생성 시점이 5일 전으로 표시됨
- 방금 push된 `93cd6a1` 기준 새 Production deployment는 확인되지 않음

확인된 Production deployment:

```txt
https://perpackage-marketing-leads-haratkoqm-peerl.vercel.app
target: production
status: READY
created: 2026-06-21 21:02:47 KST
```

따라서 현재 Cafe24 Webhook TEST가 새 진단 코드가 반영된 서버에 도달했는지 확인되지 않았다.

## 4. 운영 URL과 Vercel CLI 컨텍스트 불일치 가능성

Cafe24 Webhook URL:

```txt
https://perpackage-marketing-leads-omega.vercel.app/api/cafe24/webhooks/orders
```

Vercel CLI에서 위 `omega` URL을 deployment로 조회했을 때:

```txt
Deployment not found: perpackage-marketing-leads-omega.vercel.app under peerl
```

이는 현재 CLI가 보고 있는 Vercel scope/project와 Cafe24가 호출하는 `omega` URL이 서로 어긋나 있을 가능성을 의미한다.

가능한 원인:

1. `omega` URL이 다른 Vercel 프로젝트 또는 다른 scope에 있음
2. 예전 deployment URL을 Cafe24 Webhook URL로 등록해 둔 상태임
3. 현재 GitHub push가 연결된 프로젝트와 Cafe24 Webhook 대상 프로젝트가 다름
4. Vercel production alias가 현재 확인 중인 deployment와 다르게 연결되어 있음

## 5. Vercel Runtime Logs 조회 결과

아래 기준으로 Vercel Logs를 조회했다.

```txt
project: perpackage-marketing-leads
environment: production
since: 2h
status-code: 401
path/search: cafe24, webhooks, orders
```

결과:

```txt
matching_401_logs=none
```

즉 현재 연결된 Vercel 프로젝트 기준으로는 최근 2시간 내 `/api/cafe24/webhooks/orders` 관련 401 로그가 확인되지 않았다.

추가로 Vercel MCP Runtime Logs 조회도 시도했으나 권한 오류가 발생했다.

```txt
403 Forbidden
You don't have permission to access this resource.
```

따라서 현재 Codex 세션 권한으로는 `omega` 운영 URL의 실제 runtime log를 직접 확인하지 못했다.

## 6. 진단 로그 항목 확인 여부

확인 대상:

```txt
reason
directTokenHeaderNames
signatureHeaderNames
unsupportedCafe24HeaderNames
receivedHeaderNames
```

현재 결과:

```txt
확인 불가
```

이유:

1. `93cd6a1` 기준 Production deployment가 확인되지 않음
2. `omega` URL이 현재 Vercel CLI 컨텍스트에서 deployment로 조회되지 않음
3. 현재 프로젝트 runtime logs에서 해당 Webhook 401 요청이 잡히지 않음
4. Vercel MCP Runtime Logs는 403 권한 오류로 조회 실패

## 7. 현재 reason 판정

아직 판정할 수 없다.

가능한 reason 후보:

```txt
secret_missing
auth_mismatch
auth_header_missing_or_unsupported
```

하지만 Vercel Logs에서 진단 로그가 확인되지 않았기 때문에 현재 단계에서는 어느 reason인지 확정하면 안 된다.

## 8. 지금 가장 가능성이 높은 문제

현재 상황에서 가장 먼저 의심해야 할 문제는 Cafe24 인증 header 자체가 아니라 배포/로그 대상 불일치다.

정리하면:

- Cafe24 TEST는 계속 401을 받고 있음
- GitHub에는 진단 코드가 올라감
- 하지만 Vercel Production이 `93cd6a1` 기준인지 확인되지 않음
- Cafe24가 호출하는 `omega` URL이 현재 CLI에서 조회되는 Vercel deployment와 맞지 않음
- 현재 확인 가능한 Vercel Logs에는 해당 요청이 보이지 않음

따라서 인증값을 더 바꾸기 전에, 먼저 Cafe24 Webhook URL이 최신 Production deployment 또는 올바른 production alias를 보고 있는지 확인해야 한다.

## 9. 다음 조치

### 9-1. Vercel Dashboard에서 확인할 것

Vercel Dashboard에서 아래를 확인한다.

```txt
Project: perpackage-marketing-leads
Production deployment commit: 93cd6a1
Production domain / alias: perpackage-marketing-leads-omega.vercel.app 또는 실제 사용 중인 도메인
```

확인 기준:

- Production deployment가 `93cd6a1`인지
- Cafe24에 등록된 Webhook URL이 해당 production deployment 또는 alias를 가리키는지
- `omega` URL이 현재 프로젝트에 실제로 연결되어 있는지

### 9-2. Redeploy 필요 여부

Production deployment가 `93cd6a1`이 아니라면 Redeploy가 필요하다.

권장 순서:

1. Vercel Dashboard 접속
2. `perpackage-marketing-leads` 프로젝트 선택
3. Deployments에서 최신 `main` 커밋 `93cd6a1` 확인
4. Production으로 Redeploy
5. 배포 완료 후 Cafe24 Webhook TEST 재실행

Codex에서 `vercel deploy --prod`를 실행할 수도 있지만, production 변경 작업이므로 명시 승인이 필요하다.

### 9-3. Cafe24 Webhook URL 확인

Cafe24 Developers에 등록된 Webhook URL이 아래 중 실제 운영 alias와 일치하는지 확인한다.

```txt
https://perpackage-marketing-leads.vercel.app/api/cafe24/webhooks/orders
https://perpackage-marketing-leads-peerl.vercel.app/api/cafe24/webhooks/orders
https://perpackage-marketing-leads-omega.vercel.app/api/cafe24/webhooks/orders
```

현재 CLI에서 확인된 alias는 다음 deployment에 있었다.

```txt
https://perpackage-marketing-leads.vercel.app
https://perpackage-marketing-leads-peerl.vercel.app
https://perpackage-marketing-leads-xo733169-alt-peerl.vercel.app
```

`omega` URL은 현재 CLI 컨텍스트에서 찾지 못했다.

## 10. Redeploy 후 다시 확인할 로그

Redeploy 후 Cafe24 Webhook TEST를 다시 실행하고 Vercel Logs에서 아래를 확인한다.

```txt
POST /api/cafe24/webhooks/orders
status: 401
```

그리고 로그 메시지에서 아래 필드가 있는지 확인한다.

```txt
reason
directTokenHeaderNames
signatureHeaderNames
unsupportedCafe24HeaderNames
receivedHeaderNames
```

주의:

- 값은 출력하지 않는다.
- header 이름만 확인한다.
- token, secret, signature 값은 공유하지 않는다.

## 11. reason별 다음 조치

### secret_missing

의미:

```txt
Vercel Production env에 CAFE24_WEBHOOK_SECRET이 없거나 서버에서 읽지 못함
```

조치:

1. Vercel Production env에 `CAFE24_WEBHOOK_SECRET` 등록 여부 확인
2. 값 입력 시 `CAFE24_WEBHOOK_SECRET=` prefix 없이 값만 입력했는지 확인
3. 저장 후 Production Redeploy
4. Cafe24 Webhook TEST 재실행

### auth_mismatch

의미:

```txt
Cafe24가 보낸 인증값과 Vercel의 CAFE24_WEBHOOK_SECRET이 일치하지 않음
```

조치:

1. Cafe24 Developers Webhook 인증정보 확인
2. Vercel `CAFE24_WEBHOOK_SECRET`과 동일한 값인지 확인
3. 공백, 따옴표, 줄바꿈이 들어가지 않았는지 확인
4. 수정 후 Redeploy

### auth_header_missing_or_unsupported

의미:

```txt
Cafe24 요청에 인증 header가 없거나, 현재 코드가 읽는 후보 header 이름에 포함되지 않음
```

조치:

1. `receivedHeaderNames` 확인
2. `unsupportedCafe24HeaderNames` 확인
3. Cafe24가 실제로 보내는 header 이름을 코드 후보에 추가
4. 테스트 추가
5. 커밋/푸시/배포 후 Cafe24 TEST 재실행

## 12. 이번 작업에서 하지 않은 것

이번 확인에서는 아래 작업을 하지 않았다.

- Cafe24 결제 기능 추가
- Cafe24 환불 기능 추가
- Cafe24 배송 상태 변경 기능 추가
- 새 Webhook 이벤트 처리 기능 추가
- DB schema 변경
- 새 migration 생성
- secret/token/signature 값 출력

## 13. 결론

현재 Cafe24 Webhook TEST 401은 계속 재현되고 있지만, 아직 Webhook 인증 reason은 확정되지 않았다.

먼저 해결해야 할 것은 다음 두 가지다.

```txt
1. Vercel Production이 93cd6a1 커밋 기준인지 확인 또는 Redeploy
2. Cafe24 Webhook URL의 omega 도메인이 실제 최신 Production deployment와 연결되어 있는지 확인
```

이 두 가지가 정리된 뒤 Cafe24 TEST를 다시 실행해야 `reason`, `directTokenHeaderNames`, `signatureHeaderNames`, `unsupportedCafe24HeaderNames`, `receivedHeaderNames` 로그를 기준으로 실제 401 원인을 판정할 수 있다.
