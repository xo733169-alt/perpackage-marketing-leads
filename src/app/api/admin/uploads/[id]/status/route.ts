import { NextResponse } from "next/server";
import { isAdminAuthenticated, isAllowedMutationOrigin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminUploadStatusSchema, UPLOADED_FILE_STATUS_UPLOADED } from "@/lib/print-file-upload-schema";
import { getPrintFileReviewStatusLabel } from "@/lib/admin-uploads";

function cleanText(value: string | undefined) {
  if (value === undefined) return undefined;
  return value.trim() || null;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = adminUploadStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "검수 상태를 확인해 주세요." }, { status: 400 });
  }

  const existingProject = await prisma.uploadProject.findUnique({
    where: { id: params.id },
    select: { id: true }
  });

  if (!existingProject) {
    return NextResponse.json({ message: "업로드 프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  const project = await prisma.$transaction(async (tx) => {
    const loggedAt = new Date();
    const updatedProject = await tx.uploadProject.update({
      where: { id: params.id },
      data: {
        status: parsed.data.reviewStatus,
        reviewStatus: parsed.data.reviewStatus,
        adminMemo: cleanText(parsed.data.adminMemo)
      }
    });

    await tx.uploadedFile.updateMany({
      where: {
        projectId: params.id,
        uploadStatus: UPLOADED_FILE_STATUS_UPLOADED
      },
      data: {
        reviewStatus: parsed.data.reviewStatus
      }
    });

    await tx.fileReviewLog.create({
      data: {
        projectId: params.id,
        status: parsed.data.reviewStatus,
        message: `검수 상태가 ${getPrintFileReviewStatusLabel(parsed.data.reviewStatus)}로 변경되었습니다.`,
        createdBy: "admin",
        createdAt: loggedAt
      }
    });

    return updatedProject;
  });

  return NextResponse.json({ project });
}
