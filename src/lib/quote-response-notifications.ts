type QuoteResponseNotificationInput = {
  proposalId: string;
  proposalNumber: string;
  responseType: string;
  createdAt: Date;
  leadId: string | null;
};

export type QuoteResponseNotificationPayload = {
  proposalId: string;
  proposalNumber: string;
  responseType: string;
  createdAt: string;
  adminUrl?: string;
  leadId?: string;
};

export function buildQuoteResponseNotificationPayload(
  response: QuoteResponseNotificationInput
): QuoteResponseNotificationPayload {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");

  return {
    proposalId: response.proposalId,
    proposalNumber: response.proposalNumber,
    responseType: response.responseType,
    createdAt: response.createdAt.toISOString(),
    ...(response.leadId ? { leadId: response.leadId } : {}),
    ...(siteUrl ? { adminUrl: `${siteUrl}/admin/quote-proposals/${response.proposalId}` } : {})
  };
}

export async function notifyQuoteResponseCreated(response: QuoteResponseNotificationInput): Promise<void> {
  const webhookUrl = process.env.QUOTE_RESPONSE_WEBHOOK_URL?.trim();
  if (!webhookUrl) return;

  try {
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildQuoteResponseNotificationPayload(response))
    });

    if (!webhookResponse.ok) {
      console.error("Quote response notification webhook failed.");
    }
  } catch {
    console.error("Quote response notification webhook failed.");
  }
}
