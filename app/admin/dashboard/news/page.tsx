import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";
import { AsyncSubmitForm } from "@/components/async-submit-form";

type Props = {
  searchParams?: { error?: string; ok?: string };
};

export const dynamic = "force-dynamic";

export default async function AdminNewsPage({ searchParams }: Props) {
  const session = await getAdminSessionFromCookies();
  if (!session) redirect("/admin/login?error=请先登录后台");

  const news = await db.news.findMany({
    orderBy: { publishedAt: "desc" },
    include: { publishedBy: { select: { displayName: true } } }
  });

  return (
    <>
      <section className="section">
        <div className="section-header">
          <div>
            <h2>新闻发布与管理</h2>
            <p className="meta">发布和编辑新闻内容。</p>
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
      </section>
      <section className="section">
        <h2>发布新闻</h2>
        <AsyncSubmitForm
          action="/api/admin/news"
          className="stack"
          encType="multipart/form-data"
          submitText="发布新闻"
          workingText="正在发布..."
          successRedirect="/admin/dashboard/news"
        >
          <input type="hidden" name="action" value="create" />
          <div className="row">
            <label>
              标题
              <input name="title" required />
            </label>
            <label>
              封面图（可选，仅图片）
              <input type="file" name="coverImage" accept="image/*,.svg" />
            </label>
          </div>
          <label>
            摘要
            <input name="summary" required />
          </label>
          <label>
            正文
            <textarea name="content" required />
          </label>
          <label>
            附件（可选）
            <input type="file" name="attachments" multiple />
          </label>
        </AsyncSubmitForm>
      </section>
      <section className="section">
        <h2>新闻列表</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>标题</th>
                <th>摘要</th>
                <th>发布信息</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {news.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.summary}</td>
                  <td>
                    {item.publishedBy.displayName}
                    <br />
                    {item.publishedAt.toLocaleString("zh-CN")}
                  </td>
                  <td>
                    <form className="stack" action="/api/admin/news" method="post" encType="multipart/form-data">
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="action" value="update" />
                      <input name="title" defaultValue={item.title} required />
                      <input name="summary" defaultValue={item.summary} required />
                      <textarea name="content" defaultValue={item.content} required />
                      <label>
                        封面图（可选，仅图片）
                        <input type="file" name="coverImage" accept="image/*,.svg" />
                      </label>
                      <label>
                        新增附件（可选，多选后追加）
                        <input type="file" name="attachments" multiple />
                      </label>
                      <button className="btn btn-neutral" type="submit">
                        保存修改
                      </button>
                    </form>
                    <form action="/api/admin/news" method="post" style={{ marginTop: "0.5rem" }}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="action" value="delete" />
                      <button className="btn btn-neutral" type="submit">
                        删除
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {news.length === 0 ? (
                <tr>
                  <td colSpan={4} className="meta">
                    暂无新闻
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
