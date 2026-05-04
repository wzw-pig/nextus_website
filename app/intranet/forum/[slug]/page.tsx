import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getIntranetSessionFromCookies } from "@/lib/auth";
import { IntranetNav } from "@/components/intranet-nav";
import { AsyncSubmitForm } from "@/components/async-submit-form";
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
        include: { author: true, _count: { select: { attachments: true } } }
      }
    }
  });

  if (!category) notFound();
  const isResourceCategory = category.slug === "resources";

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>{category.name}</h2>
              <p className="meta">
                {isResourceCategory ? "在此发布资料附件，其他用户可回帖讨论与补充。" : "任何内网用户都可以发帖与回帖。"}
              </p>
            </div>
            <IntranetNav />
          </div>
          {searchParams?.error ? <p className="danger">{decodeURIComponent(searchParams.error)}</p> : null}
          {searchParams?.ok ? <p className="ok">{decodeURIComponent(searchParams.ok)}</p> : null}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>{isResourceCategory ? "发布资料帖" : "发布新帖"}</h2>
          <AsyncSubmitForm
            className="stack"
            action="/api/intranet/forum/posts"
            encType="multipart/form-data"
            submitText="发布帖子"
            workingText="正在发帖..."
          >
            <input type="hidden" name="categorySlug" value={category.slug} />
            <label>
              标题
              <input name="title" required />
            </label>
            <label>
              {isResourceCategory ? "资料说明" : "内容"}
              <textarea name="content" required />
            </label>
            <label>
              附件（可选，支持图片/视频/文件，支持多选）
              <input type="file" name="attachments" multiple />
            </label>
          </AsyncSubmitForm>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>帖子列表</h2>
          <div className="grid grid-2">
            {category.posts.length > 0 ? (
              category.posts.map((post) => (
                <article className="card" key={post.id}>
                  <h3>{post.title}</h3>
                  <p className="meta">
                    发帖人：{post.author.name}（{departmentLabels[post.author.department]}） ｜{" "}
                    {post.createdAt.toLocaleString("zh-CN")}
                  </p>
                  <p className="meta">附件数量：{post._count.attachments}个附件</p>
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
        </div>
      </section>
    </>
  );
}
