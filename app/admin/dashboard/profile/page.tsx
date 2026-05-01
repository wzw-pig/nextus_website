import { redirect } from "next/navigation";
import { getAdminSessionFromCookies } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";

type Props = {
  searchParams?: { error?: string; ok?: string };
};

export default async function AdminProfilePage({ searchParams }: Props) {
  const session = await getAdminSessionFromCookies();
  if (!session) redirect("/admin/login?error=请先登录后台");

  return (
    <>
      <section className="section">
        <div className="section-header">
          <div>
            <h2>当前后台账号重置密码</h2>
            <p className="meta">仅需输入新密码，无需输入原密码。</p>
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
        <form className="stack" action="/api/admin/self-password" method="post">
          <label>
            新密码
            <input type="password" name="password" required minLength={8} />
          </label>
          <button className="btn btn-primary" type="submit">
            重置我的后台密码
          </button>
        </form>
      </section>
    </>
  );
}
