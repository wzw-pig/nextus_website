import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applyAdminCookie, createAdminSessionToken, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return NextResponse.redirect(new URL("/admin/login?error=用户名和密码不能为空", request.url));
  }

  const admin = await db.adminUser.findUnique({ where: { username } });
  if (!admin) {
    return NextResponse.redirect(new URL("/admin/login?error=账号不存在", request.url));
  }

  const passOk = await verifyPassword(password, admin.passwordHash);
  if (!passOk) {
    return NextResponse.redirect(new URL("/admin/login?error=密码错误", request.url));
  }

  const token = await createAdminSessionToken({
    userId: admin.id,
    username: admin.username,
    displayName: admin.displayName,
    role: admin.role
  });

  const response = NextResponse.redirect(new URL("/admin/dashboard?ok=登录成功", request.url));
  applyAdminCookie(response, token);
  return response;
}
