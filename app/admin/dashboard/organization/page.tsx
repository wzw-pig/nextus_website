import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";
import { AsyncSubmitForm } from "@/components/async-submit-form";

type Props = {
  searchParams?: { error?: string; ok?: string };
};

export const dynamic = "force-dynamic";

export default async function AdminOrganizationPage({ searchParams }: Props) {
  const session = await getAdminSessionFromCookies();
  if (!session) redirect("/admin/login?error=请先登录后台");

  const members = await db.orgMember.findMany({
    orderBy: { sortOrder: "asc" }
  });
  const departments = await db.orgDepartment.findMany({
    orderBy: { sortOrder: "asc" }
  });

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>组织架构管理</h2>
              <p className="meta">管理核心管理层和部门信息。</p>
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
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>新增核心管理层成员</h2>
          <AsyncSubmitForm
            action="/api/admin/org-members"
            className="stack"
            encType="multipart/form-data"
            submitText="新增成员"
            workingText="正在提交..."
            successRedirect="/admin/dashboard/organization"
          >
            <input type="hidden" name="action" value="create" />
            <div className="row">
              <label>
                姓名
                <input name="name" required />
              </label>
              <label>
                职位
                <input name="position" required />
              </label>
            </div>
            <div className="row">
              <label>
                部门
                <input name="department" />
              </label>
              <label>
                排序（数字越小越靠前）
                <input name="sortOrder" type="number" defaultValue={0} required />
              </label>
            </div>
            <div className="row">
              <label>
                上级成员（可选）
                <select name="parentId">
                  <option value="">无（顶级成员）</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} - {m.position}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                头像（可选）
                <input type="file" name="avatar" accept="image/*,.svg" />
              </label>
            </div>
          </AsyncSubmitForm>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>核心管理层列表</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>职位</th>
                  <th>部门</th>
                  <th>上级</th>
                  <th>排序</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const parent = members.find((m) => m.id === member.parentId);
                  return (
                    <tr key={member.id}>
                      <td>{member.name}</td>
                      <td>{member.position}</td>
                      <td>{member.department || "-"}</td>
                      <td>{parent ? `${parent.name} - ${parent.position}` : "-"}</td>
                      <td>{member.sortOrder}</td>
                      <td>
                        <form className="stack" action="/api/admin/org-members" method="post" encType="multipart/form-data">
                          <input type="hidden" name="id" value={member.id} />
                          <input type="hidden" name="action" value="update" />
                          <input name="name" defaultValue={member.name} required />
                          <input name="position" defaultValue={member.position} required />
                          <input name="department" defaultValue={member.department} />
                          <select name="parentId">
                            <option value="">无（顶级成员）</option>
                            {members.filter((m) => m.id !== member.id).map((m) => (
                              <option key={m.id} value={m.id} selected={m.id === member.parentId}>
                                {m.name} - {m.position}
                              </option>
                            ))}
                          </select>
                          <input name="sortOrder" type="number" defaultValue={member.sortOrder} required />
                          <label>
                            替换头像（可选）
                            <input type="file" name="avatar" accept="image/*,.svg" />
                          </label>
                          <button className="btn btn-neutral" type="submit">
                            保存修改
                          </button>
                        </form>
                        <form action="/api/admin/org-members" method="post" style={{ marginTop: "0.5rem" }}>
                          <input type="hidden" name="id" value={member.id} />
                          <input type="hidden" name="action" value="delete" />
                          <button className="btn btn-neutral" type="submit">
                            删除
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="meta">
                      暂无成员
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>新增部门</h2>
          <AsyncSubmitForm
            action="/api/admin/organization"
            className="stack"
            encType="multipart/form-data"
            submitText="新增部门"
            workingText="正在提交..."
            successRedirect="/admin/dashboard/organization"
          >
            <input type="hidden" name="action" value="createDepartment" />
            <div className="row">
              <label>
                部门名称
                <input name="name" required />
              </label>
              <label>
                排序（数字越小越靠前）
                <input name="sortOrder" type="number" defaultValue={0} required />
              </label>
            </div>
            <label>
              部门描述
              <textarea name="description" required />
            </label>
            <label>
              部门图片（可选）
              <input type="file" name="image" accept="image/*,.svg" />
            </label>
          </AsyncSubmitForm>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>部门列表</h2>
          <div className="grid grid-2">
            {departments.length > 0 ? (
              departments.map((dept) => (
                <article className="card" key={dept.id}>
                  {dept.imageUrl ? (
                    <img
                      src={dept.imageUrl}
                      alt={dept.name}
                      style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", borderRadius: 10, marginBottom: "0.6rem" }}
                    />
                  ) : null}
                  <form className="stack" action="/api/admin/organization" method="post" encType="multipart/form-data">
                    <input type="hidden" name="id" value={dept.id} />
                    <input type="hidden" name="action" value="updateDepartment" />
                    <label>
                      部门名称
                      <input name="name" defaultValue={dept.name} required />
                    </label>
                    <label>
                      部门描述
                      <textarea name="description" defaultValue={dept.description} required />
                    </label>
                    <label>
                      排序
                      <input name="sortOrder" type="number" defaultValue={dept.sortOrder} required />
                    </label>
                    <label>
                      替换图片（可选）
                      <input type="file" name="image" accept="image/*,.svg" />
                    </label>
                    <button className="btn btn-neutral" type="submit">
                      保存修改
                    </button>
                  </form>
                  <form action="/api/admin/organization" method="post" style={{ marginTop: "0.5rem" }}>
                    <input type="hidden" name="id" value={dept.id} />
                    <input type="hidden" name="action" value="deleteDepartment" />
                    <button className="btn btn-neutral" type="submit">
                      删除
                    </button>
                  </form>
                </article>
              ))
            ) : (
              <div className="card">
                <p className="meta">暂无部门</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
