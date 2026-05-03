import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getIntranetSessionFromRequest } from "@/lib/auth";
import { deleteBlobByUrl, uploadAttachmentsToBlob } from "@/lib/blob";

export const runtime = "nodejs";

function toTraining(request: NextRequest, query: string) {
  return NextResponse.redirect(new URL(`/intranet/training?${query}`, request.url));
}

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
  if (!session.isForumAdmin) {
    return wantsJson(request) ? json(false, "仅内网管理员可编辑入职培训") : toTraining(request, "error=仅内网管理员可编辑入职培训");
  }

  const formData = await request.formData();
  const content = String(formData.get("content") ?? "");
  const removeAttachmentIds = formData
    .getAll("removeAttachmentIds")
    .map((item) => String(item))
    .filter(Boolean);
  const attachmentInputs = formData.getAll("attachments");
  const attachments = attachmentInputs.filter((item): item is File => item instanceof File && item.size > 0);
  if (attachmentInputs.length > 0 && attachments.length === 0) {
    return wantsJson(request)
      ? json(false, "附件读取失败，请重新选择文件")
      : toTraining(request, "error=附件读取失败，请重新选择文件");
  }

  const training = await db.trainingContent.upsert({
    where: { key: "default" },
    create: { key: "default", content, updatedById: session.userId },
    update: { content, updatedById: session.userId },
    include: { attachments: true }
  });

  const removingAttachments =
    removeAttachmentIds.length > 0
      ? training.attachments.filter((item) => removeAttachmentIds.includes(item.id))
      : [];
  if (removingAttachments.length > 0) {
    await Promise.all(removingAttachments.map((item) => deleteBlobByUrl(item.url)));
    await db.trainingAttachment.deleteMany({
      where: { id: { in: removingAttachments.map((item) => item.id) }, contentId: training.id }
    });
  }

  const uploadedAttachments = attachments.length ? await uploadAttachmentsToBlob(attachments, "training") : [];
  if (uploadedAttachments.length > 0) {
    await db.trainingAttachment.createMany({
      data: uploadedAttachments.map((item) => ({
        contentId: training.id,
        name: item.name,
        url: item.url,
        mimeType: item.mimeType,
        size: item.size
      }))
    });
  }

  return wantsJson(request)
    ? json(true, "入职培训内容已发布", "/intranet/training")
    : toTraining(request, "ok=入职培训内容已发布");
}
