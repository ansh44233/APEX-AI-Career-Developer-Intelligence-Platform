import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      name: "APEX",
      status: "ok",
      version: process.env.npm_package_version ?? "0.1.0",
      timestamp: new Date().toISOString(),
      services: {
        api: "operational",
        web: "operational",
        database: "not_configured",
        authentication: "not_configured",
        ai: "not_configured",
        background_jobs: "not_configured",
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
