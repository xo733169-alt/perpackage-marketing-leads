import { NextResponse } from "next/server";
import { isAdminAuthenticated, isAllowedMutationOrigin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewLogCreateSchema, UPLOADED_FILE_STATUS_UPLOADED } from "@/lib/print-file-upload-schema";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = reviewLogCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "검수 메모를 확인해 주세요." }, { status: 400 });
  }

  const project = await prisma.uploadProject.findUnique({
    where: { id: params.id },
    select: { id: true }
  });

  if (!project) {
    return NextResponse.json({ message: "업로드 프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  if (parsed.data.fileId) {
    const file = await prisma.uploadedFile.findFirst({
      where: {
        id: parsed.data.fileId,
        projectId: params.id
      },
      select: { id: true }
    });

    if (!file) {
      return NextResponse.json({ message: "업로드 파일을 찾을 수 없습니다." }, { status: 404 });
    }
  }

  const log = await prisma.$transaction(async (tx) => {
    const loggedAt = new Date();
    const createdLog = await tx.fileReviewLog.create({
      data: {
        projectId: params.id,
        fileId: parsed.data.fileId ?? null,
        status: parsed.data.status,
        message: parsed.data.message,
        createdBy: "admin",
        createdAt: loggedAt
      }
    });

    await tx.uploadProject.update({
      where: { id: params.id },
      data: {
        status: parsed.data.status,
        reviewStatus: parsed.data.status
      }
    });

    if (parsed.data.fileId) {
      await tx.uploadedFile.update({
        where: { id: parsed.data.fileId },
        data: { reviewStatus: parsed.data.status }
      });
    } else {
      await tx.uploadedFile.updateMany({
        where: {
          projectId: params.id,
          uploadStatus: UPLOADED_FILE_STATUS_UPLOADED
        },
        data: { reviewStatus: parsed.data.status }
      });
    }

    return createdLog;
  });

  return NextResponse.json({ log }, { status: 201 });
}
