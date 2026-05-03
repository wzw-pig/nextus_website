import { del, put } from "@vercel/blob";

type UploadedAttachment = {
  name: string;
  url: string;
  mimeType: string | null;
  size: number;
};

function getBlobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN 未配置，请先在环境变量中设置");
  }
  return token;
}

function isBlobUrl(url: string) {
  return /^https?:\/\/.+/i.test(url);
}

function sanitizeFilename(name: string) {
  return name.replace(/[^\w.\-]+/g, "_");
}

function isImageFile(file: File) {
  if (file.type.startsWith("image/")) return true;
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  return ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext);
}

type BlobFolder = "news" | "forum" | "news-cover" | "resource" | "training" | "homepage" | "project" | "achievement" | "team-style" | "org-member" | "org-department" | "teacher" | "teacher-avatar" | "competition-photo" | "contact-item";

export async function uploadSingleFileToBlob(file: File, folder: BlobFolder): Promise<UploadedAttachment> {
  const token = getBlobToken();
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  if (fileBuffer.byteLength === 0) {
    throw new Error(`附件 ${file.name || "file"} 读取失败：文件内容为空`);
  }

  const safeName = sanitizeFilename(file.name || "file");
  const pathname = `${folder}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const blob = await put(pathname, fileBuffer, {
    access: "public",
    token,
    contentType: file.type || undefined
  });

  return {
    name: file.name || safeName,
    url: blob.url,
    mimeType: file.type || null,
    size: fileBuffer.byteLength
  };
}

export async function uploadImageToBlob(file: File, folder: "news-cover"): Promise<UploadedAttachment> {
  if (!isImageFile(file)) {
    throw new Error("仅支持上传图片格式作为封面图");
  }
  return uploadSingleFileToBlob(file, folder);
}

export async function uploadAttachmentsToBlob(
  files: File[],
  folder: "news" | "forum" | "training"
): Promise<UploadedAttachment[]> {
  return Promise.all(files.map((file) => uploadSingleFileToBlob(file, folder)));
}

export async function deleteBlobByUrl(url: string) {
  if (!isBlobUrl(url)) return;
  const token = getBlobToken();
  await del(url, { token });
}
