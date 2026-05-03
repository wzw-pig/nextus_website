import Link from "next/link";
import { notFound } from "next/navigation";
import { departmentBySlug, departments } from "@/lib/constants";

type Props = {
  params: { slug: string };
};

export function generateStaticParams() {
  return departments.map((item) => ({ slug: item.slug }));
}

export default function DepartmentPage({ params }: Props) {
  const department = departmentBySlug[params.slug as keyof typeof departmentBySlug];
  if (!department) notFound();

  return (
    <section className="section">
      <div className="container">
        <h2 style={{ fontSize: "1.8rem", marginBottom: "0.8rem" }}>{department.name}</h2>
        <p className="meta">{department.description}</p>
        <div className="grid grid-2" style={{ marginTop: "1.5rem" }}>
          <article className="card">
            <h3>核心职责</h3>
            <p className="meta">
              负责与 {department.name}
              相关的日常项目推进、协作机制建设和成果输出，确保部门目标与团队战略保持一致。
            </p>
          </article>
          <article className="card">
            <h3>协作机制</h3>
            <p className="meta">通过周例会、月度复盘、跨部门协作工单与内网论坛，实现高效协同与知识沉淀。</p>
          </article>
        </div>
        <div className="actions" style={{ marginTop: "1.5rem" }}>
          <Link className="btn btn-neutral" href="/">
            返回首页
          </Link>
        </div>
      </div>
    </section>
  );
}
