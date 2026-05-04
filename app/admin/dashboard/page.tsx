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

  const homepageSections = [
    { title: "历史项目管理", desc: "多图+作者+技术栈+获奖", href: "/admin/dashboard/projects" },
    { title: "成果展示管理", desc: "横版/竖版奖状上传", href: "/admin/dashboard/achievements" },
    { title: "团队风采管理", desc: "团队照片上传", href: "/admin/dashboard/team-style" },
    { title: "竞赛风采管理", desc: "竞赛照片上传", href: "/admin/dashboard/competition" },
    { title: "组织架构管理", desc: "核心管理层+部门结构", href: "/admin/dashboard/organization" },
    { title: "指导老师管理", desc: "教师信息+风采图片", href: "/admin/dashboard/teachers" },
  ];

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
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>内容管理</h2>
          <div className="grid">
            <article className="card section-header">
              <h3 style={{ margin: 0 }}>新闻发布与管理</h3>
              <Link className="btn btn-neutral" href="/admin/dashboard/news">进入</Link>
            </article>
            <article className="card section-header">
              <h3 style={{ margin: 0 }}>资料发布与管理</h3>
              <Link className="btn btn-neutral" href="/admin/dashboard/resources">进入</Link>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>首页内容管理</h2>
          <p className="meta" style={{ marginBottom: "1rem" }}>管理首页各区块展示的内容，包括项目、成果、团队风采、组织架构、指导老师等。</p>
          <div className="grid grid-2">
            {homepageSections.map((item) => (
              <article className="card section-header" key={item.href}>
                <div>
                  <h3 style={{ margin: 0 }}>{item.title}</h3>
                  <p className="meta" style={{ marginTop: "0.3rem" }}>{item.desc}</p>
                </div>
                <Link className="btn btn-neutral" href={item.href}>进入</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>系统管理</h2>
          <div className="grid">
            <article className="card section-header">
              <h3 style={{ margin: 0 }}>内网账号与权限管理</h3>
              <Link className="btn btn-neutral" href="/admin/dashboard/intranet-users">进入</Link>
            </article>
            {session.role === "SUPER_ADMIN" && (
              <article className="card section-header">
                <h3 style={{ margin: 0 }}>后台管理员账号管理</h3>
                <Link className="btn btn-neutral" href="/admin/dashboard/admin-users">进入</Link>
              </article>
            )}
            <article className="card section-header">
              <h3 style={{ margin: 0 }}>当前账号重置密码</h3>
              <Link className="btn btn-neutral" href="/admin/dashboard/profile">进入</Link>
            </article>
            <article className="card">
              <h3 style={{ marginTop: 0 }}>网站访问人数</h3>
              <p className="meta" style={{ color: "#38bdf8", fontWeight: 700 }}>今日：{todayVisits._sum.count ?? 0} ｜ 7天：{sevenDaysVisits._sum.count ?? 0} ｜ 累计：{totalVisits._sum.count ?? 0}</p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
