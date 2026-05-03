import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";
import { AsyncSubmitForm } from "@/components/async-submit-form";

type Props = {
  searchParams?: { error?: string; ok?: string };
};

export const dynamic = "force-dynamic";

export default async function AdminContactPage({ searchParams }: Props) {
  const session = await getAdminSessionFromCookies();
  if (!session) redirect("/admin/login?error=请先登录后台");

  const items = await db.contactItem.findMany({
    orderBy: { sortOrder: "asc" }
  });

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>联系方式管理</h2>
              <p className="meta">管理联系我们页面的联系方式信息。</p>
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
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>新增联系方式</h2>
          <AsyncSubmitForm
            action="/api/admin/contact"
            className="stack"
            encType="multipart/form-data"
            submitText="新增联系方式"
            workingText="正在提交..."
            successRedirect="/admin/dashboard/contact"
          >
            <input type="hidden" name="action" value="create" />
            <div className="row">
              <label>
                标题
                <input name="title" required />
              </label>
              <label>
                排序（数字越小越靠前）
                <input name="sortOrder" type="number" defaultValue={0} required />
              </label>
            </div>
            <label>
              内容
              <textarea name="content" required />
            </label>
            <label>
              图片（可选）
              <input type="file" name="image" accept="image/*,.svg" />
            </label>
          </AsyncSubmitForm>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>联系方式列表</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>标题</th>
                  <th>内容</th>
                  <th>图片</th>
                  <th>排序</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td style={{ maxWidth: 300, whiteSpace: "pre-wrap" }}>{item.content}</td>
                    <td>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }} />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{item.sortOrder}</td>
                    <td>
                      <form className="stack" action="/api/admin/contact" method="post" encType="multipart/form-data">
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="action" value="update" />
                        <input name="title" defaultValue={item.title} required />
                        <textarea name="content" defaultValue={item.content} required />
                        <input name="sortOrder" type="number" defaultValue={item.sortOrder} required />
                        <label>
                          替换图片（可选）
                          <input type="file" name="image" accept="image/*,.svg" />
                        </label>
                        <button className="btn btn-neutral" type="submit">
                          保存修改
                        </button>
                      </form>
                      <form action="/api/admin/contact" method="post" style={{ marginTop: "0.5rem" }}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="action" value="delete" />
                        <button className="btn btn-neutral" type="submit">
                          删除
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="meta">
                      暂无联系方式
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
