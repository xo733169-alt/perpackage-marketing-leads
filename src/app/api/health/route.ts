import { NextResponse } from "next/server";
import { buildHealthResponse } from "@/lib/deployment-health";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(buildHealthResponse());
}
