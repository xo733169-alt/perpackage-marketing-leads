import { afterEach, describe, expect, it } from "vitest";
import { buildQuoteResponseNotificationPayload } from "@/lib/quote-response-notifications";

describe("quote response notification", () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it("builds a safe webhook payload without contact details or customer message", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://perpackage.example";
    const payload = buildQuoteResponseNotificationPayload({
      proposalId: "proposal_1",
      proposalNumber: "PPQ-20260620-0001",
      responseType: "ACCEPTED",
      createdAt: new Date("2026-06-20T00:00:00.000Z"),
      leadId: "lead_1"
    });

    expect(payload).toEqual({
      proposalId: "proposal_1",
      proposalNumber: "PPQ-20260620-0001",
      responseType: "ACCEPTED",
      createdAt: "2026-06-20T00:00:00.000Z",
      leadId: "lead_1",
      adminUrl: "https://perpackage.example/admin/quote-proposals/proposal_1"
    });
    expect(JSON.stringify(payload)).not.toContain("phone");
    expect(JSON.stringify(payload)).not.toContain("email");
    expect(JSON.stringify(payload)).not.toContain("message");
  });
});
