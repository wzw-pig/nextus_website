type AttachmentItem = {
  id: string;
  name: string;
  url: string;
  mimeType: string | null;
  size: number | null;
};

type Props = {
  attachments: AttachmentItem[];
};

function typeLabel(name: string, mimeType: string | null) {
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (ext === "pdf" || mimeType?.includes("pdf")) return "PDF";
  if (["doc", "docx"].includes(ext)) return "DOC";
  if (["xls", "xlsx"].includes(ext)) return "XLS";
  if (["ppt", "pptx"].includes(ext)) return "PPT";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "ZIP";
  if (mimeType?.startsWith("image/")) return "IMG";
  if (mimeType?.startsWith("video/")) return "VID";
  if (mimeType?.startsWith("audio/")) return "AUD";
  return (ext || "FILE").slice(0, 4).toUpperCase();
}

function formatSize(size: number | null) {
  if (!size || size <= 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function AttachmentList({ attachments }: Props) {
  if (attachments.length === 0) return null;

  return (
    <div className="attachment-list">
      {attachments.map((attachment) => (
        <a
          key={attachment.id}
          className="attachment-item"
          href={attachment.url}
          target="_blank"
          rel="noreferrer"
          download
        >
          <span className="attachment-icon">{typeLabel(attachment.name, attachment.mimeType)}</span>
          <span>
            <span className="attachment-name">{attachment.name}</span>
            {attachment.size ? <span className="attachment-size">{formatSize(attachment.size)}</span> : null}
          </span>
        </a>
      ))}
    </div>
  );
}
