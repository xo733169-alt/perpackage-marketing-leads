# PerPackage Marketing Lead Management System - GPT Handoff

## 목적

이 파일은 다음 GPT/Codex 세션에 현재 프로젝트 상태와 최근 완료된 “패키지 구조 선택형 문의폼 / 제작 준비 체크리스트” Phase 11 작업 내용을 전달하기 위한 handoff 문서다.

프로젝트명: PerPackage Marketing Lead Management System  
회사: 페르패키지  
업무 영역: 맞춤 패키지 제작 문의, 리드 CRM, 제작 사례, 관리자 운영 시스템  
기술 스택: Next.js App Router, TypeScript, Tailwind CSS, Prisma, SQLite, Zod, Vitest

---

## 현재 완료 범위

“패키지 구조 선택형 문의폼 / 제작 준비 체크리스트” Phase 1~11까지 완료되어 있다.

### Phase 1~10 요약

이미 완료된 주요 기능:

- Lead 모델에 패키지 제작 문의 필드 추가
- 문의 생성 API에서 패키지 제작 정보 저장
- 고객 문의폼에 패키지 종류, 구조, 수량, 사이즈, 제작 준비 체크리스트 추가
- readinessScore 계산 및 저장
- 관리자 리드 상세 화면에 패키지 제작 정보와 제작 준비도 표시
- 관리자 리드 목록에 패키지 종류, 수량, 급건, 상담 준비도 표시
- 관리자 리드 목록 필터 보강
- CSV export에 패키지 문의 필드 포함
- 외부 AI API 없이 규칙 기반 관리자용 상담 요약 helper 추가
- 관리자 리드 상세에서 자동 상담 정리 표시
- 관리자가 상담 요약을 직접 수정, 저장, 초기화할 수 있는 수동 상담 요약 기능 추가
- 제작 사례 필터 기능 보강
  - 패키지 종류
  - 업종/제품군
  - 패키지 구조
  - 제작 목적
- 제작 사례 필터 query parameter 적용
- 관리자 제작 사례 등록/수정 폼에 패키지 구조/제작 목적 필드 추가

중요:

- 외부 AI API는 연동하지 않았다.
- 고객-facing 페이지에는 관리자 상담 요약을 노출하지 않는다.
- 가격 계산, 결제, 세금계산서, 입출금, 전자계약 기능은 추가하지 않았다.
- 고객 문의폼 파일 업로드는 아직 구현하지 않았다.
- 기존 CRM, 견적 룰, 견적안, 영업 업무 기능은 유지되어 있다.

---

## 최근 완료 작업: Phase 11

Phase 11 목표:

관리자가 제작 사례 등록/수정 시 대표 이미지를 직접 업로드할 수 있게 했다.

이번 Phase는 파일 업로드 기능 1단계이며, 범위는 관리자 제작 사례 대표 이미지 업로드로 제한했다.

구현 방향:

- 기존 `PortfolioCase.mainImageUrl` 필드를 재사용했다.
- 새 DB 필드는 추가하지 않았다.
- 별도 관리자 업로드 API를 만들었다.
- 업로드된 이미지는 로컬 `public/uploads/portfolio` 폴더에 저장한다.
- DB에는 접근 가능한 public path를 저장한다.
- 기존 대표 이미지 URL 직접 입력 방식은 유지했다.
- 업로드만으로 DB가 바로 바뀌지 않고, 제작 사례 저장 버튼을 눌러야 최종 반영된다.

---

## Phase 11에서 수정/추가한 파일

```txt
.gitignore
public/uploads/portfolio/.gitkeep
src/lib/upload-utils.ts
src/app/api/admin/uploads/portfolio/route.ts
src/components/PortfolioCaseForm.tsx
src/test/upload-utils.test.ts
src/test/portfolio-schema.test.ts
```

---

## DB 변경 여부

DB 변경 없음.

기존 `PortfolioCase` 모델에 이미 대표 이미지 URL 필드가 있었다.

```prisma
mainImageUrl String?
```

따라서 새 migration은 생성하지 않았다.

Migration:

```txt
없음
```

---

## 재사용한 이미지 필드

대표 이미지 저장 필드:

```txt
PortfolioCase.mainImageUrl
```

업로드 성공 시 폼의 `mainImageUrl` 값이 아래와 같은 public path로 채워진다.

```txt
/uploads/portfolio/portfolio-20260621-uuid.webp
```

기존 외부 URL 입력도 계속 가능하다.

예:

```txt
https://example.com/image.jpg
```

---

## 업로드 API

파일:

```txt
src/app/api/admin/uploads/portfolio/route.ts
```

API 경로:

```txt
POST /api/admin/uploads/portfolio
```

요청 형식:

```txt
multipart/form-data
field name: file
```

성공 응답 예시:

```json
{
  "url": "/uploads/portfolio/portfolio-20260621-uuid.webp"
}
```

실패 응답 예시:

```json
{
  "message": "JPG, PNG, WebP 이미지만 업로드할 수 있습니다."
}
```

보안 처리:

- 관리자 인증 확인
- mutation origin/referer 검사
- 파일 크기 제한
- MIME type 제한
- 원본 확장자 제한
- 원본 파일명을 저장 파일명으로 사용하지 않음
- UUID 기반 안전한 파일명 생성
- 저장 경로 traversal 방지
- 업로드 폴더가 없으면 생성
- 실패 시 한국어 에러 반환

---

## 업로드 허용 파일 조건

허용:

```txt
JPEG: image/jpeg, .jpg, .jpeg
PNG: image/png, .png
WebP: image/webp, .webp
```

최대 파일 크기:

```txt
5MB
```

금지:

```txt
SVG
PDF
AI
DXF
ZIP
기타 이미지가 아닌 파일
```

---

## 저장 경로와 public URL 규칙

저장 디렉터리:

```txt
public/uploads/portfolio
```

public URL prefix:

```txt
/uploads/portfolio
```

파일명 규칙:

```txt
portfolio-YYYYMMDD-uuid.ext
```

예:

```txt
portfolio-20260621-5f2e8d8d-....webp
portfolio-20260621-5f2e8d8d-....png
portfolio-20260621-5f2e8d8d-....jpg
```

원본 파일명은 사용하지 않는다.

---

## Git 업로드 파일 보호

실제 업로드 이미지가 Git에 올라가지 않도록 `.gitignore`에 추가했다.

```gitignore
public/uploads/portfolio/*
!public/uploads/portfolio/.gitkeep
```

폴더 구조 유지를 위해 아래 파일만 추가했다.

```txt
public/uploads/portfolio/.gitkeep
```

---

## 업로드 helper

파일:

```txt
src/lib/upload-utils.ts
```

추가된 상수:

```ts
PORTFOLIO_UPLOAD_DIR
PORTFOLIO_UPLOAD_PUBLIC_PATH
MAX_PORTFOLIO_IMAGE_SIZE_BYTES
```

추가된 helper:

```ts
isAllowedPortfolioImageMimeType(mimeType)
getPortfolioImageExtension(mimeType)
hasAllowedPortfolioImageExtension(filename, mimeType)
createSafePortfolioImageFilename(mimeType, id?, date?)
buildPortfolioImagePublicUrl(filename)
getPortfolioImageValidationError(file)
```

역할:

- 허용 MIME type 판정
- MIME type 기반 저장 확장자 결정
- 원본 확장자와 MIME type 일치 여부 확인
- 안전한 파일명 생성
- public URL 생성
- 업로드 전 검증 에러 메시지 생성

---

## 관리자 제작 사례 폼 변경

파일:

```txt
src/components/PortfolioCaseForm.tsx
```

이미지 섹션에 추가된 UI:

- 현재 대표 이미지 미리보기
- 대표 이미지 업로드 input
- 업로드 중 상태 문구
- 업로드 성공 문구
- 업로드 실패 문구
- 기존 대표 이미지 URL 직접 입력 필드 유지

문구:

```txt
대표 이미지 업로드
JPG, PNG, WebP 파일을 업로드할 수 있습니다. 최대 5MB까지 지원합니다.
업로드만으로 제작 사례가 저장되지는 않습니다. 업로드 완료 후 하단 저장 버튼을 눌러 주세요.
업로드 완료. 제작 사례 저장 버튼을 눌러야 대표 이미지가 최종 반영됩니다.
```

흐름:

1. 관리자가 이미지 파일을 선택한다.
2. `/api/admin/uploads/portfolio`로 업로드한다.
3. 성공하면 반환된 URL을 `mainImageUrl` 폼 값에 넣는다.
4. 관리자가 기존 저장 버튼을 눌러야 DB에 최종 저장된다.

---

## 고객-facing 화면 영향

기존 고객-facing 제작 사례 목록/상세 화면은 이미 `mainImageUrl`을 사용하고 있었다.

관련 파일:

```txt
src/app/page.tsx
src/app/portfolio/page.tsx
src/app/portfolio/[slug]/page.tsx
src/components/PortfolioCaseImage.tsx
```

따라서 업로드된 URL이 `mainImageUrl`에 저장되면 기존 이미지 표시 방식으로 자동 노출된다.

주의:

- 고객-facing 페이지에 관리자 내부 메모나 상담 요약은 노출하지 않는다.
- 이미지가 없으면 기존 placeholder UI가 유지된다.
- alt 문구는 기존 `mainImageAlt` 또는 제작 사례 제목 기반 fallback을 사용한다.

---

## validation 변경

파일:

```txt
src/lib/portfolio-schema.ts
src/test/portfolio-schema.test.ts
```

기존 `mainImageUrl`은 `optionalText(1000)`로 처리되어 있었다.

이번 테스트에서 아래 두 형식이 모두 통과함을 확인했다.

```txt
/uploads/portfolio/example.webp
https://example.com/image.webp
```

빈 문자열도 optional 처리된다.

---

## 테스트 변경

추가 파일:

```txt
src/test/upload-utils.test.ts
```

보강 파일:

```txt
src/test/portfolio-schema.test.ts
```

테스트한 내용:

- 허용 MIME type 판정
- 비허용 MIME type 거부
- MIME type별 확장자 매핑
- 원본 파일 확장자 검증
- 안전한 파일명 생성
- 원본 한글/공백/특수문자 파일명을 저장 파일명에 쓰지 않는지 확인
- public upload URL 생성
- path traversal 거부
- 5MB 초과 파일 에러
- SVG/PDF류 거부
- `/uploads/portfolio/...` 경로를 schema가 허용하는지 확인
- 기존 외부 이미지 URL을 schema가 계속 허용하는지 확인
- 빈 이미지 URL optional 처리 확인

---

## 실행한 검증 명령어와 결과

### type check

```powershell
tsc --noEmit
```

결과:

```txt
통과
```

### lint

```powershell
next lint
```

결과:

```txt
통과
No ESLint warnings or errors
```

### test

```powershell
vitest run
```

결과:

```txt
33 test files passed
135 tests passed
```

### Prisma migration status

```powershell
DATABASE_URL=file:./dev.db prisma migrate status
```

결과:

```txt
13 migrations found
Database schema is up to date!
```

### build

```powershell
DATABASE_URL=file:./dev.db prisma generate
next build
```

결과:

```txt
통과
Compiled successfully
42 pages generated
신규 route 포함: /api/admin/uploads/portfolio
```

---

## 발견한 오류와 해결 내용

테스트 중 `createSafePortfolioImageFilename()`의 기본값 `crypto.randomUUID()` 때문에 TypeScript가 id 파라미터를 UUID template literal 타입으로 좁게 추론했다.

문제:

```txt
테스트에서 임의 문자열을 id로 넣으면 타입 오류 발생
```

해결:

```ts
id: string = crypto.randomUUID()
```

로 명시해서 실제 사용과 테스트 모두 일반 문자열을 받을 수 있게 했다.

---

## 현재 로컬 업로드 방식의 운영 한계

이번 Phase의 저장 방식은 로컬 개발/내부 테스트용이다.

```txt
public/uploads/portfolio
```

주의:

- Vercel 서버리스 환경에서는 이 폴더가 영구 저장소가 아니다.
- 배포 후 런타임에 저장한 파일이 유지되지 않을 수 있다.
- 실제 운영 전에는 외부 스토리지 전환이 필요하다.

권장 운영 전환 후보:

- Vercel Blob
- S3 호환 스토리지
- Cloudflare R2
- 별도 파일 서버

이번 Phase에서는 외부 스토리지를 연동하지 않았다.

---

## 다음 GPT가 이어서 볼 주요 파일

우선 확인:

```txt
src/lib/upload-utils.ts
src/app/api/admin/uploads/portfolio/route.ts
src/components/PortfolioCaseForm.tsx
src/test/upload-utils.test.ts
src/test/portfolio-schema.test.ts
```

필요 시 확인:

```txt
prisma/schema.prisma
src/lib/portfolio-schema.ts
src/components/PortfolioCaseImage.tsx
src/app/portfolio/page.tsx
src/app/portfolio/[slug]/page.tsx
.gitignore
```

---

## 다음 단계 제안

현실적인 우선순위:

1. 운영용 외부 스토리지 전환 설계
   - Vercel Blob/S3/R2 중 선택
   - 기존 `/uploads/portfolio/...` 경로와의 호환 전략 필요

2. 이미지 리사이즈/압축 도구
   - 업로드 시 WebP 변환
   - 썸네일 생성
   - 원본/리사이즈본 관리

3. 고객 문의 첨부파일 업로드
   - 고객 제품 사진, 참고 이미지, 디자인 파일 등
   - 단, 개인정보/대용량 파일/보안 정책이 먼저 필요

4. 채널톡/이메일 연동
   - 문의 접수 및 견적안 응답 알림
   - 자동 발송 정책은 별도 확인 필요

5. 도면/전개도 생성기
   - CRM/제작 사례 기능과 분리된 별도 대형 Phase로 설계 필요

---

## 다음 작업 시 유지해야 할 운영 규칙

- 기존 CRM, 리드, 견적 룰, 견적안, 영업 업무 기능을 삭제하거나 재작성하지 말 것.
- 고객-facing UI 문구는 한국어로 유지할 것.
- 관리자 상담 요약은 고객-facing 페이지에 노출하지 말 것.
- 외부 AI API, OpenAI API, ChatGPT API를 임의로 연동하지 말 것.
- 가격 계산, 결제, 세금계산서, 입출금, 전자계약 기능은 별도 요청 전까지 추가하지 말 것.
- 고객 문의폼 파일 업로드는 별도 Phase에서 다룰 것.
- PDF, AI, SVG, DXF, ZIP 업로드는 이번 대표 이미지 흐름에 섞지 말 것.
- 실제 고객 데이터나 업로드 파일을 Git에 올리지 말 것.
- 기존 테스트를 삭제해서 통과시키지 말 것.

