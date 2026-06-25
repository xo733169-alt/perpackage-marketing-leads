# 제작 사례 이미지 스토리지

관리자 제작 사례 대표 이미지 업로드는 storage adapter 구조를 사용한다. 업로드 API와 관리자 폼은 같은 응답 구조를 유지하고, 실제 저장 위치만 provider로 바꾼다.

## 현재 API

- 업로드 API: `POST /api/admin/uploads/portfolio`
- DB 저장 필드: `PortfolioCase.mainImageUrl`
- 대표 이미지: 최대 1600px WebP
- 썸네일: 최대 600px WebP
- 썸네일 URL: API 응답에는 포함하지만 현재 DB에는 저장하지 않는다.

응답 예시:

```json
{
  "url": "/uploads/portfolio/portfolio-20260621-example.webp",
  "thumbnailUrl": "/uploads/portfolio/portfolio-20260621-example-thumb.webp",
  "width": 1600,
  "height": 1200,
  "format": "webp",
  "originalSizeBytes": 3456789,
  "optimizedSizeBytes": 456789
}
```

`PortfolioCaseForm`은 기존처럼 `url` 값을 `mainImageUrl`에 반영한다. `thumbnailUrl`은 저장하지 않는다.

## Provider 설정

환경변수 `PORTFOLIO_STORAGE_PROVIDER`로 저장소를 선택한다.

```env
PORTFOLIO_STORAGE_PROVIDER="local"
```

지원 provider:

- `local`: `public/uploads/portfolio`에 저장
- `vercel-blob`: Vercel Blob에 저장

미지원 provider가 들어오면 local로 조용히 fallback하지 않고 에러를 낸다.

## Local Provider

로컬 개발과 내부 테스트용 기본 provider다.

```env
PORTFOLIO_STORAGE_PROVIDER="local"
```

저장 위치:

```txt
public/uploads/portfolio
```

public URL:

```txt
/uploads/portfolio/portfolio-20260621-example.webp
```

주의:

- Vercel 같은 serverless 환경에서는 영구 저장소로 적합하지 않다.
- 배포가 바뀌거나 함수 환경이 재생성되면 파일이 유지된다고 보장할 수 없다.
- 실제 고객 이미지 파일은 Git에 올리지 않는다.

현재 `.gitignore`는 업로드 파일을 제외하고 `.gitkeep`만 유지한다.

```txt
public/uploads/portfolio/*
!public/uploads/portfolio/.gitkeep
```

## Vercel Blob Provider

운영 배포에서 사용할 수 있는 provider다.

```env
PORTFOLIO_STORAGE_PROVIDER="vercel-blob"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxx"
```

주의:

- 실제 토큰은 `.env.example`, 문서, 코드, 테스트에 넣지 않는다.
- Vercel Project에 Blob Store를 연결하고 `BLOB_READ_WRITE_TOKEN`을 Environment Variables에 설정해야 한다.
- `PORTFOLIO_STORAGE_PROVIDER="vercel-blob"`인데 `BLOB_READ_WRITE_TOKEN`이 없으면 업로드는 실패한다.

Blob key 규칙:

```txt
portfolio/{filename}
```

예:

```txt
portfolio/portfolio-20260621-example.webp
portfolio/portfolio-20260621-example-thumb.webp
```

Vercel Blob provider는 public Blob URL을 반환한다. 고객-facing 제작 사례 화면은 `mainImageUrl`을 그대로 사용하므로 Blob URL도 같은 방식으로 표시된다.

## Local 파일과 Blob 파일의 관계

기존 local 업로드 파일은 Vercel Blob으로 자동 마이그레이션되지 않는다.

전환 시 주의:

- 기존 DB의 `mainImageUrl`이 `/uploads/portfolio/...`이면 local 파일을 참조한다.
- Blob 전환 후 새 업로드부터 `https://...vercel-storage.com/...` 형태의 URL이 저장된다.
- 기존 local 이미지를 운영에서도 보여야 한다면 별도 마이그레이션 도구로 Blob에 업로드하고 DB URL을 갱신해야 한다.

## Adapter 구조

주요 파일:

```txt
src/lib/storage/portfolio-storage.ts
src/app/api/admin/uploads/portfolio/route.ts
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

구현체:

- `localPortfolioImageStorage`
- `vercelBlobPortfolioImageStorage`
- `getPortfolioImageStorage()`

업로드 API는 `getPortfolioImageStorage()`로 adapter를 선택한 뒤 대표 이미지와 썸네일을 각각 `save()`한다. API 응답 구조는 provider와 무관하게 유지한다.

## 운영 전 테스트 항목

- Vercel Project에 Blob Store가 연결되어 있는지 확인
- Production/Preview 환경변수에 `PORTFOLIO_STORAGE_PROVIDER` 설정
- Blob 사용 시 `BLOB_READ_WRITE_TOKEN` 설정
- 관리자 제작 사례 이미지 업로드 테스트
- 업로드 후 `PortfolioCase.mainImageUrl`에 Blob URL이 저장되는지 확인
- 고객-facing 제작 사례 목록/상세에서 이미지가 표시되는지 확인
- 기존 local 이미지가 필요한 경우 마이그레이션 계획 수립

## Vercel Blob 배포 후 실제 테스트 순서

Vercel 운영 배포에서 제작 사례 대표 이미지가 Blob에 저장되는지 확인할 때는 아래 순서로 테스트한다.

1. Vercel Dashboard에서 `perpackage-marketing-leads` 프로젝트의 최신 Production 배포가 `Ready` 상태인지 확인한다.
2. Project Settings > Environment Variables에서 Production 환경에 아래 값이 있는지 확인한다.

```env
DATABASE_URL=
ADMIN_PASSWORD=
NEXT_PUBLIC_SITE_URL=https://perpackage-marketing-leads.vercel.app
PORTFOLIO_STORAGE_PROVIDER=vercel-blob
BLOB_READ_WRITE_TOKEN=
SITE_ACCESS_ENABLED=true
SITE_ACCESS_PASSWORD=
SITE_ACCESS_SECRET=
```

3. 환경변수를 추가하거나 수정했다면 반드시 Redeploy한다.
4. `https://perpackage-marketing-leads.vercel.app/access`에 접속해 사이트 접근 비밀번호를 입력한다.
5. `https://perpackage-marketing-leads.vercel.app/admin/login`에 접속해 관리자 비밀번호를 입력한다.
6. 로그인 후 `/admin/leads`로 이동되는지 확인한다.
7. `https://perpackage-marketing-leads.vercel.app/admin/portfolio/new`로 이동한다.
8. 제작 사례 필수 정보를 입력하고 JPG, PNG, WebP 중 하나의 대표 이미지를 업로드한다.
9. 업로드 완료 후 대표 이미지 URL 입력값이 아래 형태인지 확인한다.

```txt
https://...vercel-storage.com/portfolio/portfolio-날짜-uuid.webp
```

10. 제작 사례 저장 버튼을 눌러 `PortfolioCase.mainImageUrl`에 최종 반영한다.
11. `/admin/portfolio` 목록과 `/portfolio` 또는 `/portfolio/[slug]`에서 이미지가 표시되는지 확인한다.
12. Vercel Dashboard > Storage > Blob Store에서 아래 파일이 생성됐는지 확인한다.

```txt
portfolio/portfolio-날짜-uuid.webp
portfolio/portfolio-날짜-uuid-thumb.webp
```

## 업로드 결과 판별 기준

- URL이 `https://...vercel-storage.com/portfolio/...webp`이면 Vercel Blob provider로 저장된 것이다.
- URL이 `/uploads/portfolio/...`이면 local provider로 동작 중이다. `PORTFOLIO_STORAGE_PROVIDER`, 적용 환경, Redeploy 여부를 확인한다.
- 업로드 API가 401을 반환하면 `/access` 통과 여부와 `/admin/login` 관리자 인증 여부를 먼저 확인한다.
- "이미지 저장소 설정" 관련 오류가 나오면 `BLOB_READ_WRITE_TOKEN` 누락 또는 잘못된 provider 설정 가능성이 높다.
- 업로드는 성공했지만 공개 제작 사례 화면에 이미지가 안 보이면 제작 사례 저장 여부, `mainImageUrl`, 공개 상태, 승인 상태를 확인한다.
- `/api/health`가 계속 401이면 현재 코드 기준으로는 최신 배포가 아닐 가능성이 높다. 최신 코드로 Redeploy한 뒤 다시 확인한다.

## Naver Object Storage Provider

운영 배포에서 Vercel Blob 대신 네이버 Object Storage를 사용할 수 있다.

```env
PORTFOLIO_STORAGE_PROVIDER="naver-object-storage"
NAVER_OBJECT_STORAGE_ACCESS_KEY=""
NAVER_OBJECT_STORAGE_SECRET_KEY=""
NAVER_OBJECT_STORAGE_BUCKET=""
NAVER_OBJECT_STORAGE_ENDPOINT="https://kr.object.ncloudstorage.com"
NAVER_OBJECT_STORAGE_REGION="kr-standard"
NAVER_OBJECT_STORAGE_PUBLIC_BASE_URL=""
```

동작 방식:

- 업로드 API는 기존과 동일하게 `POST /api/admin/uploads/portfolio`를 사용한다.
- 이미지는 기존처럼 Sharp로 WebP 최적화된다.
- 대표 이미지는 최대 1600px, 썸네일은 최대 600px로 생성된다.
- 네이버 Object Storage에는 아래 key 규칙으로 저장된다.

```txt
portfolio/portfolio-날짜-uuid.webp
portfolio/portfolio-날짜-uuid-thumb.webp
```

API 응답 구조는 기존 provider와 동일하다.

```json
{
  "url": "https://object-storage-public-base/portfolio/portfolio-20260625-example.webp",
  "thumbnailUrl": "https://object-storage-public-base/portfolio/portfolio-20260625-example-thumb.webp",
  "width": 1600,
  "height": 1200,
  "format": "webp",
  "originalSizeBytes": 3456789,
  "optimizedSizeBytes": 456789
}
```

`PortfolioCaseForm`은 기존처럼 `url` 값을 `PortfolioCase.mainImageUrl`에 반영한다. `thumbnailUrl`은 아직 DB에 저장하지 않는다.

### Provider 선택 기준

- `local`: 로컬 개발 또는 임시 테스트용
- `vercel-blob`: 기존 Vercel Blob fallback
- `naver-object-storage`: 운영용 네이버 Object Storage

미지원 provider 값이 들어오면 조용히 fallback하지 않고 업로드 오류를 반환한다.

### 네이버 Object Storage 테스트 순서

1. Vercel Environment Variables에 네이버 Object Storage 변수들을 입력한다.
2. `PORTFOLIO_STORAGE_PROVIDER=naver-object-storage`로 설정한다.
3. Vercel Preview를 Redeploy한다.
4. `/access`와 `/admin/login`을 통과한다.
5. `/admin/portfolio/new`에서 제작 사례 대표 이미지를 업로드한다.
6. 대표 이미지 URL이 `NAVER_OBJECT_STORAGE_PUBLIC_BASE_URL` 하위 URL인지 확인한다.
7. 네이버 Object Storage 콘솔에서 `portfolio/...webp`, `portfolio/...-thumb.webp` 파일이 생성됐는지 확인한다.
8. 제작 사례 저장 후 `/portfolio` 또는 `/portfolio/[slug]`에서 이미지가 보이는지 확인한다.

주의:

- 네이버 Object Storage secret은 코드나 문서에 기록하지 않는다.
- 기존 Vercel Blob 또는 local 업로드 파일은 네이버 Object Storage로 자동 이전되지 않는다.
- 기존 DB의 `/uploads/portfolio/...` 또는 `vercel-storage.com` URL을 네이버 URL로 바꾸려면 별도 마이그레이션 도구가 필요하다.
