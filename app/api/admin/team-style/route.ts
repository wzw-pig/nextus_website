import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSessionFromRequest } from "@/lib/auth";
import { uploadSingleFileToBlob, deleteBlobByUrl } from "@/lib/blob";

export const runtime = "nodejs";

function toDashboard(request: NextRequest, query: string) {
  return NextResponse.redirect(new URL(`/admin/dashboard/team-style?${query}`, request.url));
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
    return toDashboard(request, "error=无效团队风采操作");
  }

  if (action === "delete") {
    if (!id) return toDashboard(request, "error=缺少团队风采ID");
    const existing = await db.teamStyleImage.findUnique({ where: { id } });
    if (existing) await deleteBlobByUrl(existing.imageUrl);
    await db.teamStyleImage.delete({ where: { id } });
    return toDashboard(request, "ok=团队风采已删除");
  }

  if (action === "create") {
    if (!imageFile) return toDashboard(request, "error=请上传图片");
    const uploaded = await uploadSingleFileToBlob(imageFile, "team-style");
    await db.teamStyleImage.create({
      data: {
        imageUrl: uploaded.url,
        sortOrder,
      },
    });
    return toDashboard(request, "ok=团队风采创建成功");
  }

  if (!id) return toDashboard(request, "error=缺少团队风采ID");
  const uploaded = imageFile ? await uploadSingleFileToBlob(imageFile, "team-style") : null;
  if (uploaded) {
    const existing = await db.teamStyleImage.findUnique({ where: { id } });
    if (existing) await deleteBlobByUrl(existing.imageUrl);
  }

  await db.teamStyleImage.update({
    where: { id },
    data: {
      sortOrder,
      ...(uploaded ? { imageUrl: uploaded.url } : {}),
    },
  });
  return toDashboard(request, "ok=团队风采更新成功");
}
