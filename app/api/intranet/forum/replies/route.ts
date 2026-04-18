import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getIntranetSessionFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getIntranetSessionFromRequest(request);
  if (!session) {
    return NextResponse.redirect(new URL("/intranet/login?error=请先登录内网", request.url));
  }

  const formData = await request.formData();
  const postId = String(formData.get("postId") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!postId || !content) {
    return NextResponse.redirect(new URL("/intranet/forum?error=回帖内容不能为空", request.url));
  }

  const post = await db.forumPost.findUnique({
    where: { id: postId },
    include: { category: true }
  });
  if (!post) {
    return NextResponse.redirect(new URL("/intranet/forum?error=帖子不存在", request.url));
  }

  await db.forumReply.create({
    data: {
      content,
      postId,
      authorId: session.userId
    }
  });

  return NextResponse.redirect(new URL(`/intranet/forum/post/${postId}?ok=回帖成功`, request.url));
}
