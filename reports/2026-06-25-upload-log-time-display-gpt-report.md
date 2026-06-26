# GPT 보고용: 인쇄파일 업로드 허브 로그 시간 표시 작업 정리

작성일: 2026-06-26  
프로젝트: `perpackage-marketing-leads`  
관련 상세 보고서: `reports/2026-06-25-upload-log-time-display-report.md`

## 1. 작업 요약

페르패키지 주문번호 기반 인쇄파일 업로드 허브의 관리자 상세 화면에 파일 업로드 시간, 검수 로그 작성 시간, 수정 요청 메시지 작성 시간, 상태 변경 이력 시간을 표시하도록 정리했다.

이번 작업은 실시간 채팅 구현이 아니다. 기존 `FileReviewLog`, `UploadedFile.uploadedAt`, `UploadProject.createdAt` 구조를 유지하고, 화면 표시와 로그 작성 흐름만 보강했다.

## 2. 수정한 파일

```txt
src/lib/admin-uploads.ts
src/app/admin/uploads/[id]/page.tsx
src/app/api/admin/uploads/[id]/status/route.ts
src/app/api/admin/uploads/[id]/review-log/route.ts
src/test/print-file-upload.test.ts
reports/2026-06-25-upload-log-time-display-report.md
reports/2026-06-25-upload-log-time-display-gpt-report.md
```

## 3. 핵심 변경 내용

### 시간 포맷 유틸

`src/lib/admin-uploads.ts`에 한국 시간 기준 포맷 유틸을 추가했다.

표시 기준:

```txt
오늘 15:32
어제 18:10
2026.06.25 15:32
```

기준 시간대:

```txt
Asia/Seoul
```

DB 저장값은 기존 Prisma `DateTime` 흐름을 유지한다. 화면 표시 시점에만 한국 시간으로 변환한다.

### 관리자 업로드 상세 화면

`src/app/admin/uploads/[id]/page.tsx`에 시간 표시를 보강했다.

추가/정리된 표시:

```txt
버전 1
오늘 15:32

업로드: 오늘 15:32

수정 요청 · 오늘 15:32
담당자 · 버전 1 original.ai
```

검수 로그 작성자가 `admin`이면 화면에는 `담당자`로 표시한다.

### 상태 변경 로그

`PATCH /api/admin/uploads/[id]/status`에서 상태 변경 시 `FileReviewLog`를 생성하고 `createdAt`을 명시적으로 저장하도록 정리했다.

상태 변경 로그 메시지 예:

```txt
검수 상태가 수정 요청으로 변경되었습니다.
```

### 수정 요청/검수 메모 로그

`POST /api/admin/uploads/[id]/review-log`에서 수정 요청 또는 검수 메모 저장 시 `FileReviewLog.createdAt`을 명시적으로 저장하도록 정리했다.

## 4. DB 변경 여부

DB schema 변경 없음.  
새 migration 없음.

이미 존재하던 필드를 사용했다.

```txt
FileReviewLog.createdAt
UploadedFile.uploadedAt
UploadProject.createdAt
```

## 5. 테스트 추가

`src/test/print-file-upload.test.ts`에 아래 테스트를 추가했다.

- `Asia/Seoul` 기준 `오늘/어제/YYYY.MM.DD` 포맷 확인
- `admin` 작성자가 `담당자`로 표시되는지 확인

## 6. 검증 상태

실행 시도:

```txt
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

결과:

```txt
pnpm: command not found
```

현재 Codex 셸에서 `pnpm`, `node`, `corepack`이 PATH에 없어 테스트/타입체크/빌드는 실행하지 못했다.

대신 확인한 항목:

- `git diff --check` 통과
- 고객 업로드 화면에 `TODO`, `placeholder`, `미구현` 문구 추가 없음 확인
- 관련 코드에서 시간 표시/로그 생성 위치 확인
- DB schema와 migration을 건드리지 않았음

## 7. 아직 수동 확인이 필요한 항목

실행 가능한 로컬 또는 배포 환경에서 확인 필요:

```txt
/admin/uploads/[id] 정상 로드
파일 업로드 시간 표시
검수 로그 시간 표시
수정 요청 메시지 시간 표시
상태 변경 후 검수 기록 시간 생성
모바일 390px 가로 overflow 없음
브라우저 콘솔 오류 없음
기존 업로드 기능 유지
기존 관리자 인증 흐름 유지
```

## 8. 이번에 만들지 않은 것

이번 작업에서는 아래 기능을 만들지 않았다.

```txt
실시간 채팅
WebSocket
Supabase Realtime
폴링 메시지 UI
upload_messages 테이블
고객 메시지 작성 UI
관리자 답변 UI
읽음 여부
메시지 알림
```

## 9. 추후 확장 계획

채팅 기능을 붙일 경우 `FileReviewLog`를 대화 테이블로 확장하지 말고, 별도 `upload_messages` 테이블을 추가하는 방향이 적합하다.

후보 구조:

```txt
upload_messages
- id
- project_id
- file_id
- sender_type
- sender_name
- message
- read_at
- created_at
```

추후 검토:

- 고객 메시지
- 관리자 답변
- 읽음 여부
- 첨부파일 연결
- 상태 변경 로그와 메시지 분리
- Supabase Realtime 또는 단순 폴링 비교
- 관리자 미확인 메시지 카운트

## 10. 다음 GPT에게 남기는 메모

1. 이 작업은 표시/로그 시간 보강 작업이다. DB 구조를 새로 바꾸지 않았다.
2. `formatDateTime`은 서버 컴포넌트에서 호출되며, `now` 주입 테스트가 가능하게 만들어져 있다.
3. 상태 변경과 검수 메모 저장은 모두 `FileReviewLog.createdAt`을 남긴다.
4. 실제 브라우저 검증은 `pnpm/node` PATH 문제 때문에 아직 못 했다.
5. 다음 단계는 실행 가능한 환경에서 `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm build`를 돌리고 `/admin/uploads/[id]`를 직접 확인하는 것이다.

