import { Department, ResourceType } from "@prisma/client";
import { redirect } from "next/navigation";
import { getAdminSessionFromCookies } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminNav } from "@/components/admin-nav";
import { departmentLabels, resourceTypeLabels } from "@/lib/constants";

type Props = {
  searchParams?: { error?: string; ok?: string };
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({ searchParams }: Props) {
  const session = await getAdminSessionFromCookies();
  if (!session) redirect("/admin/login?error=请先登录后台");

  const [news, resources, intranetUsers, adminUsers] = await Promise.all([
    db.news.findMany({
      orderBy: { publishedAt: "desc" },
      include: { publishedBy: { select: { displayName: true } } }
    }),
    db.resource.findMany({
      orderBy: { publishedAt: "desc" },
      include: { publishedBy: { select: { displayName: true } } }
    }),
    db.intranetUser.findMany({
      orderBy: { createdAt: "desc" }
    }),
    db.adminUser.findMany({
      orderBy: { createdAt: "asc" }
    })
  ]);

  return (
    <>
      <section className="section">
        <div className="section-header">
          <div>
            <h2>数据库后台管理系统</h2>
            <p className="meta">
              当前账号：{session.displayName}（{session.username}，{session.role === "SUPER_ADMIN" ? "超级管理员" : "普通管理员"}）
            </p>
          </div>
          <AdminNav />
        </div>
        {searchParams?.error ? <p className="danger">{decodeURIComponent(searchParams.error)}</p> : null}
        {searchParams?.ok ? <p className="ok">{decodeURIComponent(searchParams.ok)}</p> : null}
      </section>

      <section className="section">
        <h2>当前后台账号重置密码</h2>
        <p className="meta">仅需输入新密码，无需输入原密码。</p>
        <form className="stack" action="/api/admin/self-password" method="post" style={{ marginTop: "0.8rem" }}>
          <label>
            新密码
            <input type="password" name="password" required minLength={8} />
          </label>
          <button className="btn btn-primary" type="submit">
            重置我的后台密码
          </button>
        </form>
      </section>

      <section className="section">
        <h2>新闻发布与管理（增查删改）</h2>
        <form className="stack" action="/api/admin/news" method="post" encType="multipart/form-data">
          <input type="hidden" name="action" value="create" />
          <div className="row">
            <label>
              标题
              <input name="title" required />
            </label>
            <label>
              封面图（可选，仅图片；不上传则默认团队 logo）
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
            附件（可选，支持图片/视频/文件，支持多选）
            <input type="file" name="attachments" multiple />
          </label>
          <button type="submit" className="btn btn-primary">
            发布新闻
          </button>
        </form>

        <div className="table-wrap" style={{ marginTop: "0.8rem" }}>
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
                        封面图（可选，仅图片；不上传则保留原封面）
                        <input type="file" name="coverImage" accept="image/*,.svg" />
                      </label>
                      <label>
                        新增附件（可选，多选后追加到该新闻）
                        <input type="file" name="attachments" multiple />
                      </label>
                      <div className="actions">
                        <button className="btn btn-neutral" type="submit">
                          保存修改
                        </button>
                      </div>
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

      <section className="section">
        <h2>资料发布与管理（增查删改）</h2>
        <form className="stack" action="/api/admin/resources" method="post" encType="multipart/form-data">
          <input type="hidden" name="action" value="create" />
          <div className="row">
            <label>
              资料标题
              <input name="title" required />
            </label>
            <label>
              资料类型
              <select name="type" defaultValue={ResourceType.SOFTWARE}>
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
            资料文件（必传，不限格式）
            <input type="file" name="file" required />
          </label>
          <button className="btn btn-primary" type="submit">
            发布资料
          </button>
        </form>
        <div className="table-wrap" style={{ marginTop: "0.8rem" }}>
          <table>
            <thead>
              <tr>
                <th>标题</th>
                <th>类型</th>
                <th>下载文件</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{resourceTypeLabels[item.type]}</td>
                  <td>
                    <a href={item.fileUrl} target="_blank" rel="noreferrer">
                      {item.fileName ?? item.fileUrl}
                    </a>
                  </td>
                  <td>
                     <form className="stack" action="/api/admin/resources" method="post" encType="multipart/form-data">
                       <input type="hidden" name="id" value={item.id} />
                       <input type="hidden" name="action" value="update" />
                       <input name="title" defaultValue={item.title} required />
                      <select name="type" defaultValue={item.type}>
                        {Object.entries(resourceTypeLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                       </select>
                       <textarea name="description" defaultValue={item.description} required />
                       <label>
                         替换资料文件（可选，不限格式）
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
                  <td colSpan={4} className="meta">
                    暂无资料
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <h2>内网账号与权限管理（增查删改）</h2>
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
          <label>
            <input type="checkbox" name="canApproveFinance" style={{ width: "auto" }} /> 允许作为财务审批人
          </label>
          <button className="btn btn-primary" type="submit">
            创建内网账号
          </button>
        </form>

        <div className="table-wrap" style={{ marginTop: "0.8rem" }}>
          <table>
            <thead>
              <tr>
                <th>账号</th>
                <th>姓名/部门</th>
                <th>工号/联系方式</th>
                <th>权限与状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {intranetUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>
                    {user.name}
                    <br />
                    {departmentLabels[user.department]}
                  </td>
                  <td>
                    {user.employeeId}
                    <br />
                    {user.contact}
                  </td>
                  <td>
                    {user.canApproveFinance ? "审批用户" : "普通用户"}
                    <br />
                    {user.isActive ? "启用" : "禁用"}
                  </td>
                  <td>
                    <form className="stack" action="/api/admin/intranet-users" method="post">
                      <input type="hidden" name="action" value="update" />
                      <input type="hidden" name="id" value={user.id} />
                      <input name="name" defaultValue={user.name} required />
                      <select name="department" defaultValue={user.department}>
                        {Object.entries(departmentLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <input name="contact" defaultValue={user.contact} required />
                      <input name="employeeId" defaultValue={user.employeeId} required />
                      <label>
                        <input
                          type="checkbox"
                          name="canApproveFinance"
                          defaultChecked={user.canApproveFinance}
                          style={{ width: "auto" }}
                        />
                        审批权限
                      </label>
                      <label>
                        <input type="checkbox" name="isActive" defaultChecked={user.isActive} style={{ width: "auto" }} />
                        账号启用
                      </label>
                      <label>
                        重置密码（可选）
                        <input type="password" name="password" minLength={8} />
                      </label>
                      <button className="btn btn-neutral" type="submit">
                        保存修改
                      </button>
                    </form>
                    <form action="/api/admin/intranet-users" method="post" style={{ marginTop: "0.5rem" }}>
                      <input type="hidden" name="action" value="delete" />
                      <input type="hidden" name="id" value={user.id} />
                      <button className="btn btn-neutral" type="submit">
                        删除
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {intranetUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="meta">
                    暂无内网账号
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {session.role === "SUPER_ADMIN" ? (
        <section className="section">
          <h2>后台管理员账号管理（仅超级管理员可见）</h2>
          <p className="meta">可创建和修改其他超级管理员、普通管理员账号。</p>
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

          <div className="table-wrap" style={{ marginTop: "0.8rem" }}>
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
        </section>
      ) : null}
    </>
  );
}
