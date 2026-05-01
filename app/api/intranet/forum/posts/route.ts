import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getIntranetSessionFromRequest } from "@/lib/auth";
import { ensureForumCategories } from "@/lib/forum";
import { uploadAttachmentsToBlob } from "@/lib/blob";

export const runtime = "nodejs";

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
    return wantsJson(request)
      ? json(false, "请先登录内网")
      : NextResponse.redirect(new URL("/intranet/login?error=请先登录内网", request.url));
  }

  const formData = await request.formData();
  const categorySlug = String(formData.get("categorySlug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const attachmentInputs = formData.getAll("attachments");
  const attachments = attachmentInputs
    .filter((item): item is File => item instanceof File && item.size > 0);

  if (!categorySlug || !title || !content) {
    return wantsJson(request)
      ? json(false, "发帖信息不完整")
      : NextResponse.redirect(new URL("/intranet/forum?error=发帖信息不完整", request.url));
  }
  if (attachmentInputs.length > 0 && attachments.length === 0) {
    return wantsJson(request)
      ? json(false, "附件读取失败，请重新选择文件后提交")
      : NextResponse.redirect(new URL("/intranet/forum?error=附件读取失败，请重新选择文件后提交", request.url));
  }

  await ensureForumCategories();
  const category = await db.forumCategory.findUnique({ where: { slug: categorySlug } });
  if (!category) {
    return wantsJson(request)
      ? json(false, "论坛分类不存在")
      : NextResponse.redirect(new URL("/intranet/forum?error=论坛分类不存在", request.url));
  }

  const uploadedAttachments = attachments.length > 0 ? await uploadAttachmentsToBlob(attachments, "forum") : [];
  await db.forumPost.create({
    data: {
      title,
      content,
      categoryId: category.id,
      authorId: session.userId,
      attachments: uploadedAttachments.length
        ? {
            create: uploadedAttachments.map((item) => ({
              name: item.name,
              url: item.url,
              mimeType: item.mimeType,
              size: item.size,
              uploadedByIntranetId: session.userId
            }))
          }
        : undefined
    }
  });

  return wantsJson(request)
    ? json(true, "发帖成功", `/intranet/forum/${categorySlug}`)
    : NextResponse.redirect(new URL(`/intranet/forum/${categorySlug}?ok=发帖成功`, request.url));
}
