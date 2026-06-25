# GPT 전달용 문서: PerPackage Marketing Lead Management System

## 1. 프로젝트 개요

프로젝트명은 **PerPackage Marketing Lead Management System**입니다.

이 프로젝트는 패키지 박스 제조업체 **페르패키지**의 Phase 1 마케팅 리드 관리 MVP입니다.  
목표는 고객이 랜딩 페이지에서 맞춤 패키지 제작 견적 문의를 남기면, 해당 문의가 데이터베이스에 저장되고 관리자가 문의를 조회, 검색, 필터링, 관리할 수 있게 만드는 것입니다.

페르패키지는 서울 중구 을지로에 있는 패키지 박스 제조업체이며, 주요 제작 품목은 다음과 같습니다.

- 싸바리박스
- 자석박스
- 상하짝박스
- 서랍형박스
- 선물세트 박스
- 화장품 패키지
- 건강기능식품 패키지
- 주얼리/의류 패키지
- 단상자, 골판지박스, 쇼핑백 등

중요한 비즈니스 규칙은 다음과 같습니다.

- 예상가는 확정 견적이 아니라 참고용 범위로만 보여줘야 합니다.
- 최종 견적은 종이, 두께, 인쇄, 후가공, 구조, 수량, 제작 난이도 확인 후 상담을 통해 확정됩니다.
- 고객-facing UI 문구는 모두 한국어여야 합니다.
- 우선순위는 시각적 복잡도보다 **문의 전환, 관리자 사용성, 데이터 정확성, 향후 확장성**입니다.

## 2. 구현 위치

기존 루트 프로젝트에는 `package.json`이 없었고, `perpackage-vercel-public`은 정적 HTML 홈페이지 폴더였습니다.

그래서 기존 정적 홈페이지를 건드리지 않고 새 Next.js 앱을 아래 위치에 만들었습니다.

```text
C:\Users\inh78\OneDrive\문서\홈페이지 개발\perpackage-marketing-leads
```

## 3. 사용 기술

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- Zod
- Vitest

## 4. 구현된 주요 기능

### 공개 랜딩 페이지

경로:

```text
/
```

구현 내용:

- 페르패키지 로고 텍스트
- 네비게이션
  - 제작문의
  - 제작사례
  - 진행절차
  - 상담하기
- CTA 버튼
  - 견적 문의하기
  - 1분 견적 문의하기
  - 카카오톡 상담하기
- 히어로 문구
  - “브랜드 가치를 높이는 맞춤 패키지 제작”
  - “싸바리박스, 자석박스, 상하짝박스, 서랍형박스 등 브랜드에 맞는 고급 패키지를 제작합니다.”
- 강점 카드
- 패키지 카테고리 카드
- 견적 문의 폼

### 견적 문의 폼

고객 정보:

- 고객명
- 회사명
- 연락처
- 이메일
- 카카오톡 ID

제작 정보:

- 업종
- 원하는 박스 종류
- 가로 mm
- 세로 mm
- 높이 mm
- 제작 수량
- 인쇄 여부
- 후가공
- 희망 납기일
- 예산 범위
- 참고 이미지/링크
- 추가 요청사항

폼 UX:

- 클라이언트 검증
- 서버 검증
- 한국어 검증 메시지
- 제출 중 문구: “문의 접수 중...”
- 성공 시 `/thanks`로 이동
- 실패 시 한국어 오류 메시지 표시
- 숨김 honeypot 필드로 스팸 방지
- honeypot이 채워지면 저장하지 않고 성공처럼 응답

### 접수 완료 페이지

경로:

```text
/thanks
```

구현 내용:

- “견적 문의가 접수되었습니다.”
- “입력해주신 내용을 확인한 뒤 빠르게 상담 도와드리겠습니다.”
- 카카오톡 상담 버튼
- 홈으로 돌아가기 버튼

카카오톡 버튼은 `NEXT_PUBLIC_KAKAO_CHANNEL_URL` 환경 변수를 사용합니다.  
환경 변수가 없으면 “카카오톡 채널 링크가 아직 설정되지 않았습니다.” 문구가 표시됩니다.

### 관리자 로그인

경로:

```text
/admin/login
```

구현 내용:

- `ADMIN_PASSWORD` 환경 변수 기반 단일 관리자 로그인
- 비밀번호를 코드에 하드코딩하지 않음
- 로그인 성공 시 httpOnly 쿠키 기반 관리자 세션 생성
- `ADMIN_PASSWORD`가 없으면 설정 필요 메시지 표시
- 인증되지 않은 사용자는 관리자 페이지 접근 불가

### 관리자 리드 목록

경로:

```text
/admin/leads
```

구현 내용:

- 최신 문의 순 기본 정렬
- 검색
  - 고객명
  - 회사명
  - 연락처
- 상태 필터
  - 신규문의
  - 상담중
  - 견적완료
  - 주문확정
  - 보류
  - 종료
- 리드 점수 높은순 정렬
- CSV 다운로드
- 상세 보기 이동

표시 컬럼:

- 접수일
- 고객명
- 회사명
- 연락처
- 업종
- 박스 종류
- 수량
- 리드 점수
- 상담 상태
- 상세 보기

### 관리자 리드 상세

경로:

```text
/admin/leads/[id]
```

구현 내용:

- 제출된 모든 고객 정보 표시
- 제작 정보 표시
- 참고 자료 및 요청사항 표시
- 접수일, 수정일 표시
- 리드 점수 표시
- 참고용 예상 범위 표시
- 상담 상태 수정
- 관리자 메모 저장
- 연락처 복사 버튼
- 카카오톡 상담 문구 복사 버튼

카카오톡 상담 문구:

```text
안녕하세요, 페르패키지입니다.
패키지 제작 문의 남겨주셔서 감사합니다.
정확한 견적 안내를 위해 남겨주신 내용을 확인 중입니다.
추가로 참고 이미지나 원하시는 패키지 느낌이 있으시면 보내주세요.
```

## 5. 데이터 모델

Prisma `Lead` 모델을 만들었습니다.

주요 필드:

- id
- customerName
- companyName
- phone
- email
- kakaoId
- industry
- boxType
- widthMm
- depthMm
- heightMm
- quantityRange
- printOption
- finishingOptions
- desiredDeliveryDate
- budgetRange
- referenceNote
- message
- estimatedPriceRange
- leadScore
- status
- adminMemo
- createdAt
- updatedAt

상태값:

- NEW: 신규문의
- CONTACTING: 상담중
- QUOTED: 견적완료
- ORDER_CONFIRMED: 주문확정
- ON_HOLD: 보류
- CLOSED: 종료

## 6. 리드 점수 계산

파일:

```text
src/lib/lead-score.ts
```

점수 규칙:

- 연락처 있음: +10
- 회사명 있음: +10
- 제작 수량 `500~1000개`: +20
- 제작 수량 `1000개 이상`: +30
- 희망 납기일 있음: +10
- 참고 이미지/링크 있음: +10
- 예산 범위 `300~500만원`: +20
- 예산 범위 `500만원 이상`: +20
- 박스 종류 `아직 모르겠음`: -5
- 제작 수량 `아직 미정`: -10

## 7. 참고용 예상가 로직

파일:

```text
src/lib/estimate.ts
```

주의 사항:

- 자동 예상가는 확정 견적이 아닙니다.
- 모든 예상가 문구에는 참고용이며 최종 견적은 상담 후 안내된다는 문구가 포함됩니다.

공통 안내 문구:

```text
표시된 금액은 참고용 예상 범위이며, 최종 견적은 사양 확인 후 안내드립니다.
```

예시:

- 싸바리박스 + 300~500개: “개당 약 3,000원~6,000원대 상담 필요”
- 자석박스 + 300~500개: “개당 약 4,000원~8,000원대 상담 필요”
- 아직 모르겠음: “상담 후 사양에 맞춰 안내”

## 8. 주요 파일

```text
src/app/page.tsx
src/components/QuoteInquiryForm.tsx
src/app/thanks/page.tsx
src/app/admin/login/page.tsx
src/app/admin/leads/page.tsx
src/app/admin/leads/[id]/page.tsx
src/app/api/leads/route.ts
src/app/api/admin/login/route.ts
src/app/api/admin/logout/route.ts
src/app/api/admin/leads/route.ts
src/app/api/admin/leads/[id]/route.ts
src/app/api/admin/leads/export/route.ts
src/lib/auth.ts
src/lib/lead-score.ts
src/lib/estimate.ts
src/lib/lead-schema.ts
src/lib/lead-options.ts
src/lib/prisma.ts
prisma/schema.prisma
README.md
```

## 9. 환경 변수

`.env.example`:

```env
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="change-me"
NEXT_PUBLIC_KAKAO_CHANNEL_URL="카카오톡 채널 URL"
```

운영 시 주의:

- 실제 관리자 비밀번호는 커밋하지 않습니다.
- 실제 카카오톡 채널 URL도 배포 환경 변수로 설정합니다.

## 10. 실행 방법

의존성 설치:

```bash
pnpm install
```

DB 초기화:

```bash
pnpm db:migrate
```

개발 서버 실행:

```bash
pnpm dev
```

접속:

```text
http://127.0.0.1:3000
```

관리자 로그인:

```text
http://127.0.0.1:3000/admin/login
```

## 11. 검증 결과

다음 명령을 실행했고 모두 통과했습니다.

```bash
pnpm lint
pnpm test
pnpm build
```

검증한 흐름:

- 랜딩 페이지 렌더링
- 모바일 화면 렌더링
- 견적 문의 폼 제출
- DB 저장 확인
- honeypot 제출은 저장되지 않는 것 확인
- `/thanks` 이동 확인
- 관리자 로그인 확인
- 리드 목록 확인
- 리드 상세 확인
- 상담 상태 수정 확인
- 관리자 메모 저장 확인
- 콘솔 오류 없음 확인

참고:

- Browser 플러그인은 Windows sandbox 오류로 실행되지 않았습니다.
- 대신 Playwright와 시스템 Chrome으로 실제 화면과 플로우를 검증했습니다.

## 12. 현재 개발 서버 상태

개발 서버를 아래 주소로 실행해둔 상태입니다.

```text
http://127.0.0.1:3000
```

현재 로컬 테스트용 관리자 비밀번호:

```text
change-me
```

운영 전에는 반드시 `ADMIN_PASSWORD`를 실제 값으로 바꿔야 합니다.

## 13. 남은 TODO

- 실제 운영용 `ADMIN_PASSWORD` 설정
- 실제 `NEXT_PUBLIC_KAKAO_CHANNEL_URL` 설정
- 운영 DB 전환 여부 결정
- 개인정보 보관 기간 및 삭제 정책 정리
- 문의 접수 알림 채널 연동
- 관리자 권한/계정 분리
- 실제 포트폴리오/제작 사례 데이터 연동

## 14. 향후 확장 계획

- 포트폴리오 자동 생성 시스템
- KakaoTalk CRM 연동
- 광고 성과 대시보드
- 자동 견적 계산 엔진
- 샘플 요청 관리
- 고객 후속 연락 자동화

## 15. GPT에게 요청할 때 사용할 수 있는 프롬프트

아래 내용을 GPT에게 그대로 전달하면 됩니다.

```text
너는 시니어 풀스택 개발자이자 B2B 제조업 마케팅 시스템 설계자야.

나는 페르패키지라는 패키지 박스 제조업체의 Phase 1 마케팅 리드 관리 MVP를 만들고 있어.
현재 Next.js App Router + TypeScript + Tailwind CSS + Prisma + SQLite 기반으로 기본 구현은 끝난 상태야.

이 문서의 구현 내용을 기준으로 다음을 검토해줘.

1. MVP 기능 관점에서 빠진 리스크가 있는지
2. 견적 문의 전환율을 높이기 위해 랜딩 페이지나 폼에서 개선할 부분이 있는지
3. 관리자 리드 관리 화면에서 실제 영업 운영에 필요한 필드나 상태가 더 있는지
4. 개인정보/보안 측면에서 운영 전 반드시 보완해야 할 부분이 있는지
5. 향후 KakaoTalk CRM, 광고 성과 대시보드, 자동 견적 계산 엔진으로 확장하기 위한 구조 개선 제안

중요한 조건:
- 고객-facing 문구는 한국어여야 함
- 예상가는 확정 견적처럼 보이면 안 됨
- 최종 견적은 상담 후 확정된다는 원칙을 유지해야 함
- 과한 시각 효과보다 문의 전환, 관리자 사용성, 데이터 정확성, 확장성이 우선임
```
