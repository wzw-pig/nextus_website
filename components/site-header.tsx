import Link from "next/link";
import { departments } from "@/lib/constants";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-row">
        <Link href="/" className="brand">
          <img src="/logo.svg" alt="Nextus Logo" />
          <span>Nextus 团队官网</span>
        </Link>
        <nav className="main-nav">
          <a href="/#team-intro">团队简介</a>
          <details className="dropdown">
            <summary>部门介绍</summary>
            <div className="dropdown-menu">
              {departments.map((item) => (
                <Link key={item.slug} href={`/departments/${item.slug}`}>
                  {item.name}
                </Link>
              ))}
            </div>
          </details>
          <Link href="/news">新闻</Link>
          <Link href="/resources">资料下载</Link>
          <a href="/#about-us">关于我们</a>
          <a href="/#contact-us">联系我们</a>
          <Link href="/admin/login">管理后台</Link>
        </nav>
      </div>
    </header>
  );
}
