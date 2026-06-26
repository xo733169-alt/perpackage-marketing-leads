# GPT 보고서: Cafe24 Webhook 인증 진단 변경분 커밋/푸시 결과

작성일: 2026-06-26  
프로젝트: `perpackage-marketing-leads`  
대상 Webhook URL: `https://perpackage-marketing-leads-omega.vercel.app/api/cafe24/webhooks/orders`

## 1. 작업 목적

Cafe24 Developers Webhook TEST가 서버까지 도달하지만 HTTP 401로 실패하는 문제를 진단하기 위해, 로컬에 반영된 최소 수정분을 GitHub `main` 브랜치에 커밋/푸시했다.

이번 작업은 인증 실패 원인을 더 잘 보기 위한 진단 로그 반영이 목적이며, Cafe24 결제/취소/환불/배송 상태 변경 기능은 추가하지 않았다.

## 2. 반영된 변경 요약

수정된 파일:

```txt
src/lib/cafe24.ts
src/app/api/cafe24/webhooks/orders/route.ts
src/test/cafe24-integration.test.ts
```

주요 변경:

- Cafe24 Webhook 인증 후보 header 이름 확장
- direct token 방식 후보 header 추가
- HMAC signature 방식 후보 header 추가
- 인증 실패 시 값이 아닌 header 이름과 실패 사유만 로그에 남기는 진단 함수 추가
- Webhook route에서 401 발생 시 진단 로그 출력
- Cafe24 인증 검증 테스트 보강

로그에는 token, secret, signature 값이 출력되지 않도록 처리했다.

## 3. secret 포함 여부 확인

수정 파일 3개를 대상으로 secret 패턴을 확인했다.

확인 대상:

```txt
src/lib/cafe24.ts
src/app/api/cafe24/webhooks/orders/route.ts
src/test/cafe24-integration.test.ts
```

확인 결과:

```txt
secret_scan=clean
```

실제 `CAFE24_WEBHOOK_SECRET`, token, DB password, API key, storage secret 값은 코드에 하드코딩되어 있지 않다.

## 4. 실행한 테스트

실행 명령:

```bash
vitest run src/test/cafe24-integration.test.ts
tsc --noEmit
```

결과:

```txt
vitest: 통과
Test Files: 1 passed
Tests: 8 passed

tsc --noEmit: 통과
```

## 5. Git commit 결과

커밋 메시지:

```txt
fix: add cafe24 webhook auth diagnostics
```

커밋 해시:

```txt
93cd6a1
```

전체 커밋 해시:

```txt
93cd6a14ee7abab21d5167fcf46cae773475d659
```

커밋 결과:

```txt
3 files changed, 106 insertions(+), 14 deletions(-)
```

## 6. GitHub push 결과

Push 대상:

```txt
origin main
```

Push 결과:

```txt
2a70d99..93cd6a1  main -> main
```

원격 `main` 확인 결과:

```txt
93cd6a14ee7abab21d5167fcf46cae773475d659 refs/heads/main
```

따라서 GitHub `main`에는 Webhook 인증 진단 변경분이 정상 반영되었다.

## 7. Vercel production 배포 확인 결과

Vercel CLI로 `perpackage-marketing-leads` deployment 목록을 확인했다.

확인 결과:

- 최신 production deployment 상태는 `Ready`
- 다만 확인된 최신 production deployment 생성 시점은 2026-06-21로 표시됨
- 방금 push한 commit `93cd6a1` 기준의 새 production deployment는 목록에서 확인되지 않음

확인된 최신 production deployment:

```txt
https://perpackage-marketing-leads-haratkoqm-peerl.vercel.app
status: Ready
target: production
created: 2026-06-21 21:02:47 KST
```

운영 URL 접근 확인:

```txt
https://perpackage-marketing-leads-omega.vercel.app/admin/cafe24
https://perpackage-marketing-leads-omega.vercel.app/upload
```

결과:

```txt
둘 다 /access 경로로 redirect
최종 응답 status: 200
```

현재 운영 URL에는 접근 보호가 켜져 있다.

## 8. 배포 상태 판단

GitHub push는 완료되었지만, Vercel production에 `93cd6a1` 커밋이 실제 반영되었는지는 아직 확인되지 않았다.

가능한 상태:

1. GitHub push 후 Vercel 자동 배포가 비활성화되어 있음
2. 자동 배포가 지연 중임
3. Vercel 프로젝트가 다른 브랜치나 다른 연결 설정을 보고 있음
4. 수동 redeploy가 필요한 상태임

운영 변경이므로 Codex가 임의로 `vercel deploy --prod`는 실행하지 않았다.

## 9. Cafe24 Webhook TEST 후 확인할 로그 항목

Vercel production에 새 커밋이 반영된 뒤 Cafe24 Developers에서 Webhook TEST를 다시 실행해야 한다.

TEST 후 Vercel Logs에서 아래 필드가 남는지 확인한다.

```txt
reason
directTokenHeaderNames
signatureHeaderNames
unsupportedCafe24HeaderNames
receivedHeaderNames
```

주의:

- 로그에는 header 값이 아니라 이름만 남아야 한다.
- token, secret, signature 값은 출력되면 안 된다.
- `reason` 값으로 401 원인을 구분한다.

예상 가능한 `reason`:

```txt
secret_missing
auth_header_missing_or_unsupported
auth_mismatch
```

## 10. Cafe24 TEST 이벤트 관련 주의사항

현재 Cafe24 Developers에서 테스트한 이벤트는 아래 유형이었다.

```txt
쇼핑몰에 설치된 앱이 결제된 경우
```

이 이벤트는 앱 결제 이벤트에 가까우며, 주문번호 기반 업로드 허브 연동용으로는 적절하지 않을 수 있다.

업로드 허브와 연결하려면 이후 Cafe24 Developers에서 주문 생성 또는 주문 결제 완료에 해당하는 이벤트를 별도로 등록하는 방향이 맞다.

이번 작업에서는 Cafe24 Webhook 인증 진단만 반영했으며, 주문 생성 이벤트 처리 로직은 새로 만들지 않았다.

## 11. 다음 작업

1. Vercel에서 `93cd6a1` 커밋 기준 production deployment가 생성되었는지 확인
2. 자동 배포가 되지 않았다면 Vercel Dashboard에서 수동 Redeploy 실행
3. 배포 반영 후 Cafe24 Developers Webhook TEST 재실행
4. Vercel Logs에서 `reason`, `directTokenHeaderNames`, `signatureHeaderNames`, `unsupportedCafe24HeaderNames`, `receivedHeaderNames` 확인
5. 401 원인이 `auth_header_missing_or_unsupported`이면 Cafe24가 보내는 실제 header 이름을 코드 후보에 반영
6. 401 원인이 `auth_mismatch`이면 Cafe24 Webhook 인증정보와 Vercel `CAFE24_WEBHOOK_SECRET` 설정 일치 여부 확인
7. 주문 연동용 이벤트는 앱 결제 이벤트가 아니라 주문 생성/결제 완료 이벤트로 별도 등록

## 12. 현재 결론

Webhook 401 원인을 확인하기 위한 최소 진단 코드는 GitHub `main`에 반영 완료되었다.

다만 Vercel production 배포가 새 커밋 기준으로 갱신되었는지는 아직 확인되지 않았으므로, Cafe24 Webhook TEST 재실행 전 Vercel production redeploy 확인이 먼저 필요하다.
