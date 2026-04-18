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
  if (session.role !== "SUPER_ADMIN") return toDashboard(request, "error=仅超级管理员可管理后台账号");

  const formData = await request.formData();
  const action = String(formData.get("action") ?? "");
  const id = String(formData.get("id") ?? "");
  const username = String(formData.get("username") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!["create", "update", "delete"].includes(action)) {
    return toDashboard(request, "error=无效管理员操作");
  }

  if (action === "create") {
    if (!username || !displayName || !password) {
      return toDashboard(request, "error=创建管理员需完整填写信息");
    }
    const duplicate = await db.adminUser.findUnique({ where: { username } });
    if (duplicate) return toDashboard(request, "error=管理员用户名已存在");

    await db.adminUser.create({
      data: {
        username,
        displayName,
        passwordHash: await hashPassword(password),
        role: "ADMIN",
        createdById: session.userId
      }
    });
    return toDashboard(request, "ok=普通管理员创建成功");
  }

  if (!id) return toDashboard(request, "error=缺少管理员ID");
  const target = await db.adminUser.findUnique({ where: { id } });
  if (!target) return toDashboard(request, "error=管理员不存在");
  if (target.role === "SUPER_ADMIN") {
    return toDashboard(request, "error=超级管理员不可在此修改或删除");
  }

  if (action === "delete") {
    await db.adminUser.delete({ where: { id } });
    return toDashboard(request, "ok=普通管理员已删除");
  }

  if (!displayName) return toDashboard(request, "error=显示名不能为空");
  await db.adminUser.update({
    where: { id },
    data: {
      displayName,
      ...(password ? { passwordHash: await hashPassword(password) } : {})
    }
  });
  return toDashboard(request, "ok=普通管理员更新成功");
}
