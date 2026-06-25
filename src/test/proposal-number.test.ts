import { describe, expect, it } from "vitest";
import { generateProposalNumber, getProposalNumberPrefix } from "@/lib/proposal-number";

describe("proposal number", () => {
  it("generates readable sequential proposal numbers", () => {
    const date = new Date("2026-06-20T10:00:00");

    expect(generateProposalNumber(date, 1)).toBe("PPQ-20260620-0001");
    expect(generateProposalNumber(date, 27)).toBe("PPQ-20260620-0027");
    expect(getProposalNumberPrefix(date)).toBe("PPQ-20260620-");
  });
});
