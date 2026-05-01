import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSessionFromCookies } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";

type Props = {
  searchParams?: { error?: string; ok?: string };
};

export default async function AdminDashboardPage({ searchParams }: Props) {
  const session = await getAdminSessionFromCookies();
  if (!session) redirect("/admin/login?error=请先登录后台");

  return (
    <>
      <section className="section">
        <div className="section-header">
          <div>
            <h2>管理系统功能列表</h2>
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
        <div className="grid">
          <article className="card section-header">
            <h3 style={{ margin: 0 }}>新闻发布与管理</h3>
            <Link className="btn btn-neutral" href="/admin/dashboard/news">
              进入
            </Link>
          </article>
          <article className="card section-header">
            <h3 style={{ margin: 0 }}>内网账号与权限管理</h3>
            <Link className="btn btn-neutral" href="/admin/dashboard/intranet-users">
              进入
            </Link>
          </article>
          {session.role === "SUPER_ADMIN" ? (
            <article className="card section-header">
              <h3 style={{ margin: 0 }}>后台管理员账号管理</h3>
              <Link className="btn btn-neutral" href="/admin/dashboard/admin-users">
                进入
              </Link>
            </article>
          ) : null}
          <article className="card section-header">
            <h3 style={{ margin: 0 }}>当前账号重置密码</h3>
            <Link className="btn btn-neutral" href="/admin/dashboard/profile">
              进入
            </Link>
          </article>
        </div>
      </section>
    </>
  );
}
