import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated, isAllowedMutationOrigin } from "@/lib/auth";
import { CAFE24_LINKED_STATUS, CAFE24_LINK_SOURCE_MANUAL } from "@/lib/cafe24";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const linkOrderSchema = z.object({
  cafe24MallId: z.string().trim().max(80).optional(),
  cafe24OrderId: z.string().trim().max(120).optional(),
  cafe24OrderNo: z.string().trim().min(1, "Cafe24 주문번호를 입력해 주세요.").max(120),
  cafe24MemberId: z.string().trim().max(120).optional(),
  cafe24OrderMemo: z.string().trim().max(3000).optional()
});

function cleanOptional(value: string | undefined) {
  return value?.trim() || null;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "관리자 인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = linkOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "주문 연결 정보를 확인해 주세요." }, { status: 400 });
  }

  const existing = await prisma.uploadProject.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      cafe24OrderId: true,
      cafe24OrderNo: true,
      linkedAt: true
    }
  });

  if (!existing) {
    return NextResponse.json({ message: "업로드 프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  if (
    (existing.cafe24OrderId && parsed.data.cafe24OrderId && existing.cafe24OrderId !== parsed.data.cafe24OrderId) ||
    (existing.cafe24OrderNo && existing.cafe24OrderNo !== parsed.data.cafe24OrderNo)
  ) {
    return NextResponse.json({ message: "이미 다른 Cafe24 주문과 연결되어 있어 덮어쓸 수 없습니다." }, { status: 409 });
  }

  const now = new Date();
  const project = await prisma.$transaction(async (tx) => {
    const updated = await tx.uploadProject.update({
      where: { id: params.id },
      data: {
        cafe24MallId: cleanOptional(parsed.data.cafe24MallId),
        cafe24OrderId: cleanOptional(parsed.data.cafe24OrderId),
        cafe24OrderNo: parsed.data.cafe24OrderNo.trim(),
        cafe24MemberId: cleanOptional(parsed.data.cafe24MemberId),
        cafe24OrderMemo: cleanOptional(parsed.data.cafe24OrderMemo),
        linkedAt: existing.linkedAt ?? now,
        linkSource: CAFE24_LINK_SOURCE_MANUAL,
        orderSyncedAt: now,
        status: CAFE24_LINKED_STATUS
      }
    });

    if (!existing.linkedAt) {
      await tx.fileReviewLog.create({
        data: {
          projectId: params.id,
          status: CAFE24_LINKED_STATUS,
          message: "관리자가 Cafe24 주문을 수동 연결했습니다.",
          createdBy: "admin",
          createdAt: now
        }
      });
    }

    return updated;
  });

  return NextResponse.json({ project });
}
