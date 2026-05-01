import { ResourceType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getIntranetSessionFromRequest } from "@/lib/auth";
import { deleteBlobByUrl, uploadSingleFileToBlob } from "@/lib/blob";

export const runtime = "nodejs";

const typeValues = new Set(Object.values(ResourceType));

function toResources(request: NextRequest, query: string) {
  return NextResponse.redirect(new URL(`/intranet/resources?${query}`, request.url));
}

function wantsJson(request: NextRequest) {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("application/json") || request.headers.get("x-requested-with") === "XMLHttpRequest";
}

function json(ok: boolean, message: string, redirectTo?: string) {
  return NextResponse.json({ ok, message, redirectTo });
}

export async function POST(request: NextRequest) {
  const session = await getIntranetSessionFromRequest(request);
  if (!session) {
    return wantsJson(request) ? json(false, "请先登录内网") : toResources(request, "error=请先登录内网");
  }

  const formData = await request.formData();
  const action = String(formData.get("action") ?? "");
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const fileInput = formData.get("file");
  const file = fileInput instanceof File && fileInput.size > 0 ? fileInput : null;

  if (!["create", "update", "delete"].includes(action)) {
    return wantsJson(request) ? json(false, "无效资料操作") : toResources(request, "error=无效资料操作");
  }

  if (action === "delete") {
    if (!id) return wantsJson(request) ? json(false, "缺少资料ID") : toResources(request, "error=缺少资料ID");
    const existing = await db.resource.findUnique({ where: { id }, select: { fileUrl: true } });
    if (existing) await deleteBlobByUrl(existing.fileUrl);
    await db.resource.delete({ where: { id } });
    return wantsJson(request) ? json(true, "资料已删除", "/intranet/resources") : toResources(request, "ok=资料已删除");
  }

  if (!title || !description) {
    return wantsJson(request) ? json(false, "资料信息不能为空") : toResources(request, "error=资料信息不能为空");
  }
  if (!typeValues.has(type as ResourceType)) {
    return wantsJson(request) ? json(false, "资料类型无效") : toResources(request, "error=资料类型无效");
  }

  if (action === "create") {
    if (!file) return wantsJson(request) ? json(false, "请上传资料文件") : toResources(request, "error=请上传资料文件");
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
        publishedByIntranetId: session.userId
      }
    });
    return wantsJson(request) ? json(true, "资料发布成功", "/intranet/resources") : toResources(request, "ok=资料发布成功");
  }

  if (!id) return wantsJson(request) ? json(false, "缺少资料ID") : toResources(request, "error=缺少资料ID");
  const uploaded = file ? await uploadSingleFileToBlob(file, "resource") : null;
  if (uploaded) {
    const existing = await db.resource.findUnique({ where: { id }, select: { fileUrl: true } });
    if (existing) await deleteBlobByUrl(existing.fileUrl);
  }
  await db.resource.update({
    where: { id },
    data: {
      title,
      description,
      type: type as ResourceType,
      ...(uploaded
        ? {
            fileUrl: uploaded.url,
            fileName: uploaded.name,
            fileMimeType: uploaded.mimeType,
            fileSize: uploaded.size
          }
        : {})
    }
  });
  return wantsJson(request) ? json(true, "资料更新成功", "/intranet/resources") : toResources(request, "ok=资料更新成功");
}
