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
    <section className="section" style={{ maxWidth: 560, marginInline: "auto" }}>
      <h2>Nextus 内网系统登录</h2>
      <p className="meta">账号由后台管理员手动录入，不支持注册。</p>
      {searchParams?.error ? <p className="danger">{decodeURIComponent(searchParams.error)}</p> : null}
      {searchParams?.ok ? <p className="ok">{decodeURIComponent(searchParams.ok)}</p> : null}
      <form className="stack" action="/api/intranet/login" method="post" style={{ marginTop: "0.8rem" }}>
        <label>
          用户名
          <input name="username" required />
        </label>
        <label>
          密码
          <input type="password" name="password" required />
        </label>
        <button className="btn btn-primary" type="submit">
          登录内网
        </button>
      </form>
      <div className="actions" style={{ marginTop: "0.8rem" }}>
        <Link className="btn btn-neutral" href="/">
          返回首页
        </Link>
      </div>
    </section>
  );
}
