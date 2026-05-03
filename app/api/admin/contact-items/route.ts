import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSessionFromRequest } from "@/lib/auth";
import { uploadSingleFileToBlob, deleteBlobByUrl } from "@/lib/blob";

export const runtime = "nodejs";

function toDashboard(request: NextRequest, query: string) {
  return NextResponse.redirect(new URL(`/admin/dashboard/contact-items?${query}`, request.url));
}

export async function POST(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) return toDashboard(request, "error=后台登录已失效");

  const formData = await request.formData();
  const action = String(formData.get("action") ?? "");
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const imageInput = formData.get("image");
  const imageFile = imageInput instanceof File && imageInput.size > 0 ? imageInput : null;

  if (!["create", "update", "delete"].includes(action)) {
    return toDashboard(request, "error=无效联系方式操作");
  }

  if (action === "delete") {
    if (!id) return toDashboard(request, "error=缺少联系方式ID");
    const existing = await db.contactItem.findUnique({ where: { id } });
    if (existing && existing.imageUrl) await deleteBlobByUrl(existing.imageUrl);
    await db.contactItem.delete({ where: { id } });
    return toDashboard(request, "ok=联系方式已删除");
  }

  if (!title) {
    return toDashboard(request, "error=联系方式标题不能为空");
  }

  if (action === "create") {
    const imageUrl = imageFile
      ? (await uploadSingleFileToBlob(imageFile, "contact-item")).url
      : "";
    await db.contactItem.create({
      data: {
        title,
        content,
        imageUrl,
        sortOrder,
      },
    });
    return toDashboard(request, "ok=联系方式创建成功");
  }

  if (!id) return toDashboard(request, "error=缺少联系方式ID");

  let imageUrl: string | undefined;
  if (imageFile) {
    const existing = await db.contactItem.findUnique({ where: { id } });
    if (existing && existing.imageUrl) await deleteBlobByUrl(existing.imageUrl);
    imageUrl = (await uploadSingleFileToBlob(imageFile, "contact-item")).url;
  }

  await db.contactItem.update({
    where: { id },
    data: {
      title,
      content,
      sortOrder,
      ...(imageUrl !== undefined ? { imageUrl } : {}),
    },
  });
  return toDashboard(request, "ok=联系方式更新成功");
}
