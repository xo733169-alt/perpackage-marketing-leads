import { describe, expect, it } from "vitest";
import {
  buildLeadUpdateForCustomerResponse,
  buildQuoteShareUrl,
  generateQuoteShareToken,
  getCustomerResponseProposalStatus,
  getQuoteShareTokenPreview,
  getShareLinkExpiresAt,
  hashQuoteShareToken,
  isShareLinkUsable
} from "@/lib/quote-share";

describe("quote share helper", () => {
  it("generates a token, hash, preview, and share URL without storing the raw token", () => {
    const token = generateQuoteShareToken();
    const hash = hashQuoteShareToken(token);

    expect(token.length).toBeGreaterThan(30);
    expect(hash).toHaveLength(64);
    expect(hash).not.toContain(token);
    expect(getQuoteShareTokenPreview(token)).toBe(token.slice(-6));
    expect(buildQuoteShareUrl(token, "https://perpackage.example")).toBe(
      `https://perpackage.example/q/${encodeURIComponent(token)}`
    );
  });

  it("checks active, revoked, and expired share links", () => {
    const now = new Date("2026-06-20T00:00:00.000Z");

    expect(
      isShareLinkUsable(
        {
          status: "ACTIVE",
          expiresAt: getShareLinkExpiresAt(14, now),
          revokedAt: null
        },
        now
      )
    ).toBe(true);

    expect(
      isShareLinkUsable(
        {
          status: "REVOKED",
          expiresAt: getShareLinkExpiresAt(14, now),
          revokedAt: now
        },
        now
      )
    ).toBe(false);

    expect(
      isShareLinkUsable(
        {
          status: "ACTIVE",
          expiresAt: new Date("2026-06-19T00:00:00.000Z"),
          revokedAt: null
        },
        now
      )
    ).toBe(false);
  });

  it("maps customer responses to proposal and lead updates", () => {
    const now = new Date("2026-06-20T00:00:00.000Z");

    expect(getCustomerResponseProposalStatus("ACCEPTED")).toBe("ACCEPTED");
    expect(getCustomerResponseProposalStatus("REJECTED")).toBe("REJECTED");
    expect(getCustomerResponseProposalStatus("REVISION_REQUESTED")).toBe("READY_TO_SEND");

    expect(
      buildLeadUpdateForCustomerResponse({
        responseType: "ACCEPTED",
        orderConfirmedAt: null,
        confirmedOrderAmountKrw: null,
        proposalTotalAmountKrw: 1650000,
        now
      })
    ).toEqual({
      status: "ORDER_CONFIRMED",
      orderConfirmedAt: now,
      confirmedOrderAmountKrw: 1650000
    });

    expect(
      buildLeadUpdateForCustomerResponse({
        responseType: "REVISION_REQUESTED",
        proposalTotalAmountKrw: 1650000
      })
    ).toBeNull();
  });
});
