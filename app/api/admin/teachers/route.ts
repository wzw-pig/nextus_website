import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSessionFromRequest } from "@/lib/auth";
import { uploadSingleFileToBlob, deleteBlobByUrl } from "@/lib/blob";

export const runtime = "nodejs";

function toDashboard(request: NextRequest, query: string) {
  return NextResponse.redirect(new URL(`/admin/dashboard/teachers?${query}`, request.url));
}

export async function POST(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) return toDashboard(request, "error=后台登录已失效");

  const formData = await request.formData();
  const action = String(formData.get("action") ?? "");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();
  const college = String(formData.get("college") ?? "").trim();
  const major = String(formData.get("major") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const achievements = String(formData.get("achievements") ?? "").trim();
  const expertise = String(formData.get("expertise") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const avatarInput = formData.get("avatar");
  const avatarFile = avatarInput instanceof File && avatarInput.size > 0 ? avatarInput : null;

  if (!["create", "update", "delete"].includes(action)) {
    return toDashboard(request, "error=无效教师操作");
  }

  if (action === "delete") {
    if (!id) return toDashboard(request, "error=缺少教师ID");
    const existing = await db.teacher.findUnique({
      where: { id },
      include: { images: true },
    });
    if (existing) {
      if (existing.avatarUrl) await deleteBlobByUrl(existing.avatarUrl);
      for (const img of existing.images) {
        await deleteBlobByUrl(img.url);
      }
    }
    await db.teacher.delete({ where: { id } });
    return toDashboard(request, "ok=教师已删除");
  }

  if (!name) {
    return toDashboard(request, "error=教师姓名不能为空");
  }

  const imageFiles = formData
    .getAll("images")
    .filter((item): item is File => item instanceof File && item.size > 0);

  if (action === "create") {
    const avatarUrl = avatarFile
      ? (await uploadSingleFileToBlob(avatarFile, "teacher-avatar")).url
      : "";

    const uploadedImages = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const uploaded = await uploadSingleFileToBlob(imageFiles[i], "teacher");
      uploadedImages.push({ url: uploaded.url, sortOrder: i });
    }

    await db.teacher.create({
      data: {
        name,
        position,
        college,
        major,
        bio,
        achievements,
        expertise,
        avatarUrl,
        sortOrder,
        images: uploadedImages.length
          ? { create: uploadedImages }
          : undefined,
      },
    });
    return toDashboard(request, "ok=教师创建成功");
  }

  if (!id) return toDashboard(request, "error=缺少教师ID");

  let avatarUrl: string | undefined;
  if (avatarFile) {
    const existing = await db.teacher.findUnique({ where: { id } });
    if (existing && existing.avatarUrl) await deleteBlobByUrl(existing.avatarUrl);
    avatarUrl = (await uploadSingleFileToBlob(avatarFile, "teacher-avatar")).url;
  }

  const existingImages = await db.teacherImage.findMany({
    where: { teacherId: id },
  });
  const keepImageIds = formData
    .getAll("keepImageIds")
    .map((item) => String(item));
  const imagesToDelete = existingImages.filter(
    (img) => !keepImageIds.includes(img.id)
  );
  for (const img of imagesToDelete) {
    await deleteBlobByUrl(img.url);
    await db.teacherImage.delete({ where: { id: img.id } });
  }

  const newUploadedImages = [];
  for (let i = 0; i < imageFiles.length; i++) {
    const uploaded = await uploadSingleFileToBlob(imageFiles[i], "teacher");
    newUploadedImages.push({ url: uploaded.url, sortOrder: i });
  }

  await db.teacher.update({
    where: { id },
    data: {
      name,
      position,
      college,
      major,
      bio,
      achievements,
      expertise,
      sortOrder,
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      images: newUploadedImages.length
        ? { create: newUploadedImages }
        : undefined,
    },
  });
  return toDashboard(request, "ok=教师更新成功");
}
