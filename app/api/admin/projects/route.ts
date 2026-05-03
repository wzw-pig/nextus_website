import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSessionFromRequest } from "@/lib/auth";
import { uploadSingleFileToBlob, deleteBlobByUrl } from "@/lib/blob";

export const runtime = "nodejs";

function toDashboard(request: NextRequest, query: string) {
  return NextResponse.redirect(new URL(`/admin/dashboard/projects?${query}`, request.url));
}

export async function POST(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) return toDashboard(request, "error=后台登录已失效");

  const formData = await request.formData();
  const action = String(formData.get("action") ?? "");
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const authors = String(formData.get("authors") ?? "").trim();
  const techStack = String(formData.get("techStack") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  if (!["create", "update", "delete"].includes(action)) {
    return toDashboard(request, "error=无效项目操作");
  }

  if (action === "delete") {
    if (!id) return toDashboard(request, "error=缺少项目ID");
    const existing = await db.project.findUnique({
      where: { id },
      include: { images: true },
    });
    if (existing) {
      for (const img of existing.images) {
        await deleteBlobByUrl(img.url);
      }
    }
    await db.project.delete({ where: { id } });
    return toDashboard(request, "ok=项目已删除");
  }

  if (!title || !description) {
    return toDashboard(request, "error=项目标题和描述不能为空");
  }

  const imageFiles = formData
    .getAll("images")
    .filter((item): item is File => item instanceof File && item.size > 0);

  const awardsRaw = formData.getAll("awards").map((item) => {
    try {
      return JSON.parse(String(item));
    } catch {
      return null;
    }
  }).filter(Boolean) as { id?: string; date: string; name: string; sortOrder?: number }[];

  if (action === "create") {
    const uploadedImages = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const uploaded = await uploadSingleFileToBlob(imageFiles[i], "project");
      uploadedImages.push({ url: uploaded.url, sortOrder: i });
    }

    await db.project.create({
      data: {
        title,
        description,
        authors,
        techStack,
        sortOrder,
        images: uploadedImages.length
          ? { create: uploadedImages }
          : undefined,
        awards: awardsRaw.length
          ? {
              create: awardsRaw.map((a, i) => ({
                date: a.date,
                name: a.name,
                sortOrder: a.sortOrder ?? i,
              })),
            }
          : undefined,
      },
    });
    return toDashboard(request, "ok=项目创建成功");
  }

  if (!id) return toDashboard(request, "error=缺少项目ID");

  const existingImages = await db.projectImage.findMany({
    where: { projectId: id },
  });
  const keepImageIds = formData
    .getAll("keepImageIds")
    .map((item) => String(item));
  const imagesToDelete = existingImages.filter(
    (img) => !keepImageIds.includes(img.id)
  );
  for (const img of imagesToDelete) {
    await deleteBlobByUrl(img.url);
    await db.projectImage.delete({ where: { id: img.id } });
  }

  const newUploadedImages = [];
  for (let i = 0; i < imageFiles.length; i++) {
    const uploaded = await uploadSingleFileToBlob(imageFiles[i], "project");
    newUploadedImages.push({ url: uploaded.url, sortOrder: i });
  }

  const existingAwards = await db.projectAward.findMany({
    where: { projectId: id },
  });
  const keepAwardIds = awardsRaw
    .filter((a) => a.id)
    .map((a) => a.id as string);
  const awardsToDelete = existingAwards.filter(
    (a) => !keepAwardIds.includes(a.id)
  );
  if (awardsToDelete.length) {
    await db.projectAward.deleteMany({
      where: { id: { in: awardsToDelete.map((a) => a.id) } },
    });
  }

  for (const a of awardsRaw) {
    if (a.id) {
      await db.projectAward.update({
        where: { id: a.id },
        data: {
          date: a.date,
          name: a.name,
          sortOrder: a.sortOrder ?? 0,
        },
      });
    }
  }

  const newAwards = awardsRaw.filter((a) => !a.id);

  await db.project.update({
    where: { id },
    data: {
      title,
      description,
      authors,
      techStack,
      sortOrder,
      images: newUploadedImages.length
        ? { create: newUploadedImages }
        : undefined,
      awards: newAwards.length
        ? {
            create: newAwards.map((a, i) => ({
              date: a.date,
              name: a.name,
              sortOrder: a.sortOrder ?? i,
            })),
          }
        : undefined,
    },
  });
  return toDashboard(request, "ok=项目更新成功");
}
