import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";
import { AsyncSubmitForm } from "@/components/async-submit-form";

type Props = {
  searchParams?: { error?: string; ok?: string };
};

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage({ searchParams }: Props) {
  const session = await getAdminSessionFromCookies();
  if (!session) redirect("/admin/login?error=请先登录后台");

  const projects = await db.project.findMany({
    orderBy: { sortOrder: "asc" },
    include: { images: { orderBy: { sortOrder: "asc" } }, awards: { orderBy: { sortOrder: "asc" } } }
  });

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>项目管理</h2>
              <p className="meta">管理历史项目信息，包括图片和获奖记录。</p>
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
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>新增项目</h2>
          <AsyncSubmitForm
            action="/api/admin/projects"
            className="stack"
            encType="multipart/form-data"
            submitText="新增项目"
            workingText="正在提交..."
            successRedirect="/admin/dashboard/projects"
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
              描述
              <textarea name="description" required />
            </label>
            <label>
              作者（每行一位）
              <textarea name="authors" placeholder="张三&#10;李四" />
            </label>
            <label>
              技术栈（分号分隔）
              <input name="techStack" placeholder="React; Node.js; PostgreSQL" />
            </label>
            <label>
              项目图片（最多3张）
              <input type="file" name="images" accept="image/*,.svg" multiple />
            </label>
            <fieldset style={{ border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
              <legend>获奖记录</legend>
              <div className="row">
                <label>
                  获奖日期
                  <input name="awardDate1" placeholder="2024-06" />
                </label>
                <label>
                  获奖名称
                  <input name="awardName1" placeholder="全国一等奖" />
                </label>
              </div>
              <div className="row">
                <label>
                  获奖日期
                  <input name="awardDate2" placeholder="2024-09" />
                </label>
                <label>
                  获奖名称
                  <input name="awardName2" placeholder="省级特等奖" />
                </label>
              </div>
              <div className="row">
                <label>
                  获奖日期
                  <input name="awardDate3" />
                </label>
                <label>
                  获奖名称
                  <input name="awardName3" />
                </label>
              </div>
            </fieldset>
          </AsyncSubmitForm>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>项目列表</h2>
          <div className="grid grid-2">
            {projects.length > 0 ? (
              projects.map((project) => (
                <article className="card" key={project.id}>
                  {project.images.length > 0 ? (
                    <img
                      src={project.images[0].url}
                      alt={project.title}
                      style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", borderRadius: 10, marginBottom: "0.6rem" }}
                    />
                  ) : null}
                  <h3 style={{ marginTop: 0 }}>{project.title}</h3>
                  <p className="meta">{project.description}</p>
                  {project.authors ? <p className="meta">作者：{project.authors}</p> : null}
                  {project.techStack ? <p className="meta">技术栈：{project.techStack}</p> : null}
                  {project.awards.length > 0 ? (
                    <div style={{ marginBottom: "0.5rem" }}>
                      <strong>获奖：</strong>
                      {project.awards.map((award) => (
                        <span key={award.id} className="meta" style={{ display: "block" }}>
                          {award.date} - {award.name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <form className="stack" action="/api/admin/projects" method="post" encType="multipart/form-data">
                    <input type="hidden" name="id" value={project.id} />
                    <input type="hidden" name="action" value="update" />
                    <div className="row">
                      <label>
                        标题
                        <input name="title" defaultValue={project.title} required />
                      </label>
                      <label>
                        排序
                        <input name="sortOrder" type="number" defaultValue={project.sortOrder} required />
                      </label>
                    </div>
                    <label>
                      描述
                      <textarea name="description" defaultValue={project.description} required />
                    </label>
                    <label>
                      作者
                      <textarea name="authors" defaultValue={project.authors} />
                    </label>
                    <label>
                      技术栈
                      <input name="techStack" defaultValue={project.techStack} />
                    </label>
                    <label>
                      新增图片（可选，最多3张）
                      <input type="file" name="images" accept="image/*,.svg" multiple />
                    </label>
                    <button className="btn btn-neutral" type="submit">
                      保存修改
                    </button>
                  </form>
                  <form action="/api/admin/projects" method="post" style={{ marginTop: "0.5rem" }}>
                    <input type="hidden" name="id" value={project.id} />
                    <input type="hidden" name="action" value="delete" />
                    <button className="btn btn-neutral" type="submit">
                      删除
                    </button>
                  </form>
                </article>
              ))
            ) : (
              <div className="card">
                <p className="meta">暂无项目</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
