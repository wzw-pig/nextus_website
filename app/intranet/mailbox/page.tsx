import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getIntranetSessionFromCookies } from "@/lib/auth";
import { IntranetNav } from "@/components/intranet-nav";

export const dynamic = "force-dynamic";

export default async function IntranetMailboxPage() {
  const session = await getIntranetSessionFromCookies();
  if (!session) redirect("/intranet/login?error=请先登录内网");

  await db.intranetMessage.updateMany({
    where: { recipientId: session.userId, isRead: false },
    data: { isRead: true }
  });

  const messages = await db.intranetMessage.findMany({
    where: { recipientId: session.userId },
    orderBy: { createdAt: "desc" }
  });

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>站内信</h2>
              <p className="meta">系统消息会显示在这里。</p>
            </div>
            <IntranetNav />
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="grid">
            {messages.length > 0 ? (
              messages.map((msg) => (
                <article className="card" key={msg.id}>
                  <h3>{msg.title}</h3>
                  <p className="meta">
                    发件方：{msg.senderName} ｜ {msg.createdAt.toLocaleString("zh-CN")}
                  </p>
                  <p className="meta">状态：{msg.isRead ? "已读" : "未读"}</p>
                  <p style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{msg.content}</p>
                </article>
              ))
            ) : (
              <div className="card">
                <p className="meta">暂无站内信。</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
