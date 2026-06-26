# GPT 보고서: Cafe24 Webhook 테스트 전 Production 도메인 및 Vercel 환경 정리

작성일: 2026-06-26  
프로젝트: `perpackage-marketing-leads`  
관련 커밋: `93cd6a1 fix: add cafe24 webhook auth diagnostics`

## 1. 작업 목적

Cafe24 Webhook TEST가 계속 `401`로 실패하고 있으나, Vercel Logs에서 해당 요청이 확인되지 않았다.

따라서 인증값을 추가로 수정하기 전에 아래 항목을 먼저 정리했다.

- 현재 Vercel Production alias
- Production deployment가 최신 커밋 `93cd6a1` 기준인지 여부
- 공식 테스트 도메인
- Cafe24 Developers에 등록할 URL
- Vercel Production 환경변수 정리
- Redeploy 필요 여부

이번 작업에서는 secret 값, token 값, signature 값은 출력하지 않았다.

## 2. 현재 Vercel Production alias

Vercel CLI 기준 현재 Production alias는 아래와 같다.

```txt
https://perpackage-marketing-leads.vercel.app
https://perpackage-marketing-leads-peerl.vercel.app
https://perpackage-marketing-leads-xo733169-alt-peerl.vercel.app
```

위 alias들은 모두 같은 Production deployment를 보고 있다.

현재 확인된 Production deployment:

```txt
deployment URL: https://perpackage-marketing-leads-haratkoqm-peerl.vercel.app
target: production
status: READY
created: 2026-06-21 21:02:47 KST
```

## 3. 최신 커밋 반영 여부

최신 진단 코드 커밋:

```txt
93cd6a1
93cd6a14ee7abab21d5167fcf46cae773475d659
fix: add cafe24 webhook auth diagnostics
created: 2026-06-26 18:36:09 KST
```

현재 Production deployment 생성 시점은 `2026-06-21 21:02:47 KST`다.

따라서 현재 Production은 `93cd6a1` 기준 배포로 보기 어렵다.

결론:

```txt
Production Redeploy 필요
```

## 4. 기존 omega URL 상태

Cafe24 Webhook TEST에 사용되던 URL:

```txt
https://perpackage-marketing-leads-omega.vercel.app/api/cafe24/webhooks/orders
```

이 URL은 현재 Vercel CLI 컨텍스트에서 deployment로 조회되지 않았다.

이전 확인 결과:

```txt
Deployment not found: perpackage-marketing-leads-omega.vercel.app under peerl
```

따라서 `omega` URL은 현재 공식 테스트 도메인으로 쓰지 않는 것이 안전하다.

## 5. 공식 테스트 도메인

앞으로 Cafe24 Developers, Vercel 환경변수, 테스트 URL은 아래 도메인 하나로 통일하는 것을 권장한다.

```txt
https://perpackage-marketing-leads.vercel.app
```

이 도메인은 현재 Vercel Production alias로 확인되었다.

## 6. URL 접근 확인

아래 URL이 404가 아닌지 확인했다.

```txt
https://perpackage-marketing-leads.vercel.app/admin/cafe24
https://perpackage-marketing-leads.vercel.app/upload
```

확인 결과:

```txt
/admin/cafe24 -> /access?next=%2Fadmin%2Fcafe24 로 redirect, 최종 200
/upload       -> /access?next=%2Fupload 로 redirect, 최종 200
```

따라서 두 경로는 404가 아니다.

현재 사이트 접근 보호가 켜져 있어 `/access`로 먼저 이동한다.

## 7. Cafe24 Developers에 등록할 URL

공식 도메인을 `https://perpackage-marketing-leads.vercel.app`로 통일할 경우 Cafe24 Developers에는 아래 값으로 정리한다.

### App URL

```txt
https://perpackage-marketing-leads.vercel.app/admin/cafe24
```

### Redirect URI

```txt
https://perpackage-marketing-leads.vercel.app/api/cafe24/oauth/callback
```

### Webhook URL

```txt
https://perpackage-marketing-leads.vercel.app/api/cafe24/webhooks/orders
```

주의:

- `omega` URL은 사용하지 않는다.
- Cafe24 Developers에 등록한 URL과 Vercel 환경변수 URL이 서로 달라지면 OAuth/Webhook 테스트가 꼬일 수 있다.

## 8. Vercel Production 환경변수 확인

Vercel Production 환경변수는 값 없이 이름 존재 여부만 확인했다.

확인 결과:

```txt
NEXT_PUBLIC_SITE_URL: present
CAFE24_REDIRECT_URI: missing
CAFE24_WEBHOOK_SECRET: missing
```

`NEXT_PUBLIC_SITE_URL`은 존재하지만, 값이 공식 도메인과 일치하는지는 별도로 Vercel Dashboard에서 확인해야 한다.

secret 값은 출력하지 않았다.

## 9. Vercel Production 환경변수 권장값

아래 값으로 정리하는 것을 권장한다.

```txt
NEXT_PUBLIC_SITE_URL=https://perpackage-marketing-leads.vercel.app
CAFE24_REDIRECT_URI=https://perpackage-marketing-leads.vercel.app/api/cafe24/oauth/callback
CAFE24_WEBHOOK_SECRET=값은 Cafe24 Webhook 인증정보와 동일하게 설정
```

주의:

- Vercel 환경변수 입력칸에는 `KEY=`를 함께 넣지 않는다.
- 값 앞뒤에 따옴표를 넣지 않는다.
- 공백, 줄바꿈이 들어가지 않게 한다.
- `CAFE24_WEBHOOK_SECRET` 값은 보고서나 로그에 남기지 않는다.

## 10. Redeploy 필요 여부

필요하다.

이유:

1. 현재 Production deployment가 2026-06-21 생성본으로 확인됨
2. 최신 진단 커밋 `93cd6a1`은 2026-06-26 커밋임
3. Production 환경변수에 `CAFE24_REDIRECT_URI`, `CAFE24_WEBHOOK_SECRET`이 missing으로 확인됨
4. 환경변수 추가/수정 후에는 Production Redeploy가 필요함

권장 순서:

```txt
1. Vercel Production env 정리
2. Production Redeploy
3. Cafe24 Developers URL을 공식 도메인 기준으로 수정
4. Cafe24 Webhook TEST 재실행
5. Vercel Logs에서 진단 항목 확인
```

## 11. Redeploy 후 확인할 URL

Redeploy 완료 후 아래 URL을 다시 확인한다.

```txt
https://perpackage-marketing-leads.vercel.app/admin/cafe24
https://perpackage-marketing-leads.vercel.app/upload
```

기준:

- 404가 아니어야 함
- 접근 보호가 켜져 있으면 `/access`로 redirect될 수 있음
- 관리자 페이지는 로그인 또는 접근 비밀번호가 필요할 수 있음

## 12. Cafe24 Webhook TEST 후 확인할 Vercel Logs 항목

Redeploy 후 Cafe24 Developers에서 Webhook TEST를 다시 실행한다.

그 다음 Vercel Logs에서 아래 경로를 확인한다.

```txt
POST /api/cafe24/webhooks/orders
```

확인할 진단 항목:

```txt
reason
directTokenHeaderNames
signatureHeaderNames
unsupportedCafe24HeaderNames
receivedHeaderNames
```

주의:

- header 값은 출력하지 않는다.
- token 값은 출력하지 않는다.
- signature 값은 출력하지 않는다.
- header 이름과 reason만 확인한다.

## 13. reason별 다음 조치

### secret_missing

의미:

```txt
Vercel Production env에서 CAFE24_WEBHOOK_SECRET을 읽지 못함
```

조치:

```txt
CAFE24_WEBHOOK_SECRET 등록 여부 확인
저장 후 Production Redeploy
Cafe24 Webhook TEST 재실행
```

### auth_mismatch

의미:

```txt
Cafe24가 보낸 인증값과 Vercel CAFE24_WEBHOOK_SECRET이 다름
```

조치:

```txt
Cafe24 Webhook 인증정보와 Vercel env 값 일치 여부 확인
공백/따옴표/줄바꿈 제거
저장 후 Production Redeploy
```

### auth_header_missing_or_unsupported

의미:

```txt
Cafe24 요청에 인증 header가 없거나, 코드가 아직 해당 header 이름을 후보로 읽지 못함
```

조치:

```txt
receivedHeaderNames 확인
unsupportedCafe24HeaderNames 확인
실제 Cafe24 header 이름을 코드 후보에 추가
테스트 추가
커밋/푸시/배포
```

## 14. 이번 작업에서 하지 않은 것

이번 작업에서는 아래를 하지 않았다.

- Cafe24 결제 기능 추가
- Cafe24 환불 기능 추가
- Cafe24 배송 상태 변경 기능 추가
- Webhook 신규 기능 추가
- DB schema 변경
- migration 생성
- secret/token/signature 값 출력

## 15. 결론

현재 상태에서는 Webhook 401 원인을 인증값만 보고 판단하면 안 된다.

먼저 아래를 정리해야 한다.

```txt
1. 공식 도메인: https://perpackage-marketing-leads.vercel.app
2. Vercel Production env: NEXT_PUBLIC_SITE_URL, CAFE24_REDIRECT_URI, CAFE24_WEBHOOK_SECRET 정리
3. 93cd6a1 기준 Production Redeploy
4. Cafe24 Developers URL도 같은 도메인으로 통일
5. Webhook TEST 재실행 후 Vercel Logs의 reason 확인
```

이후 Vercel Logs에 찍히는 `reason`을 기준으로 `secret_missing`, `auth_mismatch`, `auth_header_missing_or_unsupported` 중 실제 원인을 확정한다.
