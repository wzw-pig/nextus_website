import Link from "next/link";
import { redirect } from "next/navigation";
import { getIntranetSessionFromCookies } from "@/lib/auth";
import { db } from "@/lib/db";
import { IntranetNav } from "@/components/intranet-nav";
import { departmentLabels } from "@/lib/constants";

type Props = {
  searchParams?: { error?: string; ok?: string };
};

export default async function IntranetHomePage({ searchParams }: Props) {
  const session = await getIntranetSessionFromCookies();
  if (!session) redirect("/intranet/login?error=请先登录内网");
  const unreadCount = await db.intranetMessage.count({
    where: { recipientId: session.userId, isRead: false }
  });

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>内网主页</h2>
              <p className="meta">
                欢迎，{session.displayName} ｜ {departmentLabels[session.department]} ｜ 工号：{session.employeeId}
              </p>
              <p
                className="meta"
                style={
                  unreadCount > 0
                    ? { color: "#dc2626", fontWeight: 700, background: "#fee2e2", display: "inline-block", padding: "0.2rem 0.5rem", borderRadius: 9999 }
                    : undefined
                }
              >
                站内信未读：{unreadCount} 条
              </p>
            </div>
            <IntranetNav />
          </div>
          {searchParams?.error ? <p className="danger">{decodeURIComponent(searchParams.error)}</p> : null}
          {searchParams?.ok ? <p className="ok">{decodeURIComponent(searchParams.ok)}</p> : null}
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 560 }}>
          <h2 style={{ fontSize: "1.3rem", marginBottom: "0.8rem" }}>当前内网账号重置密码</h2>
          <p className="meta">密码至少8位！</p>
          <form className="stack" action="/api/intranet/self-password" method="post" style={{ marginTop: "1rem" }}>
            <label>
              新密码
              <input type="password" name="password" required minLength={8} />
            </label>
            <button className="btn btn-primary" type="submit">
              重置我的内网密码
            </button>
          </form>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1.5rem" }}>功能入口</h2>
          <div className="grid grid-2">
            <div className="card">
              <h3>论坛系统</h3>
              <p className="meta">支持按分类发帖与回帖，记录发帖人/回帖人姓名与部门。</p>
              <Link href="/intranet/forum" className="btn btn-neutral" style={{ marginTop: "0.8rem" }}>
                进入论坛
              </Link>
            </div>
            <div className="card">
              <h3>资料发布（论坛分类）</h3>
              <p className="meta">在&quot;资料发布&quot;分类发帖并上传附件，其他用户可回帖讨论。</p>
              <Link href="/intranet/forum/resources" className="btn btn-neutral" style={{ marginTop: "0.8rem" }}>
                进入资料分类
              </Link>
            </div>
            <div className="card">
              <h3>十楼使用预约</h3>
              <p className="meta">查看未来7天十楼教工小家可用时间并发起预约。</p>
              <Link href="/intranet/floor-reservations" className="btn btn-neutral" style={{ marginTop: "0.8rem" }}>
                进入预约
              </Link>
            </div>
            <div className="card">
              <h3>财务审批</h3>
              <p className="meta">可提交采购与经费申请、跟踪审批进度，审批通过后显示审批人完整信息。</p>
              <Link href="/intranet/finance" className="btn btn-neutral" style={{ marginTop: "0.8rem" }}>
                进入财务审批
              </Link>
            </div>
            <div className="card">
              <h3>站内信</h3>
              <p className="meta">管理员删除通知等系统消息会在站内信展示。</p>
              <Link href="/intranet/mailbox" className="btn btn-neutral" style={{ marginTop: "0.8rem" }}>
                查看站内信
              </Link>
            </div>
            <div className="card">
              <h3>新成员入职培训</h3>
              <p className="meta">全员可查看培训资料；内网管理员可编辑并发布最新版本。</p>
              <Link href="/intranet/training" className="btn btn-neutral" style={{ marginTop: "0.8rem" }}>
                进入培训模块
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
