import { afterEach, describe, expect, it } from "vitest";
import { buildLeadNotificationPayload } from "@/lib/notifications";

const previousSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = previousSiteUrl;
});

describe("buildLeadNotificationPayload", () => {
  it("builds a privacy-conscious webhook payload with adminUrl when site URL exists", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://perpackage.example";

    const payload = buildLeadNotificationPayload({
      id: "lead_1",
      customerName: "홍길동",
      companyName: "페르패키지",
      industry: "화장품",
      boxType: "싸바리박스",
      quantityRange: "300~500개",
      leadScore: 70,
      createdAt: new Date("2026-06-20T03:00:00.000Z")
    });

    expect(payload).toEqual({
      leadId: "lead_1",
      customerName: "홍길동",
      companyName: "페르패키지",
      industry: "화장품",
      boxType: "싸바리박스",
      quantityRange: "300~500개",
      leadScore: 70,
      createdAt: "2026-06-20T03:00:00.000Z",
      adminUrl: "https://perpackage.example/admin/leads/lead_1"
    });
    expect(payload).not.toHaveProperty("phone");
    expect(payload).not.toHaveProperty("email");
  });

  it("omits adminUrl when site URL is missing", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;

    const payload = buildLeadNotificationPayload({
      id: "lead_2",
      customerName: "김고객",
      companyName: null,
      industry: "식품",
      boxType: "자석박스",
      quantityRange: "1000개 이상",
      leadScore: 80,
      createdAt: new Date("2026-06-20T03:00:00.000Z")
    });

    expect(payload.adminUrl).toBeUndefined();
  });
});
