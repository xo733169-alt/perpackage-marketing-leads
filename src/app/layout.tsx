import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "페르패키지 | 맞춤 패키지·싸바리박스 제작 문의",
  description: "싸바리박스, 자석박스, 상하짝박스, 서랍형박스 등 브랜드 맞춤 패키지 제작 견적을 문의하세요.",
  openGraph: {
    title: "페르패키지 | 맞춤 패키지·싸바리박스 제작 문의",
    description: "싸바리박스, 자석박스, 상하짝박스, 서랍형박스 등 브랜드 맞춤 패키지 제작 견적을 문의하세요.",
    locale: "ko_KR",
    siteName: "페르패키지",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "페르패키지",
    address: {
      "@type": "PostalAddress",
      addressLocality: "서울특별시 중구",
      streetAddress: "을지로"
    },
    areaServed: "KR",
    description: "맞춤형 고급 패키지 박스 제작 및 견적 상담"
  };

  return (
    <html lang="ko">
      <body className="min-h-screen font-sans antialiased">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
