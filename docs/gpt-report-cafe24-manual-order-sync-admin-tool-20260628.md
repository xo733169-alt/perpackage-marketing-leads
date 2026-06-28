# GPT 보고서: Cafe24 주문번호 직접 조회 관리자 도구 구현

작성일: 2026-06-28
프로젝트: `perpackage-marketing-leads`

## 1. 작업 목적

Cafe24 실제 주문 Webhook 실시간 수신이 아직 들어오지 않는 상태에서, 관리자 화면에서 주문번호를 직접 입력해 Cafe24 주문 상세 API를 호출하고 업로드 접수번호 연결 가능 여부를 확인할 수 있는 우회 도구를 구현했다.

이번 작업은 Webhook 자동 수신 문제를 직접 해결하는 작업이 아니라, Webhook 안정화 전에도 주문 상세 조회와 업로드 프로젝트 연결 QA를 진행할 수 있게 하는 관리자용 기능 추가 작업이다.

## 2. 작업 전 Git 확인

작업 시작 전 아래를 확인했다.

```txt
현재 브랜치: main
git pull origin main: Already up to date
작업 전 git status: clean
기존 로컬 변경사항: 없음
```

## 3. 구현 요약

`/admin/cafe24` 화면에 새 섹션을 추가했다.

섹션 제목:

```txt
Cafe24 주문번호 직접 조회
```

설명 문구:

```txt
실시간 Webhook 수신 전에도 Cafe24 주문번호로 주문 상세 정보를 직접 조회하고 업로드 접수번호 연결을 확인할 수 있습니다.
```

입력 필드:

```txt
Cafe24 주문번호 입력
placeholder: 예: 20260627-0000032
```

버튼:

```txt
주문 조회
초기화
```

## 4. 수정 파일

```txt
src/lib/cafe24.ts
src/app/api/admin/cafe24/orders/[orderId]/sync/route.ts
src/app/admin/cafe24/page.tsx
src/components/AdminCafe24OrderLookupPanel.tsx
src/test/cafe24-integration.test.ts
```

## 5. 추가된 UI 위치

관리자 Cafe24 화면에 추가했다.

```txt
/admin/cafe24
```

추가 컴포넌트:

```txt
src/components/AdminCafe24OrderLookupPanel.tsx
```

## 6. 사용한 API route

기존 API route를 유지하고 응답 데이터를 보강했다.

```txt
POST /api/admin/cafe24/orders/[orderId]/sync
```

재사용한 기존 함수:

```txt
fetchCafe24OrderDetail
extractCafe24OrderInfo
linkCafe24OrderToUploadProject
```

추가한 helper:

```txt
extractCafe24OrderSummary
```

## 7. 조회 성공 시 표시 항목

조회 성공 시 `/admin/cafe24` 화면에 아래 항목을 표시한다.

```txt
order_id
order_no
주문자명
상품명
결제상태
주문일
배송상태
총 결제금액
업로드 접수번호 추출 여부
업로드 접수번호
연결 프로젝트 여부
연결 프로젝트
tokenLookupMallId
연결 처리 결과
연결 메시지
```

## 8. 조회 실패 시 표시 항목

조회 실패 시 아래 항목을 표시한다.

```txt
조회 실패
실패 사유
tokenLookupMallId
orderId
```

실패 응답에서도 token, secret, signature 값은 반환하지 않는다.

## 9. 테스트 주문번호

관리자 화면에 테스트 후보 주문번호를 표시했다.

```txt
20260627-0000032
20260627-0000015
20260627-0000021
```

실제 Cafe24 운영 주문번호 라이브 조회는 관리자 인증 쿠키와 운영 Cafe24 API 호출이 필요한 기능이라 로컬 자동 테스트에서는 실행하지 않았다. 배포 후 `/admin/cafe24`에서 직접 테스트해야 한다.

## 10. Webhook 기존 기능 유지

아래 기존 기능은 유지했다.

```txt
/api/cafe24/webhooks/orders
Cafe24 x-api-key 인증
TEST payload SKIPPED_TEST_PAYLOAD 처리
실제 payload 수신 시 주문 상세 조회 시도
/admin/cafe24 Webhook 수신 로그 표시
```

이번 작업은 실시간 Webhook 수신 문제 해결이 아니라 주문번호 직접 조회 우회 기능 구현이다.

## 11. Cafe24 sample payload skip 보완

Cafe24 Webhook 이벤트 TEST에서 들어오는 sample payload를 실제 페르패키지 주문으로 오인하지 않도록 보완했다.

확인된 sample payload 조건:

```txt
mall_id: cafe24bestshop
order_id 또는 order_no: 20200717-0029236
event_no: 90023 또는 90025
```

위 조건은 실제 주문 상세 조회를 시도하지 않고 `SKIPPED_TEST_PAYLOAD`로 분류한다.

유지한 기준:

```txt
CAFE24_MALL_ID=peerl
```

`cafe24bestshop`으로 환경변수를 바꾸지 않았다.

## 12. 보안상 노출하지 않은 값

아래 값은 화면, 로그, API 응답에 노출하지 않도록 점검했다.

```txt
access token
refresh token
client secret
webhook secret
signature
authorization header value
CAFE24_WEBHOOK_SECRET
CAFE24_CLIENT_SECRET
```

민감값 노출 점검 결과:

```txt
unsafe_new_log_or_ui_hits=0
```

## 13. 검증 명령 결과

아래 검증을 모두 통과했다.

```bash
vitest run src/test/cafe24-integration.test.ts
tsc --noEmit
npm run build
```

결과:

```txt
Cafe24 integration test: 13 tests 통과
TypeScript 검사: 통과
Next.js production build: 통과
```

## 14. 커밋 및 push

커밋:

```txt
56bd128e5a5f0c141c31b33d9f7947861f8b7188
feat: add cafe24 manual order sync admin tool
```

GitHub main push:

```txt
완료
```

커밋 후 `git status`:

```txt
clean
```

## 15. Vercel 배포 필요 여부

필요하다.

Vercel CLI로 확인한 Production 최신 배포는 이번 새 커밋 기준 배포가 아니었다.

따라서 `/admin/cafe24`에서 새 주문번호 직접 조회 UI를 바로 테스트하려면 아래 중 하나가 필요하다.

```txt
Vercel Dashboard에서 Redeploy
또는 Vercel Production 수동 배포
```

## 16. 다음 작업 제안

1. Vercel Production 배포
2. `/admin/cafe24` 접속
3. OAuth token 상태 확인
   - mallId: `peerl`
   - 연결 상태: 연결됨
   - 만료 시각: 현재보다 이후
4. 테스트 주문번호 입력
   - `20260627-0000032`
   - `20260627-0000015`
   - `20260627-0000021`
5. 주문 상세 조회 성공/실패 확인
6. 업로드 접수번호가 추출되는지 확인
7. 연결 프로젝트가 있는지 확인
8. 주문 상세 조회가 안정적으로 되면 Webhook 자동 수신과 같은 sync 로직을 재사용

## 17. 결론

실시간 주문 Webhook이 아직 Cafe24에서 서버로 들어오지 않는 상황에서도, 관리자가 주문번호를 직접 입력해 주문 상세 정보를 확인하고 업로드 접수번호 연결 상태를 점검할 수 있는 우회 기능을 구현했다.

이제 Webhook 자동 수신 문제와 별개로 Cafe24 주문 상세 조회, 업로드 접수번호 추출, 업로드 프로젝트 연결 QA를 진행할 수 있다.
