# PerPackage Marketing Lead Management System

페르패키지 맞춤 패키지 제작 문의를 접수하고, 관리자에서 리드·제작 사례·마케팅 성과·참고 견적 룰을 관리하는 Next.js 기반 MVP입니다.

## 기술 스택

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- Zod
- Vitest

## 설치

```bash
pnpm install
```

## 환경 변수

`.env.example`을 참고해 `.env`를 생성합니다. 실제 운영 비밀번호와 외부 URL은 코드에 커밋하지 않습니다.

```env
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="change-me"
SITE_ACCESS_ENABLED="false"
SITE_ACCESS_PASSWORD=""
SITE_ACCESS_SECRET="change-this-random-secret"
NEXT_PUBLIC_KAKAO_CHANNEL_URL="카카오톡 채널 URL"
NEXT_PUBLIC_SITE_URL="http://127.0.0.1:3000"
LEAD_NOTIFICATION_WEBHOOK_URL=""
QUOTE_RESPONSE_WEBHOOK_URL=""
```

## 데이터베이스

```bash
pnpm db:migrate
pnpm exec prisma generate
```

주요 마이그레이션:

- `add_privacy_source_followup_fields`
- `add_portfolio_cases`
- `add_portfolio_approval_seo_image_fields`
- `add_marketing_analytics_fields`
- `add_reference_quote_engine`
- `add_quote_proposals_and_rule_history`
- `add_quote_share_and_customer_response`
- `add_quote_revision_and_lead_communication`

## 개발 서버

```bash
pnpm dev
```

주요 경로:

- 공개 랜딩 페이지: `/`
- 비공개 테스트 접근: `/access`
- 개인정보 안내: `/privacy`
- 문의 완료: `/thanks`
- 제작 사례 목록: `/portfolio`
- 제작 사례 상세: `/portfolio/[slug]`
- 관리자 로그인: `/admin/login`
- 리드 관리: `/admin/leads`
- 제작 사례 관리: `/admin/portfolio`
- 성과 대시보드: `/admin/analytics`
- 마케팅 비용 관리: `/admin/marketing-costs`
- 견적 룰 관리: `/admin/quote-rules`
- 견적 계산기: `/admin/quote-calculator`
- 견적안 관리: `/admin/quote-proposals`
- 견적안 수정안 작성: `/admin/quote-proposals/[id]/revisions/new`
- 견적안 수정 비교: `/admin/quote-proposals/[id]/compare`
- 견적 보정: `/admin/quote-calibration`
- 견적 룰 변경 이력: `/admin/quote-rules/history`
- 고객 견적안 공유 페이지: `/q/[token]`
- 운영 체크리스트: `/admin/checklist`
- sitemap: `/sitemap.xml`
- robots: `/robots.txt`

## 구현된 기능

- 공개 랜딩 페이지와 견적 문의 폼
- 개인정보 필수 동의, 마케팅 수신 선택 동의
- UTM, referrer, landingPath, 제작 사례 유입 추적
- Honeypot 스팸 방어
- 리드 저장, CSV 다운로드, 상태·메모·후속 연락 관리
- 관리자 로그인과 httpOnly 세션 쿠키
- 선택형 전체 사이트 비공개 접근 gate
- 리드 삭제
- 선택적 리드 알림 webhook
- 제작 사례 등록/편집/공개/보관/삭제
- 제작 사례 공개 승인 workflow
- 제작 사례 SEO 체크리스트와 미리보기
- 제작 사례 import 스크립트
- robots/sitemap
- 관리자 성과 대시보드
- 수동 마케팅 비용 관리
- Lead 전환 필드와 내부 주문 금액 기록
- Phase 4 참고 견적 엔진, 견적 룰 관리, 관리자 견적 계산기
- Phase 4.5 관리자 견적안 작성, 프린트용 견적안, 견적 룰 변경 이력, 견적 보정 대시보드
- Phase 5 제한 공유 링크, 고객 견적안 확인/응답, 견적 활동 timeline
- Phase 6 견적안 수정안 workflow, 이전/현재 견적안 비교, 리드 상담 이력

## Phase 4 참고 견적 엔진

Phase 4에서는 기존 단순 예상 문구를 구조화된 rule 기반 참고 견적 엔진으로 확장했습니다.

계산 입력:

- 박스 종류
- 제작 수량
- 가로/세로/높이
- 인쇄 여부
- 후가공

계산 결과:

- 참고용 개당 예상 범위
- 참고용 총 예상 범위
- 견적 난이도
- 견적 신뢰도
- 누락된 항목
- 계산 메모
- 적용된 룰

중요 문구:

> 자동 계산 결과는 참고용 예상 범위입니다. 실제 견적은 종이, 구조, 후가공, 외주 공정, 일정, 제작 난이도 확인 후 상담을 통해 확정해야 합니다.

고객 화면에는 내부 룰 이름, 배율, 계산 메모를 노출하지 않습니다. 고객에게는 참고용 범위와 상담 필요 안내만 보여줍니다.

## QuoteRule 모델

`QuoteRule`은 관리자 전용 참고 견적 룰입니다.

주요 필드:

- `name`
- `isActive`
- `boxType`
- `quantityRange`
- `minQuantity`
- `maxQuantity`
- `baseUnitPriceMinKrw`
- `baseUnitPriceMaxKrw`
- size threshold/multiplier fields
- print multiplier fields
- finishing add-on fields
- complexity multiplier fields
- `minOrderPriceKrw`
- `notes`

기본 견적 룰은 placeholder 기준입니다. 운영 전 실제 단가와 제작 기준에 맞게 반드시 검토해야 합니다.

## Lead 견적 스냅샷 필드

리드가 접수될 때 당시 계산 결과를 Lead에 저장합니다. 이후 견적 룰이 바뀌어도 과거 리드의 접수 당시 참고값은 유지됩니다.

추가 필드:

- `estimatedUnitPriceMinKrw`
- `estimatedUnitPriceMaxKrw`
- `estimatedTotalPriceMinKrw`
- `estimatedTotalPriceMaxKrw`
- `estimateLabel`
- `estimateDisclaimer`
- `quoteComplexityLevel`
- `quoteConfidenceLevel`
- `quoteCalculationNotes`
- `quoteMissingFields`

기존 `estimatedPriceRange`는 호환성을 위해 유지합니다.

## 기본 견적 룰 seed

기본 placeholder 룰을 생성합니다.

```bash
pnpm quote-rules:seed
```

기본 동작은 이미 존재하는 룰을 덮어쓰지 않습니다.

수동 수정된 룰까지 강제로 갱신해야 할 때만 사용합니다.

```bash
pnpm quote-rules:seed -- --force
```

## 견적 룰 운영 방법

1. `/admin/quote-rules`에서 기본 룰 목록을 확인합니다.
2. 박스 종류와 수량 구간별 단가 범위를 실제 제작 기준에 맞게 조정합니다.
3. 필요 없는 룰은 삭제보다 비활성화를 우선합니다.
4. `/admin/quote-calculator`에서 샘플 조건으로 계산 결과를 확인합니다.
5. 공개 문의 폼에서 고객에게 확정 견적처럼 보이지 않는지 확인합니다.

## 공개 견적 미리보기와 관리자 계산기의 차이

공개 견적 미리보기:

- 고객 입력 중 참고용 예상 범위만 표시
- 내부 룰 이름, 배율, 계산 메모 미노출
- 항상 상담 후 최종 안내 disclaimer 표시

관리자 견적 계산기:

- 적용 룰, 계산 메모, 누락 항목, 난이도, 신뢰도 표시
- 내부 검토용 도구
- 실제 견적 확정 도구가 아님

## 마케팅 성과 대시보드

`/admin/analytics`는 관리자 전용 집계 화면입니다.

주요 지표:

- 전체 문의 수
- 신규/상담중/견적완료/주문확정 수
- 평균 리드 점수
- 고점수 리드 수
- 제작 사례 유입 문의 수
- 후속 연락 필요 수
- 마케팅 수신 동의 수
- 상담/견적/주문 전환율
- 소스, 캠페인, 제작 사례, 업종, 박스 종류별 성과

광고비와 매출 성과는 수동 입력 데이터 기준의 참고 지표이며, 실제 광고 플랫폼 데이터와 차이가 있을 수 있습니다.

## 제작 사례 운영

공개 페이지와 sitemap에는 다음 조건을 모두 만족하는 제작 사례만 포함됩니다.

- `status=PUBLISHED`
- `publicApprovalConfirmed=true`

운영 주의:

- 실제 고객사명은 승인 없이 공개하지 않습니다.
- 제품명, 이미지, 민감한 수량/단가/거래처 정보는 공개 전 확인합니다.
- 포트폴리오 제목은 검색 친화적으로 작성합니다.
- 자동 예상 범위를 최종 견적처럼 표현하지 않습니다.

## 제작 사례 import

예시 파일:

```text
scripts/portfolio-cases.example.json
```

실행:

```bash
pnpm portfolio:import scripts/portfolio-cases.example.json
```

dry-run:

```bash
pnpm portfolio:import scripts/portfolio-cases.example.json --dry-run
```

기본 예시는 `DRAFT`, `publicApprovalConfirmed=false`입니다.

## Phase 4.5 견적안 운영

Phase 4.5에서는 참고 견적 엔진을 실제 상담 업무에 연결하기 위해 관리자 전용 견적안 workflow를 추가했습니다.

중요 문구:

> 견적안은 관리자 검토 후 작성하는 문서이며, 공개 견적 미리보기나 자동 계산 결과와 다를 수 있습니다.

견적안은 고객에게 자동 발송되지 않습니다. `SENT` 상태는 관리자가 카카오톡, 전화, 이메일 등 별도 채널로 안내한 뒤 수동으로 표시하는 내부 상태입니다.

## QuoteProposal 모델

`QuoteProposal`은 리드 기반으로 작성하는 관리자 전용 견적안입니다.

주요 필드:

- `leadId`
- `proposalNumber`
- `status`
- 고객 스냅샷 필드
- 제작 사양 요약
- 납기 안내, 결제 조건, 고객 안내 문구
- 공급가, 부가세, 합계
- 리드 접수 당시 참고 견적 스냅샷
- 예상 범위 비교 상태

상태:

- `DRAFT`: 임시작성
- `READY_TO_SEND`: 발송준비
- `SENT`: 발송완료
- `ACCEPTED`: 수락
- `REJECTED`: 거절
- `EXPIRED`: 만료
- `CANCELLED`: 취소

## QuoteProposalItem 모델

`QuoteProposalItem`은 견적안의 항목 행입니다.

주요 필드:

- `quoteProposalId`
- `sortOrder`
- `itemName`
- `description`
- `quantity`
- `unitPriceKrw`
- `amountKrw`

`amountKrw`와 견적안 합계는 서버에서 다시 계산합니다. 클라이언트 화면의 합계는 입력 편의를 위한 미리보기이며, 저장된 값의 기준은 서버 계산 결과입니다.

## QuoteRuleChangeLog 모델

`QuoteRuleChangeLog`는 견적 룰 변경 내역을 보관합니다.

기록 대상:

- 생성
- 수정
- 비활성화
- 재활성화
- 삭제

기록 내용:

- 룰 이름 스냅샷
- 변경 유형
- 변경 전/후 JSON
- 변경 사유
- 변경자
- 변경일

기본 seed 스크립트로 생성되는 placeholder 룰은 운영 편의를 위한 초기 데이터입니다. 운영 중 `/admin/quote-rules`에서 변경하는 내용은 변경 이력에 기록됩니다.

## 견적안 workflow

리드에서 견적안을 만드는 기본 흐름:

1. `/admin/leads/[id]`에서 리드 상세를 엽니다.
2. “견적안 작성”을 누릅니다.
3. 리드의 고객 정보, 박스 종류, 수량, 참고 견적 스냅샷이 자동 반영됩니다.
4. 항목명, 수량, 단가, 제작 메모, 납기 안내, 결제 조건을 관리자가 검토합니다.
5. “임시저장” 또는 “발송준비로 저장”을 선택합니다.
6. `/admin/quote-proposals/[id]`에서 상세 확인, 상태 변경, 프린트 보기를 사용할 수 있습니다.

상태 변경과 리드 연동:

- 견적안을 `SENT`로 변경하면 관련 리드가 `NEW` 또는 `CONTACTING`일 때 `QUOTED`로 변경되고 `quotedAt`이 비어 있으면 현재 시각으로 저장됩니다.
- 견적안을 `ACCEPTED`로 변경하면 관련 리드가 `ORDER_CONFIRMED`로 변경되고 `orderConfirmedAt`이 비어 있으면 현재 시각으로 저장됩니다.
- `confirmedOrderAmountKrw`가 비어 있으면 견적안 합계가 내부 주문 금액으로 저장됩니다.

## 프린트용 견적안

`/admin/quote-proposals/[id]/print`는 브라우저 인쇄 또는 PDF 저장을 위한 관리자 전용 HTML 화면입니다.

포함 내용:

- 페르패키지 견적 안내
- 견적안 번호
- 작성일과 유효일
- 고객명과 회사명
- 제작 사양
- 견적 항목 표
- 공급가, 부가세, 합계
- 납기 안내, 결제 조건, 안내 문구

프린트 화면에도 다음 disclaimer가 표시됩니다.

> 본 견적안은 입력된 사양 기준의 안내 금액이며, 최종 제작 조건, 원자재, 후가공, 일정 확인에 따라 조정될 수 있습니다.

## 견적 보정 대시보드

`/admin/quote-calibration`은 리드 접수 당시 참고 견적 범위와 실제 관리자 견적안을 비교하는 관리자 전용 화면입니다.

비교 상태:

- `IN_RANGE`: 예상 범위 내
- `ABOVE_RANGE`: 예상보다 높음
- `BELOW_RANGE`: 예상보다 낮음
- `NO_ESTIMATE`: 예상 데이터 없음
- `NO_PROPOSAL`: 견적안 없음

표시 정보:

- 분석 대상 견적안 수
- 예상 범위 내/초과/미만/데이터 없음 수
- 평균 차이율
- 박스 종류별 보정 현황
- 수량 구간별 보정 현황
- 최근 이상치

견적 룰 보정은 자동으로 적용하지 않습니다. 실제 제작 단가와 공정 기준을 확인한 뒤 관리자가 수동으로 조정해야 합니다.

## 견적 룰 변경 이력

견적 룰 수정 화면에는 최근 변경 이력이 표시됩니다.

전체 변경 이력은 `/admin/quote-rules/history`에서 확인할 수 있습니다.

견적 룰을 수정할 때 “변경 사유”를 입력하면 나중에 단가 조정 근거를 추적하기 쉽습니다.

## Phase 5 견적안 공유와 고객 응답

Phase 5에서는 관리자가 작성한 견적안을 고객에게 제한 링크로 공유하고, 고객의 수락/거절/수정 요청 의견을 기록하는 workflow를 추가했습니다.

중요 문구:

> 공유 링크는 링크를 아는 사람이 견적안을 볼 수 있는 제한 링크입니다. 외부에 공개하지 마세요.

> 고객 수락은 결제나 전자계약이 아니며, 담당자가 확인 후 다음 절차를 안내해야 합니다.

> 견적안 공유 페이지에는 내부 견적 룰, 배율, 계산 메모, 전화번호, 이메일, 카카오톡 ID, 관리자 메모를 노출하지 않습니다.

## QuoteProposalShareLink 모델

`QuoteProposalShareLink`는 견적안 공유용 token link를 관리합니다.

주요 필드:

- `quoteProposalId`
- `tokenHash`
- `tokenPreview`
- `status`
- `expiresAt`
- `revokedAt`
- `firstViewedAt`
- `lastViewedAt`
- `viewCount`
- `createdBy`

보안 기준:

- raw token은 DB에 저장하지 않습니다.
- DB에는 SHA-256 hash인 `tokenHash`만 저장합니다.
- `tokenPreview`는 관리자 표시용 마지막 6자리 미리보기입니다.
- raw 공유 URL은 생성 직후 관리자 화면에서만 표시됩니다.
- 링크를 잃어버렸다면 기존 링크를 폐기하고 새 링크를 재생성합니다.

상태:

- `ACTIVE`: 활성
- `REVOKED`: 폐기
- `EXPIRED`: 만료

## QuoteProposalCustomerResponse 모델

`QuoteProposalCustomerResponse`는 공유 링크를 통해 들어온 고객 응답을 저장합니다.

응답 유형:

- `ACCEPTED`: 수락
- `REJECTED`: 거절
- `REVISION_REQUESTED`: 수정 요청

입력 항목:

- 담당자명
- 메시지

고객 공유 페이지에서는 전화번호, 이메일, 카카오톡 ID를 다시 입력받지 않습니다.

응답 처리:

- `ACCEPTED`: 견적안 상태를 `ACCEPTED`로 바꾸고 관련 Lead를 `ORDER_CONFIRMED`로 갱신합니다.
- `REJECTED`: 견적안 상태를 `REJECTED`로 바꾸되 Lead를 자동 종료하지 않습니다.
- `REVISION_REQUESTED`: 견적안 상태를 `READY_TO_SEND`로 바꾸고 관리자가 수동으로 수정/재작성합니다.
- 한 공유 링크당 고객 응답은 1회만 허용합니다.

## QuoteActivityLog 모델

`QuoteActivityLog`는 견적 관련 주요 이벤트 timeline입니다.

기록 대상:

- 견적안 생성
- 견적안 수정
- 견적안 상태 변경
- 공유 링크 생성
- 공유 링크 폐기
- 고객 견적안 확인
- 고객 수락
- 고객 거절
- 고객 수정 요청

활동 내역은 견적안 상세와 관련 Lead 상세에서 확인할 수 있습니다.

## 견적안 공유 workflow

1. `/admin/quote-proposals/[id]`에서 견적안을 엽니다.
2. “공유 링크” 섹션에서 만료 기간을 선택합니다.
3. “공유 링크 생성”을 누릅니다.
4. 생성 직후 표시되는 `/q/[token]` URL을 복사합니다.
5. 관리자가 카카오톡, 이메일, 문자 등 외부 채널로 직접 고객에게 전달합니다.
6. 고객이 링크를 열면 조회 시간이 기록됩니다.
7. 고객은 수락, 거절, 수정 요청 중 하나를 선택해 의견을 접수합니다.
8. 관리자 견적안 상세에서 고객 응답과 활동 내역을 확인합니다.

링크 관리:

- 활성 링크가 있으면 새 링크 생성 대신 “새 링크 재생성”을 사용합니다.
- 재생성 시 기존 활성 링크는 폐기됩니다.
- “공유 링크 폐기”를 누르면 해당 링크로 견적안을 볼 수 없습니다.

## 고객 견적안 공유 페이지

경로:

```text
/q/[token]
```

표시 내용:

- 견적안 번호
- 작성일
- 유효일
- 고객명/회사명
- 제작 사양
- 견적 항목
- 공급가
- 부가세
- 합계
- 납기 안내
- 결제 조건
- 고객 안내 메시지
- disclaimer

노출하지 않는 내용:

- 연락처
- 이메일
- 카카오톡 ID
- 내부 메모
- 내부 견적 룰
- 배율
- 계산 메모
- 원가성 판단 로직

공유 페이지 disclaimer:

> 본 견적안은 입력된 사양 기준의 안내 금액이며, 최종 제작 조건, 원자재, 후가공, 일정 확인에 따라 조정될 수 있습니다.

SEO 보안:

- `/q/[token]` 페이지는 `noindex, nofollow` metadata를 사용합니다.
- `/q` 경로는 robots.txt에서 disallow합니다.
- sitemap에는 공유 링크를 포함하지 않습니다.

## 견적 응답 webhook

선택적으로 고객 응답 발생 시 외부 webhook에 최소 정보만 보낼 수 있습니다.

환경 변수:

```env
QUOTE_RESPONSE_WEBHOOK_URL=""
```

payload 포함:

- `proposalId`
- `proposalNumber`
- `responseType`
- `createdAt`
- `leadId`
- `adminUrl`

payload에 포함하지 않는 정보:

- 전화번호
- 이메일
- 카카오톡 ID
- 고객 메시지 전문
- 내부 메모

Webhook 실패는 고객 응답 접수를 실패시키지 않습니다.

## 테스트와 품질 확인

```bash
pnpm lint
pnpm test
pnpm build
```

견적 엔진 확인:

1. `pnpm quote-rules:seed` 실행
2. `/admin/quote-calculator` 접속
3. 박스 종류, 수량, 사이즈, 인쇄, 후가공 입력
4. 참고용 개당/총 예상 범위와 disclaimer 확인
5. 공개 문의 폼에서도 내부 룰 정보가 보이지 않는지 확인

리드 견적 스냅샷 확인:

1. 공개 문의 폼에서 테스트 문의 접수
2. `/admin/leads`에서 해당 리드 상세 진입
3. “참고 견적 정보” 섹션 확인
4. CSV export에 견적 스냅샷 필드가 포함되는지 확인
5. 테스트 문의 삭제

제작 사례 유입 추적 확인:

1. 공개 제작 사례 상세에서 “비슷한 패키지 견적 문의하기” 클릭
2. 견적 폼 상단의 제작 사례 유입 안내 확인
3. 문의 제출 후 관리자 리드 상세에서 “연결 제작 사례” 확인
4. `/admin/analytics` 제작 사례 성과 테이블 확인

견적안 workflow 확인:

1. `/admin/leads`에서 테스트 리드 상세로 이동
2. “견적안 작성” 클릭
3. 항목 수량과 단가 입력 후 임시저장 또는 발송준비로 저장
4. 견적안 상세에서 공급가, 부가세, 합계 확인
5. 프린트 보기에서 출력 화면 확인
6. 상태를 `발송완료`로 변경하면 리드가 `견적완료`로 바뀌는지 확인
7. 상태를 `수락`으로 변경하면 리드가 `주문확정`으로 바뀌고 내부 주문 금액이 저장되는지 확인

견적 보정 확인:

1. 리드에 저장된 참고 견적 스냅샷이 있는 상태에서 견적안을 생성
2. `/admin/quote-calibration` 접속
3. 예상 범위 내/초과/미만 비교 상태 확인
4. 박스 종류별, 수량 구간별 보정 현황 확인

견적안 공유/고객 응답 확인:

1. `/admin/quote-proposals/[id]`에서 공유 링크 생성
2. 생성 직후 표시되는 `/q/[token]` URL 복사
3. 비로그인 브라우저에서 공유 URL 접속
4. 전화번호, 이메일, 카카오톡 ID, 내부 메모가 보이지 않는지 확인
5. 고객 응답으로 수락/거절/수정 요청 중 하나 제출
6. 관리자 견적안 상세에서 “고객 응답”과 “활동 내역” 확인
7. 수락 응답인 경우 관련 Lead가 `주문확정`으로 갱신되는지 확인
8. 공유 링크 폐기 후 같은 URL이 견적 상세를 보여주지 않는지 확인
9. `/robots.txt`에 `/q` disallow가 있는지 확인
10. `/sitemap.xml`에 `/q` 링크가 없는지 확인

## Phase 6 견적안 수정안과 상담 이력

Phase 6에서는 고객의 수정 요청 이후 관리자가 기존 견적안을 덮어쓰지 않고 새 수정안을 만들 수 있도록 revision workflow를 추가했습니다.

중요 운영 원칙:

> 수정안 생성은 기존 견적안을 덮어쓰지 않고 새 견적안을 생성합니다.

> 이전 견적안은 기록 보존을 위해 삭제하지 말고 대체 상태로 관리합니다.

> 상담 이력에는 개인정보와 민감한 고객 요청이 포함될 수 있으므로 관리자 화면에서만 노출합니다.

### 새 데이터 필드와 모델

`QuoteProposal` revision 필드:

- `revisionGroupId`
- `revisionNumber`
- `parentProposalId`
- `supersededByProposalId`
- `isLatestRevision`
- `revisionReason`
- `revisedFromCustomerResponseId`
- `supersededAt`

새 상태:

- `SUPERSEDED`: 대체됨

새 모델:

- `LeadCommunicationLog`: 리드별 전화, 카카오톡, 이메일, 미팅, 내부 메모 상담 이력

상담 채널:

- `PHONE`
- `KAKAO`
- `EMAIL`
- `SMS`
- `MEETING`
- `INTERNAL`
- `OTHER`

상담 방향:

- `INBOUND`
- `OUTBOUND`
- `INTERNAL`

### 수정안 workflow

1. 고객이 공유 견적안에서 `수정 요청`을 남깁니다.
2. 관리자 견적안 상세 화면에 `고객이 수정 요청을 남겼습니다. 수정 견적안을 작성해 주세요.` 안내가 표시됩니다.
3. 관리자가 `수정안 만들기`를 클릭합니다.
4. `/admin/quote-proposals/[id]/revisions/new`에서 수정 사유를 확인하고 수정안 작성을 시작합니다.
5. 새 `QuoteProposal`이 생성되고 기존 line item이 복제됩니다.
6. 이전 견적안은 `SUPERSEDED` 상태와 `isLatestRevision=false`로 표시됩니다.
7. 이전 견적안의 활성 공유 링크는 폐기됩니다.
8. 새 수정안은 `/admin/quote-proposals/[newId]/edit`에서 관리자가 검토한 뒤 별도로 공유 링크를 생성합니다.

수정 번호 규칙:

- 첫 견적안은 `1차`
- 수정안은 같은 `revisionGroupId`를 유지하면서 `2차`, `3차`로 증가
- `parentProposalId`는 바로 이전 견적안을 가리킴
- `supersededByProposalId`는 이전 견적안이 어떤 새 견적안으로 대체됐는지 기록

### 비교 화면

수정안 상세에서 `이전 견적안 비교`를 클릭하면 `/admin/quote-proposals/[id]/compare`에서 다음 정보를 비교합니다.

- 이전 견적안 번호
- 현재 견적안 번호
- 이전/현재 합계
- 차이 금액
- 차이율
- 항목 추가/삭제
- 수량 변경
- 단가 변경
- 금액 변경
- 사양 요약, 제작 메모, 납기, 결제 조건, 고객 안내 문구 변경

### 리드 상담 이력

리드 상세 `/admin/leads/[id]`에는 `상담 이력` 섹션이 추가됩니다.

기록 항목:

- 상담 채널
- 방향
- 요약
- 상세 내용
- 상담 일시
- 다음 연락 예정일

상담 이력에 `nextFollowUpAt`이 있으면 리드의 다음 연락 예정일이 비어 있거나 더 늦은 날짜일 때 자동으로 갱신됩니다.

### 새 API

- `GET /api/admin/quote-proposals/[id]/revisions`
- `POST /api/admin/quote-proposals/[id]/revisions`
- `GET /api/admin/leads/[id]/communications`
- `POST /api/admin/leads/[id]/communications`
- `PATCH /api/admin/lead-communications/[id]`
- `DELETE /api/admin/lead-communications/[id]`

모든 API는 관리자 인증을 요구합니다. mutation route는 기존 Origin/Referer 검사를 따릅니다.

### Phase 6 테스트 방법

수정안 생성 확인:

1. 리드에서 견적안을 생성합니다.
2. 견적안 상세에서 공유 링크를 생성하고 `/q/[token]`으로 접속합니다.
3. 고객 응답에서 `수정 요청`을 제출합니다.
4. 관리자 견적안 상세에서 수정 요청 안내와 `수정안 만들기` 버튼을 확인합니다.
5. 수정안을 생성하면 새 견적안 편집 화면으로 이동하는지 확인합니다.
6. 기존 견적안이 `대체됨` 상태가 되고 최신 수정안이 아닌 것으로 표시되는지 확인합니다.
7. 기존 공유 링크가 더 이상 견적 상세를 보여주지 않는지 확인합니다.

비교 화면 확인:

1. 수정안 상세에서 `이전 견적안 비교`를 클릭합니다.
2. 항목 수량, 단가, 금액, 사양 문구 변경이 표시되는지 확인합니다.

상담 이력 확인:

1. `/admin/leads/[id]`에서 상담 채널, 방향, 요약, 상세 내용, 다음 연락 예정일을 입력합니다.
2. 상담 이력이 최신순으로 표시되는지 확인합니다.
3. 다음 연락 예정일이 리드의 후속 연락 예정일에 반영되는지 확인합니다.
4. 상담 이력 삭제 후 목록에서 사라지는지 확인합니다.

마이그레이션:

```bash
pnpm db:migrate
```

## Phase 7 세일즈 운영 업무 관리

Phase 7에서는 리드 상담, 견적안, 고객 수정 요청, 공유 링크 만료를 관리자가 하루 단위로 확인할 수 있도록 세일즈 운영 레이어를 추가했습니다. 외부 메시지 발송은 하지 않으며, 모든 알림과 업무는 관리자 화면에서만 확인하는 내부 운영 기능입니다.

### SalesTask 모델

`SalesTask`는 관리자 전용 수동 업무 모델입니다.

- `leadId`: 연결 리드
- `quoteProposalId`: 연결 견적안
- `title`, `description`: 업무 제목과 설명
- `type`: FOLLOW_UP, QUOTE_PREP, REVISION_REVIEW, QUOTE_SHARE, CUSTOMER_RESPONSE, SHARE_LINK_EXPIRY, GENERAL
- `priority`: LOW, NORMAL, HIGH, URGENT
- `status`: TODO, IN_PROGRESS, DONE, CANCELLED
- `dueAt`: 처리 기한
- `completedAt`, `cancelledAt`: 완료/취소 일시
- `assignedTo`: 담당자 메모용 문자열
- `sourceType`, `sourceId`: 자동 후보 업무의 중복 생성을 막기 위한 출처 키

업무 데이터는 공개 페이지에 노출되지 않으며 `/admin/*` 화면과 관리자 API에서만 사용됩니다.

### 오늘 할 일 대시보드

관리자 페이지:

```text
/admin/today
```

표시 항목:

- 오늘 처리할 업무
- 기한 지난 업무
- 신규 문의
- 후속 연락 필요 리드
- 고객 수정 요청
- 견적안 발송 준비
- 발송 후 응답 확인이 필요한 견적안
- 곧 만료되는 공유 링크

후속 연락 필요 기준:

- `Lead.nextFollowUpAt`이 오늘 또는 이전인 리드
- 종료 또는 주문확정 상태는 기본적으로 제외

견적안 액션 큐:

- `READY_TO_SEND` 상태인데 활성 공유 링크가 없는 견적안
- 최근 수정된 `DRAFT` 견적안
- `SENT` 후 3일 이상 고객 응답이 없는 견적안

고객 수정 요청 큐:

- 최신 고객 응답이 `REVISION_REQUESTED`이고 더 최신 수정안이 없는 견적안

공유 링크 만료 큐:

- 활성 공유 링크 중 2일 이내 만료 예정인 링크
- 이미 수락/거절/취소/대체된 견적안은 제외

### 업무 관리

관리자 페이지:

```text
/admin/tasks
/admin/tasks/new
/admin/tasks/[id]/edit
```

지원 기능:

- 업무 검색
- 상태, 유형, 우선순위, 기한 상태 필터
- 기한 빠른순, 우선순위순, 최신순 정렬
- 업무 생성
- 업무 수정
- 완료 처리
- 취소 처리
- 삭제

상태 변경 규칙:

- `DONE`으로 변경하면 `completedAt`이 비어 있을 때 현재 시각을 저장합니다.
- `CANCELLED`로 변경하면 `cancelledAt`이 비어 있을 때 현재 시각을 저장합니다.

### 리드/견적안 연결 업무

리드 상세:

```text
/admin/leads/[id]
```

추가된 기능:

- 연결 업무 목록 표시
- 후속 연락 업무 만들기
- 상담 이력 inline 수정
- 전체 활동 타임라인 표시

견적안 상세:

```text
/admin/quote-proposals/[id]
```

추가된 기능:

- 연결 업무 목록 표시
- 고객 확인 업무 만들기
- 수정 요청 검토 업무 만들기

### 전체 활동 타임라인

리드 상세의 전체 활동 타임라인은 다음 정보를 합쳐 최신순으로 보여줍니다.

- 문의 접수
- 상담 이력
- 견적안 작성/상태 변경
- 공유 링크 생성/조회/폐기
- 고객 응답
- 업무 생성/완료/취소

상담 이력과 업무 정보는 개인정보 또는 민감한 상담 맥락을 포함할 수 있으므로 관리자 화면에서만 노출합니다.

### API

관리자 전용 API:

```text
GET    /api/admin/tasks
POST   /api/admin/tasks
GET    /api/admin/tasks/[id]
PATCH  /api/admin/tasks/[id]
DELETE /api/admin/tasks/[id]
```

모든 업무 API는 관리자 인증을 요구하며, mutation 요청은 기존 Origin/Referer 검증 흐름을 따릅니다.

### Phase 7 마이그레이션

```bash
pnpm db:migrate
```

생성된 마이그레이션 예:

```text
add_sales_tasks
```

### Phase 7 테스트 방법

1. `/admin/today`에 접속해 오늘 할 일 요약과 액션 큐가 표시되는지 확인합니다.
2. `/admin/tasks/new`에서 업무를 생성합니다.
3. `/admin/tasks`에서 검색/필터/정렬이 동작하는지 확인합니다.
4. 업무를 완료 처리하고 `completedAt`이 저장되는지 확인합니다.
5. 리드 상세에서 후속 연락 업무를 만들고 연결 업무에 표시되는지 확인합니다.
6. 견적안 상세에서 고객 확인 업무 또는 수정 요청 검토 업무를 만들고 연결 업무에 표시되는지 확인합니다.
7. 상담 이력을 수정하고 리드 상세의 상담 이력과 전체 활동 타임라인에 반영되는지 확인합니다.

주의:

> 업무 알림은 외부 발송이 아니라 관리자 화면에서 확인하는 내부 알림입니다.

> 후속 연락 일정은 고객에게 자동 메시지를 보내지 않습니다. 관리자가 직접 연락해야 합니다.

> 업무, 상담 이력, 견적 활동 데이터는 관리자 전용 정보이며 공개 페이지에 노출하지 않습니다.

## Vercel 배포 환경 변수 설정

Vercel 빌드에서 다음 오류가 나면 Vercel Project Environment Variables에 `DATABASE_URL`이 빠진 상태입니다.

```text
Error: Environment variable not found: DATABASE_URL.
schema.prisma:7
url = env("DATABASE_URL")
```

이 프로젝트의 build script는 `prisma generate && next build`이므로, Vercel 빌드 단계에서도 `DATABASE_URL`이 반드시 필요합니다.

### Dashboard에서 설정하는 방법

1. Vercel Dashboard에서 `perpackage-marketing-leads` 프로젝트를 엽니다.
2. `Settings`로 이동합니다.
3. `Environment Variables`로 이동합니다.
4. 아래 변수를 추가합니다.
5. `Production`과 `Preview` 환경에 모두 저장합니다.
6. 실패한 Deployment에서 `Redeploy`를 실행합니다.

임시 Preview/build 테스트용 최소 변수:

```env
DATABASE_URL="file:/var/task/prisma/preview.db?mode=ro"
ADMIN_PASSWORD="관리자 로그인 비밀번호"
NEXT_PUBLIC_SITE_URL="https://perpackage-marketing-leads-iaj8xg6ly-peerl.vercel.app"
NEXT_PUBLIC_KAKAO_CHANNEL_URL=""

SITE_ACCESS_ENABLED="true"
SITE_ACCESS_PASSWORD="사이트 전체 접근 비밀번호"
SITE_ACCESS_SECRET="충분히 긴 랜덤 문자열"

LEAD_NOTIFICATION_WEBHOOK_URL=""
QUOTE_RESPONSE_WEBHOOK_URL=""
```

역할 구분:

- `SITE_ACCESS_PASSWORD`는 앱 전체 비공개 테스트 접근용입니다.
- `ADMIN_PASSWORD`는 `/admin/login` 관리자 로그인용입니다.
- 두 비밀번호는 서로 다르게 설정해야 합니다.
- `SITE_ACCESS_SECRET`은 로그인 비밀번호가 아니라 site access cookie 서명용 secret입니다.
- `SITE_ACCESS_ENABLED=true`이면 고객도 접근 비밀번호 없이는 견적 문의 form과 견적 공유 링크를 볼 수 없습니다.

주의:

> `DATABASE_URL="file:/var/task/prisma/preview.db?mode=ro"`는 임시 Vercel Preview/build 테스트용입니다. 배포에 포함된 빈 SQLite DB를 읽기 전용으로 여는 값이므로 실제 문의 저장 테스트나 운영 저장에는 적합하지 않습니다. 실제 고객 문의를 운영 저장하기 전에는 PostgreSQL 전환을 검토해야 합니다.

자세한 체크리스트:

```text
docs/vercel-deployment-checklist.md
```

## Vercel 비공개 테스트 배포

Vercel Preview Deployment에서 외부 노출 없이 owner만 확인하려면 전체 사이트 접근 gate를 켭니다. 이 기능은 기존 `/admin/login`과 별개입니다.

1. GitHub와 Vercel을 연결한 뒤 Production 공개 전에 Preview Deployment로 먼저 테스트합니다.
2. Vercel Project Settings → Environment Variables에 아래 값을 설정합니다.

```env
SITE_ACCESS_ENABLED="true"
SITE_ACCESS_PASSWORD="실제 테스트 접근 비밀번호"
SITE_ACCESS_SECRET="충분히 긴 랜덤 문자열"
ADMIN_PASSWORD="실제 관리자 비밀번호"
NEXT_PUBLIC_SITE_URL="Vercel Preview 또는 배포 URL"
NEXT_PUBLIC_KAKAO_CHANNEL_URL="실제 카카오톡 채널 URL"
DATABASE_URL="운영/테스트 DB URL"
```

운영 기준:

- `SITE_ACCESS_PASSWORD`는 앱 전체 접근용입니다.
- `ADMIN_PASSWORD`는 `/admin/login` 관리자 로그인용입니다.
- 두 비밀번호는 서로 다르게 설정하세요.
- `SITE_ACCESS_SECRET`은 cookie 서명용 secret입니다. 운영/Preview에서는 충분히 긴 랜덤 문자열을 설정하세요.
- 개발 환경에서 `SITE_ACCESS_SECRET`이 비어 있으면 fallback으로 동작할 수 있지만, 배포 환경에서는 반드시 설정하는 것을 권장합니다.
- Preview URL을 외부에 공유하지 마세요.
- `/q/[token]` 견적 공유 링크도 private mode에서는 site access password가 있어야 볼 수 있습니다.
- 운영 공개 전 `SITE_ACCESS_ENABLED`를 `false`로 바꾸거나, 공개 범위를 의도적으로 결정하세요.

주의:

> `SITE_ACCESS_ENABLED=true` 상태에서는 고객도 사이트 접근 비밀번호 없이는 견적 문의폼과 견적 공유 링크를 볼 수 없습니다. 실제 고객에게 공개하기 전에는 설정을 반드시 확인하세요.

> SQLite는 Vercel 운영 저장소로 적합하지 않을 수 있으므로 실제 운영 전 PostgreSQL 전환을 검토하세요.

private mode 동작:

- 일반 페이지 요청은 `/access?next=...`로 이동합니다.
- API 요청은 `{ "error": "접근 권한이 필요합니다." }`와 함께 401을 반환합니다.
- `/access`, `/api/site-access/login`, `/api/site-access/logout`, `/_next/*`, 정적 asset은 gate에서 제외됩니다.
- `/api/health`는 배포 상태 확인을 위해 민감정보 없이 최소 상태만 반환합니다.
- `/admin/*`은 site access 통과 후에도 기존 `ADMIN_PASSWORD` 로그인이 필요합니다.
- `robots.txt`는 전체 차단으로 바뀝니다.
- `sitemap.xml`은 private content를 노출하지 않도록 빈 목록을 반환합니다.

로컬 테스트 예시:

```env
SITE_ACCESS_ENABLED="true"
SITE_ACCESS_PASSWORD="preview-password"
SITE_ACCESS_SECRET="local-random-secret"
```

확인 순서:

1. `/` 접속 시 `/access?next=/`로 이동하는지 확인
2. 잘못된 비밀번호 입력 시 `비밀번호가 올바르지 않습니다.`가 표시되는지 확인
3. 올바른 비밀번호 입력 후 원래 경로로 이동하는지 확인
4. `/admin/login`은 site access 통과 후에도 관리자 로그인을 요구하는지 확인
5. private mode에서 `/api/leads` 같은 API가 cookie 없이 401을 반환하는지 확인
6. private mode에서 `/q/[token]`도 `/access`를 먼저 요구하는지 확인
7. `/robots.txt`가 `Disallow: /`를 반환하는지 확인
8. `/sitemap.xml`이 portfolio나 quote share URL을 노출하지 않는지 확인

## Phase 8 배포 준비 및 운영 안전장치

Phase 8은 기능 확장이 아니라 Vercel 배포, DB 전략, 백업, 보안, 운영 점검을 정리한 단계입니다.

추가된 운영 도구:

- `/api/health`: 배포 상태 확인용 최소 health check
- `pnpm deployment:check`: 필수 환경변수 누락 여부 확인
- `/admin/checklist`: Vercel 배포, DB/백업, 보안, 운영 전 테스트 항목 보강
- `docs/postgresql-migration-plan.md`: PostgreSQL 전환 계획
- `docs/backup-and-restore.md`: 백업/복구 운영 가이드
- `docs/security-checklist.md`: 보안 체크리스트

### `/api/health`

배포 후 아래 URL로 최소 상태를 확인할 수 있습니다.

```text
https://your-domain.com/api/health
```

응답 예시:

```json
{
  "ok": true,
  "app": "PerPackage Marketing Lead Management System",
  "timestamp": "2026-06-20T12:00:00.000Z",
  "database": "configured",
  "siteAccess": "enabled"
}
```

이 응답은 `DATABASE_URL` 값, 비밀번호, 고객 데이터, DB row count를 노출하지 않습니다.

### 배포 환경변수 검사

로컬 또는 Vercel 환경에서 다음 명령으로 필수 환경변수를 확인할 수 있습니다.

```bash
pnpm deployment:check
```

검사 항목:

- `DATABASE_URL`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_SITE_URL`
- `SITE_ACCESS_ENABLED`
- `SITE_ACCESS_ENABLED=true`일 때 `SITE_ACCESS_PASSWORD`, `SITE_ACCESS_SECRET`

검사 결과는 누락된 변수명과 경고만 출력하며 실제 secret 값은 출력하지 않습니다.

### Vercel 환경변수 기준

필수/권장 변수:

```env
DATABASE_URL="file:/var/task/prisma/preview.db?mode=ro"
ADMIN_PASSWORD="관리자 로그인 비밀번호"
NEXT_PUBLIC_SITE_URL="https://perpackage-marketing-leads.vercel.app"
NEXT_PUBLIC_KAKAO_CHANNEL_URL=""
LEAD_NOTIFICATION_WEBHOOK_URL=""
QUOTE_RESPONSE_WEBHOOK_URL=""
SITE_ACCESS_ENABLED="true"
SITE_ACCESS_PASSWORD="사이트 전체 접근 비밀번호"
SITE_ACCESS_SECRET="충분히 긴 랜덤 문자열"
```

`DATABASE_URL`이 없으면 Vercel build에서 아래 오류가 발생합니다.

```text
Environment variable not found: DATABASE_URL
```

해결 순서:

1. Vercel Project Settings로 이동합니다.
2. Environment Variables에서 `DATABASE_URL`을 추가합니다.
3. 임시 private preview는 현재 프로젝트 기준 `DATABASE_URL="file:/var/task/prisma/preview.db?mode=ro"`를 사용합니다.
4. 나머지 필수 환경변수를 추가합니다.
5. Production/Preview scope를 확인합니다.
6. Redeploy를 실행합니다.

주의:

> SQLite preview DB는 private preview와 화면 확인용입니다. 실제 고객 문의 저장이나 운영 CRM DB로 사용하지 마세요.

### Vercel 프로젝트 설정

이 프로젝트를 Vercel Git 연동으로 배포할 때는 Root Directory를 다음 폴더로 맞춥니다.

```text
perpackage-marketing-leads
```

권장 설정:

```text
Install Command: pnpm install
Build Command: pnpm run build
Output Directory: Next.js 기본값
```

별도 `vercel.json`은 현재 필수는 아닙니다. Next.js 자동 감지와 `package.json` script로 충분합니다.

### PostgreSQL 전환 계획

실제 운영 전에는 PostgreSQL 전환을 권장합니다. 이 Phase에서는 provider를 바꾸지 않고 계획 문서만 추가했습니다.

상세 문서:

```text
docs/postgresql-migration-plan.md
```

요약:

- 별도 브랜치에서 전환
- 관리형 PostgreSQL 준비
- Prisma provider를 `postgresql`로 변경
- migration 생성
- 로컬/Preview 검증
- 백업 후 Production 승격

### 백업 및 보안 문서

운영 전 반드시 아래 문서를 확인합니다.

```text
docs/backup-and-restore.md
docs/security-checklist.md
docs/vercel-deployment-checklist.md
```

중요 원칙:

- 실제 고객 DB는 Git에 올리지 않습니다.
- Preview DB에는 실제 고객 데이터를 넣지 않습니다.
- `/q/[token]`은 noindex/nofollow와 sitemap 제외를 유지합니다.
- 고객-facing 페이지에는 phone, email, kakaoId, internalMemo, 내부 견적 룰을 노출하지 않습니다.

## 운영 전 체크리스트

- `ADMIN_PASSWORD` 실제 값 설정
- Preview 배포 시 `SITE_ACCESS_ENABLED=true` 설정 여부 확인
- `SITE_ACCESS_PASSWORD`와 `ADMIN_PASSWORD`를 서로 다르게 설정
- `SITE_ACCESS_SECRET`을 충분히 긴 랜덤 문자열로 설정
- 실제 고객 공개 전 `SITE_ACCESS_ENABLED` 공개 정책 확인
- `NEXT_PUBLIC_SITE_URL` 실제 배포 URL 설정
- `NEXT_PUBLIC_KAKAO_CHANNEL_URL` 실제 카카오톡 채널 URL 설정
- 운영 DB 결정
- 백업 정책 결정
- 개인정보 처리방침 내용 확인
- 문의 알림 채널 결정
- 관리자 접근 URL 관리
- 테스트 문의 접수 후 삭제 확인
- 마케팅 비용 수동 입력 기준 결정
- 광고 캠페인 UTM 네이밍 기준 결정
- 제작 사례 공개 승인 확인
- 기본 견적 룰 placeholder 단가 검토
- 공개 견적 미리보기가 확정 견적처럼 보이지 않는지 확인
- 견적안 프린트 화면 disclaimer 확인
- 견적안 상태 변경 시 리드 전환 필드가 의도대로 갱신되는지 확인
- 견적 룰 변경 이력과 변경 사유 기록 확인
- 견적 보정 대시보드가 자동 룰 변경이 아닌 참고 지표로만 운영되는지 확인
- 견적안 공유 링크가 외부에 공개되지 않도록 운영 방식 확인
- 고객 공유 페이지에서 연락처, 이메일, 카카오톡 ID, 내부 메모가 노출되지 않는지 확인
- 고객 수락이 결제나 전자계약처럼 보이지 않는지 확인
- `QUOTE_RESPONSE_WEBHOOK_URL` 사용 여부 결정
- 고객 수정 요청 후 새 수정안이 기존 견적안을 덮어쓰지 않고 생성되는지 확인
- 대체된 견적안의 기존 공유 링크가 폐기되는지 확인
- 상담 이력이 관리자 화면에서만 노출되는지 확인
- 상담 이력의 다음 연락 예정일이 리드 후속 연락 workflow와 맞는지 확인

## 남은 제한 사항

- 제작 사례 대표 이미지 업로드는 구현되어 있으며, 고객 파일/도안 파일 업로드는 아직 구현하지 않았습니다.
- 외부 광고 API 연동은 구현하지 않았습니다.
- KakaoTalk API 연동은 구현하지 않았습니다.
- 결제는 구현하지 않았습니다.
- 자동 견적 결과는 확정 견적이 아닙니다.
- 견적안은 자동 발송되지 않으며 관리자가 별도 채널로 직접 안내해야 합니다.
- 고객 견적안 공유 링크는 제한 링크이며, 별도 로그인이나 본인 인증은 구현하지 않았습니다.
- 고객 수락은 결제나 전자계약이 아닙니다.
- 수정 견적안은 자동 발송되지 않으며 관리자가 검토 후 새 공유 링크를 직접 전달해야 합니다.
- 상담 이력은 내부 운영 기록이며 고객-facing 화면에는 노출하지 않습니다.
- 견적 응답 webhook은 선택 기능이며, 실패해도 고객 응답 접수는 유지됩니다.
- 견적 보정 대시보드는 룰 조정 후보를 보여주는 참고 도구이며 자동으로 단가 룰을 변경하지 않습니다.
- 전체 ERP, 재고 관리, 생산 관리 기능은 구현하지 않았습니다.
- 운영 DB는 Supabase Postgres 기준으로 전환 중이며, 기존 SQLite 데이터가 있으면 별도 이관 절차가 필요합니다.

## Supabase Postgres + Naver Object Storage 운영 전환

현재 운영 전환 기준:

- Vercel Pro: Next.js 앱, 관리자 페이지, API Route, Middleware, 환경변수 관리
- Supabase Postgres: Prisma 운영 DB
- Naver Object Storage: 제작 사례 이미지와 향후 고객 업로드 파일의 원본 저장소

Prisma datasource는 PostgreSQL 기준이다.

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

필수 환경변수:

```env
DATABASE_URL=""
DIRECT_URL=""
ADMIN_PASSWORD=""
NEXT_PUBLIC_SITE_URL=""
SITE_ACCESS_ENABLED="false"
```

`SITE_ACCESS_ENABLED="true"`일 때 추가 필수:

```env
SITE_ACCESS_PASSWORD=""
SITE_ACCESS_SECRET=""
```

제작 사례 이미지 업로드를 네이버 Object Storage로 운영할 때 필요한 환경변수:

```env
PORTFOLIO_STORAGE_PROVIDER="naver-object-storage"
NAVER_OBJECT_STORAGE_ACCESS_KEY=""
NAVER_OBJECT_STORAGE_SECRET_KEY=""
NAVER_OBJECT_STORAGE_BUCKET=""
NAVER_OBJECT_STORAGE_ENDPOINT="https://kr.object.ncloudstorage.com"
NAVER_OBJECT_STORAGE_REGION="kr-standard"
NAVER_OBJECT_STORAGE_PUBLIC_BASE_URL=""
```

fallback provider:

- `local`: 로컬 개발 또는 임시 테스트용
- `vercel-blob`: 기존 Vercel Blob fallback
- `naver-object-storage`: 운영용 네이버 Object Storage

PostgreSQL migration:

- 기존 SQLite migration은 `prisma/migrations_sqlite_archive`에 보존한다.
- 새 운영 DB에는 `prisma/migrations/20260625000000_init_postgres_baseline`을 기준으로 적용한다.
- 기존 SQLite 데이터는 자동 이전되지 않으므로 필요한 경우 별도 export/import 절차를 수행한다.

새 Vercel Preview 배포 전 확인:

```bash
pnpm install
pnpm deployment:check
pnpm test
pnpm build
```

운영 테스트 체크리스트:

- Supabase Postgres 연결 확인
- 관리자 로그인 확인
- 문의 저장 API 확인
- 관리자 리드 목록 확인
- 제작 사례 등록 확인
- 제작 사례 대표 이미지 업로드 확인
- Naver Object Storage에 `portfolio/...webp`, `portfolio/...-thumb.webp` 저장 확인
- 기존 `local` 또는 `vercel-blob` fallback 필요 여부 확인
