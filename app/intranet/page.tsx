import Link from "next/link";
import { redirect } from "next/navigation";
import { getIntranetSessionFromCookies } from "@/lib/auth";
import { IntranetNav } from "@/components/intranet-nav";
import { departmentLabels } from "@/lib/constants";

export default async function IntranetHomePage() {
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
