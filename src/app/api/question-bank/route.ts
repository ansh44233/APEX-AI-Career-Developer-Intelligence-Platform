import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Sign in to view your saved questions." }, { status: 401 });
  const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? "100");
  const limit = Number.isFinite(rawLimit) ? Math.min(200, Math.max(1, Math.floor(rawLimit))) : 100;
  try {
    const questions = await prisma.questionBankItem.findMany({
      where: { userId }, orderBy: { createdAt: "desc" }, take: limit,
      select: { id: true, title: true, category: true, difficulty: true, prompt: true, followUp: true, topics: true, evaluation: true, hint: true, source: true, createdAt: true },
    });
    return NextResponse.json({ questions }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Question storage is unavailable. Check database configuration." }, { status: 503 });
  }
}
