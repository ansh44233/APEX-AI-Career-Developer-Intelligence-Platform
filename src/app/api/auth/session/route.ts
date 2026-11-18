import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        },
        expiresAt: session.session.expiresAt,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Authentication service unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function DELETE() {
  try {
    await auth.api.signOut({ headers: await headers() });
    return NextResponse.json(
      { authenticated: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not end session." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
