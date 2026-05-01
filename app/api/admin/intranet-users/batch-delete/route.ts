import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSessionFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

function toDashboard(request: NextRequest, query: string) {
  return NextResponse.redirect(new URL(`/admin/dashboard/intranet-users?${query}`, request.url));
}

export async function POST(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) return toDashboard(request, "error=后台登录已失效");

  const formData = await request.formData();
  const ids = formData
    .getAll("ids")
    .map((v) => String(v))
    .filter(Boolean);
  if (ids.length === 0) return toDashboard(request, "error=请先勾选要删除的内网账号");

  const result = await db.intranetUser.deleteMany({
    where: {
      id: { in: ids }
    }
  });
  return toDashboard(request, `ok=批量删除完成，共删除${result.count}个账号`);
}
