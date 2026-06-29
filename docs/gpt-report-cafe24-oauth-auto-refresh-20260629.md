# GPT 보고서: Cafe24 OAuth token 자동 refresh 보강

## 1. 작업 목적

Cafe24 access token이 약 2시간 단위로 만료되어, 관리자가 매번 `/admin/cafe24`에서 “OAuth 연결 시작”을 누르지 않아도 되도록 자동 refresh token 갱신 로직을 보강했습니다.

이번 작업은 기존 Cafe24 주문번호 직접 조회 및 Webhook 주문 상세 조회 흐름에서 API 호출 전에 access token 상태를 확인하고, 만료 또는 만료 임박 시 refresh token으로 자동 갱신하도록 만드는 작업입니다.

## 2. 현재 전제

운영 기준:

```txt
mallId: peerl
CAFE24_MALL_ID=peerl 유지
/admin/cafe24에서 OAuth token 상태 표시
Cafe24 주문번호 직접 조회 API: POST /api/admin/cafe24/orders/[orderId]/sync
주문 상세 조회 함수: fetchCafe24OrderDetail
Webhook 실제 주문 상세 조회도 fetchCafe24OrderDetail 흐름 사용
```

DB 기준:

```txt
model Cafe24Token {
  mallId
  accessToken
  refreshToken
  expiresAt
  scopes
  createdAt
  updatedAt
}
```

참고:

```txt
현재 schema에는 refresh token 만료 시각 전용 필드는 없음
따라서 이번 작업에서는 schema 변경 없이 access token expiresAt 기준으로 자동 refresh 처리
```

## 3. 수정 파일

이번 OAuth 자동 refresh 보강으로 수정된 주요 파일:

```txt
src/lib/cafe24.ts
src/app/admin/cafe24/page.tsx
src/test/cafe24-integration.test.ts
```

현재 작업트리에는 직전 “주문 전 업로드 자동 매칭” 구현 파일도 함께 수정된 상태입니다.

전체 미커밋 코드 변경 파일:

```txt
src/app/admin/cafe24/page.tsx
src/app/api/admin/cafe24/orders/[orderId]/sync/route.ts
src/app/api/cafe24/webhooks/orders/route.ts
src/app/api/uploads/files/route.ts
src/app/api/uploads/projects/route.ts
src/components/AdminCafe24OrderLookupPanel.tsx
src/lib/cafe24.ts
src/lib/print-file-upload-schema.ts
src/test/cafe24-integration.test.ts
```

## 4. 자동 refresh 기준

기존:

```txt
만료 3분 전 refresh
```

변경:

```txt
만료 10분 전 refresh
```

추가 상수:

```ts
export const CAFE24_TOKEN_REFRESH_MARGIN_MS = 10 * 60 * 1000;
```

## 5. token 상태 판단 함수 추가

파일:

```txt
src/lib/cafe24.ts
```

추가 함수:

```ts
getCafe24TokenTimingStatus
shouldRefreshCafe24Token
```

상태값:

```txt
valid
refresh_needed
expired
```

판단 기준:

```txt
expiresAt <= now → expired
expiresAt - now <= 10분 → refresh_needed
그 외 → valid
```

## 6. refresh token 갱신 흐름

기존 `refreshCafe24Token` 흐름을 보완했습니다.

동작:

```txt
1. mallId 기준 Cafe24Token 조회
2. refresh token으로 OAuth token endpoint 호출
3. 새 access token 저장
4. Cafe24가 새 refresh token을 내려주면 refresh token도 교체
5. 새 refresh token이 없으면 기존 refresh token 유지
6. expiresAt 갱신
7. scopes 갱신
8. Prisma updatedAt 자동 갱신
```

주의:

```txt
Cafe24Token schema에는 refresh token 만료 시각 컬럼이 없으므로 refresh token expiresAt 저장은 이번 작업에서 하지 않음
```

## 7. refresh 실패 메시지

refresh 실패 시 민감값 없이 아래 메시지를 사용합니다.

```txt
Cafe24 token refresh failed. Please reconnect OAuth.
```

노출하지 않는 값:

```txt
access token
refresh token
client secret
authorization header value
webhook secret
signature
```

## 8. API 호출 경로 적용

이미 `fetchCafe24OrderDetail`이 `getValidCafe24Token`을 사용하고 있었고, 이번 작업으로 `getValidCafe24Token`의 refresh 판단이 강화됐습니다.

적용 흐름:

```txt
POST /api/admin/cafe24/orders/[orderId]/sync
→ fetchCafe24OrderDetail
→ getValidCafe24Token
→ 필요 시 refreshCafe24Token
→ Cafe24 주문 상세 조회
```

Webhook 흐름:

```txt
POST /api/cafe24/webhooks/orders
→ 실제 주문 payload일 때 fetchCafe24OrderDetail
→ getValidCafe24Token
→ 필요 시 refreshCafe24Token
→ Cafe24 주문 상세 조회
```

추가 보완:

```txt
Cafe24 API 호출이 401을 반환하는 경우 refreshCafe24Token을 한 번 더 시도
refresh 실패 시 재연결 안내 메시지 반환
```

## 9. /admin/cafe24 화면 표시 보강

파일:

```txt
src/app/admin/cafe24/page.tsx
```

추가 표시:

```txt
자동 갱신 상태
자동 갱신 기준
갱신 실패 안내
```

상태 라벨:

```txt
연결됨
갱신 필요
자동 갱신 실패
연결 필요
```

자동 갱신 기준 표시:

```txt
만료 10분 전
```

갱신 실패 시 표시:

```txt
OAuth 재연결이 필요합니다.
```

참고:

```txt
기존 관리자 화면 일부 한글 라벨은 파일 인코딩 문제로 깨져 있으나, 이번 작업에서는 새 상태 row를 추가해 명확한 한글 상태를 표시하도록 보강
```

## 10. 테스트 보강

파일:

```txt
src/test/cafe24-integration.test.ts
```

추가 테스트:

```txt
access token이 충분히 유효하면 refresh하지 않음
만료 5분 이내면 refresh_needed
이미 만료됐으면 expired
shouldRefreshCafe24Token이 refresh 필요 여부를 올바르게 반환
```

테스트는 실제 token 값을 사용하지 않고 시간 계산만 검증합니다.

## 11. 검증 결과

실행한 명령:

```bash
vitest run src/test/cafe24-integration.test.ts
tsc --noEmit
npm run build
```

결과:

```txt
vitest: 통과, 1 file / 14 tests
tsc --noEmit: 통과
npm run build: 통과
```

## 12. 보안 확인

민감값 검색을 수행했습니다.

검색 결과 확인된 항목:

```txt
테스트용 더미 문자열
기존 refresh token request 구현부
```

실제 운영 secret/token 값은 포함되지 않았습니다.

노출 금지 유지:

```txt
access token
refresh token
client secret
webhook secret
signature
authorization header value
CAFE24_CLIENT_SECRET
CAFE24_WEBHOOK_SECRET
env 실제 값
```

## 13. 현재 git 상태

보고서 작성 시점 기준 코드 변경은 아직 commit/push 전입니다.

수정된 코드 파일:

```txt
M src/app/admin/cafe24/page.tsx
M src/app/api/admin/cafe24/orders/[orderId]/sync/route.ts
M src/app/api/cafe24/webhooks/orders/route.ts
M src/app/api/uploads/files/route.ts
M src/app/api/uploads/projects/route.ts
M src/components/AdminCafe24OrderLookupPanel.tsx
M src/lib/cafe24.ts
M src/lib/print-file-upload-schema.ts
M src/test/cafe24-integration.test.ts
```

untracked 보고서 파일:

```txt
docs/gpt-report-cafe24-order-item-summary-pushed-20260628.md
docs/gpt-report-cafe24-order-items-summary-product-name-20260628.md
docs/gpt-report-cafe24-order-sync-details-upload-matching-20260628.md
docs/gpt-report-preorder-upload-auto-matching-20260629.md
docs/gpt-report-cafe24-oauth-auto-refresh-20260629.md
```

## 14. 다음 작업 제안

1. 코드 변경분을 기능 단위로 커밋
   - 주문 전 업로드 자동 매칭
   - Cafe24 OAuth 자동 refresh
2. 보고서 문서는 별도 커밋 여부 결정
3. GitHub main push
4. Vercel Production 배포 확인
5. 운영에서 `/admin/cafe24` token 상태 확인
6. 만료 10분 이내 또는 만료 후 주문번호 직접 조회 테스트
7. refresh 성공 시 `최근 갱신` 시각이 바뀌는지 확인
8. refresh 실패 시 OAuth 재연결 안내가 표시되는지 확인

## 15. 최종 요약

이번 작업으로 Cafe24 access token이 만료됐거나 만료 10분 전이면 자동으로 refresh token 갱신을 시도하도록 보강했습니다.

핵심:

```txt
mallId=peerl 기준 유지
Cafe24 API 호출 전 token 유효성 확인
만료 또는 만료 임박 시 refresh token 자동 갱신
refresh 성공 시 DB token 정보 갱신
refresh 실패 시 민감값 없이 OAuth 재연결 안내
주문번호 직접 조회와 Webhook 주문 상세 조회 모두 같은 로직 재사용
/admin/cafe24에 자동 갱신 상태 표시
테스트/타입검사/빌드 통과
```

