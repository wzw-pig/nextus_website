import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getIntranetSessionFromCookies } from "@/lib/auth";
import { IntranetNav } from "@/components/intranet-nav";
import { AttachmentList } from "@/components/attachment-list";
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
        </div>
      </section>

      <section className="section">
        <h2>回帖</h2>
        <form className="stack" action="/api/intranet/forum/replies" method="post" encType="multipart/form-data">
          <input type="hidden" name="postId" value={post.id} />
          <label>
            内容
            <textarea name="content" required />
          </label>
          <label>
            附件（可选，支持图片/视频/文件，支持多选）
            <input type="file" name="attachments" multiple />
          </label>
          <button className="btn btn-primary" type="submit">
            发布回帖
          </button>
        </form>
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
