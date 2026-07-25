import { NextResponse } from "next/server";

/**
 * Lightweight health check for uptime monitoring / Vercel checks.
 * Does not touch the database so it stays fast and dependency-free.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
