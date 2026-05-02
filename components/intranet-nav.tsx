import Link from "next/link";

export function IntranetNav() {
  return (
    <div className="actions">
      <Link href="/intranet" className="btn btn-neutral">
        内网主页
      </Link>
      <Link href="/intranet/forum" className="btn btn-neutral">
        论坛
      </Link>
      <Link href="/intranet/resources" className="btn btn-neutral">
        资料发布
      </Link>
      <Link href="/intranet/floor-reservations" className="btn btn-neutral">
        十楼使用预约
      </Link>
      <Link href="/intranet/mailbox" className="btn btn-neutral">
        站内信
      </Link>
      <Link href="/intranet/finance" className="btn btn-neutral">
        财务审批
      </Link>
      <form action="/api/intranet/logout" method="post">
        <button type="submit" className="btn btn-neutral">
          退出内网
        </button>
      </form>
    </div>
  );
}
