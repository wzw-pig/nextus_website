import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";
import { AsyncSubmitForm } from "@/components/async-submit-form";
import { resourceTypeLabels } from "@/lib/constants";
import { ResourceType } from "@prisma/client";

type Props = {
  searchParams?: { error?: string; ok?: string };
};

export const dynamic = "force-dynamic";

const resourceTypes = Object.values(ResourceType) as ResourceType[];

export default async function AdminResourcesPage({ searchParams }: Props) {
  const session = await getAdminSessionFromCookies();
  if (!session) redirect("/admin/login?error=请先登录后台");

  const resources = await db.resource.findMany({
    orderBy: { publishedAt: "desc" },
    include: { publishedBy: { select: { displayName: true } } }
  });

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>资料发布与管理</h2>
              <p className="meta">发布和管理软件资料、视频教程、文档资料等。</p>
            </div>
            <AdminNav />
          </div>
          <div className="actions" style={{ marginTop: "0.6rem" }}>
            <a className="btn btn-neutral" href="/admin/dashboard">
              返回功能列表
            </a>
          </div>
          {searchParams?.error ? <p className="danger">{decodeURIComponent(searchParams.error)}</p> : null}
          {searchParams?.ok ? <p className="ok">{decodeURIComponent(searchParams.ok)}</p> : null}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>发布资料</h2>
          <AsyncSubmitForm
            action="/api/admin/resources"
            className="stack"
            encType="multipart/form-data"
            submitText="发布资料"
            workingText="正在发布..."
            successRedirect="/admin/dashboard/resources"
          >
            <input type="hidden" name="action" value="create" />
            <div className="row">
              <label>
                标题
                <input name="title" required />
              </label>
              <label>
                类型
                <select name="type" required>
                  <option value="">请选择类型</option>
                  {resourceTypes.map((type) => (
                    <option key={type} value={type}>{resourceTypeLabels[type]}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              描述
              <input name="description" required />
            </label>
            <label>
              资料文件
              <input type="file" name="file" required />
            </label>
          </AsyncSubmitForm>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>资料列表</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>标题</th>
                  <th>类型</th>
                  <th>文件名</th>
                  <th>发布信息</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{resourceTypeLabels[item.type]}</td>
                    <td>{item.fileName ?? "-"}</td>
                    <td>
                      {item.publishedBy?.displayName ?? "未知"}
                      <br />
                      {item.publishedAt.toLocaleString("zh-CN")}
                    </td>
                    <td>
                      <form className="stack" action="/api/admin/resources" method="post" encType="multipart/form-data">
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="action" value="update" />
                        <input name="title" defaultValue={item.title} required />
                        <input name="description" defaultValue={item.description} required />
                        <select name="type" defaultValue={item.type} required>
                          {resourceTypes.map((type) => (
                            <option key={type} value={type}>{resourceTypeLabels[type]}</option>
                          ))}
                        </select>
                        <label>
                          替换文件（可选）
                          <input type="file" name="file" />
                        </label>
                        <button className="btn btn-neutral" type="submit">
                          保存修改
                        </button>
                      </form>
                      <form action="/api/admin/resources" method="post" style={{ marginTop: "0.5rem" }}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="action" value="delete" />
                        <button className="btn btn-neutral" type="submit">
                          删除
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {resources.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="meta">
                      暂无资料
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
