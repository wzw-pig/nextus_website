import { HomeModule } from "@prisma/client";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";
import { homeModuleLabels } from "@/lib/homepage";

type Props = {
  searchParams?: { error?: string; ok?: string };
};

const moduleOrder: HomeModule[] = [HomeModule.PROJECT, HomeModule.ACHIEVEMENT, HomeModule.TEAM_STYLE];

export const dynamic = "force-dynamic";

export default async function AdminHomepagePage({ searchParams }: Props) {
  const session = await getAdminSessionFromCookies();
  if (!session) redirect("/admin/login?error=请先登录后台");

  const homeContentModel = db.homeContentItem;
  if (!homeContentModel) {
    redirect("/admin/dashboard?error=首页内容模块未初始化，请先执行 Prisma 迁移并重启服务");
  }

  const items = await homeContentModel.findMany({
    orderBy: [{ module: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
  });

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>首页内容管理</h2>
              <p className="meta">分别维护历史项目、成果展示、团队风采模块的图片与文案。</p>
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

      {moduleOrder.map((module) => {
        const current = items.filter((item) => item.module === module);
        return (
          <section className="section" key={module}>
            <div className="container">
              <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>{homeModuleLabels[module]}</h2>
              <form className="stack" action="/api/admin/homepage" method="post" encType="multipart/form-data">
                <input type="hidden" name="action" value="create" />
                <input type="hidden" name="module" value={module} />
                <div className="row">
                  <label>
                    标题
                    <input name="title" required />
                  </label>
                  <label>
                    排序（数字越小越靠前）
                    <input name="sortOrder" type="number" defaultValue={current.length + 1} required />
                  </label>
                </div>
                <label>
                  介绍文案
                  <textarea name="description" required />
                </label>
                <label>
                  图片
                  <input name="image" type="file" accept="image/*,.svg" required />
                </label>
                <button className="btn btn-primary" type="submit">
                  新增到{homeModuleLabels[module]}
                </button>
              </form>

              <div className="grid grid-2" style={{ marginTop: "1.5rem" }}>
                {current.length > 0 ? (
                  current.map((item) => (
                    <article className="card" key={item.id}>
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", borderRadius: 10, marginBottom: "0.6rem" }}
                      />
                      <form className="stack" action="/api/admin/homepage" method="post" encType="multipart/form-data">
                        <input type="hidden" name="action" value="update" />
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="module" value={module} />
                        <label>
                          标题
                          <input name="title" defaultValue={item.title} required />
                        </label>
                        <label>
                          介绍文案
                          <textarea name="description" defaultValue={item.description} required />
                        </label>
                        <label>
                          排序
                          <input name="sortOrder" type="number" defaultValue={item.sortOrder} required />
                        </label>
                        <label>
                          替换图片（可选）
                          <input name="image" type="file" accept="image/*,.svg" />
                        </label>
                        <button className="btn btn-neutral" type="submit">
                          保存修改
                        </button>
                      </form>
                      <form action="/api/admin/homepage" method="post" style={{ marginTop: "0.5rem" }}>
                        <input type="hidden" name="action" value="delete" />
                        <input type="hidden" name="id" value={item.id} />
                        <button className="btn btn-neutral" type="submit">
                          删除
                        </button>
                      </form>
                    </article>
                  ))
                ) : (
                  <div className="card">
                    <p className="meta">当前模块还没有自定义内容，首页会显示默认内容。</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
