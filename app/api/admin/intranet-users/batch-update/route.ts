import { Department } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSessionFromRequest, hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

type UpdateUserRow = {
  id: string;
  name: string;
  department: Department;
  employeeId: string;
  contact: string;
  canApproveFinance: boolean;
  isForumAdmin: boolean;
  isActive: boolean;
  password?: string;
};

const departmentValues = new Set(Object.values(Department));

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) return bad("后台登录已失效", 401);

  const body = (await request.json()) as { users?: UpdateUserRow[] };
  const users = body.users ?? [];
  if (!Array.isArray(users) || users.length === 0) return bad("没有需要保存的账号数据");

  for (let i = 0; i < users.length; i += 1) {
    const user = users[i];
    if (!user.id || !user.name || !user.employeeId || !user.contact) return bad(`第 ${i + 1} 行存在空字段`);
    if (!departmentValues.has(user.department)) return bad(`第 ${i + 1} 行部门无效`);
    if (user.password && user.password.length < 8) return bad(`第 ${i + 1} 行密码长度至少8位`);
  }

  const employeeIds = users.map((item) => item.employeeId.trim());
  const uniqueEmployeeIds = new Set(employeeIds);
  if (uniqueEmployeeIds.size !== employeeIds.length) return bad("保存失败：表格内存在重复工号");

  const duplicateInDb = await db.intranetUser.findMany({
    where: {
      employeeId: { in: employeeIds },
      NOT: { id: { in: users.map((item) => item.id) } }
    },
    select: { id: true }
  });
  if (duplicateInDb.length > 0) return bad("保存失败：有工号已被其他账号占用");

  const hashedPasswords = new Map<string, string>();
  for (const user of users) {
    if (user.password) {
      hashedPasswords.set(user.id, await hashPassword(user.password));
    }
  }

  await db.$transaction(
    users.map((user) =>
      db.intranetUser.update({
        where: { id: user.id },
        data: {
          name: user.name.trim(),
          department: user.department,
          employeeId: user.employeeId.trim(),
          contact: user.contact.trim(),
          canApproveFinance: Boolean(user.canApproveFinance),
          isForumAdmin: Boolean(user.isForumAdmin),
          isActive: Boolean(user.isActive),
          ...(hashedPasswords.has(user.id) ? { passwordHash: hashedPasswords.get(user.id)! } : {})
        }
      })
    )
  );
  return NextResponse.json({ ok: true, message: `保存成功，共更新 ${users.length} 个账号` });
}
