# 보안 체크리스트

이 문서는 `PerPackage Marketing Lead Management System`을 Vercel Preview와 실제 운영으로 옮기기 전 확인할 보안 기준입니다.

## 환경변수

- `DATABASE_URL`은 Vercel Environment Variables에만 설정합니다.
- `ADMIN_PASSWORD`는 소스코드에 하드코딩하지 않습니다.
- `SITE_ACCESS_PASSWORD`와 `ADMIN_PASSWORD`는 서로 다르게 설정합니다.
- `SITE_ACCESS_SECRET`은 충분히 긴 랜덤 문자열을 사용합니다.
- `NEXT_PUBLIC_`으로 시작하는 변수에는 secret을 넣지 않습니다.

## 관리자 접근

- `/admin/login` URL을 불필요하게 외부 공유하지 않습니다.
- 관리자 비밀번호는 테스트용 짧은 값으로 운영하지 않습니다.
- 실제 운영 전에는 관리자 비밀번호를 긴 값으로 교체합니다.
- 향후 개선 과제로 다중 관리자 계정과 역할 기반 권한을 검토합니다.

## Private preview

- Preview 확인 시 `SITE_ACCESS_ENABLED=true`를 사용합니다.
- private mode에서는 `/`, `/portfolio`, `/admin`, `/q/[token]` 모두 site access를 먼저 요구해야 합니다.
- 실제 고객에게 공개하기 전 `SITE_ACCESS_ENABLED` 값을 의도적으로 결정합니다.

## 견적 공유 링크

- `/q/[token]`은 sitemap에 포함하지 않습니다.
- `/q/[token]`은 noindex/nofollow를 유지합니다.
- token 원문은 DB에 저장하지 않고 hash만 저장합니다.
- 공유 링크는 고객에게 직접 전달하는 제한 링크이며 공개 게시물에 올리지 않습니다.
- 고객 수락은 결제나 전자계약이 아닙니다.

## 공개 페이지 민감정보

고객-facing 화면에는 아래 정보를 노출하지 않습니다.

- phone
- email
- kakaoId
- internalMemo
- 내부 quote rule
- multiplier
- calculation notes
- 상담 이력
- 업무 데이터

## Webhook

- lead notification webhook payload에는 full phone, email, kakaoId, message를 넣지 않습니다.
- quote response webhook payload에는 full customer message와 internal memo를 넣지 않습니다.
- webhook 실패가 고객 제출/응답 실패로 이어지지 않도록 유지합니다.

## CSV export

- lead CSV에는 개인정보가 포함될 수 있습니다.
- export 파일은 외부 공유 전에 목적과 수신자를 확인합니다.
- 테스트 CSV와 실제 고객 CSV를 구분합니다.

## 테스트 데이터

- Vercel Preview DB에는 실제 고객 데이터를 넣지 않습니다.
- 테스트 문의는 확인 후 삭제합니다.
- 공개 전 `/admin/checklist`에서 테스트 삭제 여부를 확인합니다.

## 운영 DB

- 실제 운영 전 PostgreSQL 전환을 검토합니다.
- migration 전 백업을 생성합니다.
- 운영 DB 접근 권한을 최소화합니다.

## 향후 개선 과제

- 다중 관리자 계정
- 역할 기반 접근 제어
- 관리자 로그인 감사 로그
- rate limiting
- 관리형 PostgreSQL
- 오류 모니터링
- 백업 자동화
