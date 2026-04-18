import { redirect } from "next/navigation";
import { getIntranetSessionFromCookies } from "@/lib/auth";
import { IntranetNav } from "@/components/intranet-nav";
import { db } from "@/lib/db";
import { departmentLabels } from "@/lib/constants";

type Props = {
  searchParams?: { error?: string; ok?: string };
};

export const dynamic = "force-dynamic";

export default async function FinancePage({ searchParams }: Props) {
  const session = await getIntranetSessionFromCookies();
  if (!session) redirect("/intranet/login?error=请先登录内网");

  const [approvers, myRequests, assignedRequests] = await Promise.all([
    db.intranetUser.findMany({
      where: { canApproveFinance: true, isActive: true },
      orderBy: { createdAt: "asc" }
    }),
    db.financeRequest.findMany({
      where: { requesterId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        approver: true
      }
    }),
    session.canApproveFinance
      ? db.financeRequest.findMany({
          where: { approverId: session.userId },
          orderBy: { createdAt: "desc" },
          include: { requester: true }
        })
      : Promise.resolve([])
  ]);

  return (
    <>
      <section className="section">
        <div className="section-header">
          <div>
            <h2>财务审批系统</h2>
            <p className="meta">可提交采购需求并跟踪审批进度。</p>
          </div>
          <IntranetNav />
        </div>
        {searchParams?.error ? <p className="danger">{decodeURIComponent(searchParams.error)}</p> : null}
        {searchParams?.ok ? <p className="ok">{decodeURIComponent(searchParams.ok)}</p> : null}
      </section>

      <section className="section">
        <h2>提交采购/经费申请</h2>
        <form className="stack" action="/api/intranet/finance" method="post">
          <input type="hidden" name="action" value="create" />
          <div className="row">
            <label>
              申请标题
              <input name="title" required />
            </label>
            <label>
              采购物品
              <input name="itemName" required />
            </label>
          </div>
          <div className="row">
            <label>
              预算金额（元）
              <input type="number" min="0" step="0.01" name="amount" required />
            </label>
            <label>
              指定审批人
              <select name="approverId" required>
                <option value="">请选择审批人</option>
                {approvers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}（{departmentLabels[item.department]} / {item.employeeId}）
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            购买必要性说明
            <textarea name="justification" required />
          </label>
          <button className="btn btn-primary" type="submit">
            提交申请
          </button>
        </form>
      </section>

      <section className="section">
        <h2>我的申请单</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>标题</th>
                <th>物品/金额</th>
                <th>审批状态</th>
                <th>审批人信息</th>
              </tr>
            </thead>
            <tbody>
              {myRequests.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.title}
                    <br />
                    <span className="meta">{item.justification}</span>
                  </td>
                  <td>
                    {item.itemName}
                    <br />
                    ¥{item.amount.toString()}
                  </td>
                  <td>
                    <span className="badge">{item.status}</span>
                    <br />
                    <span className="meta">{item.progressNote || "待审批"}</span>
                    {item.approverComment ? (
                      <>
                        <br />
                        <span className="meta">审批意见：{item.approverComment}</span>
                      </>
                    ) : null}
                  </td>
                  <td>
                    {item.approver.name}（{departmentLabels[item.approver.department]}）
                    <br />
                    工号：{item.approver.employeeId}
                    <br />
                    联系方式：{item.approver.contact}
                  </td>
                </tr>
              ))}
              {myRequests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="meta">
                    你还没有提交申请单。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {session.canApproveFinance ? (
        <section className="section">
          <h2>我需要审批的申请单</h2>
          <div className="grid">
            {assignedRequests.map((item) => (
              <article key={item.id} className="card">
                <h3>{item.title}</h3>
                <p className="meta">
                  申请人：{item.requester.name}（{departmentLabels[item.requester.department]}）
                </p>
                <p className="meta">
                  物品：{item.itemName} ｜ 金额：¥{item.amount.toString()}
                </p>
                <p className="meta">必要性：{item.justification}</p>
                <p className="meta">当前状态：{item.status}</p>
                <form className="stack" action="/api/intranet/finance" method="post">
                  <input type="hidden" name="action" value="review" />
                  <input type="hidden" name="id" value={item.id} />
                  <label>
                    审批结论
                    <select name="decision" defaultValue="APPROVED">
                      <option value="APPROVED">通过</option>
                      <option value="REJECTED">驳回</option>
                    </select>
                  </label>
                  <label>
                    审批意见
                    <textarea name="approverComment" required />
                  </label>
                  <label>
                    进度说明
                    <input name="progressNote" required defaultValue={item.progressNote ?? ""} />
                  </label>
                  <button className="btn btn-neutral" type="submit">
                    提交审批
                  </button>
                </form>
              </article>
            ))}
            {assignedRequests.length === 0 ? (
              <div className="card">
                <p className="meta">暂无待你处理的申请。</p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}
