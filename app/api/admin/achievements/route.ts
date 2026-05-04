import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSessionFromRequest } from "@/lib/auth";
import { uploadSingleFileToBlob, deleteBlobByUrl } from "@/lib/blob";

export const runtime = "nodejs";

function isAjax(request: NextRequest) {
  return request.headers.get("accept")?.includes("application/json") ||
    request.headers.get("x-requested-with") === "XMLHttpRequest";
}

function toPage(request: NextRequest, query: string, page = "achievements") {
  if (isAjax(request)) {
    const params = new URLSearchParams(query);
    return NextResponse.json({ ok: !!params.get("ok"), message: params.get("ok") || params.get("error") || "" });
  }
  return NextResponse.redirect(new URL(`/admin/dashboard/${page}?${query}`, request.url));
}

export async function POST(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) return toPage(request, "error=后台登录已失效");

  const formData = await request.formData();
  const action = String(formData.get("action") ?? "");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const orientation = String(formData.get("orientation") ?? "landscape").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const imageInput = formData.get("image");
  const imageFile = imageInput instanceof File && imageInput.size > 0 ? imageInput : null;

  if (!["create", "update", "delete"].includes(action)) return toPage(request, "error=无效操作");

  if (action === "delete") {
    if (!id) return toPage(request, "error=缺少ID");
    const existing = await db.achievement.findUnique({ where: { id } });
    if (existing && existing.imageUrl.startsWith("http")) await deleteBlobByUrl(existing.imageUrl);
    await db.achievement.delete({ where: { id } });
    return toPage(request, "ok=已删除");
  }

  if (!name) return toPage(request, "error=名称不能为空");
  if (!["landscape", "portrait"].includes(orientation)) return toPage(request, "error=方向无效");

  if (action === "create") {
    if (!imageFile) return toPage(request, "error=请上传图片");
    const uploaded = await uploadSingleFileToBlob(imageFile, "achievement");
    await db.achievement.create({ data: { name, imageUrl: uploaded.url, orientation, sortOrder } });
    return toPage(request, "ok=创建成功");
  }

  if (!id) return toPage(request, "error=缺少ID");
  const uploaded = imageFile ? await uploadSingleFileToBlob(imageFile, "achievement") : null;
  if (uploaded) {
    const existing = await db.achievement.findUnique({ where: { id } });
    if (existing && existing.imageUrl.startsWith("http")) await deleteBlobByUrl(existing.imageUrl);
  }
  await db.achievement.update({ where: { id }, data: { name, orientation, sortOrder, ...(uploaded ? { imageUrl: uploaded.url } : {}) } });
  return toPage(request, "ok=更新成功");
}
