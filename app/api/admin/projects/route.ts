import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSessionFromRequest } from "@/lib/auth";
import { uploadSingleFileToBlob, deleteBlobByUrl } from "@/lib/blob";

export const runtime = "nodejs";

function isAjax(request: NextRequest) {
  return request.headers.get("accept")?.includes("application/json") ||
    request.headers.get("x-requested-with") === "XMLHttpRequest";
}

function toPage(request: NextRequest, query: string) {
  if (isAjax(request)) {
    const params = new URLSearchParams(query);
    return NextResponse.json({ ok: !!params.get("ok"), message: params.get("ok") || params.get("error") || "" });
  }
  return NextResponse.redirect(new URL(`/admin/dashboard/projects?${query}`, request.url));
}

export async function POST(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) return toPage(request, "error=后台登录已失效");

  const formData = await request.formData();
  const action = String(formData.get("action") ?? "");
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const authors = String(formData.get("authors") ?? "").trim();
  const techStack = String(formData.get("techStack") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  if (!["create", "update", "delete"].includes(action)) return toPage(request, "error=无效操作");

  if (action === "delete") {
    if (!id) return toPage(request, "error=缺少ID");
    const existing = await db.project.findUnique({ where: { id }, include: { images: true } });
    if (existing) { for (const img of existing.images) { if (img.url.startsWith("http")) await deleteBlobByUrl(img.url); } }
    await db.project.delete({ where: { id } });
    return toPage(request, "ok=已删除");
  }

  if (!title || !description) return toPage(request, "error=标题和描述不能为空");

  const imageFiles = formData.getAll("images").filter((item): item is File => item instanceof File && item.size > 0);

  const awardDateNames = formData.getAll("awardDateName").map(String).filter(Boolean);

  if (action === "create") {
    const uploadedImages = [];
    for (let i = 0; i < Math.min(imageFiles.length, 3); i++) {
      const uploaded = await uploadSingleFileToBlob(imageFiles[i], "project");
      uploadedImages.push({ url: uploaded.url, sortOrder: i });
    }
    const awards = [];
    for (const dn of awardDateNames) {
      const [date, ...nameParts] = dn.split("|");
      if (date && nameParts.length) awards.push({ date, name: nameParts.join("|"), sortOrder: awards.length });
    }
    await db.project.create({
      data: {
        title, description, authors, techStack, sortOrder,
        images: uploadedImages.length ? { create: uploadedImages } : undefined,
        awards: awards.length ? { create: awards } : undefined,
      },
    });
    return toPage(request, "ok=创建成功");
  }

  if (!id) return toPage(request, "error=缺少ID");

  const existingImages = await db.projectImage.findMany({ where: { projectId: id } });
  const keepImageIds = formData.getAll("keepImageIds").map(String);
  const imagesToDelete = existingImages.filter((img) => !keepImageIds.includes(img.id));
  for (const img of imagesToDelete) { if (img.url.startsWith("http")) await deleteBlobByUrl(img.url); await db.projectImage.delete({ where: { id: img.id } }); }

  const newUploadedImages = [];
  for (let i = 0; i < Math.min(imageFiles.length, 3); i++) {
    const uploaded = await uploadSingleFileToBlob(imageFiles[i], "project");
    newUploadedImages.push({ url: uploaded.url, sortOrder: i });
  }

  // Handle awards
  const existingAwards = await db.projectAward.findMany({ where: { projectId: id } });
  await db.projectAward.deleteMany({ where: { projectId: id } });
  const awards = [];
  for (const dn of awardDateNames) {
    const [date, ...nameParts] = dn.split("|");
    if (date && nameParts.length) awards.push({ date, name: nameParts.join("|"), sortOrder: awards.length });
  }

  await db.project.update({
    where: { id },
    data: {
      title, description, authors, techStack, sortOrder,
      images: newUploadedImages.length ? { create: newUploadedImages } : undefined,
      awards: awards.length ? { create: awards } : undefined,
    },
  });
  return toPage(request, "ok=更新成功");
}
