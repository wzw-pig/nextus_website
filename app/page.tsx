import Link from "next/link";
import { db } from "@/lib/db";
import { departments, resourceTypeLabels } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [latestNews, latestResources] = await Promise.all([
    db.news.findMany({
      orderBy: { publishedAt: "desc" },
      include: { publishedBy: { select: { displayName: true } }, _count: { select: { attachments: true } } },
      take: 5
    }),
    db.resource.findMany({
      orderBy: { publishedAt: "desc" },
      include: {
        publishedBy: { select: { displayName: true } },
        publishedByIntranet: { select: { name: true } }
      },
      take: 6
    })
  ]);

  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <h1>Nextus 学生科创团队</h1>
          <p>
            Nextus 致力于跨学科创新实践，围绕技术研发、赛事项目、产业协同与组织治理，打造可持续成长的校园科技创新共同体。
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/intranet/login">
              进入内网系统
            </Link>
            <a className="btn btn-outline" href="#team-intro">
              了解团队
            </a>
          </div>
        </div>
        <div className="hero-image">
          <img src="/api/assets/team-photo" alt="Nextus 团队大合照" />
        </div>
      </section>

      <section id="team-intro" className="section">
        <h2>团队简介</h2>
        <div className="grid grid-2">
          <div className="card">
            <h3>团队定位</h3>
            <p className="meta">
              以“技术创新 + 项目落地 + 组织协同”为核心，聚焦人工智能、数字产品、竞赛项目和产学研实践。
            </p>
          </div>
          <div className="card">
            <h3>我们在做什么</h3>
            <p className="meta">
              组织研发项目、竞赛攻关、企业协作、知识沉淀与成员培养，持续输出可展示、可复用、可传承的成果。
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>部门介绍</h2>
        <div className="grid grid-3">
          {departments.map((item) => (
            <article key={item.slug} className="card">
              <h3>{item.name}</h3>
              <p className="meta">{item.description}</p>
              <Link href={`/departments/${item.slug}`} className="btn btn-neutral">
                查看详情
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>项目与成果</h2>
        <div className="grid grid-3">
          <div className="card">
            <h3>重点项目</h3>
            <p className="meta">覆盖智能系统、数字化管理、创新创业项目孵化等方向。</p>
          </div>
          <div className="card">
            <h3>荣誉奖项</h3>
            <p className="meta">校级、省级、国家级创新竞赛持续参赛，形成长期备赛体系。</p>
          </div>
          <div className="card">
            <h3>成员培养</h3>
            <p className="meta">新人训练营、技术分享、实战协作机制并行，促进成员全面成长。</p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>新闻动态</h2>
        <div className="section-header">
          <span className="meta">新闻由后台指定账号发布后自动展示在这里。</span>
          <Link href="/news" className="btn btn-neutral">
            查看全部新闻
          </Link>
        </div>
        <div className="grid grid-2" style={{ marginTop: "0.8rem" }}>
          {latestNews.length > 0 ? (
            latestNews.map((item) => (
              <article key={item.id} className="card">
                <h3>{item.title}</h3>
                <p className="meta">{item.summary}</p>
                <p className="meta">
                  发布人：{item.publishedBy.displayName} ｜ {item.publishedAt.toLocaleString("zh-CN")}
                </p>
                {item._count.attachments > 0 ? <p className="meta">附件：{item._count.attachments} 个</p> : null}
                <Link href={`/news/${item.id}`} className="btn btn-neutral">
                  阅读全文
                </Link>
              </article>
            ))
          ) : (
            <div className="card">
              <p className="meta">暂无新闻，管理员发布后会在此展示。</p>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <h2>资料下载</h2>
        <div className="section-header">
          <span className="meta">支持软件资料、视频教程、文档资料等，由后台动态发布。</span>
          <Link href="/resources" className="btn btn-neutral">
            查看全部资料
          </Link>
        </div>
        <div className="grid grid-2" style={{ marginTop: "0.8rem" }}>
          {latestResources.length > 0 ? (
            latestResources.map((item) => (
              <article key={item.id} className="card">
                <h3>{item.title}</h3>
                <p className="meta">{item.description}</p>
                <p className="meta">
                  类型：{resourceTypeLabels[item.type]} ｜ 发布人：
                  {item.publishedByIntranet?.name ?? item.publishedBy?.displayName ?? "未知"}
                </p>
                <a className="btn btn-neutral" href={item.fileUrl} target="_blank" rel="noreferrer">
                  下载：{item.fileName ?? "资料文件"}
                </a>
              </article>
            ))
          ) : (
            <div className="card">
              <p className="meta">暂无资料，管理员发布后会在此展示。</p>
            </div>
          )}
        </div>
      </section>

      <section id="about-us" className="section">
        <h2>关于我们</h2>
        <div className="grid grid-2">
          <div className="card">
            <h3>组织文化</h3>
            <p className="meta">开放协作、结果导向、长期主义、敢于创新。</p>
          </div>
          <div className="card">
            <h3>加入路径</h3>
            <p className="meta">简历筛选 → 面试交流 → 试运行任务 → 正式入组。</p>
          </div>
        </div>
      </section>

      <section id="contact-us" className="section">
        <h2>联系我们</h2>
        <div className="grid grid-2">
          <div className="card">
            <h3>合作邮箱</h3>
            <p className="meta">contact@nextus.team</p>
          </div>
          <div className="card">
            <h3>地址</h3>
            <p className="meta">（请替换为团队实际办公地点）</p>
          </div>
        </div>
      </section>
    </>
  );
}
