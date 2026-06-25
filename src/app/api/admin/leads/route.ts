import { NextResponse } from "next/server";
import { buildLeadListQuery } from "@/lib/admin-leads";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const { where, orderBy } = buildLeadListQuery(searchParams);
  const leads = await prisma.lead.findMany({
    where,
    orderBy,
    take: 100
  });

  return NextResponse.json({ leads });
}
