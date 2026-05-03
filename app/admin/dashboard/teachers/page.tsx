import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";
import { AsyncSubmitForm } from "@/components/async-submit-form";

type Props = {
  searchParams?: { error?: string; ok?: string };
};

export const dynamic = "force-dynamic";

export default async function AdminTeachersPage({ searchParams }: Props) {
  const session = await getAdminSessionFromCookies();
  if (!session) redirect("/admin/login?error=请先登录后台");

  const teachers = await db.teacher.findMany({
    orderBy: { sortOrder: "asc" },
    include: { images: { orderBy: { sortOrder: "asc" } } }
  });

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>指导老师管理</h2>
              <p className="meta">管理指导老师信息和照片。</p>
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
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>新增老师</h2>
          <AsyncSubmitForm
            action="/api/admin/teachers"
            className="stack"
            encType="multipart/form-data"
            submitText="新增老师"
            workingText="正在提交..."
            successRedirect="/admin/dashboard/teachers"
          >
            <input type="hidden" name="action" value="create" />
            <div className="row">
              <label>
                姓名
                <input name="name" required />
              </label>
              <label>
                职位
                <input name="position" />
              </label>
            </div>
            <div className="row">
              <label>
                学院
                <input name="college" />
              </label>
              <label>
                专业
                <input name="major" />
              </label>
            </div>
            <label>
              简介
              <textarea name="bio" />
            </label>
            <label>
              成就
              <textarea name="achievements" />
            </label>
            <label>
              研究方向（分号分隔）
              <input name="expertise" placeholder="人工智能; 机器学习; 深度学习" />
            </label>
            <div className="row">
              <label>
                头像（可选）
                <input type="file" name="avatar" accept="image/*,.svg" />
              </label>
              <label>
                照片（可选，可多选）
                <input type="file" name="images" accept="image/*,.svg" multiple />
              </label>
            </div>
          </AsyncSubmitForm>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>老师列表</h2>
          <div className="grid grid-2">
            {teachers.length > 0 ? (
              teachers.map((teacher) => (
                <article className="card" key={teacher.id}>
                  {teacher.avatarUrl ? (
                    <img
                      src={teacher.avatarUrl}
                      alt={teacher.name}
                      style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", marginBottom: "0.6rem" }}
                    />
                  ) : null}
                  <h3 style={{ marginTop: 0 }}>{teacher.name}</h3>
                  {teacher.position ? <p className="meta">职位：{teacher.position}</p> : null}
                  {teacher.college ? <p className="meta">学院：{teacher.college}</p> : null}
                  {teacher.major ? <p className="meta">专业：{teacher.major}</p> : null}
                  {teacher.expertise ? <p className="meta">研究方向：{teacher.expertise}</p> : null}
                  {teacher.images.length > 0 ? (
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                      {teacher.images.map((img) => (
                        <img
                          key={img.id}
                          src={img.url}
                          alt="照片"
                          style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }}
                        />
                      ))}
                    </div>
                  ) : null}
                  <form className="stack" action="/api/admin/teachers" method="post" encType="multipart/form-data">
                    <input type="hidden" name="id" value={teacher.id} />
                    <input type="hidden" name="action" value="update" />
                    <div className="row">
                      <label>
                        姓名
                        <input name="name" defaultValue={teacher.name} required />
                      </label>
                      <label>
                        职位
                        <input name="position" defaultValue={teacher.position} />
                      </label>
                    </div>
                    <div className="row">
                      <label>
                        学院
                        <input name="college" defaultValue={teacher.college} />
                      </label>
                      <label>
                        专业
                        <input name="major" defaultValue={teacher.major} />
                      </label>
                    </div>
                    <label>
                      简介
                      <textarea name="bio" defaultValue={teacher.bio} />
                    </label>
                    <label>
                      成就
                      <textarea name="achievements" defaultValue={teacher.achievements} />
                    </label>
                    <label>
                      研究方向
                      <input name="expertise" defaultValue={teacher.expertise} />
                    </label>
                    <label>
                      替换头像（可选）
                      <input type="file" name="avatar" accept="image/*,.svg" />
                    </label>
                    <label>
                      新增照片（可选，可多选）
                      <input type="file" name="images" accept="image/*,.svg" multiple />
                    </label>
                    <button className="btn btn-neutral" type="submit">
                      保存修改
                    </button>
                  </form>
                  <form action="/api/admin/teachers" method="post" style={{ marginTop: "0.5rem" }}>
                    <input type="hidden" name="id" value={teacher.id} />
                    <input type="hidden" name="action" value="delete" />
                    <button className="btn btn-neutral" type="submit">
                      删除
                    </button>
                  </form>
                </article>
              ))
            ) : (
              <div className="card">
                <p className="meta">暂无老师</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
