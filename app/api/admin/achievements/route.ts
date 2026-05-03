import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSessionFromRequest } from "@/lib/auth";
import { uploadSingleFileToBlob, deleteBlobByUrl } from "@/lib/blob";

export const runtime = "nodejs";

function toDashboard(request: NextRequest, query: string) {
  return NextResponse.redirect(new URL(`/admin/dashboard/achievements?${query}`, request.url));
}

export async function POST(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) return toDashboard(request, "error=后台登录已失效");

  const formData = await request.formData();
  const action = String(formData.get("action") ?? "");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const orientation = String(formData.get("orientation") ?? "landscape").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const imageInput = formData.get("image");
  const imageFile = imageInput instanceof File && imageInput.size > 0 ? imageInput : null;

  if (!["create", "update", "delete"].includes(action)) {
    return toDashboard(request, "error=无效成就操作");
  }

  if (action === "delete") {
    if (!id) return toDashboard(request, "error=缺少成就ID");
    const existing = await db.achievement.findUnique({ where: { id } });
    if (existing) await deleteBlobByUrl(existing.imageUrl);
    await db.achievement.delete({ where: { id } });
    return toDashboard(request, "ok=成就已删除");
  }

  if (!name) {
    return toDashboard(request, "error=成就名称不能为空");
  }

  if (!["landscape", "portrait"].includes(orientation)) {
    return toDashboard(request, "error=方向必须为横版或竖版");
  }

  if (action === "create") {
    if (!imageFile) return toDashboard(request, "error=请上传成就图片");
    const uploaded = await uploadSingleFileToBlob(imageFile, "achievement");
    await db.achievement.create({
      data: {
        name,
        imageUrl: uploaded.url,
        orientation,
        sortOrder,
      },
    });
    return toDashboard(request, "ok=成就创建成功");
  }

  if (!id) return toDashboard(request, "error=缺少成就ID");
  const uploaded = imageFile ? await uploadSingleFileToBlob(imageFile, "achievement") : null;
  if (uploaded) {
    const existing = await db.achievement.findUnique({ where: { id } });
    if (existing) await deleteBlobByUrl(existing.imageUrl);
  }

  await db.achievement.update({
    where: { id },
    data: {
      name,
      orientation,
      sortOrder,
      ...(uploaded ? { imageUrl: uploaded.url } : {}),
    },
  });
  return toDashboard(request, "ok=成就更新成功");
}
