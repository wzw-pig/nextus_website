import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getIntranetSessionFromRequest } from "@/lib/auth";
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
  const postId = String(formData.get("postId") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const attachmentInputs = formData.getAll("attachments");
  const attachments = attachmentInputs.filter((item): item is File => item instanceof File && item.size > 0);
  if (!postId || !content) {
    return wantsJson(request)
      ? json(false, "回帖内容不能为空")
      : NextResponse.redirect(new URL("/intranet/forum?error=回帖内容不能为空", request.url));
  }
  if (attachmentInputs.length > 0 && attachments.length === 0) {
    return wantsJson(request)
      ? json(false, "附件读取失败，请重新选择文件后提交")
      : NextResponse.redirect(new URL(`/intranet/forum/post/${postId}?error=附件读取失败，请重新选择文件后提交`, request.url));
  }

  const post = await db.forumPost.findUnique({
    where: { id: postId },
    include: { category: true }
  });
  if (!post) {
    return wantsJson(request)
      ? json(false, "帖子不存在")
      : NextResponse.redirect(new URL("/intranet/forum?error=帖子不存在", request.url));
  }

  const uploadedAttachments = attachments.length > 0 ? await uploadAttachmentsToBlob(attachments, "forum") : [];
  await db.forumReply.create({
    data: {
      content,
      postId,
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
    ? json(true, "回帖成功", `/intranet/forum/post/${postId}`)
    : NextResponse.redirect(new URL(`/intranet/forum/post/${postId}?ok=回帖成功`, request.url));
}
