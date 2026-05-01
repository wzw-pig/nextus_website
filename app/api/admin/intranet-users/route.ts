import { Department } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSessionFromRequest, hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

const departmentValues = new Set(Object.values(Department));

function toDashboard(request: NextRequest, query: string) {
  return NextResponse.redirect(new URL(`/admin/dashboard/intranet-users?${query}`, request.url));
}

export async function POST(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) return toDashboard(request, "error=后台登录已失效");

  const formData = await request.formData();
  const action = String(formData.get("action") ?? "");
  const id = String(formData.get("id") ?? "");

  if (!["create", "update", "delete"].includes(action)) {
    return toDashboard(request, "error=无效内网账号操作");
  }

  if (action === "delete") {
    if (!id) return toDashboard(request, "error=缺少用户ID");
    await db.intranetUser.delete({ where: { id } });
    return toDashboard(request, "ok=内网账号已删除");
  }

  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const department = String(formData.get("department") ?? "");
  const employeeId = String(formData.get("employeeId") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  const canApproveFinance = formData.get("canApproveFinance") === "on";
  const isForumAdmin = formData.get("isForumAdmin") === "on";
  const isActive = formData.get("isActive") === "on";

  if (!name || !employeeId || !contact) {
    return toDashboard(request, "error=姓名、工号、联系方式不能为空");
  }
  if (!departmentValues.has(department as Department)) {
    return toDashboard(request, "error=部门字段无效");
  }

  if (action === "create") {
    if (!username || !password) {
      return toDashboard(request, "error=创建账号时用户名与密码不能为空");
    }
    const duplicate = await db.intranetUser.findFirst({
      where: {
        OR: [{ username }, { employeeId }]
      },
      select: { id: true }
    });
    if (duplicate) return toDashboard(request, "error=用户名或工号已存在");

    await db.intranetUser.create({
      data: {
        username,
        passwordHash: await hashPassword(password),
        name,
        department: department as Department,
        employeeId,
        contact,
        canApproveFinance,
        isForumAdmin,
        isActive: true,
        createdById: session.userId
      }
    });
    return toDashboard(request, "ok=内网账号创建成功");
  }

  if (!id) return toDashboard(request, "error=缺少用户ID");

  const duplicateEmployee = await db.intranetUser.findFirst({
    where: {
      employeeId,
      NOT: { id }
    },
    select: { id: true }
  });
  if (duplicateEmployee) return toDashboard(request, "error=该工号已被其他账号使用");

  await db.intranetUser.update({
    where: { id },
    data: {
      name,
      department: department as Department,
      employeeId,
      contact,
      canApproveFinance,
      isForumAdmin,
      isActive,
      ...(password ? { passwordHash: await hashPassword(password) } : {})
    }
  });

  return toDashboard(request, "ok=内网账号更新成功");
}
