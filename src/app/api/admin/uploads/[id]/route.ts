import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  const project = await prisma.uploadProject.findUnique({
    where: { id: params.id },
    include: {
      files: {
        orderBy: [{ version: "asc" }, { createdAt: "asc" }]
      },
      reviewLogs: {
        include: {
          file: {
            select: {
              id: true,
              originalFilename: true,
              version: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!project) {
    return NextResponse.json({ message: "업로드 프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ project });
}
