import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSessionFromRequest } from "@/lib/auth";
import { uploadSingleFileToBlob, deleteBlobByUrl } from "@/lib/blob";

export const runtime = "nodejs";

function isAjax(request: NextRequest) {
  return request.headers.get("accept")?.includes("application/json") ||
    request.headers.get("x-requested-with") === "XMLHttpRequest";
}

function jsonResponse(ok: boolean, message: string) {
  return NextResponse.json({ ok, message });
}

function toPage(request: NextRequest, query: string, page: string) {
  if (isAjax(request)) {
    const params = new URLSearchParams(query);
    return jsonResponse(!!params.get("ok"), params.get("ok") || params.get("error") || "");
  }
  return NextResponse.redirect(new URL(`/admin/dashboard/${page}?${query}`, request.url));
}

export async function POST(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) return toPage(request, "error=后台登录已失效", "team-style");

  const formData = await request.formData();
  const action = String(formData.get("action") ?? "");
  const id = String(formData.get("id") ?? "");
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const imageInput = formData.get("image");
  const imageFile = imageInput instanceof File && imageInput.size > 0 ? imageInput : null;

  if (!["create", "update", "delete"].includes(action)) {
    return toPage(request, "error=无效操作", "team-style");
  }

  if (action === "delete") {
    if (!id) return toPage(request, "error=缺少ID", "team-style");
    const existing = await db.teamStyleImage.findUnique({ where: { id } });
    if (existing && existing.imageUrl.startsWith("http")) await deleteBlobByUrl(existing.imageUrl);
    await db.teamStyleImage.delete({ where: { id } });
    return toPage(request, "ok=已删除", "team-style");
  }

  if (action === "create") {
    if (!imageFile) return toPage(request, "error=请上传图片", "team-style");
    const uploaded = await uploadSingleFileToBlob(imageFile, "team-style");
    await db.teamStyleImage.create({ data: { imageUrl: uploaded.url, sortOrder } });
    return toPage(request, "ok=创建成功", "team-style");
  }

  if (!id) return toPage(request, "error=缺少ID", "team-style");
  const uploaded = imageFile ? await uploadSingleFileToBlob(imageFile, "team-style") : null;
  if (uploaded) {
    const existing = await db.teamStyleImage.findUnique({ where: { id } });
    if (existing && existing.imageUrl.startsWith("http")) await deleteBlobByUrl(existing.imageUrl);
  }
  await db.teamStyleImage.update({
    where: { id },
    data: { sortOrder, ...(uploaded ? { imageUrl: uploaded.url } : {}) },
  });
  return toPage(request, "ok=更新成功", "team-style");
}
