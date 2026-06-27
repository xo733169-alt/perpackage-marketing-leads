# GPT 보고서: Cafe24 OAuth/Webhook 앱 설치 흐름 점검

작성일: 2026-06-27
프로젝트: `perpackage-marketing-leads`

## 1. 작업 목적

Cafe24 OAuth/Webhook 영상 내용을 기준으로 현재 앱 설치 흐름을 점검했다.

핵심 질문은 아래와 같다.

- App URL 접속 시 OAuth 인증 요청이 자동 또는 명확하게 시작되는가?
- Redirect URI는 `/api/cafe24/oauth/callback`으로 유지되는가?
- OAuth 동의 완료 후 앱이 실제 `peerl` 쇼핑몰에 설치/동의된 상태로 볼 수 있는가?
- Cafe24 Developers의 “해당 앱을 적용한 쇼핑몰”이 비어 있는 이유는 무엇인가?
- Webhook TEST가 아닌 실시간 주문 Webhook을 받으려면 앱이 어떤 상태여야 하는가?
- 제작중 앱 상태에서도 실제 쇼핑몰 주문 Webhook을 받을 수 있는가?
- 우회 개발로 주문번호 직접 조회 기능을 먼저 만드는 것이 적절한가?

## 2. 현재 코드 기준 OAuth 시작 흐름

현재 OAuth 시작 route는 아래 파일이다.

```txt
src/app/api/cafe24/oauth/start/route.ts
```

현재 흐름:

1. `/admin/cafe24` 관리자 화면 접속
2. 관리자 로그인 필요
3. `OAuth 연결 시작` 버튼 클릭
4. `/api/cafe24/oauth/start` 호출
5. Cafe24 OAuth authorize URL로 redirect
6. Cafe24 동의 완료 후 `/api/cafe24/oauth/callback`으로 복귀
7. token 교환 후 `cafe24_tokens`에 저장
8. `/admin/cafe24`로 돌아와 연결 상태 표시

중요한 점:

- App URL 접속만으로 OAuth가 자동 시작되지는 않는다.
- `/admin/cafe24` 안에 `OAuth 연결 시작` 버튼이 있어 수동으로 명확하게 시작하는 방식이다.
- `/api/cafe24/oauth/start`는 현재 `isAdminAuthenticated()`를 요구한다.
- 따라서 Cafe24 앱 설치 과정에서 외부 설치자가 바로 App URL로 접근하는 흐름이라면, 우리 관리자 로그인에 막힐 수 있다.

## 3. Redirect URI 확인

Redirect URI는 현재 아래 경로를 유지한다.

```txt
https://perpackage-marketing-leads.vercel.app/api/cafe24/oauth/callback
```

관련 파일:

```txt
src/app/api/cafe24/oauth/callback/route.ts
.env.example
```

현재 코드에서는 callback에서 아래를 처리한다.

- `code` 수신
- `state` 검증
- Cafe24 token 교환
- `cafe24_tokens` 저장
- `/admin/cafe24`로 redirect

## 4. OAuth 동의 완료와 앱 설치 상태의 차이

현재 `/admin/cafe24`에서 아래 상태가 보이면, 우리 서버 기준으로는 `peerl` 쇼핑몰 OAuth token이 저장된 상태로 볼 수 있다.

```txt
mallId: peerl
연결 상태: 연결됨
만료 시각: 현재보다 이후
```

하지만 이것은 Cafe24 Developers의 “해당 앱을 적용한 쇼핑몰”에 표시되는 “앱 설치/적용”과 완전히 같은 의미라고 단정하면 안 된다.

현재 구조는 다음에 가깝다.

```txt
우리 관리자 화면에서 OAuth를 수동으로 시작해 peerl 쇼핑몰 token을 받은 내부 연동 흐름
```

반면 Cafe24 Developers의 적용 쇼핑몰 목록은 다음 상태를 요구할 수 있다.

```txt
Cafe24 앱 설치/적용 플로우를 통해 특정 쇼핑몰에 앱이 적용된 상태
```

따라서 token이 우리 DB에 있더라도 Developers의 “해당 앱을 적용한 쇼핑몰” 목록이 비어 있을 수 있다.

## 5. “해당 앱을 적용한 쇼핑몰”이 비어 있는 이유 분석

가능성이 높은 원인은 아래 순서다.

1. App URL이 Cafe24 설치 흐름이 아니라 우리 관리자 화면(`/admin/cafe24`)으로 연결되어 있음
2. OAuth 시작 route(`/api/cafe24/oauth/start`)가 관리자 인증을 요구함
3. Cafe24 설치 플로우에서 App URL 접속 시 OAuth가 자동으로 시작되지 않음
4. 앱이 아직 제작중/심사 전 상태라 실제 쇼핑몰 적용 목록에 잡히지 않음
5. Webhook TEST만 성공했고, 실제 앱 설치/적용은 완료되지 않음
6. OAuth token은 우리 DB에 있지만 Cafe24 Developers의 앱 적용 목록과 연결되는 설치 경로로 진행하지 않았을 수 있음

## 6. Webhook TEST와 실시간 주문 Webhook의 차이

Webhook TEST는 아래를 확인하는 용도다.

- Webhook URL 접근 가능 여부
- site access middleware bypass 여부
- 인증 header 처리 여부
- route handler 200 응답 여부

현재 TEST payload는 정상적으로 아래 상태로 처리된다.

```txt
SKIPPED_TEST_PAYLOAD
```

하지만 TEST 성공이 곧 실제 주문 Webhook 수신 가능을 의미하지는 않는다.

실제 주문 Webhook을 받으려면 아래 조건이 필요하다.

- 앱이 `peerl` 쇼핑몰에 실제 적용/설치된 상태
- 쇼핑몰이 실시간 정보 제공 권한에 동의한 상태
- Webhook 수신 상태가 활성화된 상태
- 주문 관련 이벤트가 등록된 상태
- Webhook URL이 운영 도메인으로 설정된 상태

Webhook URL은 유지한다.

```txt
https://perpackage-marketing-leads.vercel.app/api/cafe24/webhooks/orders
```

## 7. Cafe24 공식 문서 기준 확인 사항

Cafe24 공식 Admin API 문서 기준 Webhook logs는 일반 발송, 재발송, 테스트 발송을 구분한다.

```txt
G: 일반 발송
R: 재발송
T: 테스트 발송
```

따라서 실제 주문 Webhook은 TEST 로그가 아니라 일반 발송 로그로 확인되어야 한다.

Webhook setting에는 `reception_status`가 있으며 아래 값으로 구분된다.

```txt
T: 활성화
F: 비활성화
```

공식 문서 기준 Webhook setting 조회/수정 endpoint:

```txt
GET /api/v2/admin/webhooks/setting
PUT /api/v2/admin/webhooks/setting
```

## 8. 제작중 앱 상태에서 실제 주문 Webhook 가능 여부

현재 상태만으로는 제작중 앱에서 실제 주문 Webhook을 받을 수 있다고 단정할 수 없다.

특히 Cafe24 Developers의 “해당 앱을 적용한 쇼핑몰”이 비어 있다면 실제 주문 Webhook은 오지 않을 가능성이 높다.

운영 판단은 아래처럼 잡는 것이 안전하다.

```txt
Webhook TEST 성공
= 서버 URL, 인증, middleware, route 처리 확인

실제 주문 Webhook 수신
= 앱이 쇼핑몰에 적용되고 Webhook 수신이 활성화된 상태 필요
```

따라서 지금은 Cafe24 Developers에서 제작중 앱을 `peerl` 쇼핑몰에 테스트 설치/적용할 수 있는 경로를 확인해야 한다.

## 9. 현재 앱 설정에서 확인해야 할 값

Cafe24 Developers에서 아래 값을 확인한다.

### App URL

현재 추천:

```txt
https://perpackage-marketing-leads.vercel.app/admin/cafe24
```

단, 이 URL은 관리자 로그인 후 OAuth 버튼을 누르는 구조다.

앱 설치 흐름에서 OAuth를 바로 시작해야 한다면 별도 설치 시작 URL을 만드는 것이 더 적절할 수 있다.

후보:

```txt
https://perpackage-marketing-leads.vercel.app/api/cafe24/oauth/start
```

하지만 현재 이 route도 관리자 인증을 요구하므로, Cafe24 앱 설치 전용 시작 route를 별도로 설계하는 것이 안전하다.

### Redirect URI

유지:

```txt
https://perpackage-marketing-leads.vercel.app/api/cafe24/oauth/callback
```

### Webhook URL

유지:

```txt
https://perpackage-marketing-leads.vercel.app/api/cafe24/webhooks/orders
```

### Mall ID

유지:

```txt
peerl
```

## 10. 지금 당장 추천하는 우회 개발

실시간 Webhook 설치/심사/적용 문제가 정리되기 전까지는 주문번호 직접 조회 기능을 먼저 만드는 것이 실무적으로 안전하다.

이미 기반 API가 있다.

```txt
POST /api/admin/cafe24/orders/[orderId]/sync
```

이 API는 관리자가 주문번호를 넣으면 Cafe24 주문 상세 조회를 시도하고, 업로드 접수번호가 있으면 프로젝트 연결로 이어질 수 있는 구조다.

추천 구현 순서:

1. `/admin/cafe24`에 주문번호 입력 필드 추가
2. 관리자가 Cafe24 주문번호 입력
3. `POST /api/admin/cafe24/orders/[orderId]/sync` 호출
4. Cafe24 주문 상세 조회 성공/실패를 관리자 화면에 표시
5. 주문 메모 또는 수동 입력값에서 업로드 접수번호 연결
6. 실제 Webhook이 안정화되면 같은 sync 로직을 Webhook에서 재사용

## 11. 다음 작업 제안

### 우선순위 1: Cafe24 Developers 설정 점검

- App URL이 설치 흐름에 맞는지 확인
- Redirect URI가 운영 URL과 정확히 일치하는지 확인
- “해당 앱을 적용한 쇼핑몰”이 비어 있는 이유 확인
- 제작중 앱을 `peerl` 쇼핑몰에 테스트 설치할 수 있는지 확인

### 우선순위 2: 실시간 Webhook 조건 확인

- Webhook 수신 상태가 활성화인지 확인
- 실시간 정보 제공 권한 동의 여부 확인
- 주문 이벤트가 TEST가 아닌 일반 발송으로 찍히는지 확인

### 우선순위 3: 우회 개발

- `/admin/cafe24` 주문번호 직접 조회 UI 추가
- 주문 상세 조회 성공/실패 표시
- 업로드 접수번호 기반 프로젝트 연결 QA

## 12. 보안 주의사항

아래 값은 로그, 화면, 보고서에 출력하지 않는다.

```txt
secret
access token
refresh token
client secret
webhook secret
signature
authorization header value
```

이번 보고서에도 실제 secret 값은 포함하지 않았다.

## 13. 결론

현재 서버 측 Webhook 인증과 TEST 처리, 주문 상세 조회 진단 기반은 준비되어 있다.

다만 Cafe24 Developers의 “해당 앱을 적용한 쇼핑몰”이 비어 있다면 실제 주문 Webhook 수신 단계로 보기 어렵다.

따라서 다음 단계는 두 갈래로 진행하는 것이 좋다.

1. Cafe24 앱 설치/적용 상태를 정리해 실제 주문 Webhook이 올 수 있는 조건을 맞춘다.
2. 동시에 관리자 주문번호 직접 조회 기능을 먼저 만들어 Webhook 없이도 주문 상세 조회와 업로드 프로젝트 연결 QA를 진행한다.
