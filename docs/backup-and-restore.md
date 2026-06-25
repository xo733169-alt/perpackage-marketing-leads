# 백업 및 복구 운영 가이드

이 문서는 페르패키지 마케팅 리드 관리 시스템의 데이터 백업과 복구 기준을 정리합니다.

## 현재 SQLite 기준 백업

현재 로컬 개발 DB는 SQLite 파일입니다.

- 기본 로컬 DB: `prisma/dev.db`
- Vercel preview용 sanitized DB: `prisma/preview.db`

SQLite 파일을 백업할 때는 앱이 쓰기 작업을 하지 않는 시점에 복사하는 것을 권장합니다.

예시:

```text
backups/perpackage-dev-2026-06-20.db
```

주의:

- 실제 고객 정보가 들어 있는 DB 파일을 Git이나 public 저장소에 올리지 않습니다.
- OneDrive, 메신저, 외부 공유 링크로 실제 DB를 공유하지 않습니다.
- preview DB에는 실제 고객 데이터가 없어야 합니다.

## Vercel Preview DB 기준

`prisma/preview.db`는 화면 확인과 private preview 테스트용입니다.

- 실제 고객 문의 저장용으로 사용하지 않습니다.
- 민감한 lead, quote proposal, communication log를 넣지 않습니다.
- 배포 전 sanitized 상태인지 확인합니다.

## 수동 export 전략

현재 시스템에서 우선 활용할 수 있는 수동 export:

- 리드 CSV export
- 마케팅 비용 목록
- 제작 사례 import JSON
- 견적 룰 seed script

운영 전에는 최소한 리드 CSV export가 정상 동작하는지 확인합니다.

## PostgreSQL 전환 후 백업

실제 운영 DB는 managed PostgreSQL을 권장합니다.

운영 기준:

- 관리형 DB의 자동 백업 기능을 켭니다.
- 주요 배포 전 수동 snapshot을 생성합니다.
- migration 실행 전 백업을 생성합니다.
- 월 1회 이상 복구 테스트를 계획합니다.

## 복구 체크리스트

1. 복구 대상 DB와 백업 파일을 확인합니다.
2. 가능한 경우 maintenance window를 잡습니다.
3. 앱 쓰기 작업을 중단하거나 관리자 작업을 멈춥니다.
4. DB를 복구합니다.
5. `prisma generate`를 실행합니다.
6. 관리자 페이지가 열리는지 확인합니다.
7. lead, quote proposal, portfolio case count를 확인합니다.
8. 민감하지 않은 테스트 기록으로 생성/수정/삭제를 확인합니다.
9. 복구 완료 시간을 기록합니다.

## 삭제 요청 대응

고객이 개인정보 삭제를 요청하면 관리자 lead detail에서 해당 문의를 삭제합니다. 삭제 전 필요한 내부 기록 보존 여부와 법적 보존 의무가 있는지 확인합니다.

## 제한 사항

이 Phase 8에서는 자동 백업 job을 만들지 않습니다. 실제 운영 전 PostgreSQL 전환과 함께 DB provider의 백업 기능을 사용해야 합니다.
