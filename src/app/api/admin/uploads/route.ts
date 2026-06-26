import { NextResponse } from "next/server";
import { buildUploadProjectListQuery } from "@/lib/admin-uploads";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UPLOADED_FILE_STATUS_UPLOADED } from "@/lib/print-file-upload-schema";

export async function GET(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const { where, orderBy } = buildUploadProjectListQuery(searchParams);
  const projects = await prisma.uploadProject.findMany({
    where,
    orderBy,
    include: {
      files: {
        where: { uploadStatus: UPLOADED_FILE_STATUS_UPLOADED },
        select: {
          id: true,
          uploadedAt: true
        }
      }
    },
    take: 100
  });

  return NextResponse.json({ projects });
}
