import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSessionFromRequest } from "@/lib/auth";
import { uploadSingleFileToBlob, deleteBlobByUrl } from "@/lib/blob";

export const runtime = "nodejs";

function toDashboard(request: NextRequest, query: string) {
  return NextResponse.redirect(new URL(`/admin/dashboard/competition-photos?${query}`, request.url));
}

export async function POST(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) return toDashboard(request, "error=后台登录已失效");

  const formData = await request.formData();
  const action = String(formData.get("action") ?? "");
  const id = String(formData.get("id") ?? "");
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const imageInput = formData.get("image");
  const imageFile = imageInput instanceof File && imageInput.size > 0 ? imageInput : null;

  if (!["create", "update", "delete"].includes(action)) {
    return toDashboard(request, "error=无效比赛照片操作");
  }

  if (action === "delete") {
    if (!id) return toDashboard(request, "error=缺少比赛照片ID");
    const existing = await db.competitionPhoto.findUnique({ where: { id } });
    if (existing) await deleteBlobByUrl(existing.imageUrl);
    await db.competitionPhoto.delete({ where: { id } });
    return toDashboard(request, "ok=比赛照片已删除");
  }

  if (action === "create") {
    if (!imageFile) return toDashboard(request, "error=请上传照片");
    const uploaded = await uploadSingleFileToBlob(imageFile, "competition-photo");
    await db.competitionPhoto.create({
      data: {
        imageUrl: uploaded.url,
        sortOrder,
      },
    });
    return toDashboard(request, "ok=比赛照片创建成功");
  }

  if (!id) return toDashboard(request, "error=缺少比赛照片ID");
  const uploaded = imageFile ? await uploadSingleFileToBlob(imageFile, "competition-photo") : null;
  if (uploaded) {
    const existing = await db.competitionPhoto.findUnique({ where: { id } });
    if (existing) await deleteBlobByUrl(existing.imageUrl);
  }

  await db.competitionPhoto.update({
    where: { id },
    data: {
      sortOrder,
      ...(uploaded ? { imageUrl: uploaded.url } : {}),
    },
  });
  return toDashboard(request, "ok=比赛照片更新成功");
}
