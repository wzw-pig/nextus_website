import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getIntranetSessionFromCookies } from "@/lib/auth";
import { IntranetNav } from "@/components/intranet-nav";
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
        include: { author: true }
      }
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
      </section>

      <section className="section">
        <h2>回帖</h2>
        <form className="stack" action="/api/intranet/forum/replies" method="post">
          <input type="hidden" name="postId" value={post.id} />
          <label>
            内容
            <textarea name="content" required />
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
