import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
 const userId = await getCurrentUserId().catch(() => null);
 if (!userId) return NextResponse.json({ error: "Sign in to manage collections." }, { status: 401 });
 const { id } = await context.params;
 let body: unknown;
 try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
 const questionId = body && typeof body === "object" ? (body as { questionId?: unknown }).questionId : null;
 if (typeof questionId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(questionId)) return NextResponse.json({ error: "Provide a valid question ID." }, { status: 400 });
 try {
  const [collection, question] = await Promise.all([
   prisma.questionCollection.findFirst({ where: { id, userId }, select: { id: true } }),
   prisma.questionBankItem.findFirst({ where: { id: questionId, userId }, select: { id: true } }),
  ]);
  if (!collection || !question) return NextResponse.json({ error: "Collection or question not found." }, { status: 404 });
  await prisma.questionCollectionItem.upsert({ where: { collectionId_questionId: { collectionId: id, questionId } }, create: { collectionId: id, questionId }, update: {} });
  return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
 } catch { return NextResponse.json({ error: "Could not add this question to the collection." }, { status: 500 }); }
}
