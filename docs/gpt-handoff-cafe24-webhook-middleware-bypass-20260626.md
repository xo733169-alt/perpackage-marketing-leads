# GPT 인수인계: Cafe24 Webhook Middleware 401 차단 수정 후 다음 작업

작성일: 2026-06-26  
프로젝트: `perpackage-marketing-leads`

## 현재 상황

Cafe24 Webhook TEST가 계속 `401`로 실패했지만, Vercel Logs 확인 결과 요청이 `/api/cafe24/webhooks/orders` route handler에 들어가기 전에 middleware 단계에서 차단되고 있었다.

확인된 로그 요약:

```txt
Request: POST /api/cafe24/webhooks/orders
Status: 401
Middleware: 401 Unauthorized
Key: /api/cafe24/webhooks/orders
```

따라서 문제의 1차 원인은 Cafe24 Webhook secret 검증 실패가 아니라, `SITE_ACCESS_ENABLED` 기반 site access middleware가 외부 Webhook 요청을 막는 것이었다.

## 반영한 수정

수정 파일:

```txt
src/lib/site-access.ts
src/test/site-access.test.ts
```

추가한 site access bypass 경로:

```txt
/api/cafe24/webhooks/orders
/api/cafe24/oauth/start
/api/cafe24/oauth/callback
```

관리자 보호 유지 확인 경로:

```txt
/admin/cafe24
/admin/uploads
```

## 중요한 보안 구조

middleware는 Cafe24 외부 요청을 통과시키지만, Webhook route 내부 인증은 유지된다.

현재 구조:

```txt
Cafe24 요청
-> site access middleware 통과
-> /api/cafe24/webhooks/orders route 진입
-> CAFE24_WEBHOOK_SECRET 검증
-> secret 불일치 시 route 내부에서 401
```

즉 이번 수정은 site access 차단만 우회한 것이며, Webhook 자체를 무방비로 공개한 것이 아니다.

## 검증 결과

요청 명령:

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

현재 로컬 PowerShell PATH에서 `pnpm`과 `corepack`이 잡히지 않아 아래 대체 명령으로 검증했다.

실행한 명령:

```bash
.\node_modules\.bin\vitest.CMD run
.\node_modules\.bin\tsc.CMD --noEmit
npm.cmd run build
```

결과:

```txt
vitest: 통과, 38 files / 188 tests
tsc --noEmit: 통과
npm run build: 통과
```

## 생성된 상세 보고서

```txt
docs/gpt-report-cafe24-webhook-middleware-bypass-20260626.md
```

## 현재 git 상태

아직 커밋하지 않은 변경:

```txt
M  src/lib/site-access.ts
M  src/test/site-access.test.ts
?? docs/gpt-report-cafe24-webhook-middleware-bypass-20260626.md
?? docs/gpt-handoff-cafe24-webhook-middleware-bypass-20260626.md
```

주의: 기존 작업에서 생성된 다른 untracked docs 파일들이 있을 수 있다. 이번 커밋에는 위 middleware bypass 관련 파일만 포함하는 것을 권장한다.

## 다음 작업 권장 순서

1. 변경 파일만 git add
2. 커밋
3. GitHub main에 push
4. Vercel Production 배포 확인 또는 수동 Redeploy
5. Cafe24 Webhook TEST 재실행
6. Vercel Logs 확인

권장 커밋 메시지:

```txt
fix: bypass site access for cafe24 webhook
```

## 배포 후 확인할 것

Vercel Logs에서 아래를 확인한다.

```txt
POST /api/cafe24/webhooks/orders
```

확인 기준:

- 더 이상 `Middleware: 401 Unauthorized`로 끝나면 안 됨
- route 내부 로그가 보여야 함
- secret이 틀리면 route 내부에서 401이 나야 함
- secret이 맞으면 200 또는 정상 처리 응답으로 이어져야 함

route 내부 진단 로그 확인 항목:

```txt
reason
directTokenHeaderNames
signatureHeaderNames
unsupportedCafe24HeaderNames
receivedHeaderNames
```

## 하지 말아야 할 것

이번 이어받기 작업에서 아래는 하지 않는다.

```txt
DB schema 변경 금지
새 migration 생성 금지
Cafe24 결제/환불/배송 상태 변경 기능 추가 금지
secret/token/signature 값 출력 금지
관리자 페이지 site access 보호 해제 금지
```

## 결론

현재 수정은 Cafe24 Webhook 요청이 site access middleware에서 차단되는 문제를 해결하기 위한 최소 변경이다.

배포 후에는 401이 나더라도 middleware가 아니라 route 내부 `CAFE24_WEBHOOK_SECRET` 검증 단계에서 나는지 확인해야 한다. 그 다음에야 실제 Cafe24 인증 header 또는 secret 일치 여부를 판단할 수 있다.
