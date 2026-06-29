# Cafe24 주문 전 업로드 접수번호 테스트 가이드

## 목적

주문 전 `/upload`에서 생성된 업로드 접수번호를 Cafe24 주문 데이터에 함께 남길 수 있는지 확인한다.

이번 가이드는 Cafe24 기본 파일첨부 기능을 대체하지 않는다. 상품상세의 Cafe24 기본 파일첨부 옵션은 그대로 유지하고, 별도 추가입력 옵션에 접수번호가 저장되는지 먼저 검증한다.

## 테스트할 접수번호 형식

허용 패턴:

```txt
PP-UP-YYYYMMDD-NNN
TEMP-UP-YYYYMMDD-NNN
PP-UP-TEST-001
TEMP-UP-TEST-001
```

현재 추출 기준:

```txt
\b(?:PP|TEMP)-UP-(?:\d{8}|TEST)-\d{3,}\b
```

## Cafe24 관리자 설정 테스트

1. Cafe24 관리자에서 테스트 상품의 상품 수정 화면으로 이동한다.
2. 상품 옵션 또는 추가입력 옵션 영역에서 텍스트 입력 항목을 추가한다.
3. 옵션명은 아래처럼 지정한다.

```txt
파일접수번호
```

4. 상품상세에서 해당 입력칸이 노출되는지 확인한다.
5. 테스트 주문 시 `파일접수번호` 입력칸에 아래 값을 넣는다.

```txt
PP-UP-TEST-001
```

6. 주문 완료 후 Cafe24 주문관리에서 해당 추가입력 값이 주문 상세에 저장되는지 확인한다.
7. 페르패키지 관리자 `/admin/cafe24`에서 같은 주문번호를 직접 조회한다.
8. 조회 결과에서 아래 항목을 확인한다.

```txt
업로드 접수번호 추출 여부: 예
업로드 접수번호: PP-UP-TEST-001
추출 위치: order.items[0].additional_option...
추출 기준: Cafe24 추가입력 옵션
추출 패턴: /\b(?:PP|TEMP)-UP-(?:\d{8}|TEST)-\d{3,}\b/i
```

## 확인해야 할 주문 상세 응답 위치

Cafe24 주문 상세 응답에서 아래 위치를 우선 확인한다.

```txt
order.items
order.items[].options
order.items[].additional_option
order.items[].option_value
product_name
order_memo
memo
client_memo
customer_memo
admin_memo
additional_info
custom fields
```

민감값으로 판단되는 `token`, `secret`, `password`, `authorization` 계열 필드는 접수번호 추출 대상에서 제외한다.

## 추후 자동화 흐름

```txt
주문 전 /upload 완료
→ PP-UP-YYYYMMDD-NNN 접수번호 생성
→ Cafe24 상품상세 링크에 uploadCode query 전달
→ 상품상세 JS가 추가입력 옵션 '파일접수번호'에 자동 입력
→ 고객 주문 완료
→ Webhook 또는 관리자 직접 조회
→ Cafe24 주문 상세에서 접수번호 추출
→ UploadProject 자동 연결
```

## 상품상세 자동 입력 JS 초안

아래 코드는 운영 적용 전 검증용 초안이다. 이번 작업에서는 Cafe24 상품상세 HTML에 직접 적용하지 않는다.

```html
<script>
(function () {
  var params = new URLSearchParams(window.location.search);
  var uploadCode = (params.get("uploadCode") || "").trim();

  if (!/^(?:PP|TEMP)-UP-(?:\d{8}|TEST)-\d{3,}$/i.test(uploadCode)) {
    return;
  }

  function normalize(text) {
    return (text || "").replace(/\s+/g, "").trim();
  }

  function findInputByLabel() {
    var rows = document.querySelectorAll("tr");

    for (var i = 0; i < rows.length; i += 1) {
      var row = rows[i];
      var label = row.querySelector("th, label, .title");

      if (label && normalize(label.textContent).indexOf("파일접수번호") !== -1) {
        var rowInput = row.querySelector("input[type='text'], input:not([type]), textarea");
        if (rowInput) return rowInput;
      }
    }

    var labels = document.querySelectorAll("label");

    for (var j = 0; j < labels.length; j += 1) {
      var item = labels[j];

      if (normalize(item.textContent).indexOf("파일접수번호") === -1) continue;

      if (item.htmlFor) {
        var byId = document.getElementById(item.htmlFor);
        if (byId) return byId;
      }

      var parentInput = item.parentElement && item.parentElement.querySelector("input[type='text'], input:not([type]), textarea");
      if (parentInput) return parentInput;
    }

    return null;
  }

  var input = findInputByLabel();

  if (!input || (input.value || "").trim()) {
    return;
  }

  input.value = uploadCode.toUpperCase();
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
})();
</script>
```

## 운영 적용 전 주의사항

- Cafe24 기본 파일첨부 옵션은 삭제하지 않는다.
- `{$form.file_option}`, `{$file_option_name}`, `{$file_option_limit}`는 수정하지 않는다.
- 추가입력 옵션 자동 입력은 주문서에 실제로 값이 저장되는지 확인한 뒤 적용한다.
- 접수번호 입력칸을 숨기거나 readonly로 만들기 전 Cafe24 주문 저장 동작을 먼저 확인한다.
- access token, refresh token, client secret, webhook secret, signature 값은 화면과 로그에 노출하지 않는다.

