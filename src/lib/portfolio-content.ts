export type PortfolioContentInput = {
  title?: string | null;
  industry?: string | null;
  boxType?: string | null;
  productName?: string | null;
  quantityRange?: string | null;
  finishingOptions?: string[] | null;
  boardThickness?: string | null;
  paperType?: string | null;
  printOption?: string | null;
  isClientNamePublic?: boolean | null;
  clientName?: string | null;
};

const slugTerms: Array<[RegExp, string]> = [
  [/화장품/g, "cosmetic"],
  [/건강기능식품/g, "health-supplement"],
  [/식품/g, "food"],
  [/의류/g, "apparel"],
  [/주얼리/g, "jewelry"],
  [/생활용품/g, "lifestyle"],
  [/선물세트/g, "gift-set"],
  [/싸바리박스/g, "rigid-box"],
  [/자석박스/g, "magnetic-box"],
  [/상하짝박스/g, "lid-base-box"],
  [/서랍형박스/g, "drawer-box"],
  [/단상자/g, "folding-carton"],
  [/패키지/g, "package"],
  [/박스/g, "box"],
  [/제작/g, "production"],
  [/사례/g, "case"],
  [/브랜드/g, "brand"],
  [/프리미엄|고급/g, "premium"],
  [/맞춤/g, "custom"]
];

function clean(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function listText(value: string[] | null | undefined): string {
  return (value ?? []).map((item) => item.trim()).filter(Boolean).join(", ");
}

export function generatePortfolioSlug(input: string | PortfolioContentInput): string {
  const source =
    typeof input === "string"
      ? input
      : [input.industry, input.productName, input.boxType, "제작 사례"].filter(Boolean).join(" ");

  let slug = source.trim().toLowerCase();
  slugTerms.forEach(([pattern, replacement]) => {
    slug = slug.replace(pattern, ` ${replacement} `);
  });

  slug = slug
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || "portfolio-case";
}

export function generatePortfolioTitle(input: PortfolioContentInput): string {
  const industry = clean(input.industry) || "브랜드";
  const boxType = clean(input.boxType) || "맞춤 박스";
  const productName = clean(input.productName);

  if (productName) {
    return `${productName} ${boxType} 제작 사례`;
  }

  return `${industry} 브랜드용 프리미엄 ${boxType} 제작 사례`;
}

export function generatePortfolioShortDescription(input: PortfolioContentInput): string {
  const industry = clean(input.industry) || "브랜드";
  const boxType = clean(input.boxType) || "맞춤 박스";
  const finishing = listText(input.finishingOptions);

  if (finishing) {
    return `${finishing} 포인트를 적용해 브랜드 이미지를 살린 ${industry} ${boxType} 제작 사례입니다.`;
  }

  return `제품 특성과 브랜드 방향에 맞춰 구조와 사양을 정리한 ${industry} ${boxType} 제작 사례입니다.`;
}

export function generatePortfolioSeoTitle(input: PortfolioContentInput): string {
  const industry = clean(input.industry);
  const boxType = clean(input.boxType) || "맞춤 패키지";
  return `${industry ? `${industry} ` : ""}${boxType} 제작 사례 | 페르패키지`;
}

export function generatePortfolioSeoDescription(input: PortfolioContentInput): string {
  const industry = clean(input.industry) || "브랜드";
  const boxType = clean(input.boxType) || "맞춤 패키지";
  return `페르패키지의 ${industry} 브랜드용 ${boxType} 제작 사례입니다. 구조, 인쇄, 후가공, 수량 조건에 맞춰 맞춤 패키지 제작 상담을 도와드립니다.`;
}

export function generatePortfolioOverview(input: PortfolioContentInput): string {
  const title = generatePortfolioTitle(input);
  const quantity = clean(input.quantityRange);
  const paper = clean(input.paperType);
  const board = clean(input.boardThickness);
  const publicClient = input.isClientNamePublic && clean(input.clientName) ? `${clean(input.clientName)}의 ` : "";

  return `${publicClient}${title}입니다. 제품의 판매 환경과 브랜드 인상을 고려해 구조, 소재, 인쇄, 후가공 조건을 함께 검토했습니다.${
    quantity ? ` 제작 수량은 ${quantity} 기준으로 상담했습니다.` : ""
  }${paper || board ? ` 주요 소재 조건은 ${[paper, board].filter(Boolean).join(", ")}입니다.` : ""}`;
}

export function generateSpecificationSummary(input: PortfolioContentInput): string {
  const specs = [
    clean(input.industry) ? `업종: ${clean(input.industry)}` : "",
    clean(input.boxType) ? `박스 종류: ${clean(input.boxType)}` : "",
    clean(input.quantityRange) ? `제작 수량: ${clean(input.quantityRange)}` : "",
    clean(input.paperType) ? `사용 지류: ${clean(input.paperType)}` : "",
    clean(input.boardThickness) ? `보드 두께: ${clean(input.boardThickness)}` : "",
    clean(input.printOption) ? `인쇄 사양: ${clean(input.printOption)}` : "",
    listText(input.finishingOptions) ? `후가공: ${listText(input.finishingOptions)}` : ""
  ].filter(Boolean);

  return specs.length ? specs.join("\n") : "세부 사양은 상담 과정에서 확인 후 정리합니다.";
}

export function generatePortfolioTags(input: PortfolioContentInput): string[] {
  const tags = [
    clean(input.industry),
    clean(input.boxType),
    clean(input.productName),
    clean(input.quantityRange),
    ...(input.finishingOptions ?? [])
  ]
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set(tags));
}
