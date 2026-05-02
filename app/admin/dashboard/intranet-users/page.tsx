import { Department } from "@prisma/client";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";
import { AdminIntranetImporter } from "@/components/admin-intranet-importer";
import { AdminIntranetBulkEditor } from "@/components/admin-intranet-bulk-editor";
import { departmentLabels } from "@/lib/constants";

type Props = {
  searchParams?: { error?: string; ok?: string; q?: string };
};

export const dynamic = "force-dynamic";

export default async function AdminIntranetUsersPage({ searchParams }: Props) {
  const session = await getAdminSessionFromCookies();
  if (!session) redirect("/admin/login?error=请先登录后台");

  const keyword = (searchParams?.q ?? "").trim();
  const chars = Array.from(new Set(keyword.replace(/\s+/g, "").split("").filter(Boolean)));
  const where = keyword
    ? {
        OR: [
          { name: { contains: keyword, mode: "insensitive" as const } },
          { employeeId: { contains: keyword, mode: "insensitive" as const } },
          { contact: { contains: keyword, mode: "insensitive" as const } },
          ...(chars.length > 1
            ? [
                { AND: chars.map((char) => ({ name: { contains: char, mode: "insensitive" as const } })) },
                { AND: chars.map((char) => ({ employeeId: { contains: char, mode: "insensitive" as const } })) },
                { AND: chars.map((char) => ({ contact: { contains: char, mode: "insensitive" as const } })) }
              ]
            : [])
        ]
      }
    : undefined;

  const intranetUsers = await db.intranetUser.findMany({
    where,
    orderBy: { createdAt: "desc" }
  });

  return (
    <>
      <section className="section">
        <div className="section-header">
          <div>
            <h2>内网账号与权限管理</h2>
            <p className="meta">支持创建、编辑、查询、批量导入和批量删除。</p>
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
        <form className="row" action="/admin/dashboard/intranet-users" method="get" style={{ marginBottom: "0.8rem" }}>
          <input name="q" defaultValue={keyword} placeholder="按姓名/工号/手机号模糊搜索，例如：张三 或 138" />
          <button className="btn btn-neutral" type="submit">
            查询
          </button>
        </form>
        <AdminIntranetImporter departmentLabels={departmentLabels} />
      </section>

      <section className="section">
        <h2>创建内网账号</h2>
        <form className="stack" action="/api/admin/intranet-users" method="post">
          <input type="hidden" name="action" value="create" />
          <div className="row">
            <label>
              登录用户名
              <input name="username" required />
            </label>
            <label>
              登录密码
              <input type="password" name="password" minLength={8} required />
            </label>
          </div>
          <div className="row">
            <label>
              姓名
              <input name="name" required />
            </label>
            <label>
              部门
              <select name="department" defaultValue={Department.TECH_RESEARCH}>
                {Object.entries(departmentLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="row">
            <label>
              工号
              <input name="employeeId" required />
            </label>
            <label>
              联系方式
              <input name="contact" required />
            </label>
          </div>
          <div className="row">
            <label>
              <input type="checkbox" name="canApproveFinance" style={{ width: "auto" }} /> 允许作为财务审批人
            </label>
            <label>
              <input type="checkbox" name="isForumAdmin" style={{ width: "auto" }} /> 内网管理员
            </label>
          </div>
          <button className="btn btn-primary" type="submit">
            创建内网账号
          </button>
        </form>
      </section>

      <section className="section">
        <h2>账号列表</h2>
        <form id="batchDeleteForm" action="/api/admin/intranet-users/batch-delete" method="post">
          <div className="actions" style={{ marginBottom: "0.5rem" }}>
            <button className="btn btn-neutral" type="submit">
              批量删除勾选账号
            </button>
          </div>
        </form>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>勾选</th>
                <th>账号</th>
                <th>姓名</th>
                <th>工号</th>
                <th>手机号</th>
                <th>权限概览</th>
              </tr>
            </thead>
            <tbody>
              {intranetUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <input type="checkbox" name="ids" value={user.id} form="batchDeleteForm" style={{ width: "auto" }} />
                  </td>
                  <td>{user.username}</td>
                  <td>{user.name}</td>
                  <td>{user.employeeId}</td>
                  <td>{user.contact}</td>
                  <td>
                    {user.canApproveFinance ? "审批用户" : "普通用户"} ｜ {user.isForumAdmin ? "内网管理员" : "内网普通用户"} ｜{" "}
                    {user.isActive ? "启用" : "禁用"}
                  </td>
                </tr>
              ))}
              {intranetUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="meta">
                    暂无内网账号
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <h3 style={{ marginTop: "0.9rem" }}>批量编辑（底部统一保存）</h3>
        <AdminIntranetBulkEditor
          departmentLabels={departmentLabels}
          users={intranetUsers.map((item) => ({
            id: item.id,
            username: item.username,
            name: item.name,
            department: item.department,
            employeeId: item.employeeId,
            contact: item.contact,
            canApproveFinance: item.canApproveFinance,
            isForumAdmin: item.isForumAdmin,
            isActive: item.isActive
          }))}
        />
      </section>
    </>
  );
}
