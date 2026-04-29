import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getIntranetSessionFromRequest, hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

function toIntranet(request: NextRequest, query: string) {
  return NextResponse.redirect(new URL(`/intranet?${query}`, request.url));
}

export async function POST(request: NextRequest) {
  const session = await getIntranetSessionFromRequest(request);
  if (!session) return toIntranet(request, "error=内网登录已失效");

  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  if (!password) return toIntranet(request, "error=新密码不能为空");
  if (password.length < 8) return toIntranet(request, "error=新密码长度至少8位");

  await db.intranetUser.update({
    where: { id: session.userId },
    data: {
      passwordHash: await hashPassword(password)
    }
  });

  return toIntranet(request, "ok=当前内网账号密码已重置");
}
