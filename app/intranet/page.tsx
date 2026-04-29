import Link from "next/link";
import { redirect } from "next/navigation";
import { getIntranetSessionFromCookies } from "@/lib/auth";
import { IntranetNav } from "@/components/intranet-nav";
import { departmentLabels } from "@/lib/constants";

type Props = {
  searchParams?: { error?: string; ok?: string };
};

export default async function IntranetHomePage({ searchParams }: Props) {
  const session = await getIntranetSessionFromCookies();
  if (!session) redirect("/intranet/login?error=请先登录内网");

  return (
    <>
      <section className="section">
        <div className="section-header">
          <div>
            <h2>内网主页</h2>
            <p className="meta">
              欢迎，{session.displayName} ｜ {departmentLabels[session.department]} ｜ 工号：{session.employeeId}
            </p>
          </div>
          <IntranetNav />
        </div>
        {searchParams?.error ? <p className="danger">{decodeURIComponent(searchParams.error)}</p> : null}
        {searchParams?.ok ? <p className="ok">{decodeURIComponent(searchParams.ok)}</p> : null}
      </section>

      <section className="section">
        <h2>当前内网账号重置密码</h2>
        <p className="meta">密码至少8位！</p>
        <form className="stack" action="/api/intranet/self-password" method="post" style={{ marginTop: "0.8rem" }}>
          <label>
            新密码
            <input type="password" name="password" required minLength={8} />
          </label>
          <button className="btn btn-primary" type="submit">
            重置我的内网密码
          </button>
        </form>
      </section>

      <section className="section">
        <h2>功能入口</h2>
        <div className="grid grid-2">
          <div className="card">
            <h3>论坛系统</h3>
            <p className="meta">支持按分类发帖与回帖，记录发帖人/回帖人姓名与部门。</p>
            <Link href="/intranet/forum" className="btn btn-neutral">
              进入论坛
            </Link>
          </div>
          <div className="card">
            <h3>财务审批</h3>
            <p className="meta">可提交采购与经费申请、跟踪审批进度，审批通过后显示审批人完整信息。</p>
            <Link href="/intranet/finance" className="btn btn-neutral">
              进入财务审批
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
