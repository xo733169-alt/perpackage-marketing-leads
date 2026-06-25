import { describe, expect, it } from "vitest";
import {
  quoteShareCustomerResponseSchema,
  quoteShareLinkCreateSchema
} from "@/lib/quote-share-schema";

describe("quote share schema", () => {
  it("validates share link creation", () => {
    expect(quoteShareLinkCreateSchema.parse({ expiresInDays: "14" })).toEqual({
      expiresInDays: 14,
      regenerate: false
    });

    expect(quoteShareLinkCreateSchema.safeParse({ expiresInDays: 120 }).success).toBe(false);
  });

  it("validates customer response type and optional fields", () => {
    expect(
      quoteShareCustomerResponseSchema.parse({
        responseType: "REVISION_REQUESTED",
        responderName: "담당자",
        message: "수량 변경 검토 부탁드립니다."
      })
    ).toEqual({
      responseType: "REVISION_REQUESTED",
      responderName: "담당자",
      message: "수량 변경 검토 부탁드립니다."
    });

    expect(quoteShareCustomerResponseSchema.safeParse({ responseType: "UNKNOWN" }).success).toBe(false);
    expect(
      quoteShareCustomerResponseSchema.safeParse({
        responseType: "ACCEPTED",
        message: "a".repeat(1001)
      }).success
    ).toBe(false);
  });
});
