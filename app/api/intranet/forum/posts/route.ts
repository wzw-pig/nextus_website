import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getIntranetSessionFromRequest } from "@/lib/auth";
import { ensureForumCategories } from "@/lib/forum";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getIntranetSessionFromRequest(request);
  if (!session) {
    return NextResponse.redirect(new URL("/intranet/login?error=请先登录内网", request.url));
  }

  const formData = await request.formData();
  const categorySlug = String(formData.get("categorySlug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!categorySlug || !title || !content) {
    return NextResponse.redirect(new URL("/intranet/forum?error=发帖信息不完整", request.url));
  }

  await ensureForumCategories();
  const category = await db.forumCategory.findUnique({ where: { slug: categorySlug } });
  if (!category) {
    return NextResponse.redirect(new URL("/intranet/forum?error=论坛分类不存在", request.url));
  }

  await db.forumPost.create({
    data: {
      title,
      content,
      categoryId: category.id,
      authorId: session.userId
    }
  });

  return NextResponse.redirect(new URL(`/intranet/forum/${categorySlug}?ok=发帖成功`, request.url));
}
