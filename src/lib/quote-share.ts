import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import type { QuoteProposalStatus } from "./quote-proposal-schema";
import type { QuoteCustomerResponseType } from "./quote-share-schema";

export type ShareLinkVisibilityInput = {
  status: string;
  expiresAt: Date;
  revokedAt?: Date | null;
};

export function generateQuoteShareToken(): string {
  return crypto
    .randomBytes(32)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function hashQuoteShareToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getQuoteShareTokenPreview(token: string): string {
  return token.slice(-6);
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || "http://127.0.0.1:3000";
}

export function buildQuoteShareUrl(token: string, siteUrl = getSiteUrl()): string {
  return `${siteUrl.replace(/\/$/, "")}/q/${encodeURIComponent(token)}`;
}

export function getShareLinkExpiresAt(expiresInDays = 14, now = new Date()): Date {
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  return expiresAt;
}

export function isShareLinkExpired(link: Pick<ShareLinkVisibilityInput, "expiresAt">, now = new Date()): boolean {
  return link.expiresAt.getTime() <= now.getTime();
}

export function isShareLinkUsable(link: ShareLinkVisibilityInput | null | undefined, now = new Date()): boolean {
  if (!link) return false;
  if (link.status !== "ACTIVE") return false;
  if (link.revokedAt) return false;
  return !isShareLinkExpired(link, now);
}

export function getCustomerResponseProposalStatus(responseType: QuoteCustomerResponseType): QuoteProposalStatus {
  if (responseType === "ACCEPTED") return "ACCEPTED";
  if (responseType === "REJECTED") return "REJECTED";
  return "READY_TO_SEND";
}

export function buildLeadUpdateForCustomerResponse({
  responseType,
  orderConfirmedAt,
  confirmedOrderAmountKrw,
  proposalTotalAmountKrw,
  now = new Date()
}: {
  responseType: QuoteCustomerResponseType;
  orderConfirmedAt?: Date | null;
  confirmedOrderAmountKrw?: number | null;
  proposalTotalAmountKrw: number;
  now?: Date;
}): Prisma.LeadUncheckedUpdateInput | null {
  if (responseType !== "ACCEPTED") return null;

  return {
    status: "ORDER_CONFIRMED",
    orderConfirmedAt: orderConfirmedAt ?? now,
    confirmedOrderAmountKrw: confirmedOrderAmountKrw ?? proposalTotalAmountKrw
  };
}
