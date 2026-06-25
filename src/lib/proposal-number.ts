import type { Prisma } from "@prisma/client";

export function getProposalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export function generateProposalNumber(date = new Date(), sequence = 1): string {
  return `PPQ-${getProposalDateKey(date)}-${String(sequence).padStart(4, "0")}`;
}

export function getProposalNumberPrefix(date = new Date()): string {
  return `PPQ-${getProposalDateKey(date)}-`;
}

export async function createUniqueProposalNumber(tx: Prisma.TransactionClient, date = new Date()) {
  const prefix = getProposalNumberPrefix(date);
  const count = await tx.quoteProposal.count({
    where: { proposalNumber: { startsWith: prefix } }
  });

  for (let sequence = count + 1; sequence < count + 1000; sequence += 1) {
    const proposalNumber = generateProposalNumber(date, sequence);
    const existing = await tx.quoteProposal.findUnique({
      where: { proposalNumber },
      select: { id: true }
    });

    if (!existing) return proposalNumber;
  }

  throw new Error("Unable to generate a unique proposal number.");
}
