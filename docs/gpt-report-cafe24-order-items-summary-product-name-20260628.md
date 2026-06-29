# GPT 보고서: Cafe24 order.items 구조 요약 및 상품명 추출 보완

## 1. 작업 목적

운영 환경에서 Cafe24 주문번호 직접 조회 기능이 정상 작동하는 것을 확인한 뒤, 실제 Cafe24 주문 상세 응답 구조에 맞춰 상품 정보 추출을 보완했습니다.

운영 확인 결과 `order.items` 배열이 존재하고, `order_items` / `products` 배열은 없는 것으로 확인됐습니다. 따라서 원문 payload 전체를 노출하지 않고 `order.items` 내부 구조를 안전하게 요약하며, 상품명 후보 필드를 `items` 배열 중심으로 더 정확하게 추출하도록 수정했습니다.

## 2. 운영 확인 상태

운영에서 아래 주문번호 조회가 성공했습니다.

```txt
20260627-0000021
20260627-0000032
20260627-0000015
```

확인된 값:

```txt
tokenLookupMallId: peerl
배송상태: F / 배송전
응답 구조 요약 표시됨
order 객체 있음
items 배열 있음
order_items 배열 없음
products 배열 없음
payment 관련 key: paid, payment_method
shipping 관련 key: shipping_status
연결 메시지: 같은 주문번호를 가진 업로드 프로젝트가 없습니다.
```

## 3. 수정 파일

```txt
src/lib/cafe24.ts
src/components/AdminCafe24OrderLookupPanel.tsx
src/test/cafe24-integration.test.ts
```

## 4. order.items 구조 요약 추가

`Cafe24OrderResponseShape`에 아래 필드를 추가했습니다.

```txt
firstItemKeys
```

역할:

```txt
order.items 배열의 첫 번째 item 객체에서 key 목록만 추출해 관리자 화면에 표시
```

보안 원칙:

- 원문 payload 전체를 표시하지 않음
- 첫 번째 item의 값도 표시하지 않음
- key 목록만 표시
- key 이름 중 민감값으로 판단되는 token/secret/password/authorization 계열은 제외

관리자 화면 표시 위치:

```txt
/admin/cafe24
→ Cafe24 주문번호 직접 조회
→ 조회 성공
→ 응답 구조 요약
→ 첫 번째 item key
```

## 5. 상품명 후보 필드 보완

기존 후보:

```txt
product_name
product_name_default
productName
productNameDefault
item_name
itemName
```

추가 후보:

```txt
product_name_en
productNameEn
product_no
productNo
variant_code
variantCode
option_value
optionValue
```

## 6. 상품명 추출 우선순위

상품 정보는 아래 배열을 우선 탐색하도록 보완했습니다.

```txt
items
order_items
orderItems
products
```

각 item에서 우선 확인하는 기본 상품명 후보:

```txt
product_name
productName
product_name_default
productNameDefault
item_name
itemName
product_name_en
productNameEn
```

기본 상품명 후보가 없을 경우 보조 후보를 사용합니다.

```txt
product_no
productNo
variant_code
variantCode
option_value
optionValue
```

보조 후보는 상품명 자체가 아니라 식별/옵션 정보일 수 있으므로, 기본 상품명 후보가 없는 경우에만 fallback으로 사용합니다.

여러 상품이 있으면 중복 제거 후 쉼표로 표시합니다.

## 7. UploadProject 연결 점검 구조

`/upload`에서 고객이 주문번호를 입력해 업로드 프로젝트를 생성하면, 프로젝트 생성 API가 이미 아래 필드에 주문번호를 저장합니다.

```txt
UploadProject.cafe24OrderNumber
```

확인 파일:

```txt
src/app/api/uploads/projects/route.ts
```

저장 구조:

```ts
cafe24OrderNumber: input.cafe24OrderNumber ?? ""
```

따라서 `/upload`에서 같은 Cafe24 주문번호로 업로드 프로젝트가 생성되어 있다면, `/admin/cafe24` 주문번호 직접 조회 결과에서 주문번호 기반 매칭으로 연결 프로젝트 여부가 `예`로 표시될 수 있습니다.

매칭 기준:

```txt
UploadProject.uploadCode
UploadProject.cafe24OrderId
UploadProject.cafe24OrderNo
UploadProject.cafe24OrderNumber
```

현재 운영 확인에서는 해당 주문번호를 가진 업로드 프로젝트가 없어 아래 메시지가 표시된 상태입니다.

```txt
같은 주문번호를 가진 업로드 프로젝트가 없습니다.
```

이는 연결 로직 오류가 아니라, 연결 대상 UploadProject가 아직 없는 상태로 판단됩니다.

## 8. 보안 확인

이번 작업에서도 아래 값은 화면, API 응답, 로그, 보고서에 실제 값으로 노출하지 않았습니다.

```txt
secret
access token
refresh token
client secret
webhook secret
signature
authorization header value
CAFE24_WEBHOOK_SECRET
CAFE24_CLIENT_SECRET
```

민감값 검색 결과:

```txt
테스트용 더미 문자열
기존 Cafe24 token refresh 요청 구현부
```

위 항목 외 실제 운영 secret 값은 포함되지 않았습니다.

## 9. 검증 결과

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

빌드 참고:

```txt
첫 npm run build는 기존 .next 캐시의 readlink 오류로 실패
.next 캐시를 프로젝트 내부 경로로 확인한 뒤 삭제
재실행한 npm run build는 통과
```

## 10. 현재 git 상태

보고서 작성 시점 기준 미커밋 변경:

```txt
M  src/components/AdminCafe24OrderLookupPanel.tsx
M  src/lib/cafe24.ts
M  src/test/cafe24-integration.test.ts
?? docs/gpt-report-cafe24-order-sync-details-upload-matching-20260628.md
?? docs/gpt-report-cafe24-order-items-summary-product-name-20260628.md
```

아직 commit/push는 하지 않았습니다.

## 11. 다음 확인 단계

1. 운영 배포 후 `/admin/cafe24`에서 같은 주문번호를 다시 조회
2. 응답 구조 요약에 `첫 번째 item key`가 표시되는지 확인
3. 상품명이 `order.items` 내부 후보 필드에서 추출되는지 확인
4. `/upload`에서 동일 주문번호로 테스트 업로드 프로젝트 생성
5. `/admin/cafe24`에서 같은 주문번호 조회
6. 연결 프로젝트 여부가 `예`로 표시되는지 확인

## 12. 최종 요약

이번 작업은 Cafe24 주문 상세 응답의 실제 운영 구조에 맞춰 상품 정보 추출을 한 단계 보완한 작업입니다.

핵심 변경:

```txt
order.items 첫 번째 item key 목록만 안전하게 표시
원문 payload 값은 노출하지 않음
상품명 후보 필드 확장
items 배열 우선 상품명 추출
/upload 주문번호 저장 구조와 /admin/cafe24 연결 프로젝트 확인 흐름 점검
테스트/타입검사/빌드 통과
```

