import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ensureForumCategories } from "@/lib/forum";
import { getIntranetSessionFromCookies } from "@/lib/auth";
import { IntranetNav } from "@/components/intranet-nav";

export const dynamic = "force-dynamic";

export default async function ForumHomePage() {
  const session = await getIntranetSessionFromCookies();
  if (!session) redirect("/intranet/login?error=请先登录内网");

  await ensureForumCategories();

  const categories = await db.forumCategory.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { posts: true } } }
  });

  return (
    <>
      <section className="section">
        <div className="section-header">
          <div>
            <h2>内网论坛</h2>
            <p className="meta">选择分类进入帖子列表。</p>
          </div>
          <IntranetNav />
        </div>
      </section>
      <section className="section">
        <div className="grid grid-3">
          {categories.map((item) => (
            <article key={item.id} className="card">
              <h3>{item.name}</h3>
              <p className="meta">帖子数：{item._count.posts}</p>
              <Link href={`/intranet/forum/${item.slug}`} className="btn btn-neutral">
                进入分类
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
