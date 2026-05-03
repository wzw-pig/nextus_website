import Link from "next/link";
import { getIntranetSessionFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";

type Props = {
  searchParams?: { error?: string; ok?: string };
};

export default async function IntranetLoginPage({ searchParams }: Props) {
  const session = await getIntranetSessionFromCookies();
  if (session) redirect("/intranet");

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 560 }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: "0.8rem" }}>Nextus 内网系统登录</h2>
        <p className="meta">账号由后台管理员手动录入，不支持注册。</p>
        {searchParams?.error ? <p className="danger">{decodeURIComponent(searchParams.error)}</p> : null}
        {searchParams?.ok ? <p className="ok">{decodeURIComponent(searchParams.ok)}</p> : null}
        <form className="stack" action="/api/intranet/login" method="post" style={{ marginTop: "1.5rem" }}>
          <label>
            用户名
            <input name="username" required />
          </label>
          <label>
            密码
            <input type="password" name="password" required />
          </label>
          <button className="btn btn-primary" type="submit" style={{ width: "100%" }}>
            登录内网
          </button>
        </form>
        <div className="actions" style={{ marginTop: "1rem" }}>
          <Link className="btn btn-neutral" href="/">
            返回首页
          </Link>
        </div>
      </div>
    </section>
  );
}
