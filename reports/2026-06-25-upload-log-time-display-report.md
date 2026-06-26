# 페르패키지 인쇄파일 업로드 허브 로그 시간 표시 작업 보고서

작성일: 2026-06-26  
대상 프로젝트: `perpackage-marketing-leads`

## 1. 작업 목적

주문번호 기반 인쇄파일 업로드 허브에서 관리자가 파일 업로드 시각, 검수 로그 작성 시각, 수정 요청 메시지 작성 시각, 상태 변경 이력을 더 쉽게 확인할 수 있도록 시간 표시를 정리했다.

이번 작업에서는 실시간 채팅, WebSocket, Supabase Realtime, 폴링 메시지 기능은 만들지 않았다.

## 2. 수정한 파일

```txt
src/lib/admin-uploads.ts
src/app/admin/uploads/[id]/page.tsx
src/app/api/admin/uploads/[id]/status/route.ts
src/app/api/admin/uploads/[id]/review-log/route.ts
src/test/print-file-upload.test.ts
reports/2026-06-25-upload-log-time-display-report.md
```

## 3. 시간 표시를 추가한 영역

관리자 업로드 상세 페이지:

- 주문 및 고객 정보의 접수일
- 업로드 파일 목록의 버전/업로드 시간
- 업로드 파일 목록의 업로드 일시 컬럼
- 검수 기록의 상태별 작성 시간
- 수정 요청 및 검수 메모 로그의 작성자/대상 파일 정보

상태 변경 API:

- `PATCH /api/admin/uploads/[id]/status`에서 상태 변경 시 `FileReviewLog`를 생성하고 `createdAt`을 명시적으로 저장한다.

검수 메모 API:

- `POST /api/admin/uploads/[id]/review-log`에서 수정 요청 또는 검수 메모 저장 시 `FileReviewLog.createdAt`을 명시적으로 저장한다.

## 4. 시간 포맷 기준

화면 표시 포맷은 한국 시간(`Asia/Seoul`) 기준이다.

```txt
오늘 15:32
어제 18:10
2026.06.25 15:32
```

`src/lib/admin-uploads.ts`의 `formatDateTime`에서 처리한다.

## 5. DB 저장 시간과 화면 표시 시간 기준

- DB 저장값은 기존 Prisma `DateTime` 흐름을 유지한다.
- `FileReviewLog.createdAt`은 `Date` 객체로 저장되며, DB/Prisma의 UTC 기반 저장 흐름을 바꾸지 않았다.
- `UploadedFile.uploadedAt`도 기존 저장 구조를 유지한다.
- 화면 표시 시점에만 `Asia/Seoul` 기준으로 변환한다.
- 시간 포맷 함수는 `now`를 주입할 수 있게 만들어 테스트와 서버 렌더링에서 날짜 기준을 안정적으로 다룰 수 있게 했다.

## 6. 실시간 채팅을 이번에 만들지 않은 이유

이번 목표는 기존 검수 로그와 업로드 기록에 시간을 표시하는 1차 개선이다.

실시간 채팅은 별도 데이터 모델, 고객 인증/식별, 읽음 처리, 파일 첨부 연결, 관리자 알림, 메시지 보존 정책이 필요하다. 기존 업로드/검수 기능을 깨지 않으려면 현재 `FileReviewLog`와 분리해서 설계하는 편이 안전하다.

## 7. 추후 채팅 확장 계획

추후 확장 후보:

- `upload_messages` 테이블 추가
- 고객 메시지 저장
- 관리자 답변 저장
- 메시지 읽음 여부 저장
- 메시지와 업로드 파일 또는 검수 파일 연결
- 작성 시간 표시
- 상태 변경 로그와 고객/관리자 메시지 분리
- Supabase Realtime 방식 검토
- 단순 폴링 방식 검토
- 고객별 주문번호 기반 메시지 접근 권한 검토
- 관리자 알림 및 미확인 메시지 카운트 추가

권장 방향:

1. `FileReviewLog`는 상태 변경/검수 이력 전용으로 유지한다.
2. 고객과 관리자의 대화는 별도 `upload_messages` 테이블로 분리한다.
3. 메시지 실시간성은 운영 안정화 후 Supabase Realtime 또는 폴링 중 하나를 비교한다.

## 8. 검증 결과

코드 기준 확인:

- `FileReviewLog.createdAt` 필드가 Prisma schema에 이미 존재한다.
- `UploadedFile.uploadedAt` 필드가 Prisma schema에 이미 존재한다.
- 관리자 상세 페이지는 `reviewLogs`를 `createdAt desc`로 조회한다.
- 상태 변경 API는 상태 변경 시 `FileReviewLog`를 생성한다.
- 검수 메모 API는 수정 요청/검수 메모 저장 시 `FileReviewLog`를 생성한다.
- 고객 화면에는 TODO, placeholder, 미구현 문구를 추가하지 않았다.
- DB schema 변경과 migration 생성은 하지 않았다.

추가한 테스트:

- 한국 시간 기준 `오늘/어제/YYYY.MM.DD` 포맷 테스트
- `admin` 작성자를 `담당자`로 표시하는 테스트

명령 실행 시도:

```txt
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

결과:

```txt
pnpm: command not found
```

현재 Codex 셸에서 `pnpm`, `node`, `corepack`이 PATH에 없어 테스트/타입체크/빌드를 실행하지 못했다. 실행 가능한 로컬 또는 CI 환경에서는 위 명령 재실행을 권장한다.

남은 수동 확인:

- `/admin/uploads/[id]` 정상 로드
- 파일 업로드 시간이 `업로드: 오늘 15:32` 또는 날짜 형식으로 표시되는지 확인
- 검수 로그 시간이 표시되는지 확인
- 수정 요청 메시지 시간이 표시되는지 확인
- 상태 변경 후 검수 기록에 시간이 남는지 확인
- 모바일 390px에서 가로 overflow 없음 확인
- 브라우저 콘솔 오류 없음 확인
- 기존 업로드 기능과 관리자 인증 흐름 유지 확인
