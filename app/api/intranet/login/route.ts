import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applyIntranetCookie, createIntranetSessionToken, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return NextResponse.redirect(new URL("/intranet/login?error=用户名和密码不能为空", request.url));
  }

  const user = await db.intranetUser.findUnique({ where: { username } });
  if (!user || !user.isActive) {
    return NextResponse.redirect(new URL("/intranet/login?error=账号不存在或已禁用", request.url));
  }

  const passOk = await verifyPassword(password, user.passwordHash);
  if (!passOk) {
    return NextResponse.redirect(new URL("/intranet/login?error=密码错误", request.url));
  }

  const token = await createIntranetSessionToken({
    userId: user.id,
    username: user.username,
    displayName: user.name,
    department: user.department,
    canApproveFinance: user.canApproveFinance,
    isForumAdmin: user.isForumAdmin,
    employeeId: user.employeeId,
    contact: user.contact
  });

  const response = NextResponse.redirect(new URL("/intranet?ok=登录成功", request.url));
  applyIntranetCookie(response, token);
  return response;
}
