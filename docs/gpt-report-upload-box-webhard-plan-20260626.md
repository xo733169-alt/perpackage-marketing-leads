# GPT 보고용: 페르패키지 인쇄파일 업로드 허브 다음 방향 정리

작성일: 2026-06-26  
프로젝트: `perpackage-marketing-leads`  
관련 기존 보고서:

- `reports/2026-06-26-customer-file-upload-gpt-report.md`
- `docs/gpt-report-customer-file-upload-qa-20260626.md`

## 1. 현재 결론

기존 “주문번호 기반 인쇄파일 업로드 허브”를 다음 단계에서 **업로드 전용 웹하드형 구조**로 확장하는 방향이 더 실무적이다.

고객에게 Naver Object Storage 권한을 직접 주는 방식이 아니라, 우리 서비스가 고객별 업로드 링크와 PUT 전용 signed URL을 발급한다.

핵심 권한:

```txt
고객: 파일/폴더 업로드만 가능
고객: 삭제, 이동, 이름 변경, 다른 고객 폴더 접근 불가
관리자: 목록 확인, 다운로드, 검수, 수정 요청, 상태 변경 가능
```

## 2. 입력 항목 방향 변경

주문번호는 필수에서 선택으로 낮추는 방향을 권장한다.

필수:

```txt
업체명 또는 고객명
담당자명
연락처
파일 업로드
개인정보 동의
```

선택:

```txt
주문번호
이메일
상품명
요청사항
```

제외:

```txt
카카오톡 아이디
```

카카오톡 아이디 제외 이유:

- 고객이 본인 카카오톡 ID를 모르는 경우가 많다.
- 입력해도 실무 연락으로 바로 이어지지 않을 수 있다.
- 개인정보 입력 항목이 늘어나면 업로드 이탈이 생길 수 있다.
- 연락처와 이메일, 요청사항만으로 운영 대응이 충분하다.

주의:

- DB에 이미 `kakaoId`가 들어간 상태라면 바로 schema/migration에서 삭제하지 않는다.
- 고객 화면에서만 제거하고, API/DB optional 필드는 일단 유지하는 편이 안전하다.

## 3. 추천 운영 흐름

### 1단계: 관리자 생성형 업로드 박스

관리자가 고객별 업로드 박스를 만든다.

입력:

```txt
업체명 또는 고객명
담당자명
연락처
이메일
주문번호
상품명
업로드 박스 이름
만료일
최대 용량
관리자 메모
```

생성 결과:

```txt
/upload/box/{token}
```

이 링크를 고객에게 문자, 이메일, Cafe24 주문 안내, 채널톡 등으로 전달한다.

### 2단계: 고객 업로드 전용 화면

경로:

```txt
/upload/box/[token]
```

고객 화면:

```txt
업로드 박스 안내
업체명/담당자명 일부 표시
파일 선택
폴더 선택 또는 여러 파일 선택
요청사항
개인정보 동의
업로드하기
```

고객에게 제공하지 않는 기능:

```txt
삭제
이동
이름 변경
다른 고객 파일 보기
스토리지 direct URL 보기
관리자 URL 보기
```

### 3단계: 관리자 확인 화면

목록:

```txt
/admin/upload-boxes
```

컬럼:

```txt
업로드 박스명
업체명/고객명
담당자명
연락처
주문번호
파일 수
최근 업로드 시간
만료일
검수 상태
상세 보기
```

상세:

```txt
/admin/upload-boxes/[id]
```

표시:

```txt
업체명/고객명
담당자명
연락처
이메일
주문번호
상품명
요청사항
파일명
폴더 경로
용량
확장자
MIME type
업로드 시간
다운로드
검수 상태
수정 요청 메모
관리자 메모
검수 로그
```

## 4. DB 설계 권장안

기존 `UploadProject`, `UploadedFile`, `FileReviewLog`를 재사용할 수도 있지만, 웹하드형 구조는 별도 `UploadBox` 개념을 두는 편이 더 명확하다.

권장 모델:

```txt
UploadBox
- id
- tokenHash
- tokenPreview
- title
- companyName
- customerName
- contactName
- phone
- email
- cafe24OrderNumber
- productName
- requestMemo
- status
- reviewStatus
- expiresAt
- maxTotalSizeBytes
- privacyAgreed
- adminMemo
- createdAt
- updatedAt
```

```txt
UploadBoxFile
- id
- uploadBoxId
- originalFilename
- storedFilename
- folderPath
- storageBucket
- storageKey
- fileSize
- fileType
- fileExtension
- version
- uploadStatus
- reviewStatus
- uploadedAt
- createdAt
- updatedAt
```

```txt
UploadBoxReviewLog
- id
- uploadBoxId
- fileId
- status
- message
- createdBy
- createdAt
```

대안:

- 1차 구현 속도를 우선하면 기존 `UploadProject`에 `uploadBoxTokenHash`, `uploadExpiresAt`, `maxTotalSizeBytes` 등을 추가해 확장할 수 있다.
- 다만 장기적으로는 주문번호 기반 프로젝트와 웹하드형 업로드 박스 책임이 섞일 수 있으므로 별도 모델이 더 안전하다.

## 5. Storage 설계

운영 저장소:

```txt
Naver Object Storage
```

local QA:

```txt
PRINT_FILE_STORAGE_PROVIDER=local
UPLOAD_LOCAL_STORAGE_SECRET=긴_임시_문자열
```

저장 key 예시:

```txt
upload-boxes/{uploadBoxId}/{safeFolderPath}/{safeFilename}
```

또는 기존 prefix와 통일:

```txt
print-files/upload-boxes/{uploadBoxId}/{safeFolderPath}/{safeFilename}
```

권장:

```txt
print-files/upload-boxes/{uploadBoxId}/{safeFolderPath}/{safeFilename}
```

이유:

- 기존 `print-files` prefix와 맞다.
- 포트폴리오 이미지와 분리된다.
- 인쇄파일 전용 영역임이 명확하다.

## 6. API 설계 권장안

관리자:

```txt
POST /api/admin/upload-boxes
GET /api/admin/upload-boxes
GET /api/admin/upload-boxes/[id]
PATCH /api/admin/upload-boxes/[id]
PATCH /api/admin/upload-boxes/[id]/status
POST /api/admin/upload-boxes/[id]/review-log
GET /api/admin/upload-boxes/[id]/files/[fileId]/download
```

고객:

```txt
GET /api/upload-boxes/[token]
POST /api/upload-boxes/[token]/files
POST /api/upload-boxes/[token]/files/complete
```

또는 현재 prepare/complete 패턴 유지:

```txt
POST /api/upload-boxes/[token]/files
intent=prepare

POST /api/upload-boxes/[token]/files
intent=complete
```

중요:

- 고객용 삭제 API를 만들지 않는다.
- 고객용 이동 API를 만들지 않는다.
- 고객용 이름 변경 API를 만들지 않는다.
- 고객에게는 PUT 전용 signed URL만 준다.
- 다운로드는 관리자 인증 API를 통해서만 제공한다.

## 7. 파일/폴더 업로드 정책

허용 확장자:

```txt
pdf
ai
eps
svg
dxf
psd
zip
jpg
jpeg
png
```

차단:

```txt
html
htm
js
mjs
cjs
exe
bat
cmd
sh
php
jar
msi
scr
ps1
```

검증:

```txt
확장자 검사
MIME type 검사
확장자/MIME mismatch 차단
파일 용량 제한
전체 용량 제한
path traversal 방지
파일명 sanitize
폴더 경로 sanitize
```

폴더 업로드:

- Chrome/Edge에서는 `webkitdirectory` 기반 폴더 업로드 가능
- Safari/모바일은 제한 가능
- 1차에서는 “여러 파일 업로드”를 기본으로 두고, 폴더 업로드는 지원 가능한 브라우저에서만 제공하는 편이 안전하다.

## 8. 고객 화면 문구 방향

고객 안내:

```txt
인쇄파일을 업로드해 주세요.
담당자가 파일을 확인한 뒤 필요한 경우 수정 요청을 안내드립니다.
제작 진행 여부와 일정은 파일 확인 후 안내됩니다.
대용량 파일은 ZIP으로 압축해 업로드해 주세요.
```

금지 표현:

```txt
바로 제작
자동 제작 확정
파일 업로드 즉시 제작
결제 완료 즉시 인쇄
확정 견적
당일 제작 가능
무조건 제작 가능
인쇄 포함 확정가
```

## 9. Cafe24 연결 순서

Cafe24는 마지막에 붙인다.

1차:

```txt
관리자가 업로드 박스 생성
고객에게 /upload/box/{token} 링크 전달
```

2차:

```txt
Cafe24 주문 완료 화면에 /upload 안내 링크 삽입
```

3차:

```txt
Cafe24 주문번호를 query로 전달 가능하면 /upload?order=주문번호
```

4차:

```txt
Cafe24 주문 API로 주문번호 검증
```

5차:

```txt
Cafe24 Webhook으로 주문 생성 시 업로드 박스 자동 생성
```

이번 다음 작업에서는 Cafe24 API, OAuth, Webhook을 구현하지 않는다.

## 10. 현재 QA 기준 남은 선행 조건

직전 QA 결과:

- `pnpm test`: 177개 테스트 통과
- `pnpm build`: 통과
- `/upload`, `/upload/success`: 390px overflow 없음
- 위험 파일 차단 확인
- MIME mismatch 차단 확인
- local signed PUT/GET 확인

막힌 부분:

- 현재 로컬 `.env.local`의 `DATABASE_URL`이 SQLite 형식이다.
- Prisma schema는 PostgreSQL 기준이라 실제 업로드 DB 저장이 실패한다.
- `DIRECT_URL`도 필요하다.

따라서 실제 업로드 왕복 QA 전 선행 조건:

```txt
Supabase/PostgreSQL DATABASE_URL 설정
Supabase/PostgreSQL DIRECT_URL 설정
Prisma migration 적용
```

## 11. 다음 GPT에게 줄 구현 지시

다음 작업 목표:

```txt
기존 주문번호 기반 업로드 허브를 업로드 전용 웹하드형 “업로드 박스” 구조로 확장한다.
고객은 전용 링크에서 파일/폴더 업로드만 할 수 있고, 삭제/이동/이름 변경 권한은 없다.
주문번호는 선택 입력으로 낮추고, 카카오톡 아이디는 고객 화면에서 제거한다.
```

구현 범위:

```txt
1. 현재 DB 상태 확인
2. UploadBox 구조 설계
3. 관리자 업로드 박스 생성 페이지/API
4. 고객 /upload/box/[token] 업로드 화면
5. 업로드 전용 signed PUT 흐름
6. 관리자 업로드 박스 목록/상세
7. 관리자 다운로드/상태 변경/검수 메모
8. 고객 화면에서 카카오톡 아이디 제거
9. 주문번호 optional 처리
10. 보고서 작성
```

구현하지 말 것:

```txt
Cafe24 API
Cafe24 OAuth
Cafe24 Webhook
실시간 채팅
WebSocket
Supabase Realtime
결제
세금계산서
전자계약
전개도 에디터
자동 인쇄용 PDF 생성
고객 삭제/이동/이름 변경 API
```

검증:

```txt
pnpm test
pnpm exec tsc --noEmit
pnpm build
/upload/box/[token] 390px overflow 확인
업로드 only 권한 확인
위험 파일 차단 확인
MIME mismatch 확인
관리자 인증 없는 다운로드 차단 확인
local provider 업로드 왕복 확인
```

## 12. 최종 권장 순서

```txt
1. DB를 PostgreSQL/Supabase 기준으로 맞춘다.
2. 기존 주문번호 업로드 MVP의 실제 왕복 QA를 끝낸다.
3. 업로드 박스 모델을 추가한다.
4. 관리자 생성형 업로드 박스를 만든다.
5. 고객 전용 /upload/box/[token] 화면을 만든다.
6. local provider로 업로드 only 권한을 검증한다.
7. Naver Object Storage로 전환한다.
8. Cafe24에는 단순 링크부터 붙인다.
9. 이후 주문번호 자동 입력, API 검증, Webhook 순서로 확장한다.
```
