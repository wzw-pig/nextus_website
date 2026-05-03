import { HomeModule } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteBlobByUrl, uploadSingleFileToBlob } from "@/lib/blob";
import { getAdminSessionFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

const validModules = new Set(Object.values(HomeModule));

function toPage(request: NextRequest, query: string) {
  return NextResponse.redirect(new URL(`/admin/dashboard/homepage?${query}`, request.url));
}

function isImageFile(file: File) {
  if (file.type.startsWith("image/")) return true;
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  return ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext);
}

export async function POST(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) return toPage(request, "error=后台登录已失效");
  const homeContentModel = db.homeContentItem;
  if (!homeContentModel) return toPage(request, "error=首页内容模块未初始化，请先执行 Prisma 迁移并重启服务");

  const formData = await request.formData();
  const action = String(formData.get("action") ?? "");
  const id = String(formData.get("id") ?? "").trim();
  const moduleName = String(formData.get("module") ?? "").trim() as HomeModule;
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sortOrder = Number(String(formData.get("sortOrder") ?? "0"));
  const imageInput = formData.get("image");
  const image = imageInput instanceof File && imageInput.size > 0 ? imageInput : null;

  if (!["create", "update", "delete"].includes(action)) return toPage(request, "error=无效操作");

  if (action === "delete") {
    if (!id) return toPage(request, "error=缺少内容ID");
    const existing = await homeContentModel.findUnique({ where: { id }, select: { imageUrl: true } });
    if (!existing) return toPage(request, "error=内容不存在");
    await deleteBlobByUrl(existing.imageUrl);
    await homeContentModel.delete({ where: { id } });
    return toPage(request, "ok=首页内容已删除");
  }

  if (!validModules.has(moduleName)) return toPage(request, "error=模块参数无效");
  if (!title || !description) return toPage(request, "error=标题和说明不能为空");
  if (!Number.isFinite(sortOrder)) return toPage(request, "error=排序值无效");
  if (image && !isImageFile(image)) return toPage(request, "error=仅支持上传图片");

  if (action === "create") {
    if (!image) return toPage(request, "error=请上传图片");
    const uploaded = await uploadSingleFileToBlob(image, "homepage");
    await homeContentModel.create({
      data: {
        module: moduleName,
        title,
        description,
        imageUrl: uploaded.url,
        sortOrder
      }
    });
    return toPage(request, "ok=首页内容已新增");
  }

  if (!id) return toPage(request, "error=缺少内容ID");
  const uploaded = image ? await uploadSingleFileToBlob(image, "homepage") : null;
  if (uploaded) {
    const existing = await homeContentModel.findUnique({ where: { id }, select: { imageUrl: true } });
    if (existing) await deleteBlobByUrl(existing.imageUrl);
  }
  await homeContentModel.update({
    where: { id },
    data: {
      module: moduleName,
      title,
      description,
      sortOrder,
      ...(uploaded ? { imageUrl: uploaded.url } : {})
    }
  });
  return toPage(request, "ok=首页内容已更新");
}
