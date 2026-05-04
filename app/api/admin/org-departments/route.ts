import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSessionFromRequest } from "@/lib/auth";
import { uploadSingleFileToBlob, deleteBlobByUrl } from "@/lib/blob";

export const runtime = "nodejs";

function isAjax(request: NextRequest) {
  return request.headers.get("accept")?.includes("application/json") ||
    request.headers.get("x-requested-with") === "XMLHttpRequest";
}

function toPage(request: NextRequest, query: string) {
  if (isAjax(request)) {
    const params = new URLSearchParams(query);
    return NextResponse.json({ ok: !!params.get("ok"), message: params.get("ok") || params.get("error") || "" });
  }
  return NextResponse.redirect(new URL(`/admin/dashboard/organization?${query}`, request.url));
}

export async function POST(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) return toPage(request, "error=后台登录已失效");

  const formData = await request.formData();
  const action = String(formData.get("action") ?? "");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const imageInput = formData.get("image");
  const imageFile = imageInput instanceof File && imageInput.size > 0 ? imageInput : null;

  if (!["create", "update", "delete"].includes(action)) return toPage(request, "error=无效操作");

  if (action === "delete") {
    if (!id) return toPage(request, "error=缺少ID");
    const existing = await db.orgDepartment.findUnique({ where: { id } });
    if (existing && existing.imageUrl && existing.imageUrl.startsWith("http")) await deleteBlobByUrl(existing.imageUrl);
    await db.orgDepartment.delete({ where: { id } });
    return toPage(request, "ok=已删除");
  }

  if (!name || !description) return toPage(request, "error=名称和描述不能为空");

  if (action === "create") {
    const imageUrl = imageFile ? (await uploadSingleFileToBlob(imageFile, "org-department")).url : "";
    await db.orgDepartment.create({ data: { name, description, imageUrl, sortOrder } });
    return toPage(request, "ok=创建成功");
  }

  if (!id) return toPage(request, "error=缺少ID");
  let imageUrl: string | undefined;
  if (imageFile) {
    const existing = await db.orgDepartment.findUnique({ where: { id } });
    if (existing && existing.imageUrl && existing.imageUrl.startsWith("http")) await deleteBlobByUrl(existing.imageUrl);
    imageUrl = (await uploadSingleFileToBlob(imageFile, "org-department")).url;
  }
  await db.orgDepartment.update({ where: { id }, data: { name, description, sortOrder, ...(imageUrl !== undefined ? { imageUrl } : {}) } });
  return toPage(request, "ok=更新成功");
}
