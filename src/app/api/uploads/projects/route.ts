import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { isAllowedMutationOrigin } from "@/lib/auth";
import { CAFE24_ORDER_LINK_PENDING_STATUS } from "@/lib/cafe24";
import { prisma } from "@/lib/prisma";
import { toPrintFileFieldErrors, uploadProjectCreateSchema } from "@/lib/print-file-upload-schema";
import { buildUploadCode, getUploadCodeDailyPrefix } from "@/lib/upload-code";

function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ message, ...extra }, { status });
}

function isUploadCodeConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function POST(request: Request) {
  if (!isAllowedMutationOrigin(request)) {
    return jsonError("허용되지 않은 요청입니다.", 403);
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = uploadProjectCreateSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("입력 내용을 다시 확인해 주세요.", 400, {
        fieldErrors: toPrintFileFieldErrors(parsed.error)
      });
    }

    const input = parsed.data;
    const hasCafe24OrderNumber = Boolean(input.cafe24OrderNumber?.trim());
    const dailyPrefix = getUploadCodeDailyPrefix();
    const dailyCount = await prisma.uploadProject.count({
      where: {
        uploadCode: {
          startsWith: dailyPrefix
        }
      }
    });
    const baseData = {
      cafe24OrderNumber: input.cafe24OrderNumber ?? "",
      companyName: input.companyName ?? input.customerName,
      contactName: input.contactName ?? null,
      customerName: input.customerName,
      phone: input.phone,
      email: input.email ?? null,
      kakaoId: input.kakaoId ?? null,
      contactMethod: input.contactMethod ?? null,
      productName: input.productName ?? "",
      productOptionText: input.productOptionText ?? null,
      requestMemo: input.requestMemo ?? null,
      privacyAgreed: input.privacyConsent,
      status: hasCafe24OrderNumber ? "upload_waiting" : CAFE24_ORDER_LINK_PENDING_STATUS,
      reviewStatus: "upload_waiting"
    };
    const select = {
      id: true,
      uploadCode: true,
      cafe24OrderNumber: true,
      companyName: true,
      contactName: true,
      customerName: true,
      phone: true,
      email: true,
      productName: true,
      createdAt: true,
      status: true,
      reviewStatus: true
    } as const;
    let project;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      try {
        project = await prisma.uploadProject.create({
          data: {
            ...baseData,
            uploadCode: buildUploadCode(dailyCount + attempt + 1)
          },
          select
        });
        break;
      } catch (error) {
        if (!isUploadCodeConflict(error) || attempt === 9) throw error;
      }
    }

    if (!project) {
      return jsonError("업로드 접수번호를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.", 500);
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("[api/uploads/projects] create failed", error);
    return jsonError("업로드 정보를 저장하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.", 500);
  }
}
