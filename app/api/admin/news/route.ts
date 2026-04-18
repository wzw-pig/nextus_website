import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSessionFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

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
  const summary = String(formData.get("summary") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const coverImageUrl = String(formData.get("coverImageUrl") ?? "").trim();

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

  if (action === "create") {
    await db.news.create({
      data: {
        title,
        summary,
        content,
        coverImageUrl: coverImageUrl || null,
        publishedById: session.userId
      }
    });
    return toDashboard(request, "ok=新闻发布成功");
  }

  if (!id) return toDashboard(request, "error=缺少新闻ID");
  await db.news.update({
    where: { id },
    data: {
      title,
      summary,
      content,
      coverImageUrl: coverImageUrl || null
    }
  });
  return toDashboard(request, "ok=新闻更新成功");
}
