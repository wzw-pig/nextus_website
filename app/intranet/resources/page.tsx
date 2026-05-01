import { ResourceType } from "@prisma/client";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getIntranetSessionFromCookies } from "@/lib/auth";
import { IntranetNav } from "@/components/intranet-nav";
import { AsyncSubmitForm } from "@/components/async-submit-form";
import { resourceTypeLabels } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function IntranetResourcesPage() {
  const session = await getIntranetSessionFromCookies();
  if (!session) redirect("/intranet/login?error=请先登录内网");

  const resources = await db.resource.findMany({
    orderBy: { publishedAt: "desc" },
    include: {
      publishedBy: { select: { displayName: true } },
      publishedByIntranet: { select: { name: true } }
    }
  });

  return (
    <>
      <section className="section">
        <div className="section-header">
          <div>
            <h2>内网资料发布与管理</h2>
            <p className="meta">发布资料后，站内用户可下载。</p>
          </div>
          <IntranetNav />
        </div>
      </section>
      <section className="section">
        <h2>发布资料</h2>
        <AsyncSubmitForm
          action="/api/intranet/resources"
          className="stack"
          encType="multipart/form-data"
          submitText="发布资料"
          workingText="正在发布..."
          successRedirect="/intranet/resources"
        >
          <input type="hidden" name="action" value="create" />
          <div className="row">
            <label>
              资料标题
              <input name="title" required />
            </label>
            <label>
              资料类型
              <select name="type" defaultValue={ResourceType.DOCUMENT}>
                {Object.entries(resourceTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            资料说明
            <textarea name="description" required />
          </label>
          <label>
            资料文件
            <input type="file" name="file" required />
          </label>
        </AsyncSubmitForm>
      </section>
      <section className="section">
        <h2>已发布资料</h2>
        <div className="grid">
          {resources.length > 0 ? (
            resources.map((item) => (
              <article className="card" key={item.id}>
                <h3>{item.title}</h3>
                <p className="meta">{item.description}</p>
                <p className="meta">
                  类型：{resourceTypeLabels[item.type]} ｜ 发布人：
                  {item.publishedByIntranet?.name ?? item.publishedBy?.displayName ?? "未知"}
                </p>
                <a className="btn btn-neutral" href={item.fileUrl} target="_blank" rel="noreferrer">
                  下载：{item.fileName ?? "资料文件"}
                </a>
              </article>
            ))
          ) : (
            <div className="card">
              <p className="meta">暂无资料。</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
