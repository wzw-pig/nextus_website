import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";
import { AsyncSubmitForm } from "@/components/async-submit-form";

type Props = {
  searchParams?: { error?: string; ok?: string };
};

export const dynamic = "force-dynamic";

export default async function AdminAchievementsPage({ searchParams }: Props) {
  const session = await getAdminSessionFromCookies();
  if (!session) redirect("/admin/login?error=请先登录后台");

  const achievements = await db.achievement.findMany({
    orderBy: { sortOrder: "asc" }
  });

  const landscapeItems = achievements.filter((a) => a.orientation === "landscape");
  const portraitItems = achievements.filter((a) => a.orientation === "portrait");

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>成果展示管理</h2>
              <p className="meta">管理成果展示图片，区分横版和竖版。</p>
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
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>新增成果</h2>
          <AsyncSubmitForm
            action="/api/admin/achievements"
            className="stack"
            encType="multipart/form-data"
            submitText="新增成果"
            workingText="正在提交..."
            successRedirect="/admin/dashboard/achievements"
          >
            <input type="hidden" name="action" value="create" />
            <div className="row">
              <label>
                名称
                <input name="name" required />
              </label>
              <label>
                排序（数字越小越靠前）
                <input name="sortOrder" type="number" defaultValue={0} required />
              </label>
            </div>
            <div className="row">
              <label>
                方向
                <select name="orientation" required>
                  <option value="landscape">横版</option>
                  <option value="portrait">竖版</option>
                </select>
              </label>
              <label>
                图片
                <input type="file" name="image" accept="image/*,.svg" required />
              </label>
            </div>
          </AsyncSubmitForm>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>横版成果</h2>
          <div className="grid grid-2">
            {landscapeItems.length > 0 ? (
              landscapeItems.map((item) => (
                <article className="card" key={item.id}>
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", borderRadius: 10, marginBottom: "0.6rem" }}
                  />
                  <form className="stack" action="/api/admin/achievements" method="post" encType="multipart/form-data">
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="action" value="update" />
                    <label>
                      名称
                      <input name="name" defaultValue={item.name} required />
                    </label>
                    <div className="row">
                      <label>
                        排序
                        <input name="sortOrder" type="number" defaultValue={item.sortOrder} required />
                      </label>
                      <label>
                        方向
                        <select name="orientation" defaultValue={item.orientation} required>
                          <option value="landscape">横版</option>
                          <option value="portrait">竖版</option>
                        </select>
                      </label>
                    </div>
                    <label>
                      替换图片（可选）
                      <input type="file" name="image" accept="image/*,.svg" />
                    </label>
                    <button className="btn btn-neutral" type="submit">
                      保存修改
                    </button>
                  </form>
                  <form action="/api/admin/achievements" method="post" style={{ marginTop: "0.5rem" }}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="action" value="delete" />
                    <button className="btn btn-neutral" type="submit">
                      删除
                    </button>
                  </form>
                </article>
              ))
            ) : (
              <div className="card">
                <p className="meta">暂无横版成果</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>竖版成果</h2>
          <div className="grid grid-2">
            {portraitItems.length > 0 ? (
              portraitItems.map((item) => (
                <article className="card" key={item.id}>
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{ width: "100%", aspectRatio: "3 / 4", objectFit: "cover", borderRadius: 10, marginBottom: "0.6rem" }}
                  />
                  <form className="stack" action="/api/admin/achievements" method="post" encType="multipart/form-data">
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="action" value="update" />
                    <label>
                      名称
                      <input name="name" defaultValue={item.name} required />
                    </label>
                    <div className="row">
                      <label>
                        排序
                        <input name="sortOrder" type="number" defaultValue={item.sortOrder} required />
                      </label>
                      <label>
                        方向
                        <select name="orientation" defaultValue={item.orientation} required>
                          <option value="landscape">横版</option>
                          <option value="portrait">竖版</option>
                        </select>
                      </label>
                    </div>
                    <label>
                      替换图片（可选）
                      <input type="file" name="image" accept="image/*,.svg" />
                    </label>
                    <button className="btn btn-neutral" type="submit">
                      保存修改
                    </button>
                  </form>
                  <form action="/api/admin/achievements" method="post" style={{ marginTop: "0.5rem" }}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="action" value="delete" />
                    <button className="btn btn-neutral" type="submit">
                      删除
                    </button>
                  </form>
                </article>
              ))
            ) : (
              <div className="card">
                <p className="meta">暂无竖版成果</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
