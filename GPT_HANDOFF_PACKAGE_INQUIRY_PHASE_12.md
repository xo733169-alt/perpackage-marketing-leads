# PerPackage Marketing Lead Management System - GPT Handoff

## 목적

이 파일은 다음 GPT/Codex 세션에 현재 프로젝트 상태와 최근 완료된 “패키지 구조 선택형 문의폼 / 제작 준비 체크리스트” Phase 12 작업 내용을 전달하기 위한 handoff 문서다.

프로젝트명: PerPackage Marketing Lead Management System  
회사: 페르패키지  
업무 영역: 맞춤 패키지 제작 문의, 리드 CRM, 제작 사례, 견적안, 관리자 영업 운영 시스템  
기술 스택: Next.js App Router, TypeScript, Tailwind CSS, Prisma, SQLite, Zod, Vitest

---

## 현재 완료 범위

“패키지 구조 선택형 문의폼 / 제작 준비 체크리스트” Phase 1~12까지 완료되어 있다.

Phase 1~11에서 완료된 주요 기능:

- Lead 모델에 패키지 제작 문의 필드 추가
- 문의 생성 API가 패키지 제작 정보를 저장
- 고객 문의폼에 패키지 종류, 구조, 수량, 사이즈, 제작 준비 체크리스트 추가
- readinessScore 계산 및 저장
- 관리자 리드 상세/목록에서 패키지 제작 정보 표시
- CSV export에 패키지 문의 필드 포함
- 외부 AI API 없이 규칙 기반 관리자 상담 요약 helper 추가
- 관리자 수동 상담 요약 저장/수정/초기화 기능 추가
- 제작 사례 필터 기능 보강
- 관리자 제작 사례 대표 이미지 업로드 기능 추가
- 대표 이미지 업로드 경로:
  - API: `POST /api/admin/uploads/portfolio`
  - 저장 위치: `public/uploads/portfolio`
  - DB 저장 필드: `PortfolioCase.mainImageUrl`

Phase 12에서 완료된 기능:

- 관리자 제작 사례 대표 이미지 업로드 시 WebP 리사이즈/압축 적용
- 대표 이미지 최대 1600px 제한
- 썸네일 이미지 최대 600px 생성
- 업로드 API 응답에 이미지 최적화 메타데이터 추가
- 관리자 제작 사례 폼에서 원본 용량, 최적화 후 용량, 이미지 크기, 저장 포맷 표시
- 기존 `mainImageUrl` 저장 흐름 유지
- DB schema 변경 없음

---

## 중요한 운영 규칙

다음 GPT/Codex는 아래 규칙을 유지해야 한다.

- 기존 CRM, 리드, 견적 룰, 견적안, 영업 업무 기능을 삭제하거나 재작성하지 말 것.
- 기존 포트폴리오/제작 사례 기능을 대규모로 갈아엎지 말 것.
- 고객-facing UI 문구는 한국어를 유지할 것.
- 관리자 상담 요약은 고객-facing 페이지에 노출하지 말 것.
- 외부 AI API, OpenAI API, ChatGPT API를 임의로 연동하지 말 것.
- 가격 계산, 결제, 세금계산서, 입출금, 전자계약 기능을 추가하지 말 것.
- 전개도 생성기, 3D 에디터는 별도 요청 전까지 추가하지 말 것.
- 고객 문의폼 파일 업로드는 Phase 12 범위가 아니었고 아직 구현하지 않았다.
- PDF, AI, SVG, DXF, ZIP 업로드를 대표 이미지 업로드 흐름에 섞지 말 것.
- 외부 스토리지 연동은 아직 하지 않았다.
- 실제 고객 데이터나 업로드 파일을 Git에 올리지 말 것.

---

## Phase 12 작업 요약

Phase 12 목표는 관리자 제작 사례 대표 이미지를 업로드할 때 웹 표시용으로 자동 최적화하는 것이었다.

기존 Phase 11 흐름:

1. 관리자 제작 사례 등록/수정 폼에서 대표 이미지 선택
2. `POST /api/admin/uploads/portfolio`로 업로드
3. `public/uploads/portfolio`에 원본 파일 저장
4. API가 `{ url }` 반환
5. 폼의 `mainImageUrl`에 URL 반영
6. 관리자가 제작 사례 저장 버튼을 눌러야 DB에 최종 저장

Phase 12 변경 후 흐름:

1. 관리자 제작 사례 등록/수정 폼에서 JPG, PNG, WebP 대표 이미지 선택
2. 업로드 API에서 기존 인증, Origin 검사, 파일 검증 수행
3. 파일 buffer를 읽음
4. `sharp`로 이미지 메타데이터 확인
5. 대표 이미지를 WebP로 리사이즈/압축
6. 썸네일도 WebP로 생성
7. `public/uploads/portfolio`에 최적화된 파일 저장
8. API가 `url`, `thumbnailUrl`, `width`, `height`, `format`, 용량 정보를 반환
9. 폼의 `mainImageUrl`에는 대표 이미지 `url`만 반영
10. 관리자 화면에 최적화 결과 표시
11. 제작 사례 저장 버튼을 눌러야 DB에 최종 저장

---

## Dependency 변경

이미지 리사이즈/압축을 위해 `sharp`를 추가했다.

수정 파일:

```txt
package.json
pnpm-lock.yaml
```

추가 dependency:

```json
"sharp": "^0.35.2"
```

---

## DB 변경 여부

DB 변경 없음.

Prisma migration 생성 없음.

기존 필드를 그대로 사용한다.

```prisma
mainImageUrl String?
```

썸네일 파일은 생성하지만, 현재 DB에는 썸네일 URL을 저장하지 않는다. 고객-facing 화면도 기존처럼 `mainImageUrl`만 사용한다.

---

## 수정/추가한 주요 파일

```txt
package.json
pnpm-lock.yaml
src/lib/upload-utils.ts
src/lib/portfolio-image-optimizer.ts
src/app/api/admin/uploads/portfolio/route.ts
src/components/PortfolioCaseForm.tsx
src/test/upload-utils.test.ts
src/test/portfolio-image-optimizer.test.ts
```

---

## 새 helper 파일

### `src/lib/portfolio-image-optimizer.ts`

새로 추가한 이미지 최적화 전용 helper 파일이다.

주요 export:

```ts
export type OptimizedPortfolioImage
export class PortfolioImageOptimizationError extends Error
export async function optimizePortfolioImage(buffer: Buffer): Promise<OptimizedPortfolioImage>
```

동작:

- `sharp(buffer, { failOn: "error" }).metadata()`로 이미지가 읽히는지 확인
- 대표 이미지를 최대 1600 × 1600px 안에 들어오도록 리사이즈
- WebP quality 82로 변환
- 썸네일을 최대 600 × 600px 안에 들어오도록 리사이즈
- WebP quality 78로 변환
- EXIF 회전을 반영하기 위해 `.rotate()` 사용
- 깨진 이미지나 읽을 수 없는 buffer는 `PortfolioImageOptimizationError`로 처리

---

## `src/lib/upload-utils.ts` 변경 내용

추가된 상수:

```ts
export const PORTFOLIO_MAIN_IMAGE_MAX_WIDTH = 1600;
export const PORTFOLIO_MAIN_IMAGE_MAX_HEIGHT = 1600;
export const PORTFOLIO_MAIN_IMAGE_WEBP_QUALITY = 82;

export const PORTFOLIO_THUMBNAIL_MAX_WIDTH = 600;
export const PORTFOLIO_THUMBNAIL_MAX_HEIGHT = 600;
export const PORTFOLIO_THUMBNAIL_WEBP_QUALITY = 78;
```

추가된 타입:

```ts
export type PortfolioImageUploadResponse = {
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  format?: string;
  originalSizeBytes?: number;
  optimizedSizeBytes?: number;
};
```

추가된 helper:

```ts
export function createPortfolioOptimizedImageFilename(id?: string, date?: Date): string;
export function createPortfolioThumbnailFilename(baseFilename: string): string;
```

파일명 규칙:

```txt
portfolio-YYYYMMDD-uuid.webp
portfolio-YYYYMMDD-uuid-thumb.webp
```

기존 helper도 유지:

```ts
createSafePortfolioImageFilename()
buildPortfolioImagePublicUrl()
getPortfolioImageValidationError()
```

---

## 업로드 API 변경 내용

파일:

```txt
src/app/api/admin/uploads/portfolio/route.ts
```

API:

```txt
POST /api/admin/uploads/portfolio
```

유지된 동작:

- 관리자 인증 필요
- mutation Origin 검사 유지
- multipart/form-data의 `file` 필드 사용
- 허용 파일: JPG, PNG, WebP
- 최대 파일 크기: 5MB
- SVG, PDF, AI, DXF, ZIP 등은 허용하지 않음
- traversal 방지
- 업로드 폴더 없으면 생성

변경된 동작:

- 원본 파일을 그대로 저장하지 않음
- 업로드 buffer를 `sharp`로 WebP 변환
- 대표 이미지와 썸네일을 저장
- 변환 실패 시 원본 저장으로 조용히 fallback하지 않음
- 실패 이유를 관리자에게 한국어 에러로 반환

성공 응답 예:

```json
{
  "url": "/uploads/portfolio/portfolio-20260621-uuid.webp",
  "thumbnailUrl": "/uploads/portfolio/portfolio-20260621-uuid-thumb.webp",
  "width": 1600,
  "height": 1200,
  "format": "webp",
  "originalSizeBytes": 3456789,
  "optimizedSizeBytes": 456789
}
```

기존 프론트는 `url`만 사용해도 계속 동작한다.

---

## 관리자 폼 변경 내용

파일:

```txt
src/components/PortfolioCaseForm.tsx
```

변경 내용:

- `PortfolioImageUploadResponse` 타입을 사용
- 업로드 성공 시 `mainImageUrl`에 `data.url` 반영
- `thumbnailUrl`은 현재 DB 저장 필드가 없으므로 저장하지 않음
- 업로드 성공 메시지를 “웹용 이미지로 최적화되었습니다” 문구로 보강
- 응답 값이 있는 경우 아래 정보를 표시
  - 원본 용량
  - 최적화 후 용량
  - 이미지 크기
  - 저장 포맷

중요:

- 업로드만으로 제작 사례 DB가 바뀌지 않는다.
- 기존처럼 제작 사례 저장 버튼을 눌러야 `PortfolioCase.mainImageUrl`에 최종 반영된다.
- 기존 이미지 URL 직접 입력 방식은 유지되어 있다.

---

## 고객-facing 화면 영향

고객-facing 제작 사례 목록/상세 화면은 구조적으로 변경하지 않았다.

관련 파일:

```txt
src/components/PortfolioCaseImage.tsx
src/app/portfolio/page.tsx
src/app/portfolio/[slug]/page.tsx
```

기존처럼 `mainImageUrl`을 사용한다.

기대 효과:

- 새로 업로드한 대표 이미지는 WebP 최적화 파일이므로 목록/상세 이미지 로딩이 가벼워진다.
- 고객-facing 페이지에 관리자 내부 정보는 노출되지 않는다.

---

## 테스트 변경 내용

수정:

```txt
src/test/upload-utils.test.ts
```

추가 테스트:

- 최적화 이미지 파일명이 `.webp`로 생성되는지
- 사용자 원본 파일명/한글/공백이 저장 파일명에 직접 들어가지 않는지
- 썸네일 파일명이 `-thumb.webp`로 생성되는지
- traversal filename이 거부되는지
- 최적화 상수 값이 기대값인지

신규:

```txt
src/test/portfolio-image-optimizer.test.ts
```

추가 테스트:

- `sharp`로 테스트 이미지를 생성한 뒤 WebP로 변환되는지
- 대표 이미지가 1600px 제한 안에 들어오는지
- 썸네일이 600px 제한 안에 들어오는지
- 깨진 buffer가 `PortfolioImageOptimizationError`로 거부되는지

---

## 검증 결과

아래 명령을 실행했고 모두 통과했다.

```txt
tsc --noEmit
next lint
vitest run
DATABASE_URL=file:./dev.db prisma migrate status
DATABASE_URL=file:./dev.db prisma generate && next build
```

결과 요약:

```txt
tsc --noEmit: 통과
next lint: 통과, ESLint warning/error 없음
vitest run: 34 test files, 140 tests 통과
prisma migrate status: Database schema is up to date
prisma generate: 통과
next build: 통과
```

참고:

- 현재 환경에서 기본 PATH에 `node`/`pnpm`이 잡혀 있지 않아 Codex 런타임 Node 경로를 사용해 명령을 실행했다.
- `sharp` 설치는 pnpm v11.0.7로 완료되었다.

---

## 현재 로컬 업로드 방식의 운영 한계

현재 업로드 파일 저장 위치:

```txt
public/uploads/portfolio
```

이 방식은 로컬 개발과 내부 테스트에는 단순하고 편하다.

하지만 Vercel 같은 서버리스 배포에서는 영구 파일 저장소로 적합하지 않다.

운영 한계:

- 배포/재배포 시 업로드 파일 유지가 보장되지 않음
- 서버리스 환경에서 런타임 파일 쓰기가 영구 저장소가 아님
- 여러 배포 인스턴스 간 파일 동기화가 되지 않음
- 실제 고객/운영 이미지 저장에는 외부 스토리지 전환이 필요함

운영 전 추천:

- Vercel Blob, S3, Cloudflare R2, Cloudinary 등 외부 스토리지 설계
- DB에는 외부 스토리지 URL 저장
- 업로드 파일 접근 권한, 삭제 정책, 백업 정책 결정

단, Phase 12에서는 외부 스토리지 연동을 하지 않았다.

---

## 다음 GPT가 이어서 볼 주요 파일

Phase 12 이후 이어서 작업할 때 우선 확인할 파일:

```txt
package.json
pnpm-lock.yaml
src/lib/upload-utils.ts
src/lib/portfolio-image-optimizer.ts
src/app/api/admin/uploads/portfolio/route.ts
src/components/PortfolioCaseForm.tsx
src/components/PortfolioCaseImage.tsx
src/app/portfolio/page.tsx
src/app/portfolio/[slug]/page.tsx
src/test/upload-utils.test.ts
src/test/portfolio-image-optimizer.test.ts
```

업로드 파일 저장 경로:

```txt
public/uploads/portfolio
```

Git 추적 방지:

```txt
public/uploads/portfolio/*
!public/uploads/portfolio/.gitkeep
```

---

## 다음 단계 제안

현실적인 다음 작업 순서:

1. 운영용 외부 스토리지 전환 설계
   - Vercel Blob/S3/R2/Cloudinary 중 선택
   - 현재 로컬 업로드 API를 외부 스토리지 adapter 구조로 바꾸는 작업
   - 삭제/교체/백업 정책 설계

2. 고객 문의 첨부파일 업로드
   - 제품 사진, 참고 패키지 이미지, 디자인 파일 여부와 연계
   - 단, PDF/AI 등은 보안/용량/권한 정책을 먼저 정해야 함

3. 채널톡/이메일 연동
   - 문의 접수 알림
   - 견적안 응답 알림
   - 자동 발송 여부는 별도 운영 정책 필요

4. 도면/전개도 생성기
   - 현재 CRM/문의 흐름과 분리해서 별도 도구로 설계하는 것이 안전함

---

## 다음 작업 시 주의사항

다음 GPT/Codex는 아래를 지켜야 한다.

- DB schema 변경이 필요할 때만 migration 생성
- `PortfolioCase.mainImageUrl` 의미를 바꾸지 말 것
- `thumbnailUrl`을 DB에 저장하고 싶다면 먼저 모델에 기존 유사 필드가 있는지 확인할 것
- 외부 스토리지 전환 전에는 `public/uploads/portfolio` 방식의 운영 한계를 반드시 사용자에게 설명할 것
- 고객-facing 페이지에 관리자 전용 정보, 내부 상담 요약, 내부 메모를 노출하지 말 것
- 고객 문의폼 파일 업로드를 추가할 때는 대표 이미지 업로드와 구분할 것
- 실제 고객 업로드 파일을 Git에 올리지 말 것
- 기존 테스트를 삭제해서 통과시키지 말 것

---

## 다음 GPT에게 바로 줄 수 있는 요청 예시

아래 문장을 그대로 다음 GPT/Codex에게 전달하면 된다.

```txt
첨부한 GPT_HANDOFF_PACKAGE_INQUIRY_PHASE_12.md를 먼저 읽고 현재 프로젝트 상태를 이해해줘.

현재 PerPackage Marketing Lead Management System은 Next.js App Router, TypeScript, Tailwind CSS, Prisma, SQLite, Zod, Vitest 기반이다.

패키지 구조 선택형 문의폼 / 제작 준비 체크리스트 Phase 1~12는 완료되어 있다.

최근 Phase 12에서는 관리자 제작 사례 대표 이미지 업로드 시 sharp 기반 WebP 리사이즈/압축과 썸네일 생성을 추가했다.

다음 작업은 [원하는 기능명]이다.

중요:
- 기존 CRM/포트폴리오/견적안/영업 업무 기능을 삭제하거나 재작성하지 말 것.
- 고객-facing UI 문구는 한국어를 유지할 것.
- 외부 AI API, 가격 계산, 결제, 세금계산서, 전자계약 기능을 임의로 추가하지 말 것.
- 실제 고객 데이터나 업로드 파일을 Git에 올리지 말 것.
- 작업 후 lint/test/build 결과를 한국어로 보고해줘.
```

