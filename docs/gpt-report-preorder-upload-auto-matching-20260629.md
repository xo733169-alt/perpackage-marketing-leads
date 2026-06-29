# GPT 보고서: 주문 전 업로드 프로젝트 자동 매칭 기능 구현

## 1. 작업 목적

고객이 Cafe24 주문 메모에 업로드 접수번호를 적지 않아도, 주문 전 업로드된 인쇄파일 프로젝트와 Cafe24 주문정보를 자동 또는 후보 방식으로 연결할 수 있게 했습니다.

이번 작업의 핵심은 아래 흐름입니다.

```txt
/upload에서 주문번호 없이 파일 업로드
→ UploadProject를 ORDER_LINK_PENDING 상태로 저장
→ Cafe24 주문번호 직접 조회 또는 Webhook 주문 상세 조회
→ 미연결 UploadProject 중 자동 매칭 후보 탐색
→ 점수가 충분하면 자동 연결
→ 애매하면 /admin/cafe24에 관리자 확인 후보로 표시
```

## 2. 구현 기준

요청 기준:

```txt
1. /upload에서 주문번호 없이 파일 업로드 가능
2. 주문 전 업로드 시 이름, 연락처, 상품명 또는 상품 선택을 받음
3. UploadProject 상태를 ORDER_LINK_PENDING으로 저장
4. /admin/cafe24 주문번호 직접 조회 시 Cafe24 주문정보를 가져온 뒤, 미연결 UploadProject 중 자동 매칭 후보를 찾음
5. 매칭 기준:
   - 연락처 일치
   - 주문자명 일치
   - 상품명 또는 상품번호 일치
   - 업로드 시간과 주문시간 근접
6. 점수가 높은 경우 자동 연결 또는 관리자 확인 후보로 표시
7. 애매한 경우 자동 연결하지 말고 관리자에게 후보로 표시
8. token, secret, signature 값은 절대 노출하지 않음
```

## 3. 수정 파일

```txt
src/lib/cafe24.ts
src/app/api/admin/cafe24/orders/[orderId]/sync/route.ts
src/app/api/cafe24/webhooks/orders/route.ts
src/app/api/uploads/projects/route.ts
src/app/api/uploads/files/route.ts
src/components/AdminCafe24OrderLookupPanel.tsx
src/lib/print-file-upload-schema.ts
src/test/cafe24-integration.test.ts
```

## 4. 상태값 추가

새 상태값:

```txt
ORDER_LINK_PENDING
```

의미:

```txt
주문번호 없이 업로드된 파일 프로젝트가 이후 Cafe24 주문과 연결되기를 기다리는 상태
```

추가 위치:

```txt
src/lib/cafe24.ts
src/lib/print-file-upload-schema.ts
```

관리자 표시 라벨:

```txt
주문 연결 대기
```

DB schema 변경은 하지 않았습니다.

이유:

```txt
UploadProject.status는 문자열 필드이므로 새 migration 없이 상태값 추가 가능
```

## 5. /upload 프로젝트 생성 흐름

파일:

```txt
src/app/api/uploads/projects/route.ts
```

변경 내용:

```txt
주문번호가 있으면 기존처럼 upload_waiting
주문번호가 없으면 ORDER_LINK_PENDING
```

구현 기준:

```ts
const hasCafe24OrderNumber = Boolean(input.cafe24OrderNumber?.trim());

status: hasCafe24OrderNumber ? "upload_waiting" : CAFE24_ORDER_LINK_PENDING_STATUS
```

## 6. 파일 업로드 완료 흐름

파일:

```txt
src/app/api/uploads/files/route.ts
```

변경 내용:

```txt
주문번호가 있는 프로젝트는 파일 업로드 완료 후 uploaded
주문번호가 없는 프로젝트는 파일 업로드 완료 후에도 ORDER_LINK_PENDING 유지
reviewStatus는 uploaded 유지
```

이유:

```txt
주문 전 파일은 업로드 자체는 끝났지만 아직 Cafe24 주문과 연결되지 않았기 때문
```

## 7. Cafe24 주문정보 추출 보완

파일:

```txt
src/lib/cafe24.ts
```

주문 상세 응답에서 자동 매칭에 필요한 값을 추출하도록 확장했습니다.

추가 추출 값:

```txt
buyerName
buyerPhone
productName
productIdentifiers
orderedAt
```

연락처 후보:

```txt
buyer_cellphone
buyerCellphone
buyer_phone
buyerPhone
orderer_phone
ordererPhone
orderer_cellphone
ordererCellphone
member_phone
memberPhone
customer_phone
customerPhone
receiver_cellphone
receiverCellphone
receiver_phone
receiverPhone
cellphone
phone
mobile
mobilePhone
```

상품 식별 후보:

```txt
product_no
productNo
variant_code
variantCode
option_value
optionValue
```

## 8. 자동 매칭 후보 점수화

파일:

```txt
src/lib/cafe24.ts
```

추가된 주요 로직:

```txt
findCafe24UploadProjectMatchCandidates
scoreUploadProjectCandidate
```

후보 대상:

```txt
linkedAt이 없음
cafe24OrderId가 없음
cafe24OrderNo가 없음
status가 ORDER_LINK_PENDING 이거나 cafe24OrderNumber가 빈 값
```

조회 범위:

```txt
최근 50개 미연결 UploadProject
```

점수 기준:

```txt
연락처 일치: +55
주문자명 일치: +20
상품명 일치: +20
상품번호 또는 옵션 후보 일치: +15
업로드/주문 시간 6시간 이내: +15
업로드/주문 시간 24시간 이내: +10
업로드/주문 시간 72시간 이내: +5
```

후보 최소 점수:

```txt
40점 이상
```

자동 연결 가능 기준:

```txt
점수 85점 이상
연락처 일치 포함
두 번째 후보와 15점 이상 차이
```

위 조건을 만족하지 않으면 자동 연결하지 않고 관리자 확인 후보로 표시합니다.

## 9. 자동 연결 또는 후보 표시 흐름

기존 우선순위:

```txt
1. uploadCode 기준 매칭
2. cafe24OrderId / cafe24OrderNo / cafe24OrderNumber 기준 매칭
```

추가된 우선순위:

```txt
3. 주문 전 업로드 자동 매칭 후보 탐색
4. 확실한 단일 후보면 자동 연결
5. 애매하면 SKIPPED + candidates 반환
```

결과에 추가된 값:

```txt
candidates
autoLinkedByCandidate
```

## 10. /admin/cafe24 주문번호 직접 조회 연동

파일:

```txt
src/app/api/admin/cafe24/orders/[orderId]/sync/route.ts
```

변경 내용:

```txt
Cafe24 주문 상세 조회
→ extractCafe24OrderSummary
→ buyerName / buyerPhone / productName / productIdentifiers / orderedAt 추출
→ linkCafe24OrderToUploadProject에 전달
```

이제 주문번호 직접 조회 시, 동일 주문번호가 없어도 주문 전 업로드 프로젝트 후보를 찾을 수 있습니다.

## 11. Cafe24 Webhook 연동

파일:

```txt
src/app/api/cafe24/webhooks/orders/route.ts
```

변경 내용:

```txt
Webhook에서 실제 주문 상세 조회 성공 시
→ extractCafe24OrderSummary
→ 같은 자동 매칭 정보 전달
→ linkCafe24OrderToUploadProject 재사용
```

즉, 수동 주문번호 조회와 Webhook 자동 흐름이 같은 매칭 로직을 공유합니다.

## 12. 관리자 화면 후보 표시

파일:

```txt
src/components/AdminCafe24OrderLookupPanel.tsx
```

추가 표시:

```txt
자동 후보 연결
관리자 확인 후보
후보 점수
판정
매칭 사유
접수번호
업체명
고객명
담당자명
연락처
상품명
업로드 시각
```

애매한 경우:

```txt
자동 연결은 보류했습니다. 관리자 확인이 필요한 업로드 프로젝트 후보가 있습니다.
```

후보가 없는 경우:

```txt
같은 주문번호 또는 자동 매칭 기준에 맞는 업로드 프로젝트가 없습니다.
```

## 13. 보안 확인

아래 값은 출력하거나 화면/API 응답에 노출하지 않았습니다.

```txt
token
secret
signature
access token
refresh token
client secret
webhook secret
env 실제 값
authorization header value
```

민감값 검색 결과:

```txt
테스트용 더미 문자열
기존 token refresh 구현부
```

실제 운영 secret 값은 포함되지 않았습니다.

## 14. 검증 결과

실행한 명령:

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

## 15. 현재 git 상태

보고서 작성 시점 기준 코드 변경은 아직 commit/push 전입니다.

수정된 코드 파일:

```txt
M src/app/api/admin/cafe24/orders/[orderId]/sync/route.ts
M src/app/api/cafe24/webhooks/orders/route.ts
M src/app/api/uploads/files/route.ts
M src/app/api/uploads/projects/route.ts
M src/components/AdminCafe24OrderLookupPanel.tsx
M src/lib/cafe24.ts
M src/lib/print-file-upload-schema.ts
M src/test/cafe24-integration.test.ts
```

기존 untracked 보고서 파일:

```txt
docs/gpt-report-cafe24-order-item-summary-pushed-20260628.md
docs/gpt-report-cafe24-order-items-summary-product-name-20260628.md
docs/gpt-report-cafe24-order-sync-details-upload-matching-20260628.md
```

이번 보고서 파일:

```txt
docs/gpt-report-preorder-upload-auto-matching-20260629.md
```

## 16. 다음 작업 제안

1. 코드 변경분만 별도 commit
2. GitHub main에 push
3. Vercel Production 배포 확인
4. 운영에서 아래 시나리오 테스트

```txt
1. /upload에서 주문번호 없이 파일 업로드
2. 고객명/담당자명/연락처/상품명 입력
3. Cafe24에서 같은 고객/연락처/상품으로 주문 생성
4. /admin/cafe24에서 주문번호 직접 조회
5. 자동 연결 또는 관리자 확인 후보 표시 확인
```

5. 실제 운영 데이터 기준으로 점수 기준 조정

점수 조정 후보:

```txt
자동 연결 기준 85점
두 번째 후보와 15점 차이
후보 최소 점수 40점
시간 근접 기준 6/24/72시간
```

## 17. 최종 요약

이번 작업으로 고객이 주문 메모에 업로드 접수번호를 적지 않아도, 주문 전 업로드 프로젝트와 Cafe24 주문정보를 자동 매칭할 수 있는 1차 구조가 구현됐습니다.

핵심은 다음과 같습니다.

```txt
주문번호 없는 업로드 = ORDER_LINK_PENDING
Cafe24 주문정보에서 이름/연락처/상품/시간 추출
미연결 UploadProject 점수화
확실하면 자동 연결
애매하면 관리자 확인 후보 표시
수동 조회와 Webhook 모두 같은 매칭 로직 재사용
secret/token/signature 노출 없음
검증 통과
```

