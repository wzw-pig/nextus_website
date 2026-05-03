import { db } from "@/lib/db";
import { resourceTypeLabels } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const resources = await db.resource.findMany({
    orderBy: { publishedAt: "desc" },
    include: {
      publishedBy: { select: { displayName: true } },
      publishedByIntranet: { select: { name: true } }
    }
  });

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title" style={{ textAlign: "left" }}>资料下载中心</h2>
        <p className="meta">支持软件资料、视频教程、文档资料等统一管理与发布。</p>
        <div className="grid grid-2" style={{ marginTop: "1.5rem" }}>
          {resources.length > 0 ? (
            resources.map((item) => (
              <article key={item.id} className="card">
                <h3 style={{ fontSize: "1.2rem", marginBottom: "0.8rem" }}>{item.title}</h3>
                <p className="meta">{item.description}</p>
                <p className="meta" style={{ marginTop: "0.5rem" }}>
                  类型：{resourceTypeLabels[item.type]} ｜ 发布人：
                  {item.publishedByIntranet?.name ?? item.publishedBy?.displayName ?? "未知"}
                </p>
                <a href={item.fileUrl} className="btn btn-neutral" target="_blank" rel="noreferrer" style={{ marginTop: "0.8rem" }}>
                  下载：{item.fileName ?? "资料文件"}
                </a>
              </article>
            ))
          ) : (
            <div className="card">
              <p className="meta">暂无可下载资料。</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
