import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applyAdminCookie, createAdminSessionToken, hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const initToken = String(formData.get("initToken") ?? "");
  const username = String(formData.get("username") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!initToken || !username || !displayName || !password) {
    return NextResponse.redirect(new URL("/admin/bootstrap?error=请完整填写初始化信息", request.url));
  }

  if (!process.env.SUPER_ADMIN_INIT_TOKEN) {
    return NextResponse.redirect(new URL("/admin/bootstrap?error=未配置 SUPER_ADMIN_INIT_TOKEN", request.url));
  }

  if (initToken !== process.env.SUPER_ADMIN_INIT_TOKEN) {
    return NextResponse.redirect(new URL("/admin/bootstrap?error=初始化口令错误", request.url));
  }

  const existingSuperAdmin = await db.adminUser.findFirst({
    where: { role: "SUPER_ADMIN" },
    select: { id: true }
  });
  if (existingSuperAdmin) {
    return NextResponse.redirect(new URL("/admin/bootstrap?error=系统已存在超级管理员，禁止重复创建", request.url));
  }

  const existingUsername = await db.adminUser.findUnique({ where: { username } });
  if (existingUsername) {
    return NextResponse.redirect(new URL("/admin/bootstrap?error=该用户名已存在", request.url));
  }

  const superAdmin = await db.adminUser.create({
    data: {
      username,
      displayName,
      passwordHash: await hashPassword(password),
      role: "SUPER_ADMIN"
    }
  });

  const token = await createAdminSessionToken({
    userId: superAdmin.id,
    username: superAdmin.username,
    displayName: superAdmin.displayName,
    role: superAdmin.role
  });

  const response = NextResponse.redirect(new URL("/admin/dashboard?ok=超级管理员创建成功", request.url));
  applyAdminCookie(response, token);
  return response;
}
