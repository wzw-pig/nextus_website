import Link from "next/link";

export function AdminNav() {
  return (
    <div className="actions">
      <Link href="/" className="btn btn-neutral">
        返回首页
      </Link>
      <form action="/api/admin/logout" method="post">
        <button className="btn btn-neutral" type="submit">
          退出后台
        </button>
      </form>
    </div>
  );
}
