import { getAdminSessionFromCookies } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

type Props = {
  searchParams?: { error?: string; ok?: string };
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const session = await getAdminSessionFromCookies();
  if (session) redirect("/admin/dashboard");

  return (
    <section className="section" style={{ maxWidth: 560, marginInline: "auto" }}>
      <h2>后台管理登录</h2>
      <p className="meta">仅数据库中已录入的后台账号可登录。</p>
      {searchParams?.error ? <p className="danger">{decodeURIComponent(searchParams.error)}</p> : null}
      {searchParams?.ok ? <p className="ok">{decodeURIComponent(searchParams.ok)}</p> : null}
      <form className="stack" action="/api/admin/login" method="post" style={{ marginTop: "0.8rem" }}>
        <label>
          用户名
          <input type="text" name="username" required />
        </label>
        <label>
          密码
          <input type="password" name="password" required />
        </label>
        <button className="btn btn-primary" type="submit">
          登录后台
        </button>
      </form>
      <div className="actions" style={{ marginTop: "0.8rem" }}>
        <Link href="/" className="btn btn-neutral">
          返回首页
        </Link>
        <Link href="/admin/bootstrap" className="btn btn-neutral">
          创建超级管理员（首次）
        </Link>
      </div>
    </section>
  );
}
