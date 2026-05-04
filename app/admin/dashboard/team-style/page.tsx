import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";
import { AsyncSubmitForm } from "@/components/async-submit-form";

type Props = {
  searchParams?: { error?: string; ok?: string };
};

export const dynamic = "force-dynamic";

export default async function AdminCompetitionPage({ searchParams }: Props) {
  const session = await getAdminSessionFromCookies();
  if (!session) redirect("/admin/login?error=请先登录后台");

  const photos = await db.competitionPhoto.findMany({
    orderBy: { sortOrder: "asc" }
  });

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>团队生活管理</h2>
              <p className="meta">管理团队生活图片。</p>
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
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>上传图片</h2>
          <AsyncSubmitForm
            action="/api/admin/competition-photos"
            className="stack"
            encType="multipart/form-data"
            submitText="上传图片"
            workingText="正在上传..."
            successRedirect="/admin/dashboard/competition"
          >
            <input type="hidden" name="action" value="create" />
            <div className="row">
              <label>
                排序（数字越小越靠前）
                <input name="sortOrder" type="number" defaultValue={0} required />
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
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>图片列表</h2>
          <div className="grid grid-3">
            {photos.length > 0 ? (
              photos.map((item) => (
                <article className="card" key={item.id}>
                  <img
                    src={item.imageUrl}
                    alt="竞赛风采"
                    style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: 10, marginBottom: "0.6rem" }}
                  />
                  <p className="meta">排序：{item.sortOrder}</p>
                  <form action="/api/admin/competition-photos" method="post">
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
                <p className="meta">暂无图片</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
