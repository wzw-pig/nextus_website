import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSessionFromRequest } from "@/lib/auth";
import { uploadSingleFileToBlob, deleteBlobByUrl } from "@/lib/blob";

export const runtime = "nodejs";

function toDashboard(request: NextRequest, query: string) {
  return NextResponse.redirect(new URL(`/admin/dashboard/org-departments?${query}`, request.url));
}

export async function POST(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) return toDashboard(request, "error=后台登录已失效");

  const formData = await request.formData();
  const action = String(formData.get("action") ?? "");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const imageInput = formData.get("image");
  const imageFile = imageInput instanceof File && imageInput.size > 0 ? imageInput : null;

  if (!["create", "update", "delete"].includes(action)) {
    return toDashboard(request, "error=无效部门操作");
  }

  if (action === "delete") {
    if (!id) return toDashboard(request, "error=缺少部门ID");
    const existing = await db.orgDepartment.findUnique({ where: { id } });
    if (existing && existing.imageUrl) await deleteBlobByUrl(existing.imageUrl);
    await db.orgDepartment.delete({ where: { id } });
    return toDashboard(request, "ok=部门已删除");
  }

  if (!name || !description) {
    return toDashboard(request, "error=部门名称和描述不能为空");
  }

  if (action === "create") {
    const imageUrl = imageFile
      ? (await uploadSingleFileToBlob(imageFile, "org-department")).url
      : "";
    await db.orgDepartment.create({
      data: {
        name,
        description,
        imageUrl,
        sortOrder,
      },
    });
    return toDashboard(request, "ok=部门创建成功");
  }

  if (!id) return toDashboard(request, "error=缺少部门ID");

  let imageUrl: string | undefined;
  if (imageFile) {
    const existing = await db.orgDepartment.findUnique({ where: { id } });
    if (existing && existing.imageUrl) await deleteBlobByUrl(existing.imageUrl);
    imageUrl = (await uploadSingleFileToBlob(imageFile, "org-department")).url;
  }

  await db.orgDepartment.update({
    where: { id },
    data: {
      name,
      description,
      sortOrder,
      ...(imageUrl !== undefined ? { imageUrl } : {}),
    },
  });
  return toDashboard(request, "ok=部门更新成功");
}
