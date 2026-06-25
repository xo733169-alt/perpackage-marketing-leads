import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { isAdminAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

const sections = [
  {
    title: "운영 전 필수 설정",
    items: [
      "ADMIN_PASSWORD 실제 값 설정",
      "NEXT_PUBLIC_SITE_URL 실제 배포 URL 설정",
      "NEXT_PUBLIC_KAKAO_CHANNEL_URL 실제 카카오톡 채널 URL 설정",
      "운영 DB 결정",
      "백업 정책 결정"
    ]
  },
  {
    title: "Vercel 배포 확인",
    items: [
      "DATABASE_URL 설정",
      "ADMIN_PASSWORD 설정",
      "NEXT_PUBLIC_SITE_URL 설정",
      "SITE_ACCESS_ENABLED 설정 확인",
      "SITE_ACCESS_PASSWORD와 ADMIN_PASSWORD 분리",
      "Preview Deployment 확인",
      "Production Deployment 전 최종 확인"
    ]
  },
  {
    title: "DB/백업 확인",
    items: [
      "Preview DB에 실제 고객 데이터 없음",
      "운영 DB 결정",
      "운영 DB 백업 방식 결정",
      "마이그레이션 적용 방법 확인",
      "테스트 문의 삭제 확인"
    ]
  },
  {
    title: "보안 확인",
    items: [
      "관리자 URL 공유 주의",
      "관리자 비밀번호 변경 주기",
      "공유 견적 링크 외부 공개 금지",
      "/q noindex/nofollow 유지",
      "개인정보 삭제 요청 처리 절차 확인"
    ]
  },
  {
    title: "운영 전 테스트",
    items: [
      "견적 문의 접수 테스트",
      "관리자 리드 확인",
      "견적안 작성 테스트",
      "공유 링크 생성 테스트",
      "고객 응답 테스트",
      "업무/후속 연락 테스트",
      "테스트 데이터 삭제"
    ]
  },
  {
    title: "제작 사례 공개 전 확인",
    items: [
      "고객사명 공개 허용 여부",
      "제품명 공개 가능 여부",
      "이미지 사용 허가 여부",
      "민감한 수량/단가/거래처 정보 제거",
      "SEO 제목/설명 확인",
      "견적 확정처럼 보이는 표현 없음"
    ]
  },
  {
    title: "문의 관리 확인",
    items: [
      "테스트 문의 접수",
      "개인정보 동의 저장 확인",
      "UTM 저장 확인",
      "관리자 상세 확인",
      "테스트 문의 삭제 확인"
    ]
  },
  {
    title: "성과 관리 확인",
    items: [
      "마케팅 비용 수동 입력 기준 확인",
      "캠페인 UTM 값과 비용 기록 매칭 확인",
      "주문 확정 리드의 내부 금액 기록 확인",
      "후속 연락 필요 리드 확인",
      "광고비/매출 지표는 참고 지표로만 해석"
    ]
  },
  {
    title: "참고 견적 룰 확인",
    items: [
      "기본 견적 룰 placeholder 단가 검토",
      "박스 종류와 수량 구간별 실제 제작 기준 반영",
      "후가공/인쇄/난이도 배율 과대 또는 과소 여부 확인",
      "공개 견적 미리보기가 확정 견적처럼 보이지 않는지 확인",
      "상담 후 최종 견적 안내 문구 유지"
    ]
  }
];

export default function AdminChecklistPage() {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6">
          <AdminNav currentPath="/admin/checklist" />
          <div>
            <p className="text-sm font-bold text-brass">관리자</p>
            <h1 className="mt-2 text-3xl font-black text-ink">운영 체크리스트</h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              배포 전 설정, 제작 사례 공개, 문의 관리, 성과 지표 운영 기준을 빠르게 점검하는 페이지입니다.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {sections.map((section) => (
            <section key={section.title} className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">{section.title}</h2>
              <ul className="mt-4 space-y-3">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-charcoal">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brass" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
