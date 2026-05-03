import { NextRequest, NextResponse } from "next/server";
import { getIntranetSessionFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

function wantsJson(request: NextRequest) {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("application/json") || request.headers.get("x-requested-with") === "XMLHttpRequest";
}

function json(ok: boolean, message: string, redirectTo?: string) {
  return NextResponse.json({ ok, message, redirectTo });
}

export async function POST(request: NextRequest) {
  const session = await getIntranetSessionFromRequest(request);
  if (!session) {
    return wantsJson(request)
      ? json(false, "请先登录内网")
      : NextResponse.redirect(new URL("/intranet/login?error=请先登录内网", request.url));
  }

  const message = "内网资料发布已并入论坛“资料发布”分类，请在论坛中发帖并上传资料附件";
  return wantsJson(request)
    ? json(false, message, "/intranet/forum/resources")
    : NextResponse.redirect(new URL(`/intranet/forum/resources?ok=${encodeURIComponent(message)}`, request.url));
}
