import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSessionFromRequest, hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

function toDashboard(request: NextRequest, query: string) {
  return NextResponse.redirect(new URL(`/admin/dashboard?${query}`, request.url));
}

export async function POST(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) return toDashboard(request, "error=后台登录已失效");

  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  if (!password) return toDashboard(request, "error=新密码不能为空");
  if (password.length < 8) return toDashboard(request, "error=新密码长度至少8位");

  await db.adminUser.update({
    where: { id: session.userId },
    data: {
      passwordHash: await hashPassword(password)
    }
  });

  return toDashboard(request, "ok=当前后台账号密码已重置");
}
