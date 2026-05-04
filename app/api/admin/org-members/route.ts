import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSessionFromRequest } from "@/lib/auth";
import { uploadSingleFileToBlob, deleteBlobByUrl } from "@/lib/blob";

export const runtime = "nodejs";

function isAjax(request: NextRequest) {
  return request.headers.get("accept")?.includes("application/json") ||
    request.headers.get("x-requested-with") === "XMLHttpRequest";
}

function jsonResponse(ok: boolean, message: string, redirectTo?: string) {
  return NextResponse.json({ ok, message, redirectTo });
}

function toDashboard(request: NextRequest, query: string) {
  if (isAjax(request)) {
    const params = new URLSearchParams(query);
    const ok = params.get("ok");
    const error = params.get("error");
    return jsonResponse(!!ok, ok || error || "", "/admin/dashboard/organization");
  }
  return NextResponse.redirect(new URL(`/admin/dashboard/organization?${query}`, request.url));
}

export async function POST(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) return toDashboard(request, "error=后台登录已失效");

  const formData = await request.formData();
  const action = String(formData.get("action") ?? "");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const parentId = String(formData.get("parentId") ?? "").trim() || null;
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const avatarInput = formData.get("avatar");
  const avatarFile = avatarInput instanceof File && avatarInput.size > 0 ? avatarInput : null;

  if (!["create", "update", "delete"].includes(action)) {
    return toDashboard(request, "error=无效组织成员操作");
  }

  if (action === "delete") {
    if (!id) return toDashboard(request, "error=缺少组织成员ID");
    const existing = await db.orgMember.findUnique({ where: { id } });
    if (existing && existing.avatarUrl && existing.avatarUrl.startsWith("http")) await deleteBlobByUrl(existing.avatarUrl);
    await db.orgMember.delete({ where: { id } });
    return toDashboard(request, "ok=组织成员已删除");
  }

  if (!name || !position) {
    return toDashboard(request, "error=成员姓名和职位不能为空");
  }

  if (action === "create") {
    const avatarUrl = avatarFile
      ? (await uploadSingleFileToBlob(avatarFile, "org-member")).url
      : "";
    await db.orgMember.create({
      data: { name, position, department, avatarUrl, parentId, sortOrder },
    });
    return toDashboard(request, "ok=组织成员创建成功");
  }

  if (!id) return toDashboard(request, "error=缺少组织成员ID");

  let avatarUrl: string | undefined;
  if (avatarFile) {
    const existing = await db.orgMember.findUnique({ where: { id } });
    if (existing && existing.avatarUrl && existing.avatarUrl.startsWith("http")) await deleteBlobByUrl(existing.avatarUrl);
    avatarUrl = (await uploadSingleFileToBlob(avatarFile, "org-member")).url;
  }

  await db.orgMember.update({
    where: { id },
    data: {
      name, position, department, parentId, sortOrder,
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    },
  });
  return toDashboard(request, "ok=组织成员更新成功");
}
