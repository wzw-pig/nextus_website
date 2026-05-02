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
  if (!session.isForumAdmin) return NextResponse.redirect(new URL("/intranet/forum?error=仅内网管理员可执行删除", request.url));

  const formData = await request.formData();
  const singleId = String(formData.get("attachmentId") ?? "");
  const batchIds = formData.getAll("attachmentIds").map((item) => String(item)).filter(Boolean);
  const ids = batchIds.length > 0 ? batchIds : singleId ? [singleId] : [];
  const reason = String(formData.get("reason") ?? "").trim();
  if (ids.length === 0 || !reason) return NextResponse.redirect(new URL("/intranet/forum?error=删除附件必须填写删除理由", request.url));

  const attachments = await db.attachment.findMany({
    where: { id: { in: ids } },
    include: {
      forumPost: { include: { author: true } },
      forumReply: { include: { author: true, post: true } }
    }
  });
  if (attachments.length === 0) return NextResponse.redirect(new URL("/intranet/forum?error=附件不存在", request.url));

  const postId = attachments[0].forumPost?.id ?? attachments[0].forumReply?.postId ?? "";
  if (!postId) return NextResponse.redirect(new URL("/intranet/forum?error=该附件不属于论坛内容", request.url));

  for (const attachment of attachments) {
    const ownerId = attachment.uploadedByIntranetId ?? attachment.forumPost?.authorId ?? attachment.forumReply?.authorId ?? "";
    if (ownerId === session.userId) return toPost(request, postId, "error=内网管理员不可删除自己上传的附件");
  }

  await Promise.allSettled(attachments.map((attachment) => deleteBlobByUrl(attachment.url)));
  await db.attachment.deleteMany({ where: { id: { in: attachments.map((a) => a.id) } } });

  const grouped = new Map<
    string,
    { postTitle: string; postCreatedAt: Date; fileNames: string[] }
  >();
  for (const attachment of attachments) {
    const ownerId = attachment.uploadedByIntranetId ?? attachment.forumPost?.authorId ?? attachment.forumReply?.authorId ?? "";
    if (!ownerId) continue;
    const postTitle = attachment.forumPost?.title ?? attachment.forumReply?.post.title ?? "未知帖子";
    const postCreatedAt = attachment.forumPost?.createdAt ?? attachment.forumReply?.post.createdAt ?? new Date();
    const current = grouped.get(ownerId);
    if (!current) {
      grouped.set(ownerId, { postTitle, postCreatedAt, fileNames: [attachment.name] });
    } else {
      current.fileNames.push(attachment.name);
    }
  }

  for (const [ownerId, data] of grouped) {
    await sendSystemMessage(
      ownerId,
      "帖子附件被管理员删除通知",
      [
        `帖子名称：${data.postTitle}`,
        `发帖时间：${data.postCreatedAt.toLocaleString("zh-CN")}`,
        `删除时间：${new Date().toLocaleString("zh-CN")}`,
        `删除人：${session.displayName}`,
        `删除理由：${reason}`,
        `删除内容：文件 ${data.fileNames.join("、")}`
      ].join("\n")
    );
  }

  return toPost(request, postId, `ok=附件删除成功（${attachments.length}个）`);
}
