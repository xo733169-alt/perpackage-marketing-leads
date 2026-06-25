# GPT 전달용 보고서: Phase 14 Vercel Blob 실제 연동

작성일: 2026-06-21  
프로젝트: PerPackage Marketing Lead Management System  
회사: 페르패키지  
작업 위치: `C:\Users\inh78\OneDrive\문서\홈페이지 개발\perpackage-marketing-leads`

## 1. 현재 프로젝트 개요

이 프로젝트는 페르패키지의 마케팅 리드 관리 시스템이다.

현재 기술 스택:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- Zod
- Vitest

현재까지 완료된 주요 범위:

- 고객 문의폼
- 패키지 구조 선택형 문의 항목
- 제작 준비 체크리스트
- 관리자 리드 CRM
- 제작 사례/포트폴리오 관리
- 견적 룰/견적안/공유 링크/고객 응답
- 견적안 수정 workflow
- 영업 업무 관리
- 제작 사례 대표 이미지 업로드
- 이미지 WebP 최적화
- local storage adapter 구조
- Vercel Blob storage adapter

## 2. Phase 14 작업 목표

Phase 14의 목표는 관리자 제작 사례 대표 이미지 업로드가 로컬 개발에서는 local adapter로 저장되고, Vercel 운영 환경에서는 Vercel Blob adapter로 저장될 수 있게 만드는 것이었다.

기존 Phase 13 상태:

- 업로드 API: `POST /api/admin/uploads/portfolio`
- storage adapter 파일: `src/lib/storage/portfolio-storage.ts`
- local adapter 저장 위치: `public/uploads/portfolio`
- DB 저장 필드: `PortfolioCase.mainImageUrl`
- 썸네일 URL은 API 응답에는 있지만 DB에는 저장하지 않음
- 환경변수: `PORTFOLIO_STORAGE_PROVIDER="local"`

## 3. Phase 14 완료 내용

Vercel Blob SDK를 추가하고, 기존 storage adapter 구조 안에 `vercel-blob` provider를 추가했다.

추가된 provider:

- `local`
- `vercel-blob`

provider 선택 방식:

- `PORTFOLIO_STORAGE_PROVIDER`가 없거나 `local`이면 local adapter 사용
- `PORTFOLIO_STORAGE_PROVIDER="vercel-blob"`이면 Vercel Blob adapter 사용
- 미지원 provider는 조용히 local fallback하지 않고 에러 처리

## 4. 수정/추가한 파일

수정된 파일:

- `package.json`
- `pnpm-lock.yaml`
- `.env.example`
- `docs/portfolio-image-storage.md`
- `src/lib/storage/portfolio-storage.ts`
- `src/app/api/admin/uploads/portfolio/route.ts`
- `src/test/portfolio-storage.test.ts`

새 DB migration:

- 없음

DB schema 변경:

- 없음

## 5. 추가된 dependency

추가 패키지:

```txt
@vercel/blob@2.4.1
```

`package.json` dependencies에 추가되었고, `pnpm-lock.yaml`도 업데이트되었다.

## 6. Vercel Blob adapter 구조

파일:

```txt
src/lib/storage/portfolio-storage.ts
```

공통 인터페이스:

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

추가된 adapter:

```ts
vercelBlobPortfolioImageStorage
```

Blob 저장 pathname 규칙:

```txt
portfolio/{filename}
```

예:

```txt
portfolio/portfolio-20260621-example.webp
portfolio/portfolio-20260621-example-thumb.webp
```

Vercel Blob 저장 옵션:

- `access: "public"`
- `contentType: "image/webp"`
- `addRandomSuffix: false`
- `token: process.env.BLOB_READ_WRITE_TOKEN`

## 7. 환경변수

`.env.example`에 아래 내용이 추가되었다.

```env
# Portfolio image storage
# local: saves files under public/uploads/portfolio
# vercel-blob: saves files to Vercel Blob
PORTFOLIO_STORAGE_PROVIDER="local"

# Required when PORTFOLIO_STORAGE_PROVIDER="vercel-blob"
# BLOB_READ_WRITE_TOKEN=""
```

Vercel 운영에서 Blob을 쓰려면 Vercel Project Environment Variables에 아래 값을 설정해야 한다.

```env
PORTFOLIO_STORAGE_PROVIDER="vercel-blob"
BLOB_READ_WRITE_TOKEN="실제 Vercel Blob Read/Write Token"
```

주의:

- 실제 token은 코드, 문서, 테스트에 넣지 말 것.
- local provider에서는 `BLOB_READ_WRITE_TOKEN`이 없어도 정상 동작한다.
- `vercel-blob` provider에서 token이 없으면 업로드가 실패한다.

## 8. 업로드 API 동작

파일:

```txt
src/app/api/admin/uploads/portfolio/route.ts
```

기존 동작 유지:

- 관리자 인증 확인
- mutation origin 검사
- multipart/form-data `file` 필드 사용
- JPG, PNG, WebP만 허용
- 최대 5MB 제한
- SVG, PDF, AI, DXF, ZIP 허용하지 않음
- sharp 기반 WebP 최적화
- 대표 이미지와 썸네일 생성
- storage adapter로 저장
- 한국어 에러 응답

성공 응답 구조는 기존과 호환된다.

```json
{
  "url": "대표 이미지 URL",
  "thumbnailUrl": "썸네일 이미지 URL",
  "width": 1600,
  "height": 1200,
  "format": "webp",
  "originalSizeBytes": 3456789,
  "optimizedSizeBytes": 456789
}
```

중요:

- local provider는 `/uploads/portfolio/...` URL을 반환한다.
- vercel-blob provider는 Vercel Blob public URL을 반환한다.
- 프론트는 기존처럼 `data.url`만 `mainImageUrl`에 저장한다.
- 썸네일 URL은 아직 DB에 저장하지 않는다.

## 9. 에러 처리

추가된 에러 타입:

- `PortfolioStorageConfigurationError`
- `PortfolioStorageUploadError`

처리 방식:

- `PORTFOLIO_STORAGE_PROVIDER="vercel-blob"`인데 `BLOB_READ_WRITE_TOKEN`이 없으면 설정 오류로 처리
- Vercel Blob 업로드 실패 시 업로드 실패 오류로 처리
- 미지원 provider는 기존처럼 `UnsupportedPortfolioStorageProviderError`

클라이언트에는 token이나 내부 상세 오류를 노출하지 않는다.

## 10. 테스트 변경

파일:

```txt
src/test/portfolio-storage.test.ts
```

추가/보강한 테스트:

- provider가 없으면 local adapter 선택
- `PORTFOLIO_STORAGE_PROVIDER=local`이면 local adapter 선택
- `PORTFOLIO_STORAGE_PROVIDER=vercel-blob`이면 Vercel Blob adapter 선택
- `vercel-blob` provider에서 `BLOB_READ_WRITE_TOKEN`이 없으면 에러 발생
- path traversal filename 거부
- Blob pathname이 `portfolio/{filename}` 규칙을 따르는지 확인
- `@vercel/blob`의 `put()`을 mock 처리해서 실제 네트워크 업로드 없이 검증

## 11. 실행한 명령어와 결과

실행 결과:

```txt
tsc --noEmit
결과: 통과

pnpm lint
결과: 통과, ESLint warning/error 없음

pnpm test
결과: 35개 테스트 파일, 149개 테스트 통과

DATABASE_URL=file:./dev.db prisma migrate status
결과: DB schema up to date

DATABASE_URL=file:./dev.db pnpm build
결과: 통과
```

참고:

- 로컬 환경에서 `pnpm`이 PATH에 바로 잡히지 않아 Corepack shim 경로로 실행했다.
- 코드 자체 검증은 통과했다.

## 12. 운영 배포 시 Vercel에서 해야 할 일

Vercel에서 실제 Blob 업로드를 사용하려면 아래를 확인해야 한다.

1. Vercel Project에 Blob Store 연결
2. Environment Variables에 `PORTFOLIO_STORAGE_PROVIDER=vercel-blob` 추가
3. Environment Variables에 `BLOB_READ_WRITE_TOKEN` 추가
4. 기존 필수 env도 유지
   - `DATABASE_URL`
   - `ADMIN_PASSWORD`
   - `NEXT_PUBLIC_SITE_URL`
   - 필요한 경우 `SITE_ACCESS_*`
5. 관리자 제작 사례 이미지 업로드 테스트
6. 업로드 후 `PortfolioCase.mainImageUrl`에 Blob URL이 저장되는지 확인
7. 고객-facing `/portfolio`와 `/portfolio/[slug]`에서 이미지 표시 확인

## 13. 기존 local 이미지 주의사항

기존 local 업로드 파일은 Vercel Blob으로 자동 이전되지 않는다.

기존 DB 값이 아래 형태라면 local 파일을 참조한다.

```txt
/uploads/portfolio/example.webp
```

Blob 전환 후 새 업로드는 아래처럼 Blob URL이 저장된다.

```txt
https://...vercel-storage.com/portfolio/example.webp
```

운영에서 기존 local 이미지까지 계속 보여야 한다면 별도 마이그레이션 도구가 필요하다.

## 14. 다음 GPT가 이어서 작업할 때 주의할 점

금지사항:

- DB schema 변경하지 말 것
- migration 생성하지 말 것
- 고객 문의폼 파일 업로드를 이번 흐름에 섞지 말 것
- PDF, AI, SVG, DXF, ZIP 업로드 허용하지 말 것
- 실제 Blob token을 코드/문서/테스트에 넣지 말 것
- 기존 포트폴리오 기능을 대규모로 갈아엎지 말 것

현재 안정적으로 유지해야 하는 점:

- `PortfolioCase.mainImageUrl`은 대표 이미지 URL 저장 필드
- `thumbnailUrl`은 API 응답에는 있지만 DB에는 저장하지 않음
- local provider는 개발용으로 계속 유지
- Vercel Blob provider는 운영용 선택지

## 15. 다음 단계 제안

현실적인 다음 단계 순서:

1. 기존 local 업로드 이미지의 Vercel Blob 마이그레이션 도구
2. 고객 문의 첨부파일 업로드
3. 채널톡/이메일 연동
4. 도면/전개도 생성기

추천 다음 작업:

기존 local 업로드 이미지의 Vercel Blob 마이그레이션 도구를 먼저 만드는 것이 좋다. 운영 전환 시 기존 `/uploads/portfolio/...` 이미지가 남아 있으면 Vercel Blob 기반 운영에서 이미지가 누락될 수 있기 때문이다.
