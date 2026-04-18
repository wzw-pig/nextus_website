import { db } from "@/lib/db";
import { notFound } from "next/navigation";

type Props = {
  params: { id: string };
};

export const dynamic = "force-dynamic";

export default async function NewsDetailPage({ params }: Props) {
  const news = await db.news.findUnique({
    where: { id: params.id },
    include: { publishedBy: { select: { displayName: true } } }
  });

  if (!news) notFound();

  return (
    <article className="section">
      <h2>{news.title}</h2>
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
    </article>
  );
}
