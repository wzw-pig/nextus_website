import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.redirect(new URL("/admin/login?error=后台登录已失效", request.url));
  }

  const header = "用户名,姓名,部门,工号,手机号,审批权限,密码";
  const sample = "zhangsan,张三,TECH_RESEARCH,A001,13800000000,是,Password123!";
  const csv = `\uFEFF${header}\n${sample}\n`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=intranet-users-template.csv"
    }
  });
}
