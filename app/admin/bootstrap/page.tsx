import { db } from "@/lib/db";
import Link from "next/link";

type Props = {
  searchParams?: { error?: string; ok?: string };
};

export const dynamic = "force-dynamic";

export default async function BootstrapPage({ searchParams }: Props) {
  const superAdmin = await db.adminUser.findFirst({
    where: { role: "SUPER_ADMIN" },
    select: { id: true, username: true }
  });

  return (
    <section className="section" style={{ maxWidth: 680, marginInline: "auto" }}>
      <h2>超级管理员初始化</h2>
      <p className="meta">
        仅在系统首次部署时使用。初始化口令来自环境变量 <code>SUPER_ADMIN_INIT_TOKEN</code>。
      </p>
      {searchParams?.error ? <p className="danger">{decodeURIComponent(searchParams.error)}</p> : null}
      {searchParams?.ok ? <p className="ok">{decodeURIComponent(searchParams.ok)}</p> : null}
      {superAdmin ? (
        <div className="card" style={{ marginTop: "0.9rem" }}>
          <p className="meta">
            当前已存在超级管理员：{superAdmin.username}。如需新增超级管理员，请登录后台后在管理员账号管理中创建。
          </p>
        </div>
      ) : (
        <form className="stack" action="/api/admin/bootstrap" method="post" style={{ marginTop: "0.9rem" }}>
          <label>
            初始化口令
            <input type="password" name="initToken" required />
          </label>
          <label>
            超级管理员用户名
            <input type="text" name="username" required />
          </label>
          <label>
            显示名称
            <input type="text" name="displayName" required />
          </label>
          <label>
            超级管理员密码
            <input type="password" name="password" required minLength={8} />
          </label>
          <button className="btn btn-primary" type="submit">
            创建超级管理员
          </button>
        </form>
      )}
      <div className="actions" style={{ marginTop: "0.8rem" }}>
        <Link href="/admin/login" className="btn btn-neutral">
          返回登录
        </Link>
      </div>
    </section>
  );
}
