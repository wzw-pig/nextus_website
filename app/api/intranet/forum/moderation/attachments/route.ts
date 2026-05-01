import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteBlobByUrl } from "@/lib/blob";
import { getIntranetSessionFromRequest } from "@/lib/auth";
import { sendSystemMessage } from "@/lib/intranet-message";

export const runtime = "nodejs";

function toPost(request: NextRequest, postId: string, query: string) {
  return NextResponse.redirect(new URL(`/intranet/forum/post/${postId}?${query}`, request.url));
}

export async function POST(request: NextRequest) {
  const session = await getIntranetSessionFromRequest(request);
  if (!session) return NextResponse.redirect(new URL("/intranet/login?error=请先登录内网", request.url));
  if (!session.isForumAdmin) return NextResponse.redirect(new URL("/intranet/forum?error=仅论坛管理员可执行删除", request.url));

  const formData = await request.formData();
  const attachmentId = String(formData.get("attachmentId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!attachmentId || !reason) return NextResponse.redirect(new URL("/intranet/forum?error=删除附件必须填写删除理由", request.url));

  const attachment = await db.attachment.findUnique({
    where: { id: attachmentId },
    include: {
      forumPost: { include: { author: true } },
      forumReply: { include: { author: true, post: true } }
    }
  });
  if (!attachment) return NextResponse.redirect(new URL("/intranet/forum?error=附件不存在", request.url));

  const postId = attachment.forumPost?.id ?? attachment.forumReply?.postId ?? "";
  if (!postId) return NextResponse.redirect(new URL("/intranet/forum?error=该附件不属于论坛内容", request.url));

  const ownerId = attachment.uploadedByIntranetId ?? attachment.forumPost?.authorId ?? attachment.forumReply?.authorId ?? "";
  if (ownerId === session.userId) return toPost(request, postId, "error=论坛管理员不可删除自己上传的附件");

  await deleteBlobByUrl(attachment.url);
  await db.attachment.delete({ where: { id: attachmentId } });

  if (ownerId) {
    const postTitle = attachment.forumPost?.title ?? attachment.forumReply?.post.title ?? "未知帖子";
    const postCreatedAt = attachment.forumPost?.createdAt ?? attachment.forumReply?.post.createdAt ?? new Date();
    await sendSystemMessage(
      ownerId,
      "帖子附件被管理员删除通知",
      [
        `帖子名称：${postTitle}`,
        `发帖时间：${postCreatedAt.toLocaleString("zh-CN")}`,
        `删除时间：${new Date().toLocaleString("zh-CN")}`,
        `删除人：${session.displayName}`,
        `删除理由：${reason}`,
        `删除内容：文件 ${attachment.name}`
      ].join("\n")
    );
  }

  return toPost(request, postId, "ok=附件已删除");
}
