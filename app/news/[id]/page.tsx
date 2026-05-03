import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { AttachmentList } from "@/components/attachment-list";

type Props = {
  params: { id: string };
};

export const dynamic = "force-dynamic";

export default async function NewsDetailPage({ params }: Props) {
  const news = await db.news.findUnique({
    where: { id: params.id },
    include: {
      publishedBy: { select: { displayName: true } },
      attachments: { orderBy: { createdAt: "asc" } }
    }
  });

  if (!news) notFound();

  return (
    <section className="section">
      <div className="container">
        <h2 style={{ fontSize: "1.8rem", marginBottom: "0.8rem" }}>{news.title}</h2>
        <p className="meta">
          发布人：{news.publishedBy.displayName} ｜ {news.publishedAt.toLocaleString("zh-CN")}
        </p>
        {news.coverImageUrl ? (
          <div style={{ marginTop: "0.8rem" }}>
            <img src={news.coverImageUrl} alt={news.title} style={{ width: "100%", borderRadius: "12px" }} />
          </div>
        ) : null}
        <div className="card" style={{ marginTop: "0.8rem" }}>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{news.content}</p>
        </div>
        <div className="card" style={{ marginTop: "0.8rem" }}>
          <p className="meta" style={{ marginTop: 0 }}>
            附件下载
          </p>
          {news.attachments.length > 0 ? (
            <AttachmentList attachments={news.attachments} />
          ) : (
            <p className="meta" style={{ marginBottom: 0 }}>
              暂无附件
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
