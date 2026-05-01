import { Department } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSessionFromRequest, hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

type ImportRow = {
  username: string;
  name: string;
  department: Department;
  employeeId: string;
  contact: string;
  canApproveFinance: boolean;
  password: string;
};

const departmentValues = new Set(Object.values(Department));

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) return bad("后台登录已失效", 401);

  const body = (await request.json()) as { rows?: ImportRow[] };
  const rows = body.rows ?? [];
  if (!Array.isArray(rows) || rows.length === 0) return bad("请先上传并解析 CSV 数据");

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row.username || !row.name || !row.employeeId || !row.contact || !row.password) {
      return bad(`第 ${i + 1} 行存在空字段`);
    }
    if (row.password.length < 8) return bad(`第 ${i + 1} 行密码长度至少 8 位`);
    if (!departmentValues.has(row.department)) return bad(`第 ${i + 1} 行部门无效`);
  }

  const usernameSet = new Set<string>();
  const employeeIdSet = new Set<string>();
  for (const row of rows) {
    if (usernameSet.has(row.username) || employeeIdSet.has(row.employeeId)) {
      return bad("导入失败：CSV 内存在重复用户名或工号");
    }
    usernameSet.add(row.username);
    employeeIdSet.add(row.employeeId);
  }

  const usernames = rows.map((r) => r.username);
  const employeeIds = rows.map((r) => r.employeeId);
  const existed = await db.intranetUser.findMany({
    where: {
      OR: [{ username: { in: usernames } }, { employeeId: { in: employeeIds } }]
    },
    select: { username: true, employeeId: true }
  });
  if (existed.length > 0) {
    return bad(`导入失败：存在重复用户名或工号（${existed.length} 条）`);
  }

  const data = await Promise.all(
    rows.map(async (row) => ({
      username: row.username.trim(),
      passwordHash: await hashPassword(row.password),
      name: row.name.trim(),
      department: row.department,
      employeeId: row.employeeId.trim(),
      contact: row.contact.trim(),
      canApproveFinance: Boolean(row.canApproveFinance),
      isForumAdmin: false,
      isActive: true,
      createdById: session.userId
    }))
  );

  await db.intranetUser.createMany({ data });
  return NextResponse.json({ ok: true, message: `导入成功，共 ${data.length} 条` });
}
