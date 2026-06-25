type LeadNotificationInput = {
  id: string;
  customerName: string;
  companyName: string | null;
  industry: string;
  boxType: string;
  quantityRange: string;
  leadScore: number;
  createdAt: Date;
};

export type LeadNotificationPayload = {
  leadId: string;
  customerName: string;
  companyName: string | null;
  industry: string;
  boxType: string;
  quantityRange: string;
  leadScore: number;
  createdAt: string;
  adminUrl?: string;
};

export function buildLeadNotificationPayload(lead: LeadNotificationInput): LeadNotificationPayload {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");

  return {
    leadId: lead.id,
    customerName: lead.customerName,
    companyName: lead.companyName,
    industry: lead.industry,
    boxType: lead.boxType,
    quantityRange: lead.quantityRange,
    leadScore: lead.leadScore,
    createdAt: lead.createdAt.toISOString(),
    ...(siteUrl ? { adminUrl: `${siteUrl}/admin/leads/${lead.id}` } : {})
  };
}

export async function notifyLeadCreated(lead: LeadNotificationInput): Promise<void> {
  const webhookUrl = process.env.LEAD_NOTIFICATION_WEBHOOK_URL?.trim();
  if (!webhookUrl) return;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildLeadNotificationPayload(lead))
    });

    if (!response.ok) {
      console.error("Lead notification webhook failed.");
    }
  } catch {
    console.error("Lead notification webhook failed.");
  }
}
