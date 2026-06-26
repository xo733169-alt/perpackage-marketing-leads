# PerPackage Marketing Leads 운영 최종 검수 보고서

작성일: 2026-06-25  
프로젝트: `perpackage-marketing-leads`  
목적: Vercel + Supabase Postgres + Naver Object Storage 전환 후 운영 전 핵심 흐름 최종 확인

## 1. 작업 목적

이번 검수는 새 기능 개발이 아니라, 이미 연결된 운영 인프라가 실제 화면과 데이터 흐름에서 끝까지 동작하는지 확인하기 위한 최종 운영 QA이다.

검수 범위는 다음으로 제한했다.

- 고객 견적 문의 저장 흐름
- Supabase Postgres 저장 확인
- 관리자 리드/오늘 할 일 화면 접근
- 제작 사례 등록/목록/공개 화면 흐름
- 제작 사례 대표 이미지 업로드와 Naver Object Storage 저장
- 견적 룰/견적 계산기 동작 가능성
- 리드 CSV export 구조
- 운영 공개 전 private access 설정 확인 포인트

DB schema 변경, migration 추가, 결제/세금계산서/전자계약/고객 파일 업로드 기능은 진행하지 않았다.

## 2. 확인한 배포 URL

현재 사용자가 확인 중인 Vercel 배포 URL:

```txt
https://perpackage-marketing-leads-hwdfxdey.vercel.app
```

확인된 주요 경로:

```txt
/access
/admin/login
/admin/today
/admin/leads
/admin/portfolio
/admin/portfolio/new
/admin/quote-rules
/admin/quote-calculator
/portfolio
```

주의:

```txt
/admin/lead
```

위 경로는 존재하지 않는 경로이므로 404가 정상이다. 리드 목록은 반드시 `/admin/leads`에서 확인해야 한다.

## 3. 제작 사례 등록 테스트 결과

코드 기준 저장 흐름은 다음과 같다.

1. `/admin/portfolio/new`에서 제작 사례 정보를 입력한다.
2. 대표 이미지를 업로드하면 `POST /api/admin/uploads/portfolio`가 호출된다.
3. 업로드 API가 WebP 최적화 이미지를 저장하고 `url`, `thumbnailUrl` 등을 반환한다.
4. 폼은 반환된 `url`을 `PortfolioCase.mainImageUrl`에 넣는다.
5. 제작 사례 저장 버튼을 눌러야 DB에 최종 저장된다.

사용자 확인 결과:

- Naver Object Storage에 이미지 파일이 실제 저장되는 것까지 확인 완료.

추가 확인 필요:

- `/admin/portfolio/new`에서 제작 사례 저장 버튼 클릭 후 `PortfolioCase` row가 생성되는지 확인.
- `mainImageUrl` 값이 Naver Object Storage public URL로 저장되는지 확인.
- 공개 화면 노출을 원하면 제작 사례가 `PUBLISHED` 상태이고 `publicApprovalConfirmed=true`인지 확인.

## 4. `/admin/portfolio` 목록 확인 결과

코드 기준:

- 관리자 제작 사례 목록은 `/admin/portfolio`에서 확인한다.
- 관리자 목록은 제작 사례의 상태, 공개 승인 여부, 이미지 URL, slug 등을 확인할 수 있는 흐름이다.
- 공개 페이지 보기 링크는 `status === "PUBLISHED"` 및 `publicApprovalConfirmed === true`일 때 의미가 있다.

추가 확인 필요:

- 방금 등록한 제작 사례가 `/admin/portfolio` 목록에 표시되는지 확인.
- 목록에서 상태가 `PUBLISHED`인지, 공개 승인 여부가 체크되어 있는지 확인.

## 5. `/portfolio` 고객 화면 확인 결과

코드 기준 고객 제작 사례 목록은 다음 조건을 만족하는 제작 사례만 표시한다.

```txt
status = PUBLISHED
publicApprovalConfirmed = true
```

이미지는 `PortfolioCase.mainImageUrl`을 사용한다.

추가 확인 필요:

- `/portfolio`에서 방금 등록한 제작 사례가 보이는지 확인.
- 보이지 않는 경우 우선 아래를 확인한다.
  - 제작 사례 상태가 `PUBLISHED`인지
  - `publicApprovalConfirmed`가 `true`인지
  - `mainImageUrl`이 비어 있지 않은지
  - `SITE_ACCESS_ENABLED=true` 상태라면 `/access` 통과 후 확인 중인지

## 6. `/portfolio/[slug]` 상세 페이지 확인 결과

코드 기준:

- 상세 페이지 경로는 `/portfolio/[slug]`이다.
- slug가 맞고 공개 조건을 만족해야 404 없이 열린다.
- 상세 페이지도 `mainImageUrl`을 사용한다.

추가 확인 필요:

- `/admin/portfolio`에서 해당 사례의 slug를 확인한다.
- `/portfolio/{slug}`로 접속해 이미지와 내용이 표시되는지 확인한다.
- 404가 나오면 slug 오타 또는 공개 조건 미충족 가능성이 높다.

## 7. Naver Object Storage 이미지 표시 확인 결과

현재 코드 기준 Naver Object Storage adapter 동작:

- `PORTFOLIO_STORAGE_PROVIDER=naver-object-storage` 또는 `naver`일 때 사용된다.
- `@aws-sdk/client-s3` 기반으로 업로드한다.
- object key는 아래 형태를 사용한다.

```txt
portfolio/{filename}
```

예상 파일:

```txt
portfolio/portfolio-...webp
portfolio/portfolio-...-thumb.webp
```

사용자 확인 결과:

- 네이버 클라우드 버킷에 파일이 올라가는 것까지 확인 완료.

성공 기준:

- 업로드 후 URL이 `/uploads/portfolio/...`가 아니어야 한다.
- `mainImageUrl`이 Naver Object Storage public URL이어야 한다.
- 고객 화면에서 이미지가 표시되어야 한다.

이미지가 업로드는 되지만 고객 화면에서 깨질 경우 확인할 항목:

- `NAVER_OBJECT_STORAGE_PUBLIC_BASE_URL`이 실제 공개 접근 가능한 base URL인지
- 버킷 또는 객체 public 접근 정책이 허용되어 있는지
- `mainImageUrl`에 저장된 URL을 브라우저에서 직접 열 수 있는지
- 제작 사례 공개 조건이 충족되어 있는지

## 8. QuoteRule 데이터/계산기 확인 결과

코드 기준:

- `/admin/quote-rules`는 DB의 `QuoteRule` 목록을 조회한다.
- 새 Supabase DB에서는 `QuoteRule` 데이터가 비어 있을 수 있다.
- `/admin/quote-calculator`는 활성화된 `QuoteRule`이 없으면 앱 내부 `DEFAULT_QUOTE_RULES` fallback으로 계산기를 렌더링한다.

따라서 `QuoteRule` DB 데이터가 비어 있어도 계산기 화면 자체는 동작하도록 설계되어 있다.

추가 확인 필요:

- `/admin/quote-rules`에서 실제 룰 데이터가 있는지 확인.
- 운영용 견적 룰이 필요하면 기존 스크립트 `pnpm quote-rules:seed` 실행 여부를 별도 판단해야 한다.
- 운영용 수치가 필요한 영역이므로 임의 seed 실행은 하지 않았다.

## 9. `/admin/leads` 상세 확인 결과

사용자 확인 결과:

- 고객 견적 문의 저장 성공.
- Supabase `Lead` 테이블에 저장 확인 완료.
- 관리자 페이지 접근 성공.

추가 확인 필요:

- `/admin/leads`에서 최근 테스트 문의가 목록에 보이는지 확인.
- 리드 상세 페이지에서 고객명, 연락처, 문의 내용, 패키지 제작 정보, 제작 준비도 값이 깨지지 않는지 확인.
- 경로는 `/admin/leads`이다. `/admin/lead`는 존재하지 않는다.

## 10. CSV export 확인 결과

코드 기준:

- CSV export API는 `/api/admin/leads/export`이다.
- 관리자 인증이 필요하다.
- UTF-8 BOM을 붙여 Excel 한글 깨짐을 줄이는 구조다.
- 모든 CSV 값은 큰따옴표로 escape 처리된다.
- 패키지 문의 필드도 CSV 뒤쪽 컬럼에 포함된다.

추가 확인 필요:

- `/admin/leads`에서 CSV export 버튼을 눌러 다운로드되는지 확인.
- Excel 또는 Google Sheets에서 한글이 정상 표시되는지 확인.
- 최근 테스트 리드의 패키지 종류, 수량, 제작 준비도, 후가공, 체크리스트가 포함되는지 확인.

## 11. `SITE_ACCESS_ENABLED` 공개 설정 확인 결과

코드 기준:

- `SITE_ACCESS_ENABLED="true"`이면 `/access`를 먼저 통과해야 한다.
- 이 상태에서는 고객도 견적 문의폼과 제작 사례 페이지를 바로 볼 수 없다.
- Preview 테스트에는 `true`가 적합하다.
- 실제 공개 운영 전에는 고객 접근 정책에 맞춰 사용자가 직접 결정해야 한다.

권장 판단 기준:

```txt
Preview / 내부 테스트: SITE_ACCESS_ENABLED=true
외부 공개 운영: SITE_ACCESS_ENABLED=false 또는 공개 범위 재검토
```

추가 확인 필요:

- Vercel Environment Variables에서 `SITE_ACCESS_ENABLED` 값 확인.
- `NEXT_PUBLIC_SITE_URL`이 현재 대표 Production URL 또는 실제 공개 도메인과 일치하는지 확인.

## 12. 발견한 문제

현재까지 확인된 문제/주의점:

1. `/admin/lead`는 잘못된 경로다. 정상 경로는 `/admin/leads`이다.
2. 제작 사례가 고객 화면에 보이려면 단순 저장만으로는 부족하고, `PUBLISHED + publicApprovalConfirmed=true` 조건이 필요하다.
3. Naver Object Storage 업로드는 확인됐지만, 고객 화면 이미지 표시는 실제 공개 URL 접근 권한과 제작 사례 공개 조건을 함께 확인해야 한다.
4. 새 Supabase DB에서는 `QuoteRule` 데이터가 비어 있을 수 있다. 계산기는 fallback으로 열릴 수 있으나 운영 룰 데이터는 별도 확인이 필요하다.
5. 현재 Codex 로컬 셸에서는 `node`와 `pnpm`이 PATH에 잡히지 않아 로컬 검증 명령을 실행할 수 없었다.

## 13. 수정한 파일 목록

이번 작업에서 코드 로직은 수정하지 않았다.

신규 작성:

```txt
docs/gpt-report-final-operational-qa-20260625.md
```

DB schema 변경 없음.  
새 migration 생성 없음.  
기능 추가 없음.

## 14. 실행한 명령과 결과

확인 명령:

```txt
where.exe node
where.exe pnpm
Get-Content package.json
Get-Content src/lib/storage/portfolio-storage.ts
Get-Content src/lib/portfolio-utils.ts
Get-Content src/app/api/admin/leads/export/route.ts
Get-Content src/app/admin/quote-calculator/page.tsx
```

결과:

- `node`: 현재 Codex 로컬 셸 PATH에서 찾을 수 없음.
- `pnpm`: 현재 Codex 로컬 셸 PATH에서 찾을 수 없음.
- `package.json` 기준 검증 스크립트는 존재함.

실행하지 못한 명령:

```txt
pnpm deployment:check
pnpm test
pnpm build
```

사유:

- 현재 로컬 Codex 셸에서 `node`와 `pnpm` 실행 파일이 PATH에 잡히지 않는다.
- Vercel 배포 빌드와 사용자 브라우저 기준 주요 운영 흐름은 별도 확인됐다.

사용자 환경 또는 Vercel 배포 전후에 다시 실행 권장:

```txt
pnpm deployment:check
pnpm test
pnpm build
```

## 15. 남은 위험 요소

운영 공개 전 남은 위험 요소:

1. `SITE_ACCESS_ENABLED`를 공개 전 어떻게 둘지 결정해야 한다.
2. `NEXT_PUBLIC_SITE_URL`이 최종 Production 도메인과 일치해야 한다.
3. Naver Object Storage public base URL과 버킷 공개 정책이 실제 고객 브라우저에서 안정적으로 동작하는지 확인해야 한다.
4. `QuoteRule` 운영 데이터가 비어 있다면 기본 룰 seed 또는 관리자 입력이 필요할 수 있다.
5. Supabase DB는 생성됐지만 초기 운영 데이터가 거의 없으므로 테스트 데이터와 실제 운영 데이터를 구분해야 한다.
6. CSV export는 코드상 BOM/escape 처리가 되어 있으나 실제 Excel 한글 표시 확인이 필요하다.
7. 제작 사례 공개 조건을 놓치면 관리자에는 보이지만 고객 화면에는 안 보일 수 있다.

## 16. 다음에 해야 할 일

운영 공개 전 권장 순서:

1. `/admin/portfolio/new`에서 테스트 제작 사례를 하나 저장한다.
2. 저장된 사례가 `/admin/portfolio`에 보이는지 확인한다.
3. 상태를 `PUBLISHED`, 공개 승인 확인을 `true`로 맞춘다.
4. `/portfolio`와 `/portfolio/{slug}`에서 이미지가 보이는지 확인한다.
5. `/admin/quote-rules`에서 운영 룰 데이터 존재 여부를 확인한다.
6. 필요하면 기존 `quote-rules:seed` 실행 여부를 별도 결정한다.
7. `/admin/leads`에서 테스트 문의 상세를 확인한다.
8. CSV export를 다운로드해 한글과 패키지 필드가 정상인지 확인한다.
9. 운영 공개 전 `SITE_ACCESS_ENABLED` 값을 최종 결정한다.
10. 최종 도메인 연결 후 `NEXT_PUBLIC_SITE_URL`을 실제 도메인으로 맞춘다.

