import { NextRequest, NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/admin/login?ok=已退出后台", request.url));
  clearAdminCookie(response);
  return response;
}
