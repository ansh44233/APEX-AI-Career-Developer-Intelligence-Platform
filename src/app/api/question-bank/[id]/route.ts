import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Sign in to save questions." }, { status: 401 });
  const { id } = await context.params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  if (!body || typeof body !== "object" || typeof (body as { isSaved?: unknown }).isSaved !== "boolean") {
    return NextResponse.json({ error: "Provide a valid isSaved value." }, { status: 400 });
  }
  try {
    const result = await prisma.questionBankItem.updateMany({ where: { id, userId }, data: { isSaved: (body as { isSaved: boolean }).isSaved } });
    if (result.count === 0) return NextResponse.json({ error: "Question not found." }, { status: 404 });
    return NextResponse.json({ success: true, isSaved: (body as { isSaved: boolean }).isSaved }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not update this question." }, { status: 500 });
  }
}
