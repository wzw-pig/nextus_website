import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSessionFromRequest } from "@/lib/auth";
import { uploadAttachmentsToBlob, uploadImageToBlob } from "@/lib/blob";

export const runtime = "nodejs";

function toDashboard(request: NextRequest, query: string) {
  return NextResponse.redirect(new URL(`/admin/dashboard?${query}`, request.url));
}

function isValidCoverImage(file: File) {
  if (file.type.startsWith("image/")) return true;
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  return ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext);
}

export async function POST(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) return toDashboard(request, "error=后台登录已失效");

  const formData = await request.formData();
  const action = String(formData.get("action") ?? "");
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const coverImageFile = formData.get("coverImage");
  const attachmentInputs = formData.getAll("attachments");
  const attachments = attachmentInputs
    .filter((item): item is File => item instanceof File && item.size > 0);
  const coverFile = coverImageFile instanceof File && coverImageFile.size > 0 ? coverImageFile : null;

  if (!["create", "update", "delete"].includes(action)) {
    return toDashboard(request, "error=无效新闻操作");
  }

  if (action === "delete") {
    if (!id) return toDashboard(request, "error=缺少新闻ID");
    await db.news.delete({ where: { id } });
    return toDashboard(request, "ok=新闻已删除");
  }

  if (!title || !summary || !content) {
    return toDashboard(request, "error=标题、摘要和正文不能为空");
  }
  if (attachmentInputs.length > 0 && attachments.length === 0) {
    return toDashboard(request, "error=附件读取失败，请重新选择文件后提交");
  }
  if (coverImageFile && !(coverImageFile instanceof File)) {
    return toDashboard(request, "error=封面图读取失败");
  }
  if (coverFile && !isValidCoverImage(coverFile)) {
    return toDashboard(request, "error=封面图仅支持图片格式");
  }

  if (action === "create") {
    const uploadedAttachments = attachments.length > 0 ? await uploadAttachmentsToBlob(attachments, "news") : [];
    const coverImage = coverFile ? await uploadImageToBlob(coverFile, "news-cover") : null;
    await db.news.create({
      data: {
        title,
        summary,
        content,
        coverImageUrl: coverImage?.url || "/logo.svg",
        publishedById: session.userId,
        attachments: uploadedAttachments.length
          ? {
              create: uploadedAttachments.map((item) => ({
                name: item.name,
                url: item.url,
                mimeType: item.mimeType,
                size: item.size,
                uploadedByAdminId: session.userId
              }))
            }
          : undefined
      }
    });
    return toDashboard(request, "ok=新闻发布成功");
  }

  if (!id) return toDashboard(request, "error=缺少新闻ID");
  const coverImage = coverFile ? await uploadImageToBlob(coverFile, "news-cover") : null;
  const uploadedAttachments = attachments.length > 0 ? await uploadAttachmentsToBlob(attachments, "news") : [];
  await db.news.update({
    where: { id },
    data: {
      title,
      summary,
      content,
      ...(coverImage ? { coverImageUrl: coverImage.url } : {}),
      attachments: uploadedAttachments.length
        ? {
            create: uploadedAttachments.map((item) => ({
              name: item.name,
              url: item.url,
              mimeType: item.mimeType,
              size: item.size,
              uploadedByAdminId: session.userId
            }))
          }
        : undefined
    }
  });
  return toDashboard(request, "ok=新闻更新成功");
}
