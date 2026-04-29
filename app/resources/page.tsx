import { db } from "@/lib/db";
import { resourceTypeLabels } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const resources = await db.resource.findMany({
    orderBy: { publishedAt: "desc" },
    include: {
      publishedBy: { select: { displayName: true } }
    }
  });

  return (
    <section className="section">
      <h2>资料下载中心</h2>
      <p className="meta">支持软件资料、视频教程、文档资料等统一管理与发布。</p>
      <div className="grid grid-2" style={{ marginTop: "0.9rem" }}>
        {resources.length > 0 ? (
          resources.map((item) => (
            <article key={item.id} className="card">
              <h3>{item.title}</h3>
              <p className="meta">{item.description}</p>
              <p className="meta">
                类型：{resourceTypeLabels[item.type]} ｜ 发布人：{item.publishedBy.displayName}
              </p>
              <a href={item.fileUrl} className="btn btn-neutral" target="_blank" rel="noreferrer">
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
    </section>
  );
}
