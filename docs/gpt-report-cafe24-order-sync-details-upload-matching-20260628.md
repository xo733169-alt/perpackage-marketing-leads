# GPT 보고서: Cafe24 주문 상세 조회 보완 및 업로드 프로젝트 매칭 개선

## 1. 작업 목적

Cafe24 실시간 Webhook 수신이 아직 운영 주문으로 들어오지 않는 상황에서, 관리자 화면의 주문번호 직접 조회 기능을 먼저 안정화했습니다.

이번 작업의 핵심은 수동 조회 흐름을 나중에 Webhook 자동화에서도 그대로 재사용할 수 있게 만드는 것입니다.

수동 흐름:

```txt
관리자가 Cafe24 주문번호 입력
→ Cafe24 주문 상세 API 조회
→ 주문 정보 추출
→ 업로드 접수번호 또는 주문번호 기준 업로드 프로젝트 연결
→ /admin/cafe24 화면에 결과 표시
```

자동 흐름 목표:

```txt
Cafe24 Webhook 수신
→ order_id 추출
→ 같은 주문 상세 조회/연결 로직 실행
→ 업로드 프로젝트 연결
→ /admin/cafe24 로그에서 처리 결과 확인
```

## 2. 작업 전 상태

- Cafe24 OAuth 연결은 완료된 상태였습니다.
- `CAFE24_MALL_ID=peerl` 기준을 유지했습니다.
- Webhook URL TEST와 90023/90025 TEST payload 처리는 정상화된 상태였습니다.
- `/admin/cafe24`에 주문번호 직접 조회 UI와 API가 이미 추가되어 있었습니다.
- 직접 조회 자체는 성공했지만, 아래 항목이 부족했습니다.
  - 상품명 표시가 `-`로 나옴
  - 결제상태 표시가 `-`로 나옴
  - 배송상태가 `F` 같은 원본 코드로만 표시됨
  - 업로드 접수번호가 없으면 업로드 프로젝트 연결이 바로 SKIPPED 처리됨
  - 주문번호 기반 업로드 프로젝트 매칭이 부족함

## 3. 수정 파일

```txt
src/lib/cafe24.ts
src/app/api/admin/cafe24/orders/[orderId]/sync/route.ts
src/components/AdminCafe24OrderLookupPanel.tsx
src/test/cafe24-integration.test.ts
```

## 4. 주문 상세 응답 구조 분석 보완

`src/lib/cafe24.ts`에 Cafe24 주문 상세 응답을 안전하게 요약하는 구조를 추가했습니다.

추가된 요약 항목:

```txt
topLevelKeys
hasOrderObject
hasOrdersArray
hasItems
hasOrderItems
hasProducts
paymentKeys
shippingKeys
memoKeys
adminMemoKeys
customerMemoKeys
```

중요:

- 원문 payload 전체는 관리자 화면에 노출하지 않습니다.
- access token, refresh token, client secret, webhook secret, signature 값은 화면/API 응답/로그에 노출하지 않습니다.
- 화면에는 key 이름과 구조 요약만 표시합니다.

## 5. 상품명 추출 방식

상품명은 주문 상세 응답 내부를 재귀적으로 탐색해 아래 후보 필드에서 추출하도록 보완했습니다.

```txt
product_name
productName
product_name_default
productNameDefault
item_name
itemName
```

여러 상품명이 있으면 중복 제거 후 쉼표로 표시합니다.

예:

```txt
Design service, Y box
```

## 6. 결제상태 추출 방식

결제상태는 아래 후보 필드에서 추출합니다.

```txt
payment_status
paymentStatus
payment_state
paymentState
payment_status_text
paymentStatusText
paid
payed
payed_date
payedDate
payment_method
paymentMethod
bank_info
bankInfo
order_status
orderStatus
```

현재는 임의 번역이나 확정 매핑을 과도하게 하지 않고, Cafe24 응답에서 확인된 값을 우선 표시합니다.

관리자 화면에는 다음을 함께 표시합니다.

```txt
결제상태
결제상태 원본 후보
```

## 7. 배송상태 표시 방식

배송상태는 원본 코드와 사람이 읽을 수 있는 보조 라벨을 함께 표시하도록 보완했습니다.

현재 매핑:

```txt
F / 배송전
M / 배송중
T / 배송대기
W / 배송준비중
D / 배송완료
C / 배송취소
R / 반품
E / 교환
```

모르는 단일 코드가 들어오면 임의로 확정하지 않고 아래처럼 표시합니다.

```txt
코드 / 미매핑
```

## 8. 업로드 접수번호 추출 방식

기존 업로드 접수번호 추출 정책은 유지했습니다.

추출 대상:

```txt
order_memo
memo
additional_info
client_memo
admin_memo
customer_memo
buyer_memo
payload 전체 문자열 후보
```

업로드 접수번호 패턴은 기존 `PP-UP-YYYYMMDD-NNN` 흐름을 유지합니다.

## 9. 업로드 프로젝트 연결 방식 개선

기존:

```txt
uploadCode가 없으면 바로 SKIPPED
```

변경 후:

```txt
1. uploadCode로 UploadProject 검색
2. uploadCode가 없거나 매칭되지 않으면 Cafe24 주문번호 후보로 검색
3. 그래도 없으면 SKIPPED
```

주문번호 기반 검색 대상:

```txt
UploadProject.cafe24OrderId
UploadProject.cafe24OrderNo
UploadProject.cafe24OrderNumber
```

DB schema 변경은 하지 않았습니다.

이유:

- `UploadProject`에 이미 `cafe24OrderNumber`, `cafe24OrderId`, `cafe24OrderNo` 필드와 인덱스가 존재합니다.
- 따라서 migration 없이 주문번호 기반 매칭을 추가할 수 있었습니다.

업로드 프로젝트가 없을 때 메시지:

```txt
같은 주문번호를 가진 업로드 프로젝트가 없습니다.
```

## 10. 관리자 화면 표시 보완

`/admin/cafe24`의 “Cafe24 주문번호 직접 조회” 결과에 아래 항목을 보완했습니다.

```txt
order_id
order_no
주문자명
상품명
결제상태
결제상태 원본 후보
주문일
배송상태
배송상태 원본 코드
총 결제금액
업로드 접수번호 추출 여부
업로드 접수번호
연결 프로젝트 여부
연결 프로젝트
연결 기준
tokenLookupMallId
연결 처리 결과
연결 메시지
응답 구조 요약
```

## 11. API route

사용한 API route:

```txt
POST /api/admin/cafe24/orders/[orderId]/sync
```

변경 내용:

- 주문 상세 API 조회 후 `extractCafe24OrderInfo` 실행
- 같은 입력값으로 `findCafe24OrderMatchedProject`를 먼저 실행
- `extractCafe24OrderSummary`에 매칭 프로젝트 정보를 전달
- `linkCafe24OrderToUploadProject`로 실제 연결 처리
- 응답에 주문 요약, 응답 구조 요약, 연결 프로젝트 정보를 포함

## 12. Webhook route 유지 여부

유지했습니다.

아래 기존 기능은 제거하지 않았습니다.

```txt
/api/cafe24/webhooks/orders
Cafe24 x-api-key 인증
HMAC signature 인증 후보
TEST payload SKIPPED_TEST_PAYLOAD 처리
실제 payload 수신 시 주문 상세 조회 시도
Webhook 수신 로그 저장
```

중요:

- Webhook route도 같은 `linkCafe24OrderToUploadProject` 함수를 사용합니다.
- 따라서 이번 주문번호 기반 업로드 프로젝트 매칭 개선은 수동 조회와 Webhook 자동화에 함께 적용됩니다.

## 13. Cafe24 sample payload skip 유지

Cafe24 Developers TEST 버튼에서 들어오는 sample payload는 실제 주문으로 처리하지 않도록 유지했습니다.

유지한 skip 조건:

```txt
client_id가 sample로 시작하는 payload
mall_id=cafe24bestshop
order_id 또는 order_no=20200717-0029236
event_no=90023 또는 90025
Tb로 시작하는 sample order_id + app_name=app_name
```

처리 상태:

```txt
SKIPPED_TEST_PAYLOAD
```

## 14. 보안상 노출하지 않은 값

아래 값은 화면, API 응답, 테스트 결과, 로그에 실제 값으로 노출하지 않았습니다.

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

테스트 파일에는 검증용 더미 문자열만 사용했습니다.

## 15. 검증 결과

실행한 검증:

```bash
vitest run src/test/cafe24-integration.test.ts
tsc --noEmit
npm run build
```

결과:

```txt
vitest: 통과, 1 file / 13 tests
tsc --noEmit: 통과
npm run build: 통과
```

Next.js build 결과:

```txt
/admin/cafe24
/api/admin/cafe24/orders/[orderId]/sync
/api/cafe24/webhooks/orders
```

위 route들이 production build에 포함되는 것을 확인했습니다.

## 16. Git 상태

보고서 작성 전 기준:

```txt
branch: main
working tree: clean
latest commit: 8a5ba81 feat: improve cafe24 order sync details and upload matching
push: GitHub main에 완료
```

직전 보고서 커밋:

```txt
2c9c30f docs: add cafe24 manual order sync report
```

이번 기능 개선 커밋:

```txt
8a5ba81 feat: improve cafe24 order sync details and upload matching
```

## 17. Vercel 배포 상태

Vercel CLI로 배포 목록을 확인했습니다.

확인 결과:

```txt
최신 Production 배포는 Ready 상태
다만 확인 당시 최신 Production 배포는 1일 전 배포로 표시됨
방금 push한 8a5ba81 커밋은 아직 Production 배포 목록에 반영되지 않은 상태로 보임
```

따라서 운영에서 확인하려면 Vercel Production 재배포가 필요합니다.

## 18. 다음 확인 항목

1. Vercel Production을 `8a5ba81` 기준으로 재배포
2. `/admin/cafe24` 접속
3. OAuth token 상태 확인
   - mallId: `peerl`
   - 연결됨
   - 만료 전 또는 자동 갱신 가능 상태
4. 아래 주문번호로 직접 조회 재확인

```txt
20260627-0000021
20260627-0000032
20260627-0000015
```

확인할 항목:

```txt
상품명 표시 여부
결제상태 표시 여부
배송상태 보조 라벨 표시 여부
응답 구조 요약 표시 여부
업로드 접수번호 추출 여부
주문번호 기반 업로드 프로젝트 연결 여부
```

## 19. 남은 작업

### 운영 확인

실제 Cafe24 API 응답 구조는 운영 DB/운영 token 환경에서 다시 확인해야 합니다.

특히 다음 필드가 실제 응답에서 어느 key로 내려오는지 확인이 필요합니다.

```txt
상품명
결제상태
배송상태
주문 메모
관리자 메모
고객 메모
```

### Webhook 자동화

실시간 Webhook이 아직 실제 주문에서 들어오지 않고 있으므로, Cafe24 앱 설치/적용/심사 상태 확인은 별도 작업으로 남아 있습니다.

이번 작업은 실시간 Webhook 수신 문제를 직접 해결하지 않았습니다.

### UploadProject 연결

주문번호 기반 연결은 구현됐지만, 실제 연결이 되려면 고객 업로드 프로젝트에 Cafe24 주문번호가 저장되어 있어야 합니다.

고객이 `/upload`에서 주문번호를 입력한 경우:

```txt
UploadProject.cafe24OrderNumber
```

기준으로 매칭 가능합니다.

## 20. 최종 요약

이번 작업으로 `/admin/cafe24`의 주문번호 직접 조회 기능이 단순 조회 도구에서 Webhook 자동화와 재사용 가능한 주문 sync 엔진에 가까워졌습니다.

핵심 개선:

```txt
Cafe24 주문 상세 정보 추출 정확도 개선
상품명/결제상태/배송상태 표시 보완
응답 구조 요약 표시
uploadCode 우선 + 주문번호 기반 업로드 프로젝트 매칭 추가
Webhook route와 수동 조회 API가 같은 연결 로직 공유
DB schema 변경 없음
secret/token/signature 노출 없음
```

