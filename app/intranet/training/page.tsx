import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getIntranetSessionFromCookies } from "@/lib/auth";
import { IntranetNav } from "@/components/intranet-nav";
import { AttachmentList } from "@/components/attachment-list";
import { AsyncSubmitForm } from "@/components/async-submit-form";

type Props = {
  searchParams?: { error?: string; ok?: string };
};

export const dynamic = "force-dynamic";

export default async function IntranetTrainingPage({ searchParams }: Props) {
  const session = await getIntranetSessionFromCookies();
  if (!session) redirect("/intranet/login?error=请先登录内网");

  const content = await db.trainingContent.findUnique({
    where: { key: "default" },
    include: { attachments: { orderBy: { createdAt: "asc" } }, updatedBy: { select: { name: true } } }
  });

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>新成员入职培训</h2>
              <p className="meta">全体内网用户可查看；仅内网管理员可编辑并发布。</p>
            </div>
            <IntranetNav />
          </div>
          {searchParams?.error ? <p className="danger">{decodeURIComponent(searchParams.error)}</p> : null}
          {searchParams?.ok ? <p className="ok">{decodeURIComponent(searchParams.ok)}</p> : null}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>培训内容</h2>
          <div className="card">
            {content?.content ? (
              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.65, marginTop: 0 }}>{content.content}</p>
            ) : (
              <p className="meta" style={{ marginTop: 0 }}>
                暂无培训文字内容。
              </p>
            )}
            <p className="meta" style={{ marginBottom: "0.4rem" }}>
              培训附件
            </p>
            {content?.attachments.length ? (
              <AttachmentList attachments={content.attachments} />
            ) : (
              <p className="meta" style={{ marginBottom: 0 }}>
                暂无培训附件。
              </p>
            )}
            {content ? (
              <p className="meta" style={{ marginBottom: 0 }}>
                最近更新：{content.updatedAt.toLocaleString("zh-CN")} ｜ 更新人：{content.updatedBy.name}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {session.isForumAdmin ? (
        <section className="section">
          <div className="container">
            <h2>编辑并发布</h2>
            <AsyncSubmitForm
              action="/api/intranet/training"
              className="stack"
              encType="multipart/form-data"
              submitText="保存并发布"
              workingText="正在保存..."
              successRedirect="/intranet/training"
            >
              <label>
                培训文字内容
                <textarea name="content" defaultValue={content?.content ?? ""} rows={10} />
              </label>
              {content?.attachments.length ? (
                <div className="stack">
                  <p className="meta" style={{ margin: 0 }}>
                    删除已有附件（可多选）
                  </p>
                  {content.attachments.map((item) => (
                    <label key={item.id}>
                      <input type="checkbox" name="removeAttachmentIds" value={item.id} style={{ width: "auto" }} /> {item.name}
                    </label>
                  ))}
                </div>
              ) : null}
              <label>
                新增附件（可选，支持多选）
                <input type="file" name="attachments" multiple />
              </label>
            </AsyncSubmitForm>
          </div>
        </section>
      ) : null}
    </>
  );
}
