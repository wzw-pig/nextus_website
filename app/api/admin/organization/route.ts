import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return NextResponse.redirect(new URL("/api/admin/org-departments", request.url), 307);
}
