import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getIntranetSessionFromCookies } from "@/lib/auth";
import { IntranetNav } from "@/components/intranet-nav";
import { AttachmentList } from "@/components/attachment-list";
import { AsyncSubmitForm } from "@/components/async-submit-form";
import { departmentLabels } from "@/lib/constants";

type Props = {
  params: { id: string };
  searchParams?: { error?: string; ok?: string };
};

export const dynamic = "force-dynamic";

export default async function ForumPostPage({ params, searchParams }: Props) {
  const session = await getIntranetSessionFromCookies();
  if (!session) redirect("/intranet/login?error=请先登录内网");

  const post = await db.forumPost.findUnique({
    where: { id: params.id },
    include: {
      author: true,
      category: true,
      replies: {
        orderBy: { createdAt: "asc" },
        include: { author: true, attachments: { orderBy: { createdAt: "asc" } } }
      },
      attachments: { orderBy: { createdAt: "asc" } }
    }
  });

  if (!post) notFound();

  return (
    <>
      <section className="section">
        <div className="section-header">
          <div>
            <h2>{post.title}</h2>
            <p className="meta">
              分类：{post.category.name} ｜ 发帖人：{post.author.name}（{departmentLabels[post.author.department]}）
            </p>
          </div>
          <IntranetNav />
        </div>
        {searchParams?.error ? <p className="danger">{decodeURIComponent(searchParams.error)}</p> : null}
        {searchParams?.ok ? <p className="ok">{decodeURIComponent(searchParams.ok)}</p> : null}
        <div className="card" style={{ marginTop: "0.8rem" }}>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.65 }}>{post.content}</p>
        </div>
        <div className="card" style={{ marginTop: "0.8rem" }}>
          <p className="meta" style={{ marginTop: 0 }}>
            附件下载
          </p>
          {post.attachments.length > 0 ? (
            <AttachmentList attachments={post.attachments} />
          ) : (
            <p className="meta" style={{ marginBottom: 0 }}>
              暂无附件
            </p>
          )}
          {session.isForumAdmin ? (
            <form className="stack" style={{ marginTop: "0.6rem" }} action="/api/intranet/forum/moderation/attachments" method="post">
              {post.attachments.map((attachment) => (
                <label key={attachment.id}>
                  <input type="checkbox" name="attachmentIds" value={attachment.id} style={{ width: "auto" }} /> {attachment.name}
                </label>
              ))}
              {post.attachments.length > 0 ? <input name="reason" placeholder="批量删除附件理由（必填）" required /> : null}
              {post.attachments.length > 0 ? (
                <button className="btn btn-neutral" type="submit">
                  批量删除勾选附件
                </button>
              ) : null}
            </form>
          ) : null}
        </div>
        {session.isForumAdmin && post.authorId !== session.userId ? (
          <div className="card" style={{ marginTop: "0.8rem" }}>
            <p className="meta" style={{ marginTop: 0 }}>
              管理员操作
            </p>
            <form className="stack" action="/api/intranet/forum/moderation/posts" method="post">
              <input type="hidden" name="postId" value={post.id} />
              <label>
                删除理由（必填）
                <textarea name="reason" required />
              </label>
              <button className="btn btn-neutral" type="submit">
                删除该帖子（含全部附件）
              </button>
            </form>
          </div>
        ) : null}
      </section>

      <section className="section">
        <h2>回帖</h2>
        <AsyncSubmitForm
          className="stack"
          action="/api/intranet/forum/replies"
          encType="multipart/form-data"
          submitText="发布回帖"
          workingText="正在回帖..."
        >
          <input type="hidden" name="postId" value={post.id} />
          <label>
            内容
            <textarea name="content" required />
          </label>
          <label>
            附件（可选，支持图片/视频/文件，支持多选）
            <input type="file" name="attachments" multiple />
          </label>
        </AsyncSubmitForm>
      </section>

      <section className="section">
        <h2>回帖列表</h2>
        <div className="grid">
          {post.replies.length > 0 ? (
            post.replies.map((reply) => (
              <article key={reply.id} className="card">
                <p style={{ whiteSpace: "pre-wrap", marginTop: 0 }}>{reply.content}</p>
                <p className="meta">
                  {reply.author.name}（{departmentLabels[reply.author.department]}） ｜{" "}
                  {reply.createdAt.toLocaleString("zh-CN")}
                </p>
                {reply.attachments.length > 0 ? <AttachmentList attachments={reply.attachments} /> : null}
                {session.isForumAdmin ? (
                  <form className="stack" style={{ marginTop: "0.6rem" }} action="/api/intranet/forum/moderation/attachments" method="post">
                    {reply.attachments.map((attachment) => (
                      <label key={attachment.id}>
                        <input type="checkbox" name="attachmentIds" value={attachment.id} style={{ width: "auto" }} />{" "}
                        {attachment.name}
                      </label>
                    ))}
                    {reply.attachments.length > 0 ? <input name="reason" placeholder="批量删除附件理由（必填）" required /> : null}
                    {reply.attachments.length > 0 ? (
                      <button className="btn btn-neutral" type="submit">
                        批量删除该回帖勾选附件
                      </button>
                    ) : null}
                  </form>
                ) : null}
              </article>
            ))
          ) : (
            <div className="card">
              <p className="meta">暂无回帖。</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
