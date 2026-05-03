import Link from "next/link";
import { db } from "@/lib/db";
import { resourceTypeLabels } from "@/lib/constants";
import { getLocalImageUrls, getTechIconGroupsWithNames } from "@/lib/oss";
import { CircuitSpotlight } from "@/components/circuit-spotlight";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Fetch all data from database in parallel
  const [
    latestNews,
    latestResources,
    projects,
    achievements,
    teamStyleImages,
    orgMembers,
    orgDepartments,
    teachers,
    competitionPhotos,
    contactItems,
    ossGroupPhotos,
    ossTechIconGroups,
  ] = await Promise.all([
    db.news.findMany({
      orderBy: { publishedAt: "desc" },
      include: { publishedBy: { select: { displayName: true } }, _count: { select: { attachments: true } } },
      take: 5
    }),
    db.resource.findMany({
      orderBy: { publishedAt: "desc" },
      include: { publishedBy: { select: { displayName: true } }, publishedByIntranet: { select: { name: true } } },
      take: 6
    }),
    db.project.findMany({
      orderBy: { sortOrder: "asc" },
      include: { images: { orderBy: { sortOrder: "asc" } }, awards: { orderBy: { sortOrder: "asc" } } }
    }),
    db.achievement.findMany({ orderBy: { sortOrder: "asc" } }),
    db.teamStyleImage.findMany({ orderBy: { sortOrder: "asc" } }),
    db.orgMember.findMany({
      orderBy: { sortOrder: "asc" },
      include: { children: { orderBy: { sortOrder: "asc" } } }
    }),
    db.orgDepartment.findMany({ orderBy: { sortOrder: "asc" } }),
    db.teacher.findMany({
      orderBy: { sortOrder: "asc" },
      include: { images: { orderBy: { sortOrder: "asc" } } }
    }),
    db.competitionPhoto.findMany({ orderBy: { sortOrder: "asc" } }),
    db.contactItem.findMany({ orderBy: { sortOrder: "asc" } }),
    Promise.resolve(getLocalImageUrls("groupPhoto")),
    Promise.resolve(getTechIconGroupsWithNames()),
  ]);

  // Filter top-level org members (no parent)
  const topLevelMembers = orgMembers.filter(m => !m.parentId);

  // Separate achievements by orientation
  const landscapeAchievements = achievements.filter(a => a.orientation === "landscape");
  const portraitAchievements = achievements.filter(a => a.orientation === "portrait");

  return (
    <>
      {/* ========== HERO SECTION with Circuit Spotlight ========== */}
      <CircuitSpotlight />

      {/* ========== ABOUT SECTION ========== */}
      <section id="about" className="section">
        <div className="container">
          <h2 className="section-title">团队简介</h2>
          <div className="about-content">
            <div className="about-text">
              <div className="card" style={{ minHeight: 360 }}>
                <h3 style={{ fontSize: "1.8rem", marginBottom: "1.5rem" }}>关于 NextUs</h3>
                <p className="preserve-whitespace" style={{ fontSize: "1.1rem", lineHeight: 1.8, color: "#666" }}>
                  {"        上海工程技术大学NextUs竞赛团队是一支由追求卓越且秉持理想主义的青年学子所组成的团队。该团队摒弃消耗性竞争模式，致力于将高强度的创新实践转化为对过去自我的不断超越。他们坚信：协作而非孤军奋战，才是推动团队行稳致远的核心动能。\n        在此集体中，\"互助成长\"被视为根本理念。团队成员以利他之心构建起坚实的信任网络，使每位成员在面对挑战时皆能获得充分支持，在实现突破时亦能体会到深厚的归属感。此处不仅是实践价值、激发潜能的赛场，更成为彼此赋能、温暖共行的家园。"}
                </p>
              </div>
            </div>
            <div className="about-stats" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div className="stats-grid">
                <div className="card stat-card">
                  <div className="stat-number">120+</div>
                  <div className="stat-label">团队成员</div>
                </div>
                <div className="card stat-card">
                  <div className="stat-number">40+</div>
                  <div className="stat-label">完成项目</div>
                </div>
                <div className="card stat-card">
                  <div className="stat-number">35+</div>
                  <div className="stat-label">获得奖项</div>
                </div>
                <div className="card stat-card">
                  <div className="stat-number">{Math.max(1, Math.floor((Date.now() - new Date("2025-03-24").getTime()) / (1000 * 3600 * 24)))}</div>
                  <div className="stat-label">成立天数</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mission-vision">
            <div className="grid grid-2">
              <div className="card mission-card">
                <div className="icon">
                  <img src="/icon1.svg" alt="使命图标" />
                </div>
                <h3>我们的使命</h3>
                <p className="preserve-whitespace">
                  {"        以积极心态迎向挑战，在自我驱动中持续精进；以创新思维应对问题，以协作机制凝聚智慧；以责任意识担当使命，以感恩之心回馈过程，更以利他精神奠定共同成长的基石。"}
                </p>
              </div>
              <div className="card vision-card">
                <div className="icon">
                  <img src="/icon2.svg" alt="愿景图标" />
                </div>
                <h3>我们的愿景</h3>
                <p className="preserve-whitespace">
                  {"        作为一支聚焦创新竞赛的综合型学生团队，NextUs的视野远超赛题本身。我们深信，比奖项更珍贵的，是应对挑战的综合素养、创新协作的深层快乐，以及一段彼此支撑的共同成长经历。在这里，每一个\"我\"汇聚成\"我们\"，每一个\"下一步\"都指向更辽阔的未来。"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PROJECTS SECTION ========== */}
      <section id="projects" className="section">
        <div className="container">
          <h2 className="section-title">历史项目</h2>
          {projects.length > 0 ? (
            <div className="grid grid-3" style={{ gap: "1.5rem" }}>
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="card">
              <p className="meta">暂无项目，管理员发布后会在此展示。</p>
            </div>
          )}
        </div>
      </section>

      {/* ========== ACHIEVEMENTS SECTION ========== */}
      <section id="achievements" className="section">
        <div className="container">
          <h2 className="section-title">成果展示</h2>
          {landscapeAchievements.length > 0 && (
            <>
              <h3 className="subsection-title">横版奖状</h3>
              <AchievementScroll achievements={landscapeAchievements} />
            </>
          )}
          {portraitAchievements.length > 0 && (
            <>
              <h3 className="subsection-title" style={{ marginTop: "2rem" }}>竖版奖状</h3>
              <AchievementScroll achievements={portraitAchievements} />
            </>
          )}
          {achievements.length === 0 && (
            <div className="card">
              <p className="meta">暂无成果展示，管理员发布后会在此展示。</p>
            </div>
          )}
        </div>
      </section>

      {/* ========== TECH STACK SECTION ========== */}
      <section id="tech" className="section">
        <div className="container">
          <h2 className="section-title">技能与技术栈</h2>
          <div className="tech-scroll-container">
            <div className="tech-scroll-wrapper">
              <div className="fade-mask-left"></div>
              <div className="tech-scroll-rows">
                {ossTechIconGroups.map((group, rowIndex) => (
                  <div key={`row-${rowIndex}`} className="tech-scroll-row">
                    <div
                      className={`tech-scroll-track ${rowIndex % 2 === 0 ? "scroll-left" : "scroll-right"}`}
                      style={{ "--scroll-duration": `${35 + rowIndex * 5}s` } as React.CSSProperties}
                    >
                      {[...group, ...group, ...group, ...group].map((tech, techIndex) => (
                        <div key={`tech-${techIndex}`} className="tech-icon">
                          <div className="icon-wrapper">
                            <img src={tech.url} alt={tech.name} style={{ width: 50, height: 50, borderRadius: 10, objectFit: "contain" }} />
                            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#333", textAlign: "center" }}>{tech.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="fade-mask-right"></div>
            </div>
          </div>

          {/* Team Style Images */}
          {teamStyleImages.length > 0 && (
            <>
              <h3 className="subsection-title" style={{ marginTop: "3rem" }}>团队风采</h3>
              <div className="grid grid-3" style={{ gap: "1.5rem" }}>
                {teamStyleImages.map((img) => (
                  <div className="card media-card" key={img.id}>
                    <img src={img.imageUrl} alt="团队风采" style={{ aspectRatio: "16/9", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            </>
          )}
          {teamStyleImages.length === 0 && ossGroupPhotos.length > 0 && (
            <>
              <h3 className="subsection-title" style={{ marginTop: "3rem" }}>团队风采</h3>
              <div className="grid grid-2" style={{ gap: "1.5rem" }}>
                {ossGroupPhotos.map((photo, index) => (
                  <div className="card media-card" key={`group-${index}`}>
                    <img src={photo} alt={`团队风采 ${index + 1}`} style={{ aspectRatio: "16/9", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ========== ORGANIZATION SECTION ========== */}
      <section id="organization" className="section">
        <div className="container">
          <h2 className="section-title">组织架构</h2>

          {/* Core Management - Pyramid Structure */}
          {topLevelMembers.length > 0 && (
            <>
              <h3 className="subsection-title">核心管理层</h3>
              <div className="org-pyramid">
                {topLevelMembers.map((member) => (
                  <OrgNode key={member.id} member={member} allMembers={orgMembers} />
                ))}
              </div>
            </>
          )}

          {/* Departments */}
          {orgDepartments.length > 0 && (
            <>
              <h3 className="subsection-title" style={{ marginTop: "3rem" }}>部门结构</h3>
              <div className="grid grid-3" style={{ gap: "1.5rem" }}>
                {orgDepartments.map((dept) => (
                  <article key={dept.id} className="card" style={{ textAlign: "center", padding: "2rem" }}>
                    {dept.imageUrl && (
                      <img src={dept.imageUrl} alt={dept.name} style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 10, display: "block", margin: "0 auto 1rem" }} />
                    )}
                    <h3 style={{ fontSize: "1.3rem", fontWeight: 500, color: "#1e40af", marginBottom: "1rem" }}>{dept.name}</h3>
                    <p className="meta">{dept.description}</p>
                  </article>
                ))}
              </div>
            </>
          )}

          {/* Teachers */}
          {teachers.length > 0 && (
            <>
              <h3 className="subsection-title" style={{ marginTop: "3rem" }}>指导教师</h3>
              {teachers.map((teacher) => (
                <TeacherCard key={teacher.id} teacher={teacher} />
              ))}
            </>
          )}
        </div>
      </section>

      {/* ========== COMPETITION PHOTOS ========== */}
      {competitionPhotos.length > 0 && (
        <section id="competition" className="section">
          <div className="container">
            <h2 className="section-title">竞赛不止 不止竞赛</h2>
            <div className="grid grid-3" style={{ gap: "1.5rem" }}>
              {competitionPhotos.map((photo) => (
                <div className="card media-card" key={photo.id}>
                  <img src={photo.imageUrl} alt="竞赛风采" style={{ aspectRatio: "16/9", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========== RECRUITMENT SECTION ========== */}
      <section id="recruitment" className="section">
        <div className="container">
          <h2 className="section-title">加入我们</h2>
          <div className="card" style={{ padding: "2.5rem", textAlign: "center", marginBottom: "3rem" }}>
            <h3 style={{ fontSize: "1.8rem", marginBottom: "2rem", color: "#333" }}>在这里，你能收获到什么？</h3>
            <div className="benefits-grid">
              {["丰富经验", "强大能力", "优质伙伴", "深厚友谊", "广阔平台"].map((title) => (
                <div key={title} className="benefit-item">
                  <div className="benefit-icon">
                    <img src={`/aliyun_oss/join/${title}.png`} alt={title} />
                  </div>
                  <h4>{title}</h4>
                </div>
              ))}
            </div>
          </div>

          <h3 className="subsection-title">我们的优势</h3>
          <div className="grid grid-3" style={{ gap: "1.5rem" }}>
            {[
              ["🎓", "专业导师指导", "拥有经验丰富的导师与学长学姐，帮助你在技术道路上快速成长。"],
              ["⚙️", "实战项目经验", "参与真实项目，从需求分析到上线交付，获得完整工程经验。"],
              ["🏅", "竞赛获奖机会", "持续参加高水平赛事，形成项目成果与竞赛成绩双重积累。"],
              ["🌐", "前沿技术学习", "保持技术敏感度，持续学习 AI、应用开发与工程化能力。"],
              ["💫", "优质团队氛围", "和优秀同伴一起协作成长，建立长期可信赖的伙伴关系。"],
              ["⚡", "未来发展支持", "在就业、升学与职业方向上获得持续支持与经验分享。"]
            ].map(([icon, title, desc]) => (
              <article className="card" key={title as string} style={{ textAlign: "center", padding: "2rem" }}>
                <div className="advantage-header">
                  <div className="advantage-icon">{icon}</div>
                  <h4 style={{ fontSize: "1.3rem", color: "#333", margin: 0 }}>{title}</h4>
                </div>
                <p className="meta" style={{ textAlign: "start" }}>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ========== NEWS SECTION ========== */}
      <section id="news" className="section">
        <div className="container">
          <h2 className="section-title">新闻动态</h2>
          <div className="section-header" style={{ marginBottom: "1.5rem" }}>
            <span className="meta">保留原有动态发布能力，管理员发布后自动展示。</span>
            <Link href="/news" className="btn btn-neutral">查看全部新闻</Link>
          </div>
          <div className="grid grid-2" style={{ gap: "1.5rem" }}>
            {latestNews.length > 0 ? (
              latestNews.map((item) => (
                <article key={item.id} className="card">
                  <h3 style={{ fontSize: "1.2rem", marginBottom: "0.8rem" }}>{item.title}</h3>
                  <p className="meta">{item.summary}</p>
                  <p className="meta" style={{ marginTop: "0.5rem" }}>
                    发布人：{item.publishedBy.displayName} ｜ {item.publishedAt.toLocaleString("zh-CN")}
                  </p>
                  <Link href={`/news/${item.id}`} className="btn btn-neutral" style={{ marginTop: "0.8rem" }}>阅读全文</Link>
                </article>
              ))
            ) : (
              <div className="card"><p className="meta">暂无新闻。</p></div>
            )}
          </div>
        </div>
      </section>

      {/* ========== RESOURCES SECTION ========== */}
      <section id="resources" className="section">
        <div className="container">
          <h2 className="section-title">资料下载</h2>
          <div className="section-header" style={{ marginBottom: "1.5rem" }}>
            <span className="meta">保留原有资料发布能力，前台直接下载。</span>
            <Link href="/resources" className="btn btn-neutral">查看全部资料</Link>
          </div>
          <div className="grid grid-2" style={{ gap: "1.5rem" }}>
            {latestResources.length > 0 ? (
              latestResources.map((item) => (
                <article key={item.id} className="card">
                  <h3 style={{ fontSize: "1.2rem", marginBottom: "0.8rem" }}>{item.title}</h3>
                  <p className="meta">{item.description}</p>
                  <p className="meta" style={{ marginTop: "0.5rem" }}>
                    类型：{resourceTypeLabels[item.type]} ｜ 发布人：
                    {item.publishedByIntranet?.name ?? item.publishedBy?.displayName ?? "未知"}
                  </p>
                  <a className="btn btn-neutral" href={item.fileUrl} target="_blank" rel="noreferrer" style={{ marginTop: "0.8rem" }}>
                    下载：{item.fileName ?? "资料文件"}
                  </a>
                </article>
              ))
            ) : (
              <div className="card"><p className="meta">暂无资料。</p></div>
            )}
          </div>
        </div>
      </section>

      {/* ========== CONTACT SECTION ========== */}
      <section id="contact" className="section">
        <div className="container">
          <h2 className="section-title">联系我们</h2>
          {contactItems.length > 0 ? (
            <div className="grid grid-2" style={{ gap: "2rem" }}>
              {contactItems.map((item) => (
                <ContactCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="contact-content">
              <div className="card contact-card">
                <h3>联系方式</h3>
                <div className="contact-methods">
                  <div className="contact-details">
                    <h4>QQ群</h4>
                    <p>扫描二维码加入官方群</p>
                    <div className="qr-code">
                      <img src="/aliyun_oss/contact/qq.jpg" alt="QQ群二维码" />
                    </div>
                  </div>
                </div>
              </div>
              <SocialLinks />
            </div>
          )}
        </div>
      </section>
    </>
  );
}

// ========== Client Components ==========

function ProjectCard({ project }: { project: any }) {
  const techItems = project.techStack ? project.techStack.split(";").filter(Boolean) : [];

  return (
    <article className="card media-card">
      {project.images.length > 0 && (
        <ProjectImageCarousel images={project.images} />
      )}
      <div>
        <h3>{project.title}</h3>
        {project.authors && (
          <div className="project-authors-scroll">
            <p className="meta" style={{ color: "#3b82f6", fontWeight: 600 }}>
              作者：{project.authors}
            </p>
          </div>
        )}
        <p className="meta">{project.description}</p>
        {techItems.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" }}>
            {techItems.map((tech: string, i: number) => (
              <span key={i} style={{
                background: "rgba(59, 130, 246, 0.1)",
                color: "#3b82f6",
                padding: "0.2rem 0.6rem",
                borderRadius: 12,
                fontSize: "0.8rem",
                fontWeight: 500
              }}>{tech.trim()}</span>
            ))}
          </div>
        )}
        {project.awards.length > 0 && (
          <AwardCarousel awards={project.awards} />
        )}
      </div>
    </article>
  );
}

function ProjectImageCarousel({ images }: { images: any[] }) {
  if (images.length === 1) {
    return <img src={images[0].url} alt="项目图片" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover" }} />;
  }
  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", transition: "transform 0.3s ease" }}>
        {images.map((img: any, i: number) => (
          <img key={img.id} src={img.url} alt={`项目图片 ${i + 1}`} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", flexShrink: 0 }} />
        ))}
      </div>
    </div>
  );
}

function AwardCarousel({ awards }: { awards: any[] }) {
  if (awards.length === 0) return null;
  return (
    <div style={{ marginTop: "0.5rem", borderTop: "1px solid #eee", paddingTop: "0.5rem" }}>
      {awards.map((award: any) => (
        <p key={award.id} className="meta" style={{ fontSize: "0.85rem" }}>
          <span style={{ color: "#999" }}>{award.date}</span>{" "}
          <span style={{ color: "#3b82f6", fontWeight: 600 }}>{award.name}</span>
        </p>
      ))}
    </div>
  );
}

function AchievementScroll({ achievements }: { achievements: any[] }) {
  return (
    <div style={{ overflow: "hidden", position: "relative" }}>
      <div style={{ display: "flex", gap: "1.5rem", animation: "scrollLeft 30s linear infinite", width: "max-content" }}>
        {[...achievements, ...achievements, ...achievements].map((item, index) => (
          <div key={`${item.id}-${index}`} style={{ position: "relative", flexShrink: 0, borderRadius: 15, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
            <img src={item.imageUrl} alt={item.name} style={{ height: 240, width: "auto", objectFit: "contain", display: "block" }} />
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
              color: "white", padding: "1rem", opacity: 0,
              transition: "opacity 0.3s ease",
            }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>{item.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrgNode({ member, allMembers, level = 0 }: { member: any; allMembers: any[]; level?: number }) {
  const children = allMembers.filter(m => m.parentId === member.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div className="card" style={{
        textAlign: "center", padding: "1.5rem", minWidth: 150,
        border: level === 0 ? "2px solid #3b82f6" : "1px solid #e2e8f0",
        background: level === 0 ? "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)" : "white",
        color: level === 0 ? "white" : "#333",
        borderRadius: 15,
      }}>
        {member.avatarUrl && (
          <img src={member.avatarUrl} alt={member.name} style={{
            width: 60, height: 60, borderRadius: "50%", objectFit: "cover",
            margin: "0 auto 0.5rem", display: "block",
            border: level === 0 ? "2px solid white" : "2px solid #3b82f6"
          }} />
        )}
        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: level === 0 ? "rgba(255,255,255,0.9)" : "#3b82f6" }}>
          {member.position}
        </div>
        <div style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "0.2rem" }}>
          {member.name}
        </div>
        {member.department && (
          <div style={{ fontSize: "0.75rem", opacity: 0.8, marginTop: "0.2rem" }}>{member.department}</div>
        )}
      </div>
      {children.length > 0 && (
        <>
          <div style={{
            width: 2, height: 30,
            background: "linear-gradient(to bottom, #3b82f6, transparent)",
            borderStyle: "dashed",
            animation: "dash 2s linear infinite"
          }} />
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", justifyContent: "center" }}>
            {children.map((child) => (
              <OrgNode key={child.id} member={child} allMembers={allMembers} level={level + 1} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TeacherCard({ teacher }: { teacher: any }) {
  const expertiseItems = teacher.expertise ? teacher.expertise.split(";").filter(Boolean) : [];

  return (
    <div className="card" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        <div style={{ flex: "0 0 200px", textAlign: "center" }}>
          {teacher.avatarUrl && (
            <img src={teacher.avatarUrl} alt={teacher.name} style={{
              width: 120, height: 120, borderRadius: "50%", objectFit: "cover",
              margin: "0 auto 1rem", display: "block",
              border: "3px solid #3b82f6"
            }} />
          )}
          <h3 style={{ fontSize: "1.3rem", marginBottom: "0.3rem" }}>{teacher.name}</h3>
          {teacher.position && (
            <p style={{ color: "#3b82f6", fontWeight: 600, marginBottom: "0.3rem" }}>{teacher.position}</p>
          )}
          {teacher.college && <p className="meta">{teacher.college}</p>}
          {teacher.major && <p className="meta">{teacher.major}</p>}
        </div>
        <div style={{ flex: 1, minWidth: 250 }}>
          {teacher.bio && (
            <div style={{ marginBottom: "1rem" }}>
              <h4 style={{ marginBottom: "0.5rem", color: "#333" }}>个人简介</h4>
              <p className="meta" style={{ whiteSpace: "pre-wrap" }}>{teacher.bio}</p>
            </div>
          )}
          {teacher.achievements && (
            <div style={{ marginBottom: "1rem" }}>
              <h4 style={{ marginBottom: "0.5rem", color: "#333" }}>所获成果</h4>
              <p className="meta" style={{ whiteSpace: "pre-wrap" }}>{teacher.achievements}</p>
            </div>
          )}
          {expertiseItems.length > 0 && (
            <div>
              <h4 style={{ marginBottom: "0.5rem", color: "#333" }}>专业领域</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {expertiseItems.map((item: string, i: number) => (
                  <span key={i} style={{
                    background: "rgba(59, 130, 246, 0.1)",
                    color: "#3b82f6",
                    padding: "0.3rem 0.8rem",
                    borderRadius: 15,
                    fontSize: "0.85rem",
                    fontWeight: 500
                  }}>{item.trim()}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {teacher.images.length > 0 && (
        <div style={{ marginTop: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
          {teacher.images.map((img: any) => (
            <img key={img.id} src={img.url} alt="教师风采" style={{ width: "100%", borderRadius: 15, objectFit: "cover" }} />
          ))}
        </div>
      )}
    </div>
  );
}

function ContactCard({ item }: { item: any }) {
  const hasImage = !!item.imageUrl;
  const hasContent = !!item.content;

  if (!hasImage && hasContent) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
        {item.title && <h3 style={{ marginBottom: "1rem" }}>{item.title}</h3>}
        <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{item.content}</p>
      </div>
    );
  }

  if (hasImage && hasContent) {
    return (
      <div className="card" style={{ padding: "2rem" }}>
        {item.title && <h3 style={{ marginBottom: "1rem" }}>{item.title}</h3>}
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{item.content}</p>
          </div>
          <div style={{ flex: "0 0 200px" }}>
            <img src={item.imageUrl} alt={item.title || "联系方式"} style={{ width: "100%", borderRadius: 10 }} />
          </div>
        </div>
      </div>
    );
  }

  if (hasImage && !hasContent) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
        {item.title && <h3 style={{ marginBottom: "1rem" }}>{item.title}</h3>}
        <img src={item.imageUrl} alt={item.title || "联系方式"} style={{ maxWidth: 250, borderRadius: 10, margin: "0 auto" }} />
      </div>
    );
  }

  return null;
}

function SocialLinks() {
  return (
    <div className="card social-card">
      <h3>关注我们</h3>
      <div className="social-grid">
        <a href="https://mp.weixin.qq.com/s/vXu6xYJiqkPwqq7r9WQQ2A" target="_blank" rel="noopener noreferrer" className="social-button wechat">
          <img src="/wx.png" alt="微信公众号" className="social-image" />
          <span className="social-name">微信公众号</span>
        </a>
        <div className="social-button bilibili coming-soon" aria-disabled="true">
          <img src="/bili.png" alt="哔哩哔哩" className="social-image" />
          <span className="social-text">
            <span className="social-name default-text">哔哩哔哩</span>
            <span className="social-name hover-text">敬请期待</span>
          </span>
        </div>
        <a href="https://xhslink.com/m/9PEVyPJo8sC" target="_blank" rel="noopener noreferrer" className="social-button xiaohongshu">
          <img src="/xhs.png" alt="小红书" className="social-image" />
          <span className="social-name">小红书</span>
        </a>
        <a href="https://v.douyin.com/46dfoBY5i0I" target="_blank" rel="noopener noreferrer" className="social-button douyin">
          <img src="/dy.png" alt="抖音" className="social-image" />
          <span className="social-name">抖音</span>
        </a>
      </div>
    </div>
  );
}
