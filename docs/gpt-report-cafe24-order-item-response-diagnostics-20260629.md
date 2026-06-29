# GPT 보고용: Cafe24 주문 item 응답 구조 진단 보완 보고

## 1. 작업 목적

Cafe24 관리자 주문상세에는 `파일접수번호 : PP-UP-TEST-001`이 보이지만, `/admin/cafe24` 주문번호 직접 조회에서는 업로드 접수번호가 추출되지 않는 문제가 있었다.

테스트 대상:

```txt
주문번호: 20260629-0000053
파일접수번호: PP-UP-TEST-001
```

이번 작업은 Cafe24 주문 상세 API 응답 안에 추가입력 옵션 값이 실제로 내려오는지 안전하게 확인할 수 있도록 `/admin/cafe24`의 응답 구조 요약을 보강하는 것이다.

## 2. 수정 파일

```txt
src/lib/cafe24.ts
src/components/AdminCafe24OrderLookupPanel.tsx
src/test/cafe24-integration.test.ts
```

## 3. 코드 커밋

```txt
45fcd5c feat: add cafe24 order item response diagnostics
```

## 4. 추가한 진단 정보

`Cafe24OrderResponseShape`에 아래 필드를 추가했다.

```txt
itemCount
firstItemOptionKeys
firstItemAdditionalInputKeys
firstItemStringFields
firstItemUploadCodeFound
firstItemUploadCodeSourcePath
additionalInputFieldMessage
```

## 5. /admin/cafe24 화면 표시 보완

`/admin/cafe24`의 주문번호 직접 조회 결과 중 “응답 구조 요약” 영역에 아래 항목을 추가했다.

```txt
item 배열 개수
첫 번째 item option 관련 key
첫 번째 item 추가입력/input/custom key
첫 번째 item 문자열 필드
첫 번째 item 접수번호 발견
첫 번째 item 접수번호 위치
추가입력 옵션 API 포함 판단
```

표시 방식:

```txt
path · 문자열 있음
path · 접수번호 발견(PP-UP-TEST-001)
```

원문 payload 전체나 임의 문자열 값 전체는 출력하지 않는다.

## 6. 민감값 보호

아래 키가 포함된 필드는 구조 요약과 문자열 필드 요약에서 제외한다.

```txt
token
secret
password
authorization
access_token
refresh_token
client_secret
```

실제 token, secret, authorization header 값은 화면/로그/API 응답/테스트 결과에 노출하지 않았다.

## 7. API 응답 구조에서 확인할 item key

운영 배포 후 `/admin/cafe24`에서 `20260629-0000053`을 조회하면 아래 정보를 확인할 수 있다.

```txt
item 배열 개수
첫 번째 item top-level keys
option 관련 key 목록
additional/input/custom 관련 key 목록
첫 번째 item 내부 문자열 필드 path 목록
각 문자열 필드의 값 존재 여부
PP-UP-TEST-001 포함 여부
발견된 경우 sourcePath
발견되지 않은 경우 추가입력 옵션 API 포함 판단 메시지
```

## 8. PP-UP-TEST-001 발견 여부

로컬에서 실제 Cafe24 주문 `20260629-0000053` 조회를 시도했지만, 현재 로컬 `.env.local`의 `DATABASE_URL`이 Prisma PostgreSQL schema와 맞지 않아 OAuth token 조회 전 단계에서 중단됐다.

로컬 확인 결과:

```txt
실제 주문 API 응답 조회: 미완료
사유: 로컬 DATABASE_URL이 PostgreSQL URL이 아님
```

따라서 실제 `PP-UP-TEST-001` 포함 여부는 Vercel 배포 후 운영 환경의 `/admin/cafe24`에서 다시 확인해야 한다.

## 9. 발견되지 않을 경우 가능한 원인

운영 조회 후에도 아래처럼 표시된다면:

```txt
첫 번째 item 접수번호 발견: 아니오
추가입력 옵션 API 포함 판단: 추가입력 옵션으로 보이는 필드가 API 응답에 없음
```

가능한 원인:

```txt
Cafe24 관리자 주문상세에는 보이지만 Admin Orders API 응답에는 추가입력 옵션 값이 포함되지 않음
사용 중인 Cafe24 API endpoint가 추가입력 옵션 값을 내려주지 않음
추가입력 옵션 값이 별도 endpoint 또는 다른 응답 필드에 있음
Cafe24 API scope 또는 API version에 따라 item 옵션 응답 구성이 다름
```

## 10. 발견된 경우 기대 결과

운영 조회에서 `PP-UP-TEST-001`이 API 응답에 포함되어 있으면 `/admin/cafe24`에 아래처럼 표시된다.

```txt
업로드 접수번호 추출 여부: 예
업로드 접수번호: PP-UP-TEST-001
추출 위치: order.items[0]...
추출 기준: Cafe24 추가입력 옵션 또는 Cafe24 상품 옵션
첫 번째 item 접수번호 발견: 예
첫 번째 item 접수번호 위치: order.items[0]...
```

## 11. 다음 대안

운영 API 응답에 추가입력 옵션 값이 없으면 아래 순서로 대안을 검토한다.

1. Cafe24 주문 상세 API에서 추가입력 옵션을 포함하는 별도 endpoint가 있는지 확인한다.
2. Cafe24 상품 옵션/주문 품목 API의 상세 endpoint를 추가 조회해야 하는지 확인한다.
3. Cafe24 주문 메모 또는 배송메시지처럼 API 응답에 확실히 내려오는 필드에 접수번호를 남기는 방식을 검토한다.
4. 주문 전 업로드 완료 후 Cafe24 상품상세 이동 시 `uploadCode`를 추가입력 옵션뿐 아니라 고객 메모/주문 메모 계열 필드에도 반영 가능한지 확인한다.
5. 추가입력 옵션 API 추출이 불가능하면, 주문번호 없이 업로드한 프로젝트는 연락처/주문자명/상품명/시간 근접도 기반 자동 후보 매칭을 유지한다.

## 12. 테스트 결과

실행한 명령:

```bash
vitest run src/test/cafe24-integration.test.ts
tsc --noEmit
npm run build
```

결과:

```txt
vitest: 통과, 19 tests
tsc --noEmit: 통과
npm run build: 통과
```

## 13. 남은 확인

Vercel 배포 후 아래를 확인해야 한다.

```txt
/admin/cafe24 접속
주문번호 20260629-0000053 직접 조회
item 배열 개수 확인
첫 번째 item key 목록 확인
option/additional/input/custom 후보 key 확인
첫 번째 item 문자열 필드 path 확인
PP-UP-TEST-001 발견 여부 확인
발견된 경우 sourcePath 확인
발견되지 않은 경우 추가입력 옵션 API 포함 판단 메시지 확인
```

## 14. push 여부

코드 변경과 보고서 문서는 GitHub `main`에 push 완료 기준으로 정리한다.

코드 커밋:

```txt
45fcd5c feat: add cafe24 order item response diagnostics
```

보고서 파일:

```txt
docs/gpt-report-cafe24-order-item-response-diagnostics-20260629.md
```
