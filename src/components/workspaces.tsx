"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  CalendarDays,
  Users,
  Flame,
  Heart,
  Plus,
  FileDown,
  Clock,
  BookOpen,
  Sprout,
  ShieldCheck,
  HandCoins,
  Check,
  Eye,
} from "lucide-react";
import type { AppData } from "@/lib/data";
import { date, labels, money, localDateTime } from "@/lib/domain";
import {
  ActionButton,
  ActionForm,
  Badge,
  CampaignCard,
  Empty,
  PageHeading,
  Stat,
  type Field,
} from "./ui";
import {CampaignSchedule} from "./campaign-controls";
import { Attendance } from "./attendance";
const campaignFields: Field[] = [
  {
    name: "title",
    label: "Tên chiến dịch",
    placeholder: "Tên ngắn gọn, thể hiện mục tiêu hoạt động",
  },
  { name: "summary", label: "Mô tả ngắn", type: "textarea" },
  {
    name: "description",
    label: "Nội dung và yêu cầu tham gia",
    type: "textarea",
  },
  {
    name: "category",
    label: "Lĩnh vực",
    options: ["Giáo dục", "Cộng đồng", "Môi trường", "Sức khỏe"].map((v) => ({
      value: v,
      label: v,
    })),
  },
  { name: "location", label: "Khu vực", value: "TP.HCM" },
  { name: "address", label: "Địa chỉ tập trung" },
  { name: "starts_at", label: "Bắt đầu (giờ Việt Nam)", type: "datetime-local" },
  { name: "ends_at", label: "Kết thúc (giờ Việt Nam)", type: "datetime-local" },
  {
    name: "capacity",
    label: "Số tình nguyện viên cần tuyển",
    type: "number",
    min: 1,
    value: 20,
  },
  {
    name: "goal",
    label: "Mục tiêu quyên góp (VNĐ, 0 nếu không có)",
    type: "number",
    min: 0,
    value: 0,
  },
  {
    name: "latitude",
    label: "Vĩ độ điểm danh",
    type: "number",
    value: 10.762622,
  },
  {
    name: "longitude",
    label: "Kinh độ điểm danh",
    type: "number",
    value: 106.660172,
  },
  {
    name: "instructions",
    label: "Hướng dẫn và đầu mối hỗ trợ điểm danh",
    type: "textarea",
  },
  {
    name: "status",
    label: "Lưu dưới dạng",
    options: [
      { value: "draft", label: "Bản nháp" },
      { value: "pending", label: "Gửi xét duyệt" },
    ],
  },
];
function Tickets({
  data,
  manage = false,
}: {
  data: AppData;
  manage?: boolean;
}) {
  return (
    <div className="split-layout">
      <div>
        {!data.tickets.length ? (
          <Empty title="Chưa có yêu cầu hỗ trợ" />
        ) : (
          data.tickets.map((t: any) => (
            <article className="panel" key={t.id}>
              <Badge status={t.status} />
              <h3>{t.title}</h3>
              <p>{t.body}</p>
              <small>{date(t.created_at)}</small>
              {t.reply && (
                <div className="notice">
                  <strong>Phản hồi: </strong>
                  {t.reply}
                </div>
              )}
              {manage && t.status === "open" && (
                <ActionForm
                  action="ticket-resolve"
                  hidden={{ id: t.id }}
                  fields={[
                    {
                      name: "reply",
                      label: "Kết quả xử lý và lý do",
                      type: "textarea",
                    },
                  ]}
                  submit="Gửi phản hồi và hoàn tất"
                />
              )}
            </article>
          ))
        )}
      </div>
      {!manage && (
        <div className="panel">
          <h3>Gửi yêu cầu mới</h3>
          <ActionForm
            action="ticket"
            fields={[
              { name: "title", label: "Chủ đề" },
              { name: "body", label: "Nội dung cần hỗ trợ", type: "textarea" },
            ]}
            submit="Gửi yêu cầu"
          />
        </div>
      )}
    </div>
  );
}
function Donations({
  data,
  admin = false,
}: {
  data: AppData;
  admin?: boolean;
}) {
  return data.donations.length ? (
    <div className="panel table-wrap">
      <table>
        <thead>
          <tr>
            <th>Mã giao dịch</th>
            <th>Mục đích</th>
            <th>Số tiền</th>
            <th>Trạng thái</th>
            {admin && <th>Đối chiếu</th>}
          </tr>
        </thead>
        <tbody>
          {data.donations.map((d: any) => (
            <tr key={d.id}>
              <td>
                <strong>{d.reference}</strong>
                <small>
                  {date(d.created_at)} · {d.is_demo ? "Thử nghiệm" : ""}
                </small>
              </td>
              <td>
                {d.purpose === "operations"
                  ? "Thùng đồng hành"
                  : data.campaigns.find((c) => c.id === d.campaign_id)?.title ||
                    "Nguồn hỗ trợ"}
              </td>
              <td>{money(d.amount)}</td>
              <td>
                <Badge status={d.status} />
              </td>
              {admin && (
                <td>
                  {d.status === "pending" && data.mode === "demo" && (
                    <ActionButton
                      action="donation-confirm"
                      payload={{
                        id: d.id,
                        reason:
                          "Admin đối chiếu giao dịch mô phỏng trong môi trường thử nghiệm",
                      }}
                      confirm="Xác nhận giao dịch mô phỏng? Không có tiền thật được chuyển."
                    >
                      Xác nhận thử nghiệm
                    </ActionButton>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty
      title="Chưa có khoản đóng góp"
      body="Các khoản đóng góp của bạn sẽ hiển thị tại đây cùng trạng thái đối chiếu."
      href="/chien-dich"
    />
  );
}
export function Personal({ path, data }: { path: string; data: AppData }) {
  const user = data.user!;
  const apps = data.applications.filter((a: any) => a.user_id === user.id);
  const balance = data.points.reduce((s: number, p: any) => s + p.amount, 0);
  const hours = data.results
    .filter((r: any) => r.user_id === user.id)
    .reduce((s: number, r: any) => s + r.hours, 0);
  if (path === "/ca-nhan/dang-ky")
    return (
      <>
        <PageHeading
          title="Đăng ký của tôi"
          description="Theo dõi kết quả và chủ động xác nhận khả năng tham gia."
        />
        {apps.length ? (
          apps.map((a: any) => {
            const c = data.campaigns.find((c) => c.id === a.campaign_id);
            return (
              <article className="panel application-row" key={a.id}>
                <img src={c?.image} alt="Minh họa chiến dịch" />
                <div className="grow">
                  <Badge status={a.status} />
                  <h3>{a.campaign_title}</h3>
                  <p className="muted">
                    {c && date(c.starts_at)} · {c?.location}
                  </p>
                  <p>{a.motivation}</p>
                  <div className="button-row">
                    {a.status === "selected" && (
                      <ActionButton
                        action="application"
                        payload={{ id: a.id, status: "confirmed" }}
                        confirm="Xác nhận bạn có thể tham gia chiến dịch này?"
                        className=""
                      >
                        Xác nhận tham gia
                      </ActionButton>
                    )}
                    {[
                      "submitted",
                      "selected",
                      "waitlisted",
                      "confirmed",
                    ].includes(a.status) && (
                      <ActionButton
                        action="application"
                        payload={{ id: a.id, status: "cancelled" }}
                        confirm="Bạn muốn hủy đăng ký? Tổ chức sẽ được cập nhật danh sách."
                      >
                        Hủy tham gia
                      </ActionButton>
                    )}
                    {a.status === "confirmed" && (
                      <Link
                        href="/ca-nhan/diem-danh"
                        className="button small secondary"
                      >
                        Điểm danh <ArrowRight size={15} />
                      </Link>
                    )}
                    <Link href={"/chien-dich/" + c?.slug} className="text-link">
                      Xem chiến dịch
                    </Link>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <Empty
            title="Hành trình của bạn đang chờ bắt đầu"
            body="Chọn một chiến dịch phù hợp và gửi đăng ký đầu tiên."
            href="/chien-dich"
          />
        )}
      </>
    );
  if (path === "/ca-nhan/diem-danh")
    return (
      <>
        <PageHeading
          title="Điểm danh chiến dịch"
          description="Chụp ảnh trực tiếp và xác nhận vị trí khi đến, trước khi rời hoạt động."
        />
        <Attendance data={data} />
      </>
    );
  if (path === "/ca-nhan/quyen-gop")
    return (
      <>
        <PageHeading
          title="Quyên góp của tôi"
          description="Từng khoản đóng góp, từng mục đích được theo dõi riêng."
        />
        <Donations data={data} />
      </>
    );
  if (path === "/ca-nhan/diem-phuoc")
    return (
      <>
        <PageHeading
          title="Điểm Phước & quà đồng hành"
          description="Một lời cảm ơn cho những đóng góp được xác nhận."
        />
        <div className="points-banner">
          <Flame size={45} />
          <div>
            <span>Điểm Phước hiện có</span>
            <strong>
              {balance}
              <small> điểm</small>
            </strong>
          </div>
          <p>
            Không chuyển nhượng.
            <br />
            Không quy đổi thành tiền.
          </p>
        </div>
        <h2 className="section-title">Những món quà nhỏ</h2>
        <div className="gift-grid">
          {data.gifts.map((g: any) => (
            <div className="panel gift-card" key={g.id}>
              <div className={"gift-art " + g.image}>
                {g.image === "plant" ? (
                  <Sprout />
                ) : g.image === "book" ? (
                  <BookOpen />
                ) : (
                  <Heart />
                )}
              </div>
              <h3>{g.name}</h3>
              <p>{g.description}</p>
              <div className="gift-bottom">
                <strong>{g.cost} điểm</strong>
                <span>Còn {g.stock}</span>
              </div>
              <ActionButton
                action="redeem"
                payload={{ id: g.id }}
                confirm={"Dùng " + g.cost + " điểm để đổi " + g.name + "?"}
              >
                Đổi quà
              </ActionButton>
            </div>
          ))}
        </div>
        <h2 className="section-title">Yêu cầu đổi quà</h2>
        {data.redemptions.length ? (
          <div className="panel">
            {data.redemptions.map((r: any) => (
              <div key={r.id} className="list-row">
                <span>{r.gift_name}</span>
                <Badge status={r.status} />
                {r.status === "pending" && (
                  <ActionButton
                    action="redemption"
                    payload={{ id: r.id, status: "cancelled" }}
                    confirm="Hủy yêu cầu và hoàn điểm?"
                  >
                    Hủy yêu cầu
                  </ActionButton>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty
            title="Chưa có yêu cầu đổi quà"
            body="Điểm được cộng sau khi tổ chức xác nhận kết quả tham gia."
          />
        )}
        <h2 className="section-title">Lịch sử điểm</h2>
        <div className="panel">
          {data.points.length ? (
            data.points.map((p: any) => (
              <div className="list-row" key={p.id}>
                <span>
                  {p.note}
                  <small>{date(p.created_at)}</small>
                </span>
                <strong className={p.amount > 0 ? "positive" : ""}>
                  {p.amount > 0 ? "+" : ""}
                  {p.amount}
                </strong>
              </div>
            ))
          ) : (
            <p className="muted">Chưa phát sinh điểm Phước.</p>
          )}
        </div>
      </>
    );
  if (path === "/ca-nhan/thong-bao")
    return (
      <>
        <PageHeading
          title="Thông báo"
          description="Những cập nhật dành cho hành trình của bạn."
        />
        <div className="panel">
          {data.notifications.map((n: any) => (
            <div
              className={"notification " + (n.read ? "read" : "")}
              key={n.id}
            >
              <div className="notification-dot" />
              <div className="grow">
                <Link href={n.href}>
                  <h3>{n.title}</h3>
                </Link>
                <p>{n.body}</p>
                <small>{date(n.created_at)}</small>
              </div>
              {!n.read && (
                <ActionButton action="notification" payload={{ id: n.id }}>
                  Đánh dấu đã đọc
                </ActionButton>
              )}
            </div>
          ))}
        </div>
      </>
    );
  if (path === "/ca-nhan/ho-so")
    return (
      <>
        <PageHeading
          title="Hồ sơ của bạn"
          description="Chỉ cung cấp thông tin cần thiết cho việc kết nối và tham gia."
        />
        <div className="panel narrow-form">
          <ActionForm
            action="profile"
            fields={[
              { name: "name", label: "Họ và tên", value: user.name },
              { name: "phone", label: "Số điện thoại", required: false, value:user.phone||"" },
              {
                name: "interests",
                value:user.interests||"",
                label: "Lĩnh vực quan tâm",
                required: false,
                placeholder: "Giáo dục, cộng đồng…",
              },
            ]}
          />
          <div className="notice">
            Email: {user.email}. Không thu thập hoặc xét kỹ năng; không yêu cầu
            khai lịch rảnh.
          </div>
        </div>
        {!user.organization_id && user.role !== "admin" && (
          <div className="panel narrow-form">
            <h2>Bạn đại diện một tổ chức?</h2>
            <p>Gửi hồ sơ để được kiểm tra trước khi công khai chiến dịch.</p>
            <ActionForm
              action="organization"
              fields={[
                { name: "name", label: "Tên tổ chức" },
                {
                  name: "description",
                  label: "Giới thiệu tổ chức",
                  type: "textarea",
                },
                { name: "contact", label: "Email liên hệ", type: "email" },
                {
                  name: "evidence",
                  label: "Đường dẫn hồ sơ minh chứng công khai",
                  type: "url",
                },
              ]}
              submit="Gửi hồ sơ tổ chức"
            />
          </div>
        )}
      </>
    );
  if (path === "/ca-nhan/ho-tro")
    return (
      <>
        <PageHeading
          title="Yêu cầu hỗ trợ"
          description="Mọi câu hỏi và phản hồi đều có nơi để được lắng nghe."
        />
        <Tickets data={data} />
      </>
    );
  return (
    <>
      <PageHeading
        eyebrow="HÀNH TRÌNH CỦA BẠN"
        title={"Chào " + user.name.split(" ").at(-1) + ", hôm nay bạn thế nào?"}
        description="Một điều nhỏ hôm nay có thể mang đến một thay đổi ngày mai."
        action={
          <Link className="button" href="/chien-dich">
            Khám phá chiến dịch <ArrowUpRight size={17} />
          </Link>
        }
      />
      <div className="stats-grid">
        <Stat
          label="Chiến dịch đã đăng ký"
          value={apps.length}
          icon={<Heart size={19} />}
        />
        <Stat
          label="Đã xác nhận tham gia"
          value={apps.filter((a: any) => a.status === "confirmed").length}
          icon={<CalendarDays size={19} />}
        />
        <Stat
          label="Giờ được ghi nhận"
          value={hours}
          icon={<Clock size={19} />}
        />
        <Stat label="Điểm Phước" value={balance} icon={<Flame size={19} />} />
      </div>
      <div className="dashboard-banner">
        <div>
          <span className="eyebrow">MỖI HÀNH TRÌNH ĐỀU CÓ Ý NGHĨA</span>
          <h2>
            Thêm một người.
            <br />
            Thêm một điều tốt đẹp.
          </h2>
          <Link href="/chien-dich" className="text-link">
            Tìm hoạt động tiếp theo <ArrowRight size={17} />
          </Link>
        </div>
        <img src="/images/community.webp" alt="Cộng đồng đồng hành" />
      </div>
      <div className="section-heading">
        <h2>Việc cần bạn xác nhận</h2>
        <Link href="/ca-nhan/dang-ky" className="text-link">
          Tất cả đăng ký <ArrowRight size={16} />
        </Link>
      </div>
      {apps.filter((a: any) => a.status === "selected").length ? (
        <div className="panel">
          {apps
            .filter((a: any) => a.status === "selected")
            .map((a: any) => (
              <div className="list-row" key={a.id}>
                <strong>{a.campaign_title}</strong>
                <ActionButton
                  action="application"
                  payload={{ id: a.id, status: "confirmed" }}
                  confirm="Xác nhận bạn có thể tham gia?"
                >
                  Xác nhận tham gia
                </ActionButton>
              </div>
            ))}
        </div>
      ) : (
        <Empty
          title="Bạn đã cập nhật mọi việc"
          body="Khi có kết quả xét chọn, NOI sẽ thông báo để bạn xác nhận."
        />
      )}
      <div className="section-heading">
        <h2>Khám phá thêm cơ hội</h2>
      </div>
      <div className="campaign-grid compact">
        {data.campaigns
          .filter((c) => c.status === "published")
          .slice(0, 2)
          .map((c) => (
            <CampaignCard key={c.id} c={c} />
          ))}
      </div>
    </>
  );
}

export function Organization({ path, data }: { path: string; data: AppData }) {
  const campaigns = data.campaigns.filter(
    (c) => c.organization_id === data.user?.organization_id,
  );
  const ids = campaigns.map((c) => c.id);
  const apps = data.applications.filter((a: any) =>
    ids.includes(a.campaign_id),
  );
  const [create, setCreate] = useState(false);
  const [filter, setFilter] = useState("");
  const organization = data.organizations.find(
    (o: any) => o.id === data.user?.organization_id,
  );
  const campaignSelect: Field = {
    name: "campaign_id",
    label: "Chiến dịch",
    options: campaigns.map((c) => ({ value: c.id, label: c.title })),
  };
  if (path.endsWith("/chien-dich"))
    return (
      <>
        <PageHeading
          title="Chiến dịch của tổ chức"
          description="Công khai nhu cầu và kết nối với những người muốn đồng hành."
          action={
            <button className="button" onClick={() => setCreate(!create)}>
              <Plus size={18} />
              {create ? "Đóng biểu mẫu" : "Tạo chiến dịch"}
            </button>
          }
        />
        {create && (
          <div className="panel">
            <h2>Chiến dịch mới</h2>
            <div className="notice">
              Đăng ký theo chiến dịch. Điểm danh dùng bán kính 500 m; hãy kiểm
              tra tọa độ đúng địa điểm tổ chức.
            </div>
            <ActionForm
              action="campaign"
              fields={campaignFields}
              submit="Lưu chiến dịch"
              onDone={() => setCreate(false)}
            />
          </div>
        )}
        <div className="panel">
          {campaigns.map((c) => (
            <div key={c.id} className="list-row">
              <div className="grow">
                <h3>{c.title}</h3>
                <p className="muted">
                  {date(c.starts_at)} · {c.confirmed}/{c.capacity} đã xác nhận
                </p>
              </div>
              <Badge status={c.status} />
              <CampaignSchedule campaign={c}/>
              {["draft", "changes"].includes(c.status) ? (
                <details>
                  <summary className="text-link">Sửa & gửi duyệt</summary>
                  <ActionForm
                    action="campaign"
                    hidden={{ id: c.id }}
                    fields={campaignFields.map((f) => ({
                      ...f,
                      value:
                        f.type === "datetime-local"
                          ? localDateTime(c[f.name as keyof typeof c] as string)
                          : String(c[f.name as keyof typeof c] ?? ""),
                    }))}
                    submit="Lưu thay đổi"
                  />
                </details>
              ) : (
                <Link
                  href={"/chien-dich/" + c.slug}
                  className="icon-button"
                  aria-label="Xem chiến dịch"
                >
                  <ArrowUpRight size={19} />
                </Link>
              )}
            </div>
          ))}
        </div>
      </>
    );
  if (path.endsWith("/ung-vien"))
    return (
      <>
        <PageHeading
          title="Đăng ký tình nguyện"
          description="Xét chọn theo nhu cầu chiến dịch. Người được chọn cần xác nhận lại."
          action={
            <a href="/api/export" className="button secondary">
              <FileDown size={17} />
              Xuất CSV
            </a>
          }
        />
        <label className="field filter-field">
          Lọc theo chiến dịch
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Tất cả</option>
            {campaigns.map((c) => (
              <option value={c.id} key={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        {apps.filter((a: any) => !filter || a.campaign_id === filter).length ? (
          apps
            .filter((a: any) => !filter || a.campaign_id === filter)
            .map((a: any) => (
              <article className="panel" key={a.id}>
                <div className="row-between">
                  <h3>{a.user_name}</h3>
                  <Badge status={a.status} />
                </div>
                <p className="muted">{a.campaign_title}</p>
                <p>{a.motivation}</p>
                {["submitted", "waitlisted"].includes(a.status) && (
                  <div className="button-row">
                    <ActionButton
                      action="application"
                      payload={{ id: a.id, status: "selected" }}
                      confirm="Lựa chọn ứng viên này và gửi yêu cầu xác nhận?"
                      className=""
                    >
                      Lựa chọn
                    </ActionButton>
                    {a.status !== "waitlisted" && (
                      <ActionButton
                        action="application"
                        payload={{ id: a.id, status: "waitlisted" }}
                      >
                        Đưa vào dự phòng
                      </ActionButton>
                    )}
                    <ActionButton
                      action="application"
                      payload={{ id: a.id, status: "rejected" }}
                      confirm="Từ chối đăng ký này?"
                    >
                      Từ chối
                    </ActionButton>
                  </div>
                )}
              </article>
            ))
        ) : (
          <Empty
            title="Chưa có hồ sơ đăng ký"
            body="Hồ sơ mới sẽ xuất hiện sau khi tình nguyện viên đăng ký chiến dịch."
          />
        )}
      </>
    );
  if (path.endsWith("/diem-danh"))
    return (
      <>
        <PageHeading
          title="Điểm danh & ghi nhận kết quả"
          description="Đối chiếu dữ liệu sự có mặt trước khi xác nhận đóng góp."
        />
        {apps.filter((a: any) => ["confirmed", "completed"].includes(a.status))
          .length ? (
          apps
            .filter((a: any) => ["confirmed", "completed"].includes(a.status))
            .map((a: any) => (
              <article className="panel" key={a.id}>
                <div className="row-between">
                  <h3>{a.user_name}</h3>
                  <Badge status={a.status} />
                </div>
                <p className="muted">{a.campaign_title}</p>
                <div className="attendance-records">
                  {data.attendance
                    .filter(
                      (r: any) =>
                        r.user_id === a.user_id &&
                        r.campaign_id === a.campaign_id,
                    )
                    .map((r: any) => (
                      <a
                        href={"/api/photos/" + r.id}
                        target="_blank"
                        rel="noreferrer"
                        className="attendance-record"
                        key={r.id}
                      >
                        <Eye size={18} />
                        <span>
                          {r.kind === "in" ? "Check-in" : "Check-out"} ·{" "}
                          {new Date(r.created_at).toLocaleString("vi-VN")}
                          <small>Xem ảnh riêng tư để đối chiếu</small>
                        </span>
                      </a>
                    ))}
                </div>
                {a.status === "confirmed" ? (
                  <>
                    <p className="notice">
                      Thiếu ảnh hoặc vị trí không tự động có nghĩa là vắng mặt.
                      Ghi rõ căn cứ đối chiếu; số giờ tối đa bằng thời lượng
                      chiến dịch.
                    </p>
                    <ActionForm
                      action="complete"
                      hidden={{ id: a.id }}
                      fields={[
                        {
                          name: "hours",
                          label: "Số giờ được công nhận",
                          type: "number",
                          min: 0.25,
                          max: 24,
                          value: 4,
                        },
                        {
                          name: "reason",
                          label: "Căn cứ xác nhận / giải trình ngoại lệ",
                          type: "textarea",
                        },
                      ]}
                      submit="Xác nhận kết quả và ghi điểm"
                    />
                  </>
                ) : (
                  <p className="feedback success">
                    <Check size={17} />
                    Kết quả đã được ghi nhận. Hệ thống không cộng điểm lặp.
                  </p>
                )}
              </article>
            ))
        ) : (
          <Empty
            title="Chưa có người đã xác nhận"
            body="Xét duyệt đăng ký và chờ tình nguyện viên xác nhận tham gia."
          />
        )}
      </>
    );
  if (path.endsWith("/tai-chinh"))
    return (
      <>
        <PageHeading
          title="Quyên góp & sử dụng nguồn lực"
          description="Tiền đã tiếp nhận, đã sử dụng và còn lại được theo dõi riêng."
        />
        <div className="stats-grid three">
          <Stat
            label="Đã tiếp nhận"
            value={money(campaigns.reduce((s, c) => s + (c.received || 0), 0))}
          />
          <Stat
            label="Đã công khai sử dụng"
            value={money(campaigns.reduce((s, c) => s + (c.spent || 0), 0))}
          />
          <Stat
            label="Còn lại theo công khai"
            value={money(
              campaigns.reduce(
                (s, c) => s + (c.received || 0) - (c.spent || 0),
                0,
              ),
            )}
          />
        </div>
        <Donations
          data={{
            ...data,
            donations: data.donations.filter((d: any) =>
              ids.includes(d.campaign_id),
            ),
          }}
        />
        <div className="panel">
          <h2>Gửi khoản chi để xét duyệt</h2>
          <ActionForm
            action="expense"
            fields={[
              campaignSelect,
              { name: "title", label: "Nội dung chi" },
              {
                name: "amount",
                label: "Số tiền (VNĐ)",
                type: "number",
                min: 1000,
              },
              {
                name: "evidence",
                label: "Đường dẫn minh chứng công khai",
                type: "url",
              },
            ]}
            submit="Gửi khoản chi"
          />
        </div>
        <div className="panel">
          {data.expenses
            .filter((e: any) => ids.includes(e.campaign_id))
            .map((e: any) => (
              <div className="list-row" key={e.id}>
                <span>{e.title}</span>
                <strong>{money(e.amount)}</strong>
                <Badge status={e.status} />
              </div>
            ))}
        </div>
      </>
    );
  if (path.endsWith("/bao-cao"))
    return (
      <>
        <PageHeading
          title="Báo cáo tác động"
          description="Kể lại kết quả bằng thông tin và bằng chứng từ hoạt động."
        />
        <div className="panel">
          <ActionForm
            action="report"
            fields={[
              campaignSelect,
              { name: "title", label: "Tên báo cáo" },
              {
                name: "body",
                label: "Kết quả, hoạt động đã thực hiện và minh chứng",
                type: "textarea",
              },
              {
                name: "beneficiaries",
                label: "Số người thụ hưởng",
                type: "number",
                min: 0,
              },
            ]}
            submit="Gửi báo cáo xét duyệt"
          />
        </div>
        {data.reports
          .filter((r: any) => ids.includes(r.campaign_id))
          .map((r: any) => (
            <article className="panel prose" key={r.id}>
              <Badge status={r.status} />
              <h2>{r.title}</h2>
              <p>{r.body}</p>
              <button
                className="button secondary no-print"
                onClick={() => window.print()}
              >
                <FileDown size={17} />
                In / lưu PDF
              </button>
            </article>
          ))}
      </>
    );
  if (path.endsWith("/ho-so"))
    return (
      <>
        <PageHeading
          title="Hồ sơ tổ chức"
          description="Thông tin đại diện và phạm vi xác minh."
        />
        <div className="panel prose">
          <Badge status={organization?.status} />
          <h2>{organization?.name}</h2>
          <p>{organization?.description}</p>
          <h3>Phạm vi kiểm tra</h3>
          <p>{organization?.scope}</p>
          <p>Email: {organization?.contact}</p>
          {['changes','rejected'].includes(organization?.status)&&<><h3>Bổ sung và gửi lại hồ sơ</h3><ActionForm action="organization" fields={[{name:'name',label:'Tên tổ chức',value:organization?.name},{name:'description',label:'Giới thiệu',type:'textarea',value:organization?.description},{name:'contact',label:'Email liên hệ',type:'email',value:organization?.contact},{name:'evidence',label:'Liên kết hồ sơ minh chứng',type:'url',value:organization?.evidence}]} submit="Gửi lại để xác minh"/></>}
        </div>
      </>
    );
  if (path.endsWith("/ho-tro"))
    return (
      <>
        <PageHeading title="Phản ánh trong chiến dịch" />
        <Tickets
          data={{
            ...data,
            tickets: data.tickets.filter((t: any) =>
              ids.includes(t.campaign_id),
            ),
          }}
          manage
        />
      </>
    );
  return (
    <>
      <PageHeading
        eyebrow={organization?.name}
        title="Cùng chuẩn bị những hành trình mới"
        description="Theo dõi chiến dịch, nhân sự và các việc cần xử lý của tổ chức."
        action={
          <Link className="button" href="/to-chuc/quan-ly/chien-dich">
            <Plus size={18} />
            Tạo chiến dịch
          </Link>
        }
      />
      <div className="stats-grid">
        <Stat
          label="Chiến dịch"
          value={campaigns.length}
          icon={<Heart size={19} />}
        />
        <Stat
          label="Hồ sơ chờ xét"
          value={apps.filter((a: any) => a.status === "submitted").length}
          icon={<Users size={19} />}
        />
        <Stat
          label="Người đã xác nhận"
          value={apps.filter((a: any) => a.status === "confirmed").length}
          icon={<Check size={19} />}
        />
        <Stat
          label="Đóng góp được ghi nhận"
          value={apps.filter((a: any) => a.status === "completed").length}
          icon={<Flame size={19} />}
        />
      </div>
      <div className="panel">
        <h2>Chiến dịch đang quản lý</h2>
        {campaigns.map((c) => (
          <div className="list-row" key={c.id}>
            <img className="thumb" src={c.image} alt="" />
            <div className="grow">
              <h3>{c.title}</h3>
              <p className="muted">
                {date(c.starts_at)} · {c.confirmed}/{c.capacity} người đã xác
                nhận
              </p>
            </div>
            <Badge status={c.status} />
            <Link
              href="/to-chuc/quan-ly/ung-vien"
              className="button small secondary"
            >
              Xem hồ sơ <ArrowRight size={15} />
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}

export function Admin({ path, data }: { path: string; data: AppData }) {
  if (path.endsWith("/to-chuc"))
    return (
      <>
        <PageHeading
          title="Xác minh tổ chức"
          description="Ghi rõ nội dung kiểm tra và lý do quyết định."
        />
        {data.organizations.map((o: any) => (
          <div className="panel" key={o.id}>
            <div className="row-between">
              <h2>{o.name}</h2>
              <Badge status={o.status} />
            </div>
            <p>{o.description}</p>
            <p className="muted">{o.contact}</p>
            {o.evidence && (
              <a
                href={o.evidence}
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                Xem hồ sơ minh chứng <ArrowUpRight size={16} />
              </a>
            )}
            <p>{o.scope}</p>
            {["pending", "changes"].includes(o.status) && (
              <ActionForm
                action="organization-review"
                hidden={{ id: o.id }}
                fields={[
                  {
                    name: "status",
                    label: "Quyết định",
                    options: [
                      { value: "verified", label: "Phê duyệt" },
                      { value: "changes", label: "Yêu cầu bổ sung" },
                      { value: "rejected", label: "Từ chối" },
                    ],
                  },
                  {
                    name: "reason",
                    label: "Phạm vi kiểm tra và lý do",
                    type: "textarea",
                  },
                ]}
                submit="Lưu quyết định"
              />
            )}
          </div>
        ))}
      </>
    );
  if (path.endsWith("/chien-dich"))
    return (
      <>
        <PageHeading
          title="Duyệt chiến dịch"
          description="Tổ chức không tự duyệt chiến dịch của mình."
        />
        {data.campaigns.filter((c) => c.status === "pending").length ? (
          data.campaigns
            .filter((c) => c.status === "pending")
            .map((c) => (
              <div className="panel prose" key={c.id}>
                <h2>{c.title}</h2>
                <p>
                  {c.organization} · {date(c.starts_at)}
                </p>
                <p>{c.description}</p>
                <p>
                  {c.address} · {c.capacity} tình nguyện viên · Mục tiêu{" "}
                  {money(c.goal)}
                </p>
                <ActionForm
                  action="campaign-review"
                  hidden={{ id: c.id }}
                  fields={[
                    {
                      name: "status",
                      label: "Quyết định",
                      options: [
                        { value: "published", label: "Phê duyệt công khai" },
                        { value: "changes", label: "Yêu cầu bổ sung" },
                        { value: "rejected", label: "Từ chối" },
                      ],
                    },
                    {
                      name: "reason",
                      label: "Lý do và nội dung đã kiểm tra",
                      type: "textarea",
                    },
                  ]}
                  submit="Lưu quyết định"
                />
              </div>
            ))
        ) : (
          <Empty title="Không có chiến dịch chờ duyệt" />
        )}
      </>
    );
  if (path.endsWith("/tai-chinh"))
    return (
      <>
        <PageHeading
          title="Đối chiếu quyên góp"
          description="Giao dịch chỉ được tính vào tiến độ sau khi xác nhận."
        />
        {data.mode === "demo" && (
          <div className="notice">
            Chế độ thử nghiệm. Nút xác nhận chỉ mô phỏng đối chiếu; không thực
            hiện chuyển tiền.
          </div>
        )}
        <Donations data={data} admin />
      </>
    );
  if (path.endsWith("/bao-cao"))
    return (
      <>
        <PageHeading
          title="Duyệt báo cáo & khoản chi"
          description="Kiểm tra nội dung trước khi công khai."
        />
        {[
          ...data.reports.map((r: any) => ({ ...r, table: "reports" })),
          ...data.expenses.map((e: any) => ({ ...e, table: "expenses" })),
        ]
          .filter((r) => r.status === "pending")
          .map((r) => (
            <div className="panel" key={r.id}>
              <h2>{r.title}</h2>
              <p>{r.body || money(r.amount)}</p>
              {r.evidence && (
                <a href={r.evidence} target="_blank" rel="noreferrer">
                  Xem minh chứng
                </a>
              )}
              <ActionForm
                action="publish"
                hidden={{ id: r.id, table: r.table }}
                fields={[
                  {
                    name: "status",
                    label: "Kết quả",
                    options: [
                      { value: "published", label: "Duyệt công khai" },
                      { value: "rejected", label: "Từ chối" },
                    ],
                  },
                  { name: "reason", label: "Lý do", type: "textarea" },
                ]}
                submit="Lưu kết quả"
              />
            </div>
          ))}
        {!data.reports.some((r: any) => r.status === "pending") &&
          !data.expenses.some((e: any) => e.status === "pending") && (
            <Empty title="Không có nội dung chờ duyệt" />
          )}
      </>
    );
  if (path.endsWith("/noi-dung"))
    return (
      <>
        <PageHeading
          title="Nội dung website"
          description="Soạn bản nháp và duyệt trước khi xuất bản."
        />
        <div className="panel">
          <h2>Tạo nội dung</h2>
          <ActionForm
            action="content"
            fields={[
              {
                name: "slug",
                label: "Đường dẫn (chữ thường, không dấu, dấu gạch ngang)",
              },
              { name: "title", label: "Tiêu đề" },
              { name: "body", label: "Nội dung", type: "textarea" },
            ]}
            submit="Lưu bản nháp"
          />
        </div>
        {data.content.map((c: any) => (
          <article className="panel" key={c.id}>
            <Badge status={c.status} />
            <h3>{c.title}</h3>
            <p>/{c.slug}</p>
            <details>
              <summary className="text-link">Chỉnh sửa nội dung</summary>
              <ActionForm
                action="content"
                hidden={{ id: c.id }}
                fields={[
                  { name: "slug", label: "Đường dẫn", value: c.slug },
                  { name: "title", label: "Tiêu đề", value: c.title },
                  {
                    name: "body",
                    label: "Nội dung",
                    type: "textarea",
                    value: c.body,
                  },
                ]}
                submit="Lưu thành bản nháp"
              />
            </details>
            {c.status === "draft" && (
              <ActionButton
                action="publish"
                payload={{
                  id: c.id,
                  table: "content",
                  status: "published",
                  reason: "Đã kiểm tra nội dung trước khi xuất bản",
                }}
                confirm="Công khai nội dung này?"
              >
                Duyệt và xuất bản
              </ActionButton>
            )}
          </article>
        ))}
      </>
    );
  if (path.endsWith("/qua"))
    return (
      <>
        <PageHeading
          title="Yêu cầu đổi quà"
          description="Điểm và tồn kho đã được giữ khi người dùng gửi yêu cầu."
        />
        {data.redemptions.length ? (
          data.redemptions.map((r: any) => (
            <div className="panel row-between" key={r.id}>
              <div>
                <h3>{r.gift_name}</h3>
                <p>
                  {r.cost} điểm · {date(r.created_at)}
                </p>
                <Badge status={r.status} />
              </div>
              {r.status === "pending" && (
                <div className="button-row">
                  <ActionButton
                    action="redemption"
                    payload={{ id: r.id, status: "fulfilled" }}
                    confirm="Xác nhận người dùng đã nhận quà?"
                  >
                    Đã giao quà
                  </ActionButton>
                  <ActionButton
                    action="redemption"
                    payload={{ id: r.id, status: "cancelled" }}
                    confirm="Hủy yêu cầu, hoàn điểm và tồn kho?"
                  >
                    Hủy & hoàn điểm
                  </ActionButton>
                </div>
              )}
            </div>
          ))
        ) : (
          <Empty title="Chưa có yêu cầu đổi quà" />
        )}
      </>
    );
  if (path.endsWith("/phan-anh"))
    return (
      <>
        <PageHeading title="Phản ánh & hỗ trợ" />
        <Tickets data={data} manage />
      </>
    );
  if (path.endsWith("/nhat-ky"))
    return (
      <>
        <PageHeading
          title="Nhật ký hệ thống"
          description="Theo dõi người thực hiện, thao tác và căn cứ xử lý."
        />
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Người thực hiện</th>
                <th>Thao tác</th>
                <th>Lý do</th>
              </tr>
            </thead>
            <tbody>
              {data.audit.map((a: any) => (
                <tr key={a.id}>
                  <td>{new Date(a.created_at).toLocaleString("vi-VN")}</td>
                  <td>{a.user_id}</td>
                  <td>
                    {a.action}
                    <small>{a.target}</small>
                  </td>
                  <td>
                    {a.reason || "—"}
                    <details>
                      <summary>Xem thay đổi</summary>
                      <pre className="audit-json">
                        {JSON.stringify(
                          { before: a.before, after: a.after },
                          null,
                          2,
                        )}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.audit.length && <Empty title="Chưa có hoạt động quản trị" />}
        </div>
      </>
    );
  return (
    <>
      <PageHeading
        eyebrow="QUẢN TRỊ NOI"
        title="Mọi kết nối đều cần được chăm sóc"
        description="Ưu tiên hồ sơ chờ duyệt và những phản hồi cần xử lý."
      />
      <div className="stats-grid">
        <Stat
          label="Tổ chức chờ duyệt"
          value={
            data.organizations.filter((o: any) => o.status === "pending").length
          }
          icon={<ShieldCheck size={19} />}
        />
        <Stat
          label="Chiến dịch chờ duyệt"
          value={data.campaigns.filter((c) => c.status === "pending").length}
          icon={<Heart size={19} />}
        />
        <Stat
          label="Phản ánh đang mở"
          value={data.tickets.filter((t: any) => t.status === "open").length}
          icon={<Users size={19} />}
        />
        <Stat
          label="Giao dịch chờ đối chiếu"
          value={
            data.donations.filter((d: any) => d.status === "pending").length
          }
          icon={<HandCoins size={19} />}
        />
      </div>
      <div className="info-grid">
        {[
          [
            "/quan-tri/to-chuc",
            "Kiểm tra tổ chức",
            "Hồ sơ và phạm vi xác minh",
          ],
          [
            "/quan-tri/chien-dich",
            "Duyệt chiến dịch",
            "Nội dung trước khi công khai",
          ],
          [
            "/quan-tri/phan-anh",
            "Tiếp nhận phản hồi",
            "Kết quả và lý do xử lý",
          ],
        ].map(([href, t, p]) => (
          <Link className="panel" href={href} key={href}>
            <ArrowUpRight className="feature-icon" />
            <h3>{t}</h3>
            <p>{p}</p>
          </Link>
        ))}
      </div>
      <div className="panel">
        <h2>Nhu cầu hợp tác</h2>
        {data.leads.length ? (
          data.leads.map((l: any) => (
            <div className="list-row" key={l.id}>
              <div>
                <h3>{l.company}</h3>
                <p>{l.email}</p>
                <p>{l.message}</p>
              </div>
              <Badge status={l.status} />
            </div>
          ))
        ) : (
          <p className="muted">Chưa có yêu cầu tư vấn từ doanh nghiệp.</p>
        )}
      </div>
      <div className="notice">
        Thanh toán, nguồn khẩn cấp, thuê bao và AI chưa kết nối dịch vụ ngoài.
        Không có thu gom tái chế, vị trí tuyển hoặc xét kỹ năng.
      </div>
    </>
  );
}
