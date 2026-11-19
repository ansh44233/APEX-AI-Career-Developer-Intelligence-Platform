import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
 const userId = await getCurrentUserId().catch(() => null);
 if (!userId) return NextResponse.json({ error: "Sign in to view this collection." }, { status: 401 });
 const { id } = await context.params;
 try {
  const collection = await prisma.questionCollection.findFirst({ where: { id, userId }, select: { id: true, name: true, items: { orderBy: { createdAt: "desc" }, select: { createdAt: true, question: { select: { id: true, title: true, category: true, difficulty: true, prompt: true, followUp: true, topics: true, evaluation: true, hint: true, source: true, isSaved: true } } } } } });
  if (!collection) return NextResponse.json({ error: "Collection not found." }, { status: 404 });
  return NextResponse.json({ collection: { id: collection.id, name: collection.name, questions: collection.items.map(item => item.question) } }, { headers: { "Cache-Control": "no-store" } });
 } catch { return NextResponse.json({ error: "Could not load this collection." }, { status: 500 }); }
}
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
 const userId = await getCurrentUserId().catch(() => null);
 if (!userId) return NextResponse.json({ error: "Sign in to rename collections." }, { status: 401 });
 const { id } = await context.params;
 let body: unknown;
 try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
 const name = body && typeof body === "object" ? (body as { name?: unknown }).name : null;
 if (typeof name !== "string" || !name.trim() || name.trim().length > 60) return NextResponse.json({ error: "Collection name must be 1–60 characters." }, { status: 400 });
 try {
  const result = await prisma.questionCollection.updateMany({ where: { id, userId }, data: { name: name.trim() } });
  if (!result.count) return NextResponse.json({ error: "Collection not found." }, { status: 404 });
  return NextResponse.json({ success: true, name: name.trim() });
 } catch (error) {
  if (error && typeof error === "object" && "code" in error && error.code === "P2002") return NextResponse.json({ error: "A collection with that name already exists." }, { status: 409 });
  return NextResponse.json({ error: "Could not rename collection." }, { status: 500 });
 }
}
export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
 const userId = await getCurrentUserId().catch(() => null);
 if (!userId) return NextResponse.json({ error: "Sign in to delete collections." }, { status: 401 });
 const { id } = await context.params;
 try {
  const result = await prisma.questionCollection.deleteMany({ where: { id, userId } });
  if (!result.count) return NextResponse.json({ error: "Collection not found." }, { status: 404 });
  return NextResponse.json({ success: true });
 } catch { return NextResponse.json({ error: "Could not delete collection." }, { status: 500 }); }
}
