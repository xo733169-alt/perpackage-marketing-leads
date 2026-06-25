import { describe, expect, it } from "vitest";
import { getLeadSourceLabel } from "@/lib/source";

describe("getLeadSourceLabel", () => {
  it("prefers utmSource when it exists", () => {
    expect(getLeadSourceLabel({ utmSource: "google", referrer: "https://example.com" })).toBe("google");
  });

  it("uses external source when only referrer exists", () => {
    expect(getLeadSourceLabel({ referrer: "https://example.com" })).toBe("외부 유입");
  });

  it("falls back to direct source", () => {
    expect(getLeadSourceLabel({})).toBe("직접 유입");
  });
});
