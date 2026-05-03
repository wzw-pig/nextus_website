import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";

type Props = {
  searchParams?: { error?: string; ok?: string };
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ searchParams }: Props) {
  const session = await getAdminSessionFromCookies();
  if (!session) redirect("/admin/login?error=请先登录后台");
  if (session.role !== "SUPER_ADMIN") redirect("/admin/dashboard?error=仅超级管理员可访问");

  const adminUsers = await db.adminUser.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>后台管理员账号管理</h2>
              <p className="meta">创建和修改超级管理员、普通管理员。</p>
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
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>创建管理员</h2>
          <form className="stack" action="/api/admin/admin-users" method="post">
            <input type="hidden" name="action" value="create" />
            <div className="row">
              <label>
                管理员用户名
                <input name="username" required />
              </label>
              <label>
                管理员显示名
                <input name="displayName" required />
              </label>
            </div>
            <label>
              管理员角色
              <select name="role" defaultValue="ADMIN">
                <option value="ADMIN">普通管理员</option>
                <option value="SUPER_ADMIN">超级管理员</option>
              </select>
            </label>
            <label>
              初始密码
              <input type="password" name="password" minLength={8} required />
            </label>
            <button className="btn btn-primary" type="submit">
              创建管理员账号
            </button>
          </form>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>管理员列表</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>用户名</th>
                  <th>显示名</th>
                  <th>角色</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((admin) => (
                  <tr key={admin.id}>
                    <td>{admin.username}</td>
                    <td>{admin.displayName}</td>
                    <td>{admin.role === "SUPER_ADMIN" ? "超级管理员" : "普通管理员"}</td>
                    <td>
                      {admin.id !== session.userId ? (
                        <>
                          <form className="stack" action="/api/admin/admin-users" method="post">
                            <input type="hidden" name="action" value="update" />
                            <input type="hidden" name="id" value={admin.id} />
                            <input name="displayName" defaultValue={admin.displayName} required />
                            <label>
                              角色
                              <select name="role" defaultValue={admin.role}>
                                <option value="ADMIN">普通管理员</option>
                                <option value="SUPER_ADMIN">超级管理员</option>
                              </select>
                            </label>
                            <label>
                              重置密码（可选）
                              <input type="password" name="password" minLength={8} />
                            </label>
                            <button className="btn btn-neutral" type="submit">
                              保存修改
                            </button>
                          </form>
                          {admin.role === "ADMIN" ? (
                            <form action="/api/admin/admin-users" method="post" style={{ marginTop: "0.5rem" }}>
                              <input type="hidden" name="action" value="delete" />
                              <input type="hidden" name="id" value={admin.id} />
                              <button className="btn btn-neutral" type="submit">
                                删除
                              </button>
                            </form>
                          ) : (
                            <span className="meta">超级管理员仅支持修改，不支持删除</span>
                          )}
                        </>
                      ) : (
                        <span className="meta">当前登录账号不可在此修改或删除</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
