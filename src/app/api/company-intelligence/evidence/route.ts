import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only moderator-approved captures are exposed to the public evidence view.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get("company")?.trim();
  const sourceId = searchParams.get("sourceId")?.trim();
  if (!company && !sourceId) return NextResponse.json({ error: "Provide a company or sourceId filter." }, { status: 400 });
  try {
    const captures = await prisma.companySourceCapture.findMany({
      where: { status: "approved", ...(company ? { company } : {}), ...(sourceId ? { sourceId } : {}) },
      orderBy: { retrievedAt: "desc" },
      take: 20,
      select: {
        id: true, sourceId: true, company: true, sourceTitle: true, sourceUrl: true,
        retrievedAt: true, httpStatus: true, contentHash: true, pageTitle: true,
        description: true, excerpt: true,
      },
    });
    return NextResponse.json({ captures }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Approved evidence is unavailable." }, { status: 503 });
  }
}
