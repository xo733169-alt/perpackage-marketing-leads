# GPT 보고서: Cafe24 Webhook Middleware Bypass 커밋/푸시 결과

작성일: 2026-06-26  
프로젝트: `perpackage-marketing-leads`  
관련 작업: Cafe24 Webhook TEST 401 middleware 차단 수정

## 1. 작업 목적

Cafe24 Webhook TEST 요청이 `/api/cafe24/webhooks/orders` route handler에 들어가기 전에 site access middleware에서 `401 Unauthorized`로 차단되는 문제를 해결하기 위해, middleware bypass 변경분을 커밋하고 GitHub `main`에 push했다.

이번 작업에서는 Webhook route 내부의 `CAFE24_WEBHOOK_SECRET` 검증은 유지했다.

## 2. 원인 요약

Vercel Logs 기준 문제는 아래와 같았다.

```txt
Request: POST /api/cafe24/webhooks/orders
Status: 401
Middleware: 401 Unauthorized
Key: /api/cafe24/webhooks/orders
```

즉 Cafe24 Webhook 인증 로직까지 도달하기 전에 `SITE_ACCESS_ENABLED` 기반 접근 제한 middleware가 외부 Webhook 요청을 막고 있었다.

## 3. 커밋 정보

커밋 메시지:

```txt
fix: bypass site access for cafe24 webhook
```

커밋 해시:

```txt
267e172
```

전체 커밋 해시:

```txt
267e17223c25e8e7e11fb5e1a6e8db20f7e7bfb8
```

## 4. Push 결과

GitHub `origin/main` push 성공.

원격 main 확인 결과:

```txt
267e17223c25e8e7e11fb5e1a6e8db20f7e7bfb8 refs/heads/main
```

## 5. 커밋에 포함한 파일

이번 커밋에는 middleware bypass 관련 파일만 포함했다.

```txt
src/lib/site-access.ts
src/test/site-access.test.ts
docs/gpt-report-cafe24-webhook-middleware-bypass-20260626.md
```

다른 untracked docs 파일은 커밋에 포함하지 않았다.

## 6. 반영된 middleware bypass 경로

site access bypass에 추가된 경로:

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

## 7. Webhook route secret 검증 유지 여부

유지됨.

변경 후 요청 흐름:

```txt
Cafe24 요청
-> site access middleware 통과
-> /api/cafe24/webhooks/orders route 진입
-> CAFE24_WEBHOOK_SECRET 검증
-> secret 불일치 시 route 내부에서 401
```

이번 변경은 site access middleware 차단만 우회하는 것이며, Webhook API 자체를 무방비로 공개한 것이 아니다.

## 8. Secret 포함 여부

커밋 대상 파일 기준 secret scan 결과:

```txt
secret_scan=clean
```

실제 secret, token, signature 값은 출력하거나 커밋하지 않았다.

## 9. 테스트 결과

커밋 전 검증 결과:

```txt
vitest: 통과, 38 files / 188 tests
tsc --noEmit: 통과
npm run build: 통과
```

참고:

로컬 PowerShell PATH에서 `pnpm`과 `corepack`이 잡히지 않아 아래 대체 명령으로 검증했다.

```txt
.\node_modules\.bin\vitest.CMD run
.\node_modules\.bin\tsc.CMD --noEmit
npm.cmd run build
```

## 10. Vercel Production 배포 상태

GitHub push 후 Vercel deployment 목록을 두 번 확인했다.

확인 결과:

```txt
267e172 기준 새 Production deployment가 아직 보이지 않음
현재 보이는 Production deployment는 여전히 5일 전 배포
```

따라서 Vercel Dashboard에서 `main` 최신 커밋 `267e172` 기준 수동 Redeploy가 필요하다.

Codex는 운영 변경인 `vercel deploy --prod`를 명시 승인 없이 실행하지 않았다.

## 11. 운영 URL 확인

아래 URL은 404가 아니며, site access 보호로 `/access`에 redirect된 뒤 200 응답을 받았다.

```txt
https://perpackage-marketing-leads.vercel.app/admin/cafe24
-> /access?next=%2Fadmin%2Fcafe24
-> 200

https://perpackage-marketing-leads.vercel.app/upload
-> /access?next=%2Fupload
-> 200
```

## 12. Cafe24 Webhook TEST 후 확인해야 할 로그

Vercel Production을 `267e172` 기준으로 Redeploy한 뒤 Cafe24 Developers에서 Webhook TEST를 다시 실행한다.

Vercel Logs에서 확인할 항목:

```txt
POST /api/cafe24/webhooks/orders
Middleware: 401 Unauthorized가 사라졌는지
route 내부 로그가 보이는지
reason
directTokenHeaderNames
signatureHeaderNames
unsupportedCafe24HeaderNames
receivedHeaderNames
```

정상 판단 기준:

```txt
secret이 틀리면 route 내부에서 401
secret이 맞으면 200 또는 정상 처리 응답
```

## 13. 남은 작업

1. Vercel Dashboard에서 Production을 `267e172` 기준으로 Redeploy
2. Cafe24 Developers에서 Webhook TEST 재실행
3. Vercel Logs에서 middleware 401이 사라졌는지 확인
4. route 내부 `reason` 기준으로 실제 인증 문제 여부 확인
5. 필요 시 Cafe24가 보내는 실제 header 이름을 코드 후보에 추가

## 14. 하지 않은 작업

이번 작업에서는 아래를 하지 않았다.

```txt
DB schema 변경
새 migration 생성
Cafe24 결제/환불/배송 상태 변경 기능 추가
secret/token/signature 값 출력
관리자 페이지 site access 보호 해제
```

## 15. 결론

Middleware bypass 수정은 GitHub `main`에 반영되었다.

다만 Vercel Production에는 아직 `267e172` 기준 배포가 확인되지 않았으므로, Cafe24 Webhook TEST를 다시 하기 전에 Vercel Production Redeploy가 먼저 필요하다.
