import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get("company")?.trim();
  const role = searchParams.get("role")?.trim();
  if (!company || !role) return NextResponse.json({ error: "Company and role filters are required." }, { status: 400 });
  try {
    const claims = await prisma.companyEvidenceClaim.findMany({
      where: { status: "approved", company, role },
      orderBy: { reviewedAt: "desc" }, take: 50,
      select: {
        id: true, company: true, role: true, claimType: true, claimText: true,
        supportingExcerpt: true, reviewedAt: true,
        capture: { select: { sourceTitle: true, sourceUrl: true, retrievedAt: true, contentHash: true } },
      },
    });
    return NextResponse.json({ claims, methodology: "Only individually moderator-approved claims are returned. Each claim retains an exact passage from an approved source snapshot. Claims are scoped to the role selected during review and are not guarantees of current vacancies or universal hiring criteria." }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Approved role evidence is unavailable." }, { status: 503 }); }
}
