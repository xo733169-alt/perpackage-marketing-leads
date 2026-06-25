import { describe, expect, it } from "vitest";
import {
  getCustomerResponseActivityMessage,
  getCustomerResponseActivityType,
  stringifyActivityMetadata
} from "@/lib/quote-activity";

describe("quote activity helper", () => {
  it("maps customer responses to activity types and messages", () => {
    expect(getCustomerResponseActivityType("ACCEPTED")).toBe("CUSTOMER_ACCEPTED");
    expect(getCustomerResponseActivityMessage("ACCEPTED")).toBe("고객이 견적안을 수락했습니다.");
    expect(getCustomerResponseActivityType("REJECTED")).toBe("CUSTOMER_REJECTED");
    expect(getCustomerResponseActivityMessage("REVISION_REQUESTED")).toBe("고객이 수정 요청을 남겼습니다.");
  });

  it("serializes metadata without mutating values", () => {
    expect(stringifyActivityMetadata({ shareLinkId: "link_1", responseType: "ACCEPTED" })).toBe(
      JSON.stringify({ shareLinkId: "link_1", responseType: "ACCEPTED" })
    );
    expect(stringifyActivityMetadata(null)).toBeNull();
  });
});
