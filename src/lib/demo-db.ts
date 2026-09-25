import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { Campaign, RecordRow, User } from "./domain";
import { validateAttendance } from "./domain";

const globals = globalThis as unknown as { noiDb?: DatabaseSync };
export const demoMode = () => process.env.NOI_MODE === "demo";
export const tables = [
  "users",
  "organizations",
  "campaigns",
  "applications",
  "attendance",
  "results",
  "points",
  "gifts",
  "redemptions",
  "donations",
  "expenses",
  "reports",
  "notifications",
  "tickets",
  "audit",
  "content",
  "leads",
  "sessions",
  "credentials",
] as const;
type Table = (typeof tables)[number];
export function db() {
  if (!demoMode() && process.env.NODE_ENV !== "test")
    throw Error("Kho dữ liệu thử nghiệm đã bị tắt.");
  if (!globals.noiDb) {
    mkdirSync(join(process.cwd(), ".data"), { recursive: true });
    const d = new DatabaseSync(
      process.env.NOI_TEST_DB || join(process.cwd(), ".data/noi.sqlite"),
    );
    d.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;");
    for (const t of tables)
      d.exec(
        `CREATE TABLE IF NOT EXISTS ${t}(id TEXT PRIMARY KEY, data TEXT NOT NULL CHECK(json_valid(data)))`,
      );
    d.exec(
      "CREATE UNIQUE INDEX IF NOT EXISTS app_user_campaign ON applications(json_extract(data,'$.user_id'),json_extract(data,'$.campaign_id')); CREATE UNIQUE INDEX IF NOT EXISTS point_source ON points(json_extract(data,'$.source')); CREATE UNIQUE INDEX IF NOT EXISTS attendance_unique ON attendance(json_extract(data,'$.user_id'),json_extract(data,'$.campaign_id'),json_extract(data,'$.kind')); CREATE UNIQUE INDEX IF NOT EXISTS result_unique ON results(json_extract(data,'$.application_id')); CREATE UNIQUE INDEX IF NOT EXISTS user_email ON users(json_extract(data,'$.email'));",
    );
    globals.noiDb = d;
    seed();
  }
  return globals.noiDb;
}
export function all<T = RecordRow>(table: Table): T[] {
  return db()
    .prepare(`SELECT data FROM ${table}`)
    .all()
    .map((r) => JSON.parse(String(r.data)));
}
export function get<T = RecordRow>(table: Table, id: string): T | undefined {
  const r = db().prepare(`SELECT data FROM ${table} WHERE id=?`).get(id);
  return r ? JSON.parse(String(r.data)) : undefined;
}
export function put(table: Table, row: RecordRow) {
  db()
    .prepare(
      `INSERT INTO ${table}(id,data) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data`,
    )
    .run(row.id, JSON.stringify(row));
  return row;
}
export function remove(table: Table, id: string) {
  db().prepare(`DELETE FROM ${table} WHERE id=?`).run(id);
}
export function transaction<T>(fn: () => T): T {
  db().exec("BEGIN IMMEDIATE");
  try {
    const value = fn();
    db().exec("COMMIT");
    return value;
  } catch (e) {
    db().exec("ROLLBACK");
    throw e;
  }
}
const now = () => new Date().toISOString();
export function audit(
  user: User,
  action: string,
  target: string,
  before: unknown,
  after: unknown,
  reason = "",
) {
  put("audit", {
    id: randomUUID(),
    user_id: user.id,
    action,
    target,
    before,
    after,
    reason,
    created_at: now(),
  });
}
function notify(
  user_id: string,
  title: string,
  body: string,
  href = "/ca-nhan",
) {
  put("notifications", {
    id: randomUUID(),
    user_id,
    title,
    body,
    href,
    read: false,
    created_at: now(),
  });
}
export function listCampaigns() {
  return all<Campaign>("campaigns").map((c) => {
    const apps = all("applications").filter((a) => a.campaign_id === c.id);
    return {
      ...c,
      organization: get("organizations", c.organization_id)?.name || "Tổ chức",
      applied: apps.filter((a) => a.status !== "cancelled").length,
      confirmed: apps.filter((a) =>
        ["confirmed", "completed"].includes(a.status),
      ).length,
      received: all("donations")
        .filter((d) => d.campaign_id === c.id && d.status === "success")
        .reduce((s, d) => s + d.amount, 0),
      spent: all("expenses")
        .filter((e) => e.campaign_id === c.id && e.status === "published")
        .reduce((s, e) => s + e.amount, 0),
    };
  });
}
export function snapshot(user: User | null) {
  const admin = user?.role === "admin";
  const own = (c: Campaign) =>
    c.organization_id === user?.organization_id && user?.role === "organizer";
  const campaigns = listCampaigns().filter(
    (c) =>
      ["published", "active", "closed"].includes(c.status) || admin || own(c),
  );
  const visibleCampaign = (id: string) =>
    admin || campaigns.some((c) => c.id === id && own(c));
  const applications: RecordRow[] = user
    ? all("applications")
        .filter((a) => a.user_id === user.id || visibleCampaign(a.campaign_id))
        .map((a) => ({
          ...a,
          user_name: get("users", a.user_id)?.name,
          campaign_title: get("campaigns", a.campaign_id)?.title,
        }))
    : [];
  return {
    mode: "demo",
    user,
    campaigns,
    organizations: all("organizations").filter(
      (o) => o.status === "verified" || admin || o.id === user?.organization_id,
    ).map(o=>{if(admin||o.id===user?.organization_id)return o;const {evidence,contact,...publicOrganization}=o;return publicOrganization;}),
    applications,
    attendance: user
      ? all("attendance")
          .filter(
            (a) => a.user_id === user.id || visibleCampaign(a.campaign_id),
          )
          .map(({ photo_path, ...a }) => a)
      : [],
    results: user
      ? all("results").filter(
          (a) => a.user_id === user.id || visibleCampaign(a.campaign_id),
        )
      : [],
    donations: all("donations").filter(
      (d) =>
        user &&
        (admin || d.user_id === user.id || visibleCampaign(d.campaign_id)),
    ),
    expenses: all("expenses").filter(
      (e) =>
        e.status === "published" && campaigns.some(c=>c.id===e.campaign_id) || (user && visibleCampaign(e.campaign_id)),
    ),
    points: user ? all("points").filter((p) => p.user_id === user.id) : [],
    gifts: all("gifts").filter((g) => g.stock > 0 || admin),
    redemptions: user
      ? all("redemptions").filter((r) => admin || r.user_id === user.id)
      : [],
    reports: all("reports").filter(
      (r) =>
        r.status === "published" && campaigns.some(c=>c.id===r.campaign_id) || (user && visibleCampaign(r.campaign_id)),
    ),
    notifications: user
      ? all("notifications").filter((n) => n.user_id === user.id)
      : [],
    tickets: user
      ? all("tickets").filter(
          (t) =>
            admin ||
            t.user_id === user.id ||
            (t.campaign_id && visibleCampaign(t.campaign_id)),
        )
      : [],
    audit: admin ? all("audit").slice(-100).reverse() : [],
    content: all("content").filter((c) => admin || c.status === "published"),
    leads: admin ? all("leads") : [],
  };
}
export function mutate(user: User, action: string, p: RecordRow) {
  return transaction(() => {
    const stamp = now();
    const id = randomUUID();
    const requireAdmin = () => {
      if (user.role !== "admin") throw Error("Bạn không có quyền quản trị.");
    };
    const campaign = (cid: string) => {
      const c = get<Campaign>("campaigns", cid);
      if (!c) throw Error("Không tìm thấy chiến dịch.");
      return c;
    };
    const requireOrg = (c: Campaign) => {
      if (
        user.role !== "organizer" ||
        !user.organization_id ||
        c.organization_id !== user.organization_id
      )
        throw Error("Bạn không có quyền quản lý chiến dịch này.");
    };
    let result: RecordRow = {};
    if (action === "apply") {
      const c = campaign(p.campaign_id);
      if (!["published", "active"].includes(c.status))
        throw Error("Chiến dịch chưa mở đăng ký.");
      if (Date.now() > Date.parse(c.starts_at))
        throw Error("Đã hết thời gian đăng ký.");
      if (
        all("applications").some(
          (a) => a.user_id === user.id && a.campaign_id === c.id,
        )
      )
        throw Error(
          "Bạn đã có hồ sơ tại chiến dịch này. Hãy mở Đăng ký của tôi.",
        );
      result = put("applications", {
        id,
        user_id: user.id,
        campaign_id: c.id,
        status: "submitted",
        motivation: p.motivation,
        created_at: stamp,
      });
      all<User>("users")
        .filter((u) => u.organization_id === c.organization_id)
        .forEach((u) =>
          notify(
            u.id,
            "Có đăng ký mới",
            user.name + " đăng ký " + c.title,
            "/to-chuc/quan-ly",
          ),
        );
    } else if (action === "application") {
      const a = get("applications", p.id);
      if (!a) throw Error("Không tìm thấy đăng ký.");
      const c = campaign(a.campaign_id);
      const before = { ...a };
      if (p.status === "confirmed" || p.status === "cancelled") {
        if (a.user_id !== user.id)
          throw Error("Không được thay đổi đăng ký của người khác.");
        if (p.status === "confirmed") {
          if (a.status !== "selected") throw Error("Hồ sơ chưa được lựa chọn.");
          if (!["published", "active"].includes(c.status)||Date.now()>Date.parse(c.ends_at))
            throw Error("Chiến dịch không còn nhận xác nhận.");
          if (
            all("applications").filter(
              (x) =>
                x.campaign_id === c.id &&
                ["confirmed", "completed"].includes(x.status),
            ).length >= c.capacity
          )
            throw Error(
              "Chiến dịch đã đủ người xác nhận. Vui lòng liên hệ tổ chức.",
            );
        } else if (
          !["submitted", "selected", "waitlisted", "confirmed"].includes(
            a.status,
          )
        )
          throw Error("Không thể hủy trạng thái hiện tại.");
      } else {
        requireOrg(c);
        if (
          !["selected", "waitlisted", "rejected"].includes(p.status) ||
          !["submitted", "waitlisted"].includes(a.status)
        )
          throw Error("Chuyển trạng thái không hợp lệ.");
      }
      a.status = p.status;
      result = put("applications", a);
      audit(user, action, a.id, before, a, p.reason);
      notify(
        a.user_id,
        "Cập nhật đăng ký",
        c.title + ": hồ sơ đã được cập nhật.",
        "/ca-nhan/dang-ky",
      );
    } else if (action === "campaign") {
      if (user.role !== "organizer" || !user.organization_id)
        throw Error("Chỉ tổ chức được tạo chiến dịch.");
      const existing = p.id ? campaign(p.id) : undefined;
      if (existing) {
        requireOrg(existing);
        if (!["draft", "changes"].includes(existing.status))
          throw Error("Chỉ sửa bản nháp hoặc nội dung cần bổ sung.");
      }
      if (
        p.status === "pending" &&
        get("organizations", user.organization_id)?.status !== "verified"
      )
        throw Error("Tổ chức cần được xác minh trước khi gửi chiến dịch.");
      result = put("campaigns", {
        ...p,
        id: existing?.id || id,
        slug: existing?.slug || "chien-dich-" + id.slice(0, 8),
        organization_id: user.organization_id,
        status: p.status || "draft",
        radius: 500,
        image: "/images/community.webp",
        created_at: existing?.created_at || stamp,
      });
      audit(user, action, result.id, existing || null, result);
    } else if(action==='campaign-schedule'){
      const c=campaign(p.id);requireOrg(c);
      if(c.status!=='published'||Date.now()>=Date.parse(c.starts_at))throw Error('Chỉ đổi lịch chiến dịch chưa bắt đầu.');
      if(Date.parse(p.starts_at)<=Date.now())throw Error('Lịch mới phải ở tương lai.');
      if(all('attendance').some(a=>a.campaign_id===c.id))throw Error('Chiến dịch đã có điểm danh, cần xử lý riêng.');
      result=put('campaigns',{...c,starts_at:p.starts_at,ends_at:p.ends_at,address:p.address,latitude:p.latitude,longitude:p.longitude,instructions:p.instructions});
      for(const app of all('applications').filter(a=>a.campaign_id===c.id&&!['cancelled','rejected','completed'].includes(a.status))){
        if(app.status==='confirmed')put('applications',{...app,status:'selected'});
        notify(app.user_id,'Chiến dịch thay đổi lịch',c.title+': '+p.reason+'. Vui lòng xem lịch mới và xác nhận lại nếu đã được lựa chọn.','/ca-nhan/dang-ky');
      }
      audit(user,action,c.id,c,result,p.reason);
    } else if (action === "campaign-review") {
      requireAdmin();
      const c = campaign(p.id);
      if (c.status !== "pending")
        throw Error("Chiến dịch không ở trạng thái chờ duyệt.");
      if (
        p.status === "published" &&
        get("organizations", c.organization_id)?.status !== "verified"
      )
        throw Error("Tổ chức chưa xác minh.");
      result = put("campaigns", { ...c, status: p.status });
      audit(user, action, c.id, c, result, p.reason);
    } else if (action === "organization") {
      const old=user.organization_id?get('organizations',user.organization_id):undefined;
      if(user.role==='admin'||old&&!['changes','rejected'].includes(old.status))throw Error('Hồ sơ tổ chức hiện tại không thể gửi lại.');
      const oid=old?.id||id;
      result = put("organizations", {
        id:oid,
        name: p.name,
        slug: old?.slug||"to-chuc-" + id.slice(0, 8),
        description: p.description,
        contact: p.contact,
        evidence: p.evidence,
        status: "pending",
        scope: "Chưa được xác minh",
        created_at: stamp,
      });
      put("users", { ...user, organization_id: oid, role: "organizer" });
      audit(user, action, oid, old||null, result);
    } else if (action === "organization-review") {
      requireAdmin();
      const o = get("organizations", p.id);
      if (!o || !["pending", "changes"].includes(o.status))
        throw Error("Hồ sơ không ở trạng thái chờ kiểm tra.");
      result = put("organizations", {
        ...o,
        status: p.status,
        scope: p.reason,
      });
      audit(user, action, o.id, o, result, p.reason);
    } else if (action === "attendance") {
      const c = campaign(p.campaign_id);
      const a = all("applications").find(
        (a) =>
          a.campaign_id === c.id &&
          a.user_id === user.id &&
          a.status === "confirmed",
      );
      if (!a) throw Error("Bạn chưa xác nhận tham gia chiến dịch.");
      const prior = all("attendance").filter(
        (x) => x.user_id === user.id && x.campaign_id === c.id,
      );
      validateAttendance(
        c,
        p.kind,
        p.latitude,
        p.longitude,
        p.accuracy,
        Date.now(),
        prior.some((x) => x.kind === "in"),
        prior.some((x) => x.kind === "out"),
      );
      result = put("attendance", {
        id,
        user_id: user.id,
        campaign_id: c.id,
        kind: p.kind,
        latitude: p.latitude,
        longitude: p.longitude,
        accuracy: p.accuracy,
        photo_path: p.photo_path,
        created_at: stamp,
      });
      audit(user, action, id, null, { kind: p.kind, campaign_id: c.id });
    } else if (action === "complete") {
      const a = get("applications", p.id);
      if (!a || a.status !== "confirmed")
        throw Error("Hồ sơ không ở trạng thái đã xác nhận.");
      const c = campaign(a.campaign_id);
      requireOrg(c);
      if (Date.now() < Date.parse(c.starts_at))
        throw Error("Không thể xác nhận kết quả trước khi chiến dịch bắt đầu.");
      const records = all("attendance").filter(
        (x) => x.user_id === a.user_id && x.campaign_id === c.id,
      );
      if (records.length < 2 && !p.reason.trim())
        throw Error("Cần lý do đối chiếu khi thiếu điểm danh.");
      const maxHours =
        (Date.parse(c.ends_at) - Date.parse(c.starts_at)) / 3600000;
      if (p.hours > maxHours) throw Error("Số giờ vượt thời lượng chiến dịch.");
      result = put("results", {
        id,
        application_id: a.id,
        user_id: a.user_id,
        campaign_id: c.id,
        hours: p.hours,
        reason: p.reason,
        created_at: stamp,
      });
      put("applications", { ...a, status: "completed" });
      put("points", {
        id: randomUUID(),
        user_id: a.user_id,
        amount: Math.floor(p.hours * 10),
        source: "result:" + id,
        note: "Đóng góp tại " + c.title,
        created_at: stamp,
      });
      audit(user, action, a.id, a, result, p.reason);
      notify(
        a.user_id,
        "Đóng góp được ghi nhận",
        c.title + " · " + p.hours + " giờ tình nguyện.",
        "/ca-nhan/diem-phuoc",
      );
    } else if (action === "donate") {
      if (p.purpose === "emergency")
        throw Error("Nguồn hỗ trợ khẩn cấp chưa được kích hoạt.");
      if (p.campaign_id) {
        const c = campaign(p.campaign_id);
        if (!["published", "active"].includes(c.status))
          throw Error("Chiến dịch không nhận đóng góp.");
      }
      result = put("donations", {
        id,
        user_id: user.id,
        campaign_id: p.campaign_id || null,
        purpose: p.purpose,
        amount: p.amount,
        status: "pending",
        reference: "NOI" + id.slice(0, 8).toUpperCase(),
        is_demo: true,
        created_at: stamp,
      });
    } else if (action === "donation-confirm") {
      requireAdmin();
      const d = get("donations", p.id);
      if (!d) throw Error("Không tìm thấy giao dịch.");
      if (d.status === "success") return d;
      if (d.status !== "pending") throw Error("Trạng thái không hợp lệ.");
      result = put("donations", { ...d, status: "success" });
      audit(user, action, d.id, d, result, p.reason);
      notify(
        d.user_id,
        "Đối chiếu thử nghiệm hoàn tất",
        "Khoản đóng góp mô phỏng đã được xác nhận.",
        "/ca-nhan/quyen-gop",
      );
    } else if (action === "expense") {
      const c = campaign(p.campaign_id);
      requireOrg(c);
      const received = all("donations")
        .filter((d) => d.campaign_id === c.id && d.status === "success")
        .reduce((s, d) => s + d.amount, 0);
      const spent = all("expenses")
        .filter(
          (e) =>
            e.campaign_id === c.id &&
            ["pending", "published"].includes(e.status),
        )
        .reduce((s, e) => s + e.amount, 0);
      if (p.amount > received - spent)
        throw Error("Khoản chi vượt số tiền đã tiếp nhận còn lại.");
      result = put("expenses", {
        id,
        ...p,
        status: "pending",
        user_id: user.id,
        created_at: stamp,
      });
      audit(user, action, id, null, result);
    } else if (action === "report") {
      const c = campaign(p.campaign_id);
      requireOrg(c);
      result = put("reports", {
        id,
        campaign_id: c.id,
        title: p.title,
        body: p.body,
        beneficiaries: p.beneficiaries,
        status: "pending",
        created_at: stamp,
      });
      audit(user, action, id, null, result);
    } else if (action === "publish") {
      requireAdmin();
      const table = p.table as "reports" | "expenses" | "content";
      const row = get(table, p.id);
      if (!row || !["pending", "draft"].includes(row.status))
        throw Error("Nội dung không ở trạng thái chờ duyệt.");
      result = put(table, { ...row, status: p.status });
      audit(user, action, row.id, row, result, p.reason);
    } else if (action === "redeem") {
      const gift = get("gifts", p.id);
      if (!gift || gift.stock < 1) throw Error("Quà đã hết.");
      const balance = all("points")
        .filter((x) => x.user_id === user.id)
        .reduce((s, x) => s + x.amount, 0);
      if (balance < gift.cost) throw Error("Bạn chưa đủ điểm Phước.");
      result = put("redemptions", {
        id,
        user_id: user.id,
        gift_id: gift.id,
        gift_name: gift.name,
        cost: gift.cost,
        status: "pending",
        created_at: stamp,
      });
      put("gifts", { ...gift, stock: gift.stock - 1 });
      put("points", {
        id: randomUUID(),
        user_id: user.id,
        amount: -gift.cost,
        source: "redeem:" + id,
        note: "Đổi " + gift.name,
        created_at: stamp,
      });
      audit(user, action, id, null, result);
    } else if (action === "redemption") {
      const r = get("redemptions", p.id);
      if (!r || r.status !== "pending") throw Error("Yêu cầu đã được xử lý.");
      if (p.status === "fulfilled") requireAdmin();
      else if (user.id !== r.user_id && user.role !== "admin")
        throw Error("Không có quyền hủy yêu cầu này.");
      result = put("redemptions", { ...r, status: p.status });
      if (p.status === "cancelled") {
        const g = get("gifts", r.gift_id)!;
        put("gifts", { ...g, stock: g.stock + 1 });
        put("points", {
          id: randomUUID(),
          user_id: r.user_id,
          amount: r.cost,
          source: "refund:" + r.id,
          note: "Hoàn điểm yêu cầu đổi quà",
          created_at: stamp,
        });
      }
      audit(user, action, r.id, r, result);
    } else if (action === "ticket") {
      if (
        p.campaign_id &&
        !all("applications").some(
          (a) => a.campaign_id === p.campaign_id && a.user_id === user.id,
        )
      )
        throw Error("Bạn chưa đăng ký chiến dịch này.");
      result = put("tickets", {
        id,
        ...p,
        user_id: user.id,
        status: "open",
        reply: "",
        created_at: stamp,
      });
    } else if (action === "ticket-resolve") {
      const t = get("tickets", p.id);
      if (!t) throw Error("Không tìm thấy phản ánh.");
      if (user.role !== "admin") {
        if (!t.campaign_id) throw Error("Không có quyền xử lý.");
        requireOrg(campaign(t.campaign_id));
      }
      result = put("tickets", { ...t, status: "resolved", reply: p.reply });
      audit(user, action, t.id, t, result, p.reply);
      notify(t.user_id, "Phản ánh đã có phản hồi", p.reply, "/ca-nhan/ho-tro");
    } else if (action === "profile") {
      result = put("users", {
        ...get("users", user.id),
        name: p.name,
        phone: p.phone,
        interests: p.interests,
      });
    } else if (action === "notification") {
      const n = get("notifications", p.id);
      if (!n || n.user_id !== user.id) throw Error("Không có quyền truy cập.");
      result = put("notifications", { ...n, read: true });
    } else if (action === "content") {
      requireAdmin();
      const reserved=['chien-dich','to-chuc','ca-nhan','quan-tri','dang-nhap','api','auth','minh-bach','diem-phuoc','bao-cao-tac-dong','noi-for-business','thung-dong-hanh','ho-tro-khan-cap','tro-giup','lien-he','chinh-sach','doi-tac','co-hoi-tinh-nguyen'];
      if(reserved.includes(p.slug))throw Error('Đường dẫn dành cho chức năng hệ thống.');
      if(all('content').some(c=>c.slug===p.slug&&c.id!==p.id))throw Error('Đường dẫn nội dung đã được sử dụng.');
      const old = p.id ? get("content", p.id) : undefined;
      result = put("content", {
        ...old,
        ...p,
        id: old?.id || id,
        status: "draft",
        created_at: old?.created_at || stamp,
      });
      audit(user, action, result.id, old || null, result);
    } else if (action === "lead") {
      result = put("leads", {
        id,
        ...p,
        user_id: user.id,
        status: "pending",
        created_at: stamp,
      });
    } else throw Error("Thao tác chưa được hỗ trợ.");
    return result;
  });
}
function seed() {
  if (all("users").length) return;
  const stamp = now();
  const users = [
    {
      id: "u-minh",
      name: "Minh Huy",
      email: "huy@noi.example",
      role: "volunteer",
      organization_id: null,
    },
    {
      id: "u-org",
      name: "Gia Linh",
      email: "tochuc@noi.example",
      role: "organizer",
      organization_id: "org-naymam",
    },
    {
      id: "u-admin",
      name: "Quản trị NOI",
      email: "admin@noi.example",
      role: "admin",
      organization_id: null,
    },
  ];
  users.forEach((u) => put("users", u));
  put("organizations", {
    id: "org-naymam",
    slug: "nay-mam",
    name: "Đội Nảy Mầm",
    description:
      "Kết nối những người trẻ cùng thực hiện hoạt động cộng đồng thiết thực tại TP.HCM.",
    status: "verified",
    scope:
      "Hồ sơ minh họa: thông tin đại diện và đầu mối liên hệ. Không phải đối tác đã được xác minh thực tế.",
    contact: "tochuc@noi.example",
    created_at: stamp,
  });
  const items = [
    [
      "trung-thu-cho-em",
      "Mang một mùa trăng trọn vẹn đến với các em",
      "Giáo dục",
      "Nhà Bè, TP.HCM",
      "Cùng chuẩn bị những phần quà nhỏ, tổ chức trò chơi và mang niềm vui đến với các em nhỏ.",
      "children.webp",
      20,
      15000000,
    ],
    [
      "tu-sach-den-truong",
      "Góp một cuốn sách, mở ngàn ước mơ",
      "Giáo dục",
      "Thủ Đức, TP.HCM",
      "Cùng sắp xếp tủ sách và tổ chức buổi đọc sách cho học sinh tại điểm trường.",
      "books.webp",
      15,
      8000000,
    ],
    [
      "bua-an-am-ap",
      "Một bữa cơm, nhiều yêu thương",
      "Cộng đồng",
      "Bình Thạnh, TP.HCM",
      "Chuẩn bị và trao những phần ăn ấm áp đến người cao tuổi có hoàn cảnh khó khăn.",
      "meals.webp",
      25,
      10000000,
    ],
    [
      "sac-xanh-thanh-pho",
      "Cùng trồng thêm một khoảng xanh",
      "Môi trường",
      "Quận 7, TP.HCM",
      "Chăm sóc vườn cộng đồng, trồng cây và tìm hiểu cách gìn giữ không gian xanh.",
      "garden.webp",
      30,
      5000000,
    ],
  ];
  items.forEach((x, i) => {
    const start = new Date(Date.now() + (i + 3) * 86400000);
    start.setUTCHours(1, 0, 0, 0);
    const end = new Date(+start + 4 * 3600000);
    put("campaigns", {
      id: "c" + (i + 1),
      slug: x[0],
      title: x[1],
      category: x[2],
      location: x[3],
      summary: x[4],
      description:
        x[4] +
        "\nĐây là hoạt động dành cho người từ 18 tuổi mong muốn đóng góp thời gian cho cộng đồng. Bạn sẽ được tổ chức hướng dẫn trước buổi hoạt động. Hãy mang theo nước uống, trang phục thoải mái và một tinh thần sẵn sàng sẻ chia.\nToàn bộ chiến dịch và số liệu trong môi trường này là dữ liệu minh họa.",
      image: "/images/" + x[5],
      capacity: x[6],
      goal: x[7],
      status: "published",
      organization_id: "org-naymam",
      address: "Điểm tập trung sẽ được tổ chức xác nhận trước hoạt động",
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      latitude: 10.762622,
      longitude: 106.660172,
      radius: 500,
      instructions:
        "Có mặt trước 15 phút. Check-in bằng ảnh trực tiếp và vị trí tại địa điểm. Liên hệ điều phối viên nếu gặp lỗi.",
      created_at: stamp,
    });
  });
  put("gifts", {
    id: "g1",
    name: "Túi vải Sống xanh",
    description: "Một chiếc túi nhỏ, một thói quen đẹp.",
    cost: 150,
    stock: 12,
    image: "bag",
  });
  put("gifts", {
    id: "g2",
    name: "Sổ tay Điều tử tế",
    description: "Ghi lại những hành trình đáng nhớ.",
    cost: 80,
    stock: 20,
    image: "book",
  });
  put("gifts", {
    id: "g3",
    name: "Cây xanh để bàn",
    description: "Mang một chút thiên nhiên đến góc học tập.",
    cost: 120,
    stock: 8,
    image: "plant",
  });
  put("content", {
    id: "about",
    slug: "gioi-thieu",
    title: "Những điều tốt đẹp bắt đầu từ một kết nối",
    body: "NOI là dự án của đội Nảy Mầm, kết nối tình nguyện viên với các chiến dịch cộng đồng. Chúng tôi muốn việc tìm kiếm cơ hội, phối hợp và ghi nhận đóng góp trở nên rõ ràng, thuận tiện hơn.\nTình nguyện là đóng góp thời gian và sự quan tâm. Quyên góp bổ sung nguồn lực để các hoạt động được thực hiện. Mỗi hình thức đều đáng trân trọng.",
    status: "published",
    created_at: stamp,
  });
  put("content", {
    id: "story",
    slug: "cau-chuyen",
    title: "Một ngày nhỏ, một điều tử tế",
    body: "Có những hành trình bắt đầu từ một lời mời. Một buổi đọc sách, một bữa cơm, một cây xanh mới trồng — mỗi việc nhỏ đều có thể tạo nên thay đổi.\nĐây là câu chuyện minh họa trong môi trường thử nghiệm NOI.",
    status: "published",
    created_at: stamp,
  });
  notify(
    "u-minh",
    "Chào mừng Huy đến với NOI",
    "Khám phá một chiến dịch và bắt đầu hành trình đóng góp của bạn.",
    "/chien-dich",
  );
}
