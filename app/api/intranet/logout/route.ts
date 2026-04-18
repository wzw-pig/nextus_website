import { NextRequest, NextResponse } from "next/server";
import { clearIntranetCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/intranet/login?ok=已退出内网", request.url));
  clearIntranetCookie(response);
  return response;
}
