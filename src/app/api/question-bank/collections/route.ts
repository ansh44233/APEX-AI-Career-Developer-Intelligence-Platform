import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
 const userId = await getCurrentUserId().catch(() => null);
 if (!userId) return NextResponse.json({ error: "Sign in to view collections." }, { status: 401 });
 try {
  const collections = await prisma.questionCollection.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, select: { id: true, name: true, createdAt: true, _count: { select: { items: true } } } });
  return NextResponse.json({ collections }, { headers: { "Cache-Control": "no-store" } });
 } catch { return NextResponse.json({ error: "Collections are unavailable. Check database configuration." }, { status: 503 }); }
}
export async function POST(request: NextRequest) {
 const userId = await getCurrentUserId().catch(() => null);
 if (!userId) return NextResponse.json({ error: "Sign in to create collections." }, { status: 401 });
 let body: unknown;
 try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
 const name = body && typeof body === "object" ? (body as { name?: unknown }).name : null;
 if (typeof name !== "string" || !name.trim() || name.trim().length > 60) return NextResponse.json({ error: "Collection name must be 1–60 characters." }, { status: 400 });
 try {
  const collection = await prisma.questionCollection.create({ data: { userId, name: name.trim() }, select: { id: true, name: true, createdAt: true, _count: { select: { items: true } } } });
  return NextResponse.json({ collection }, { status: 201, headers: { "Cache-Control": "no-store" } });
 } catch (error) {
  if (error && typeof error === "object" && "code" in error && error.code === "P2002") return NextResponse.json({ error: "A collection with that name already exists." }, { status: 409 });
  return NextResponse.json({ error: "Could not create collection." }, { status: 500 });
 }
}
