import { ResourceType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSessionFromRequest } from "@/lib/auth";
import { uploadSingleFileToBlob } from "@/lib/blob";

export const runtime = "nodejs";

const typeValues = new Set(Object.values(ResourceType));

function toDashboard(request: NextRequest, query: string) {
  return NextResponse.redirect(new URL(`/admin/dashboard?${query}`, request.url));
}

export async function POST(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) return toDashboard(request, "error=后台登录已失效");

  const formData = await request.formData();
  const action = String(formData.get("action") ?? "");
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const fileInput = formData.get("file");
  const file = fileInput instanceof File && fileInput.size > 0 ? fileInput : null;

  if (!["create", "update", "delete"].includes(action)) {
    return toDashboard(request, "error=无效资料操作");
  }

  if (action === "delete") {
    if (!id) return toDashboard(request, "error=缺少资料ID");
    await db.resource.delete({ where: { id } });
    return toDashboard(request, "ok=资料已删除");
  }

  if (!title || !description) {
    return toDashboard(request, "error=资料信息不能为空");
  }

  if (!typeValues.has(type as ResourceType)) {
    return toDashboard(request, "error=资料类型无效");
  }

  if (action === "create") {
    if (!file) return toDashboard(request, "error=请上传资料文件");
    const uploaded = await uploadSingleFileToBlob(file, "resource");
    await db.resource.create({
      data: {
        title,
        description,
        fileUrl: uploaded.url,
        fileName: uploaded.name,
        fileMimeType: uploaded.mimeType,
        fileSize: uploaded.size,
        type: type as ResourceType,
        publishedById: session.userId
      }
    });
    return toDashboard(request, "ok=资料发布成功");
  }

  if (!id) return toDashboard(request, "error=缺少资料ID");
  const uploaded = file ? await uploadSingleFileToBlob(file, "resource") : null;

  await db.resource.update({
    where: { id },
    data: {
      title,
      description,
      ...(uploaded
        ? {
            fileUrl: uploaded.url,
            fileName: uploaded.name,
            fileMimeType: uploaded.mimeType,
            fileSize: uploaded.size
          }
        : {}),
      type: type as ResourceType
    }
  });
  return toDashboard(request, "ok=资料更新成功");
}
