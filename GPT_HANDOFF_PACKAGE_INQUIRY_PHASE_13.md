# PerPackage Marketing Lead Management System - GPT Handoff

## 목적

이 파일은 다음 GPT/Codex 세션에 현재 프로젝트 상태와 최근 완료된 “패키지 구조 선택형 문의폼 / 제작 준비 체크리스트” Phase 13 작업 내용을 전달하기 위한 handoff 문서다.

프로젝트명: PerPackage Marketing Lead Management System  
회사: 페르패키지  
업무 영역: 맞춤 패키지 제작 문의, 리드 CRM, 제작 사례, 견적안, 관리자 영업 운영 시스템  
기술 스택: Next.js App Router, TypeScript, Tailwind CSS, Prisma, SQLite, Zod, Vitest

---

## 현재 완료 범위

“패키지 구조 선택형 문의폼 / 제작 준비 체크리스트” Phase 1~13까지 완료되어 있다.

Phase 1~12에서 완료된 주요 기능:

- 고객 문의폼에 패키지 종류, 구조, 수량, 사이즈, 제작 준비 체크리스트 추가
- readinessScore 계산 및 저장
- 관리자 리드 목록/상세에 패키지 제작 정보 표시
- 리드 CSV export에 패키지 문의 필드 포함
- 외부 AI API 없이 규칙 기반 관리자 상담 요약 helper 추가
- 관리자 수동 상담 요약 저장/수정/초기화 기능 추가
- 제작 사례 필터 기능 보강
- 관리자 제작 사례 대표 이미지 업로드 기능 추가
- `sharp` 기반 WebP 이미지 최적화 추가
- 대표 이미지 최대 1600px, 썸네일 최대 600px 생성

Phase 13에서 완료된 기능:

- 제작 사례 이미지 저장 로직을 storage adapter 구조로 분리
- 외부 스토리지 실제 연동 없이 local storage adapter만 구현
- 기존 업로드 API 응답 구조 유지
- `PORTFOLIO_STORAGE_PROVIDER` 환경변수 설계
- 미지원 provider는 조용히 fallback하지 않고 명확히 실패 처리
- 로컬 저장 방식의 운영 한계 문서화
- storage adapter 테스트 추가

---

## 중요한 운영 규칙

다음 GPT/Codex는 아래 규칙을 유지해야 한다.

- 기존 CRM, 리드, 견적 룰, 견적안, 영업 업무 기능을 삭제하거나 재작성하지 말 것.
- 기존 포트폴리오/제작 사례 기능을 대규모로 갈아엎지 말 것.
- 고객-facing UI 문구는 한국어를 유지할 것.
- 관리자 상담 요약은 고객-facing 페이지에 노출하지 말 것.
- 외부 AI API, OpenAI API, ChatGPT API를 임의로 연동하지 말 것.
- 가격 계산, 결제, 세금계산서, 입출금, 전자계약 기능을 추가하지 말 것.
- 고객 문의폼 파일 업로드는 아직 구현하지 않았다.
- PDF, AI, SVG, DXF, ZIP 업로드는 대표 이미지 업로드 흐름에 섞지 말 것.
- 실제 고객 데이터나 업로드 파일을 Git에 올리지 말 것.
- DB schema 변경이 필요할 때만 migration을 생성할 것.

---

## Phase 13 작업 요약

Phase 13의 목표는 운영용 외부 스토리지 전환을 바로 구현하는 것이 아니라, 현재 로컬 업로드 구조를 나중에 Vercel Blob, S3, R2 등으로 쉽게 교체할 수 있도록 adapter 구조로 정리하는 것이었다.

기존 Phase 12 구조:

```txt
POST /api/admin/uploads/portfolio
  -> sharp로 WebP 최적화
  -> API route 안에서 mkdir/writeFile 직접 실행
  -> public/uploads/portfolio에 저장
  -> url, thumbnailUrl 등 반환
```

Phase 13 변경 후 구조:

```txt
POST /api/admin/uploads/portfolio
  -> sharp로 WebP 최적화
  -> getPortfolioImageStorage()로 storage adapter 선택
  -> storage.save({ filename, buffer })로 저장
  -> url, thumbnailUrl 등 기존 응답 유지
```

---

## 수정/추가한 파일

```txt
.env.example
docs/portfolio-image-storage.md
src/app/api/admin/uploads/portfolio/route.ts
src/lib/storage/portfolio-storage.ts
src/test/portfolio-storage.test.ts
```

---

## DB 변경 여부

DB 변경 없음.

Prisma schema 변경 없음.  
Migration 생성 없음.

기존 DB 저장 필드는 그대로 유지한다.

```prisma
PortfolioCase.mainImageUrl String?
```

썸네일 URL은 여전히 DB에 저장하지 않는다. 고객-facing 제작 사례 화면도 기존처럼 `mainImageUrl`만 사용한다.

---

## Dependency 변경 여부

이번 Phase 13에서는 dependency를 추가하지 않았다.

Phase 12에서 추가된 `sharp`는 그대로 사용한다.

---

## Storage Adapter 구조

새 파일:

```txt
src/lib/storage/portfolio-storage.ts
```

주요 타입:

```ts
export type StoredPortfolioImage = {
  url: string;
  filename: string;
  sizeBytes: number;
};

export type StorePortfolioImageInput = {
  filename: string;
  buffer: Buffer;
};

export type PortfolioImageStorage = {
  save(input: StorePortfolioImageInput): Promise<StoredPortfolioImage>;
};
```

현재 구현:

```ts
createLocalPortfolioImageStorage()
localPortfolioImageStorage
getPortfolioImageStorage()
UnsupportedPortfolioStorageProviderError
```

local adapter 동작:

- 저장 폴더가 없으면 생성
- 파일명 path traversal 방지
- `public/uploads/portfolio` 하위 저장
- 저장 후 public URL 반환
- 저장된 파일 크기를 `sizeBytes`로 반환

---

## 환경변수

`.env.example`에 아래 값을 추가했다.

```txt
PORTFOLIO_STORAGE_PROVIDER="local"
```

동작:

- 값이 없거나 `local`이면 local adapter 사용
- `s3`, `r2`, `vercel-blob`, `cloudinary` 등 미지원 값이면 명확히 에러 처리

중요:

운영 중 잘못된 provider 설정을 숨기지 않기 위해 미지원 provider를 local로 조용히 fallback하지 않는다.

---

## 업로드 API 변경 내용

파일:

```txt
src/app/api/admin/uploads/portfolio/route.ts
```

유지된 기능:

- 관리자 인증
- mutation Origin 검사
- multipart/form-data의 `file` 필드 사용
- 허용 파일: JPG, PNG, WebP
- 최대 파일 크기: 5MB
- SVG, PDF, AI, DXF, ZIP 등 거부
- `sharp` 기반 WebP 최적화
- 대표 이미지 저장
- 썸네일 저장
- 한국어 에러 응답
- 기존 성공 응답 형태 유지

변경된 내부 구현:

- API route에서 `mkdir`, `writeFile` 직접 호출 제거
- `getPortfolioImageStorage()`로 storage adapter 선택
- `storage.save()`로 대표 이미지와 썸네일 저장
- 저장소 provider 설정 오류는 `UnsupportedPortfolioStorageProviderError`로 처리

기존 성공 응답 구조는 유지된다.

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

---

## 문서 추가

새 문서:

```txt
docs/portfolio-image-storage.md
```

문서 내용:

- 현재 저장 방식: `public/uploads/portfolio`
- local storage 방식의 장점
- Vercel/serverless 운영 한계
- 현재 API 응답 구조
- adapter 구조 설명
- 외부 스토리지 전환 시 바꿀 위치
- 미지원 provider 정책
- 실제 업로드 파일을 Git에 올리면 안 된다는 주의

---

## 테스트 변경 내용

새 테스트:

```txt
src/test/portfolio-storage.test.ts
```

테스트 항목:

- local adapter가 지정 filename으로 public URL을 반환하는지
- 실제 파일 저장 후 sizeBytes를 반환하는지
- path traversal filename을 거부하는지
- provider가 없으면 local adapter를 선택하는지
- `PORTFOLIO_STORAGE_PROVIDER=local`이면 local adapter를 선택하는지
- 미지원 provider면 `UnsupportedPortfolioStorageProviderError`를 던지는지

테스트는 임시 디렉터리를 사용하며 테스트 후 파일을 삭제한다. `public/uploads/portfolio`에 테스트 파일을 남기지 않는다.

---

## 검증 결과

아래 명령을 실행했고 모두 통과했다.

```txt
tsc --noEmit
vitest run
next lint
DATABASE_URL=file:./dev.db prisma migrate status
DATABASE_URL=file:./dev.db prisma generate && next build
```

결과 요약:

```txt
tsc --noEmit: 통과
vitest run: 35 test files, 144 tests 통과
next lint: ESLint warning/error 없음
prisma migrate status: Database schema is up to date
prisma generate: 통과
next build: 통과
```

참고:

현재 환경에서는 기본 PATH에 `node`/`pnpm`이 잡혀 있지 않아 Codex 런타임 Node 경로를 사용해 명령을 실행했다.

---

## 현재 local storage 방식의 운영 한계

현재 저장 위치:

```txt
public/uploads/portfolio
```

이 방식은 로컬 개발과 내부 테스트에는 적합하지만 Vercel 같은 서버리스 배포 환경에서는 운영용 영구 저장소로 적합하지 않다.

한계:

- 재배포 시 업로드 파일 유지가 보장되지 않음
- 서버리스 함수 환경의 파일 쓰기는 영구 저장소가 아님
- 여러 배포 인스턴스 간 파일 동기화가 되지 않음
- 실제 고객 이미지 파일을 Git에 올리면 안 됨

현재 `.gitignore`에는 아래 규칙이 있다.

```txt
public/uploads/portfolio/*
!public/uploads/portfolio/.gitkeep
```

---

## 외부 스토리지 전환 시 바꿔야 할 위치

다음 단계에서 Vercel Blob/S3/R2를 실제 연동할 경우 우선 볼 파일:

```txt
src/lib/storage/portfolio-storage.ts
src/app/api/admin/uploads/portfolio/route.ts
docs/portfolio-image-storage.md
.env.example
```

권장 전환 방식:

1. `PortfolioImageStorage` 인터페이스는 유지한다.
2. `save({ filename, buffer })` 형태를 유지한다.
3. 외부 provider adapter를 추가한다.
4. `getPortfolioImageStorage()`에서 provider별 adapter를 선택한다.
5. API 응답 구조는 유지한다.
6. DB에는 계속 대표 이미지 URL만 저장한다.

---

## 다음 GPT가 이어서 볼 주요 파일

```txt
package.json
.env.example
docs/portfolio-image-storage.md
src/lib/upload-utils.ts
src/lib/portfolio-image-optimizer.ts
src/lib/storage/portfolio-storage.ts
src/app/api/admin/uploads/portfolio/route.ts
src/components/PortfolioCaseForm.tsx
src/components/PortfolioCaseImage.tsx
src/test/upload-utils.test.ts
src/test/portfolio-image-optimizer.test.ts
src/test/portfolio-storage.test.ts
```

---

## 다음 단계 제안

현실적인 다음 작업 순서:

1. Vercel Blob 실제 연동
   - Vercel 운영/Preview 배포와 가장 자연스럽게 연결 가능
   - 현재 adapter 구조에 `vercel-blob` provider 추가

2. S3/R2 실제 연동
   - 장기 운영 비용과 백업/권한 정책을 고려할 때 후보
   - AWS S3 또는 Cloudflare R2 중 선택 필요

3. 고객 문의 첨부파일 업로드
   - 제품 사진, 참고 패키지 이미지, 디자인 자료 업로드
   - 고객 개인정보/파일 보관 정책 먼저 필요

4. 채널톡/이메일 연동
   - 문의 접수와 견적안 응답 알림 자동화
   - 자동 발송 범위는 별도 운영 기준 필요

5. 도면/전개도 생성기
   - CRM과 분리된 별도 도구로 설계하는 것이 안전

---

## 다음 GPT에게 바로 줄 수 있는 요청 예시

아래 문장을 그대로 다음 GPT/Codex에게 전달하면 된다.

```txt
첨부한 GPT_HANDOFF_PACKAGE_INQUIRY_PHASE_13.md를 먼저 읽고 현재 프로젝트 상태를 이해해줘.

현재 PerPackage Marketing Lead Management System은 Next.js App Router, TypeScript, Tailwind CSS, Prisma, SQLite, Zod, Vitest 기반이다.

패키지 구조 선택형 문의폼 / 제작 준비 체크리스트 Phase 1~13은 완료되어 있다.

최근 Phase 13에서는 제작 사례 대표 이미지 업로드의 파일 저장 로직을 storage adapter 구조로 분리했다.

외부 스토리지는 아직 실제 연동하지 않았고, 현재는 local adapter만 있다.

다음 작업은 [원하는 기능명]이다.

중요:
- 기존 CRM/포트폴리오/견적안/영업 업무 기능을 삭제하거나 재작성하지 말 것.
- 고객-facing UI 문구는 한국어를 유지할 것.
- 외부 AI API, 가격 계산, 결제, 세금계산서, 전자계약 기능을 임의로 추가하지 말 것.
- 실제 고객 데이터나 업로드 파일을 Git에 올리지 말 것.
- 작업 후 lint/test/build 결과를 한국어로 보고해줘.
```

