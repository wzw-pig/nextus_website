import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const news = await db.news.findMany({
    orderBy: { publishedAt: "desc" },
    include: {
      publishedBy: { select: { displayName: true } },
      _count: { select: { attachments: true } }
    }
  });

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title" style={{ textAlign: "left" }}>新闻动态</h2>
        <p className="meta">该内容来自数据库，由后台指定账号发布。</p>
        <div className="grid grid-2" style={{ marginTop: "1.5rem" }}>
          {news.length > 0 ? (
            news.map((item) => (
              <article key={item.id} className="card">
                <h3 style={{ fontSize: "1.2rem", marginBottom: "0.8rem" }}>{item.title}</h3>
                <p className="meta">{item.summary}</p>
                <p className="meta" style={{ marginTop: "0.5rem" }}>
                  发布人：{item.publishedBy.displayName} ｜ {item.publishedAt.toLocaleString("zh-CN")}
                </p>
                {item._count.attachments > 0 ? <p className="meta">附件：{item._count.attachments} 个</p> : null}
                <Link href={`/news/${item.id}`} className="btn btn-neutral" style={{ marginTop: "0.8rem" }}>
                  阅读全文
                </Link>
              </article>
            ))
          ) : (
            <div className="card">
              <p className="meta">暂无新闻。</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
