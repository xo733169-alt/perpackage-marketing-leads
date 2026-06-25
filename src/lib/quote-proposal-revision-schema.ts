import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

export const quoteProposalRevisionSchema = z.object({
  revisionReason: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(500, "수정 사유는 500자 이하로 입력해 주세요.").optional()
  )
});

export type QuoteProposalRevisionInput = z.infer<typeof quoteProposalRevisionSchema>;

export function getRevisionReasonFromCustomerResponse(
  adminReason: string | null | undefined,
  customerResponseMessage: string | null | undefined
) {
  const cleanedAdminReason = adminReason?.trim();
  if (cleanedAdminReason) return cleanedAdminReason;

  const cleanedCustomerMessage = customerResponseMessage?.trim();
  if (cleanedCustomerMessage) return cleanedCustomerMessage.slice(0, 500);

  return null;
}
