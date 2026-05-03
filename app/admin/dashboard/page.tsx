import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSessionFromCookies } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminNav } from "@/components/admin-nav";
import { getVisitRangeStart } from "@/lib/visit";

type Props = {
  searchParams?: { error?: string; ok?: string };
};

export default async function AdminDashboardPage({ searchParams }: Props) {
  const session = await getAdminSessionFromCookies();
  if (!session) redirect("/admin/login?error=请先登录后台");

  const visitModel = db.websiteVisitDaily;
  const today = getVisitRangeStart(1);
  const sevenDaysStart = getVisitRangeStart(7);
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const [todayVisits, sevenDaysVisits, totalVisits] = visitModel
    ? await Promise.all([
        visitModel.aggregate({ where: { date: { gte: today, lt: tomorrow } }, _sum: { count: true } }),
        visitModel.aggregate({ where: { date: { gte: sevenDaysStart, lt: tomorrow } }, _sum: { count: true } }),
        visitModel.aggregate({ _sum: { count: true } })
      ])
    : [{ _sum: { count: 0 } }, { _sum: { count: 0 } }, { _sum: { count: 0 } }];

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>管理系统功能列表</h2>
              <p className="meta">
                当前账号：{session.displayName}（{session.username}，{session.role === "SUPER_ADMIN" ? "超级管理员" : "普通管理员"}）
              </p>
            </div>
            <AdminNav />
          </div>
          {searchParams?.error ? <p className="danger">{decodeURIComponent(searchParams.error)}</p> : null}
          {searchParams?.ok ? <p className="ok">{decodeURIComponent(searchParams.ok)}</p> : null}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid">
            <article className="card section-header">
              <h3 style={{ margin: 0 }}>新闻发布与管理</h3>
              <Link className="btn btn-neutral" href="/admin/dashboard/news">
                进入
              </Link>
            </article>
            <article className="card section-header">
              <h3 style={{ margin: 0 }}>资料发布与管理</h3>
              <Link className="btn btn-neutral" href="/admin/dashboard/resources">
                进入
              </Link>
            </article>
            <article className="card section-header">
              <h3 style={{ margin: 0 }}>首页内容管理</h3>
              <Link className="btn btn-neutral" href="/admin/dashboard/homepage">
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
              <h3 style={{ margin: 0 }}>项目管理</h3>
              <Link className="btn btn-neutral" href="/admin/dashboard/projects">
                进入
              </Link>
            </article>
            <article className="card section-header">
              <h3 style={{ margin: 0 }}>成果展示管理</h3>
              <Link className="btn btn-neutral" href="/admin/dashboard/achievements">
                进入
              </Link>
            </article>
            <article className="card section-header">
              <h3 style={{ margin: 0 }}>团队风采管理</h3>
              <Link className="btn btn-neutral" href="/admin/dashboard/team-style">
                进入
              </Link>
            </article>
            <article className="card section-header">
              <h3 style={{ margin: 0 }}>组织架构管理</h3>
              <Link className="btn btn-neutral" href="/admin/dashboard/organization">
                进入
              </Link>
            </article>
            <article className="card section-header">
              <h3 style={{ margin: 0 }}>指导老师管理</h3>
              <Link className="btn btn-neutral" href="/admin/dashboard/teachers">
                进入
              </Link>
            </article>
            <article className="card section-header">
              <h3 style={{ margin: 0 }}>竞赛风采管理</h3>
              <Link className="btn btn-neutral" href="/admin/dashboard/competition">
                进入
              </Link>
            </article>
            <article className="card section-header">
              <h3 style={{ margin: 0 }}>联系方式管理</h3>
              <Link className="btn btn-neutral" href="/admin/dashboard/contact">
                进入
              </Link>
            </article>
            <article className="card section-header">
              <h3 style={{ margin: 0 }}>当前账号重置密码</h3>
              <Link className="btn btn-neutral" href="/admin/dashboard/profile">
                进入
              </Link>
            </article>
            <article className="card">
              <h3 style={{ marginTop: 0 }}>网站访问人数（nextus.top）</h3>
              <p className="meta" style={{ color: "#38bdf8", fontWeight: 700 }}>
                今日访问：{todayVisits._sum.count ?? 0}
              </p>
              <p className="meta" style={{ color: "#38bdf8", fontWeight: 700 }}>
                7天内访问：{sevenDaysVisits._sum.count ?? 0}
              </p>
              <p className="meta" style={{ color: "#38bdf8", fontWeight: 700, marginBottom: 0 }}>
                累计访问：{totalVisits._sum.count ?? 0}
              </p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
