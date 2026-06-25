# PerPackage Marketing Lead Management System Phase 1.5 핸드오프

작성일: 2026-06-20

이 문서는 GPT 또는 다른 개발자가 현재 프로젝트 상태를 빠르게 이해할 수 있도록 만든 작업 요약 문서입니다.

## 프로젝트 개요

- 프로젝트명: PerPackage Marketing Lead Management System
- 회사: 페르패키지
- 업종: 맞춤 패키지 박스 제조
- 위치: 서울 중구 을지로
- 목적: 랜딩 페이지에서 견적 문의를 접수하고, 관리자가 리드를 조회/검색/필터링/상담 관리하는 MVP
- 현재 단계: Phase 1.5 production-readiness 개선 완료

## 기술 스택

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- Zod
- Vitest

## 현재 주요 기능

### 공개 페이지

- `/` 랜딩 페이지
- `/privacy` 개인정보 수집 및 이용 안내 페이지
- `/thanks` 문의 접수 완료 페이지
- 견적 문의 폼
- 한국어 검증 메시지
- honeypot 스팸 방지
- 개인정보 필수 동의
- 마케팅 수신 선택 동의
- UTM, referrer, landingPath 추적
- 참고용 예상 견적 범위 실시간 미리보기
- KakaoTalk CTA 환경 변수 연동

### 관리자

- `/admin/login` 관리자 로그인
- `/admin/leads` 리드 목록
- `/admin/leads/[id]` 리드 상세
- 검색: 고객명, 회사명, 연락처
- 상태 필터
- 리드 점수 정렬
- 후속 연락 필요 필터
- CSV 다운로드
- 상태 배지
- 고점수 리드 강조
- 개인정보 동의 정보 확인
- 유입 정보 확인
- 상담 상태 수정
- 관리자 메모 수정
- 영업 메모 수정
- 다음 후속 연락일 수정
- 마지막 연락일 수정
- 오늘 연락 완료 처리
- 연락처 복사
- 카카오톡 상담 문구 복사
- 추가 사양 요청 문구 복사
- 관리자 전용 문의 삭제

## Phase 1.5에서 추가된 핵심 개선

### 1. 개인정보 동의

견적 문의 폼에 필수 개인정보 동의 체크박스를 추가했습니다.

문구:

> 개인정보 수집 및 이용에 동의합니다. (필수)

체크하지 않으면 제출되지 않고 다음 메시지가 표시됩니다.

> 개인정보 수집 및 이용에 동의해 주세요.

마케팅 수신 동의는 선택 항목입니다.

### 2. 개인정보 안내 페이지

`/privacy` 페이지를 추가했습니다.

포함 내용:

- 개인정보 수집 및 이용 안내
- 수집 항목
- 수집 목적
- 보관 기간
- 제3자 제공 여부
- 개인정보 삭제 요청 방법
- 문의처

### 3. UTM 및 유입 추적

랜딩 페이지에서 다음 값을 hidden field로 수집합니다.

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `utm_content`
- `document.referrer`
- 현재 landing path와 query string

관리자 출처 표시 규칙:

- `utmSource`가 있으면 해당 값 표시
- `referrer`만 있으면 “외부 유입”
- 둘 다 없으면 “직접 유입”

### 4. 전환 개선

- 헤더 CTA와 히어로 CTA가 견적 폼으로 스크롤됩니다.
- 모바일 하단 sticky CTA를 추가했습니다.
- “페르패키지가 잘하는 제작” 신뢰 섹션을 추가했습니다.
- “제작 진행 절차” 섹션을 추가했습니다.
- 폼 안에 참고용 예상 범위 미리보기를 추가했습니다.
- `/thanks` 페이지에 “다음 단계” 섹션을 추가했습니다.

주의:

예상 금액은 확정 견적이 아닙니다. 모든 예상 범위에는 다음 취지의 문구가 포함됩니다.

> 표시된 금액은 참고용 예상 범위이며, 최종 견적은 사양 확인 후 안내드립니다.

### 5. 관리자 영업 운영 개선

추가 필드:

- `nextFollowUpAt`
- `lastContactedAt`
- `salesNote`

기능:

- 다음 후속 연락일 저장
- 마지막 연락일 저장
- 영업 메모 저장
- 오늘 연락 완료 버튼
- NEW 상태에서 오늘 연락 완료 시 CONTACTING으로 변경
- 후속 연락 필요 필터

후속 연락 필요 조건:

- `nextFollowUpAt`이 오늘 이전 또는 오늘인 리드
- 또는 `NEW` 상태이며 접수 후 2일이 지난 리드

### 6. 문의 삭제

관리자 상세 페이지에 “문의 삭제” 버튼을 추가했습니다.

목적:

- 고객 개인정보 삭제 요청 대응

동작:

- 브라우저 확인창 표시
- DELETE `/api/admin/leads/[id]`
- 관리자 인증 필요
- hard delete
- 삭제 후 `/admin/leads`로 이동

### 7. 선택 알림 웹훅

환경 변수:

```env
LEAD_NOTIFICATION_WEBHOOK_URL=""
NEXT_PUBLIC_SITE_URL="http://127.0.0.1:3000"
```

`LEAD_NOTIFICATION_WEBHOOK_URL`이 있으면 유효한 리드 저장 후 POST 요청을 보냅니다.

payload 포함:

- `leadId`
- `customerName`
- `companyName`
- `industry`
- `boxType`
- `quantityRange`
- `leadScore`
- `createdAt`
- `adminUrl`

payload 제외:

- 전체 연락처
- 이메일
- 카카오톡 ID
- 상세 문의 메시지

웹훅 실패는 고객 제출 실패로 처리하지 않습니다.

### 8. 보안 보강

- 관리자 세션 쿠키는 httpOnly
- sameSite=lax
- production에서 secure=true
- path=/
- PATCH, DELETE, logout 요청에 Origin/Referer 기본 검사 적용
- `ADMIN_PASSWORD`는 서버 환경 변수만 사용
- 고객 개인정보를 불필요하게 로그에 남기지 않음

## 새 데이터베이스 필드

Lead 모델에 다음 필드가 추가되었습니다.

```ts
privacyConsent
privacyConsentAt
marketingConsent
marketingConsentAt
utmSource
utmMedium
utmCampaign
utmTerm
utmContent
referrer
landingPath
nextFollowUpAt
lastContactedAt
salesNote
```

## 주요 변경 파일

### Prisma

- `prisma/schema.prisma`
- `prisma/migrations/20260620040137_add_privacy_source_followup_fields/migration.sql`

### 공개 페이지 및 폼

- `src/app/page.tsx`
- `src/components/QuoteInquiryForm.tsx`
- `src/app/privacy/page.tsx`
- `src/app/thanks/page.tsx`
- `src/app/layout.tsx`

### API

- `src/app/api/leads/route.ts`
- `src/app/api/admin/leads/route.ts`
- `src/app/api/admin/leads/[id]/route.ts`
- `src/app/api/admin/leads/export/route.ts`
- `src/app/api/admin/logout/route.ts`

### 관리자 UI

- `src/app/admin/leads/page.tsx`
- `src/app/admin/leads/[id]/page.tsx`
- `src/components/AdminLeadEditor.tsx`
- `src/components/CopyButton.tsx`
- `src/components/DeleteLeadButton.tsx`

### 비즈니스 로직

- `src/lib/lead-schema.ts`
- `src/lib/lead-score.ts`
- `src/lib/estimate.ts`
- `src/lib/source.ts`
- `src/lib/notifications.ts`
- `src/lib/admin-leads.ts`
- `src/lib/auth.ts`

### 테스트

- `src/test/lead-score.test.ts`
- `src/test/estimate.test.ts`
- `src/test/lead-schema.test.ts`
- `src/test/source.test.ts`
- `src/test/notifications.test.ts`

### 문서/환경 변수

- `README.md`
- `.env.example`

## 실행 방법

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

개발 서버:

```text
http://127.0.0.1:3000
```

관리자 로그인:

```text
http://127.0.0.1:3000/admin/login
```

기본 개발 환경 예시:

```env
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="change-me"
NEXT_PUBLIC_KAKAO_CHANNEL_URL="카카오톡 채널 URL"
NEXT_PUBLIC_SITE_URL="http://127.0.0.1:3000"
LEAD_NOTIFICATION_WEBHOOK_URL=""
```

## 검증 결과

최종 확인 명령:

```bash
pnpm lint
pnpm test
pnpm build
```

결과:

- lint 통과
- test 통과: 5개 파일, 12개 테스트
- build 통과
- 브라우저 QA 통과

브라우저 QA에서 확인한 항목:

- 랜딩 페이지 표시
- CTA 스크롤
- 개인정보 필수 동의 검증
- 폼 제출
- UTM 저장
- honeypot 미저장
- 관리자 로그인
- 관리자 목록 유입 정보 표시
- 관리자 상세 개인정보/유입 정보 표시
- 후속 연락 저장
- 오늘 연락 완료 처리
- CSV export
- 리드 삭제

## 운영 전 체크리스트

- `ADMIN_PASSWORD` 실제 값 설정
- `NEXT_PUBLIC_KAKAO_CHANNEL_URL` 실제 값 설정
- `NEXT_PUBLIC_SITE_URL` 실제 배포 URL 설정
- 개인정보 처리방침 내용 최종 확인
- 운영 DB 결정
- 백업 정책 결정
- 문의 알림 채널 결정
- 관리자 접근 URL 관리
- 테스트 문의 접수 후 삭제 확인

## 남은 TODO 및 한계

- 운영 DB를 SQLite로 유지할지 PostgreSQL 등으로 전환할지 결정 필요
- 정식 개인정보 처리방침은 법무/운영 기준에 맞게 최종 검토 필요
- 관리자 인증은 단일 비밀번호 방식
- 다중 관리자 계정/권한 분리는 아직 없음
- 웹훅 실패 재시도 큐는 아직 없음
- 광고 성과 대시보드는 아직 구현하지 않음
- 자동 견적 엔진은 아직 구현하지 않음
- KakaoTalk CRM 실연동은 아직 구현하지 않음

## GPT에게 요청할 때 참고 문장

다른 GPT에게 이 프로젝트를 이어서 검토시키려면 다음처럼 요청하면 됩니다.

```text
첨부한 GPT_HANDOFF_PHASE_1_5.md를 기준으로 PerPackage Marketing Lead Management System의 현재 상태를 이해해줘.
Phase 1.5는 완료되어 있고, 다음 작업은 운영 배포 전 점검 또는 Phase 2 기획이다.
확정 견적처럼 보이는 문구가 없는지, 개인정보/관리자 보안/리드 전환 관점에서 추가로 보완할 점을 검토해줘.
```
