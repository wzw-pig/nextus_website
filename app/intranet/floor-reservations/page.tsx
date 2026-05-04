import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getIntranetSessionFromCookies } from "@/lib/auth";
import { IntranetNav } from "@/components/intranet-nav";
import { AsyncSubmitForm } from "@/components/async-submit-form";
import { addDays, cleanupBeforeTodayWhere, floorTimeSlots, startOfToday } from "@/lib/floor-reservation";
import { floorTimeSlotLabels } from "@/lib/constants";

type Props = {
  searchParams?: { error?: string; ok?: string };
};

const weekLabels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function fmtDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export const dynamic = "force-dynamic";

export default async function FloorReservationsPage({ searchParams }: Props) {
  const session = await getIntranetSessionFromCookies();
  if (!session) redirect("/intranet/login?error=请先登录内网");

  const floorReservationModel = db.floorReservation;
  if (!floorReservationModel) {
    redirect("/intranet?error=预约模块未初始化，请先执行 Prisma 迁移并重启服务");
  }

  await floorReservationModel.deleteMany({ where: cleanupBeforeTodayWhere() });

  const start = startOfToday();
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  const reservations = await floorReservationModel.findMany({
    where: {
      date: {
        gte: start,
        lte: addDays(start, 6)
      }
    },
    include: { user: true },
    orderBy: [{ date: "asc" }, { slot: "asc" }]
  });

  const byCell = new Map<string, (typeof reservations)[number]>();
  for (const item of reservations) {
    byCell.set(`${fmtDate(item.date)}|${item.slot}`, item);
  }

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>十楼教工小家可使用时间表</h2>
              <p className="meta">日期为列、时段为行；绿色可预约，红色已占用。</p>
            </div>
            <IntranetNav />
          </div>
          {searchParams?.error ? <p className="danger">{decodeURIComponent(searchParams.error)}</p> : null}
          {searchParams?.ok ? <p className="ok">{decodeURIComponent(searchParams.ok)}</p> : null}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>新增预约</h2>
          <AsyncSubmitForm
            action="/api/intranet/floor-reservations"
            className="stack"
            submitText="提交预约"
            workingText="正在提交预约..."
            successRedirect="/intranet/floor-reservations"
          >
            <div className="row">
              <label>
                日期
                <select name="date" defaultValue={fmtDate(days[0])}>
                  {days.map((d) => (
                    <option key={fmtDate(d)} value={fmtDate(d)}>
                      {fmtDate(d)}（{weekLabels[d.getDay()]}）
                    </option>
                  ))}
                </select>
              </label>
              <label>
                时段
                <select name="slot" defaultValue={floorTimeSlots[0]}>
                  {floorTimeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {floorTimeSlotLabels[slot]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              使用事由（10字以内）
              <input name="reason" maxLength={10} required />
            </label>
          </AsyncSubmitForm>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>时段</th>
                  {days.map((d) => (
                    <th key={fmtDate(d)}>
                      {fmtDate(d)}
                      <br />
                      {weekLabels[d.getDay()]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {floorTimeSlots.map((slot) => (
                  <tr key={slot}>
                    <td>{floorTimeSlotLabels[slot]}</td>
                    {days.map((d) => {
                      const key = `${fmtDate(d)}|${slot}`;
                      const item = byCell.get(key);
                      const canDelete = item && (item.userId === session.userId || session.isForumAdmin);
                      const deletingOther = item && item.userId !== session.userId;
                      return (
                        <td key={key} style={{ background: item ? "#fee2e2" : "#dcfce7" }}>
                          {item ? (
                            <div className="stack" style={{ gap: "0.35rem" }}>
                              <p className="meta" style={{ margin: 0 }}>
                                {item.reason}（{item.user.name}）
                              </p>
                              {canDelete ? (
                                <form className="stack" action="/api/intranet/floor-reservations/delete" method="post">
                                  <input type="hidden" name="reservationId" value={item.id} />
                                  {deletingOther ? <input name="reason" placeholder="删除理由（必填）" required /> : null}
                                  <button className="btn btn-neutral" type="submit">
                                    删除
                                  </button>
                                </form>
                              ) : null}
                            </div>
                          ) : (
                            <span className="meta">可用</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
