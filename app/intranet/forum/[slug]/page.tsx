import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getIntranetSessionFromCookies } from "@/lib/auth";
import { IntranetNav } from "@/components/intranet-nav";
import { ensureForumCategories } from "@/lib/forum";
import { departmentLabels } from "@/lib/constants";

type Props = {
  params: { slug: string };
  searchParams?: { error?: string; ok?: string };
};

export const dynamic = "force-dynamic";

export default async function ForumCategoryPage({ params, searchParams }: Props) {
  const session = await getIntranetSessionFromCookies();
  if (!session) redirect("/intranet/login?error=请先登录内网");

  await ensureForumCategories();

  const category = await db.forumCategory.findUnique({
    where: { slug: params.slug },
    include: {
      posts: {
        orderBy: { createdAt: "desc" },
        include: { author: true }
      }
    }
  });

  if (!category) notFound();

  return (
    <>
      <section className="section">
        <div className="section-header">
          <div>
            <h2>{category.name}</h2>
            <p className="meta">任何内网用户都可以发帖与回帖。</p>
          </div>
          <IntranetNav />
        </div>
        {searchParams?.error ? <p className="danger">{decodeURIComponent(searchParams.error)}</p> : null}
        {searchParams?.ok ? <p className="ok">{decodeURIComponent(searchParams.ok)}</p> : null}
      </section>

      <section className="section">
        <h2>发布新帖</h2>
        <form className="stack" action="/api/intranet/forum/posts" method="post">
          <input type="hidden" name="categorySlug" value={category.slug} />
          <label>
            标题
            <input name="title" required />
          </label>
          <label>
            内容
            <textarea name="content" required />
          </label>
          <button className="btn btn-primary" type="submit">
            发布帖子
          </button>
        </form>
      </section>

      <section className="section">
        <h2>帖子列表</h2>
        <div className="grid grid-2">
          {category.posts.length > 0 ? (
            category.posts.map((post) => (
              <article className="card" key={post.id}>
                <h3>{post.title}</h3>
                <p className="meta" style={{ whiteSpace: "pre-wrap" }}>
                  {post.content.length > 120 ? `${post.content.slice(0, 120)}...` : post.content}
                </p>
                <p className="meta">
                  发帖人：{post.author.name}（{departmentLabels[post.author.department]}） ｜{" "}
                  {post.createdAt.toLocaleString("zh-CN")}
                </p>
                <Link href={`/intranet/forum/post/${post.id}`} className="btn btn-neutral">
                  查看与回帖
                </Link>
              </article>
            ))
          ) : (
            <div className="card">
              <p className="meta">该分类暂无帖子。</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
