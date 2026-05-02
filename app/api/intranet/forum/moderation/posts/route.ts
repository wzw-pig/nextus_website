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
  const postId = String(formData.get("postId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!postId) return NextResponse.redirect(new URL("/intranet/forum?error=缺少帖子ID", request.url));
  if (!reason) return toPost(request, postId, "error=删除帖子必须填写删除理由");

  const post = await db.forumPost.findUnique({
    where: { id: postId },
    include: {
      category: true,
      author: true,
      attachments: true,
      replies: { include: { attachments: true } }
    }
  });
  if (!post) return NextResponse.redirect(new URL("/intranet/forum?error=帖子不存在", request.url));
  if (post.authorId === session.userId) return toPost(request, postId, "error=内网管理员不可删除自己发布的帖子");

  const attachmentUrls = [...post.attachments, ...post.replies.flatMap((reply) => reply.attachments)].map((item) => item.url);
  await Promise.allSettled(attachmentUrls.map((url) => deleteBlobByUrl(url)));
  await db.forumPost.delete({ where: { id: postId } });

  await sendSystemMessage(
    post.authorId,
    "帖子被管理员删除通知",
    [
      `帖子名称：${post.title}`,
      `发帖时间：${post.createdAt.toLocaleString("zh-CN")}`,
      `删除时间：${new Date().toLocaleString("zh-CN")}`,
      `删除人：${session.displayName}`,
      `删除理由：${reason}`,
      "删除内容：整个帖子"
    ].join("\n")
  );

  return NextResponse.redirect(new URL(`/intranet/forum/${post.category.slug}?ok=帖子已删除`, request.url));
}
