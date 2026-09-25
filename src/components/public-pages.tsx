"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Heart,
  MapPin,
  Users,
  ShieldCheck,
  CalendarDays,
  Search,
  SlidersHorizontal,
  BookOpen,
  Sprout,
  HandHeart,
  Flame,
  Check,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Building2,
  Plus,
  Quote,
  Download,
} from "lucide-react";
import type { AppData } from "@/lib/data";
import { categories, date, money, type Campaign } from "@/lib/domain";
import {
  ActionForm,
  ActionButton,
  Badge,
  CampaignCard,
  Empty,
  MoneySummary,
  PageHeading,
} from "./ui";
const faqs = [
  [
    "NOI giúp tôi tham gia tình nguyện như thế nào?",
    "Tìm hiểu chiến dịch, gửi đăng ký, chờ tổ chức xét chọn và xác nhận tham gia. Bạn đăng ký theo chiến dịch, không theo từng vị trí.",
  ],
  [
    "Check-in và check-out cần những gì?",
    "Bạn cần xác nhận tham gia, cấp quyền camera và vị trí. Trong thời gian được mở và bán kính 500 m, chụp ảnh trực tiếp để gửi điểm danh. Lỗi định vị không tự động đồng nghĩa với vắng mặt.",
  ],
  [
    "Khi nào tôi nhận được điểm Phước?",
    "Sau khi tổ chức xác nhận kết quả tham gia. Check-out không tự động công nhận toàn bộ nhiệm vụ. Điểm không được quy đổi thành tiền hoặc chuyển nhượng.",
  ],
  [
    "Tôi không thể tham gia nữa thì làm sao?",
    "Mở Đăng ký của tôi và chọn Hủy tham gia để tổ chức chủ động bổ sung nhân sự.",
  ],
  [
    "Khoản quyên góp được quản lý như thế nào?",
    "Khoản đóng góp chuyển đến bên tiếp nhận đã công bố. NOI theo dõi trạng thái đối chiếu, số đã nhận, đã sử dụng và còn lại. Trong môi trường thử nghiệm không có tiền thật.",
  ],
];
function CampaignCarousel({ items }: { items: Campaign[] }) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const pos = useRef(0);
  const dir = useRef(1);
  const target = useRef<number | null>(null);
  const paused = useRef(false);
  const SPEED = 40; // px mỗi giây, tăng số này để chạy nhanh hơn
  const maxScroll = useCallback(() => {
    const v = viewport.current;
    const last = track.current?.lastElementChild as HTMLElement | undefined;
    if (!v || !last) return 0;
    return Math.max(0, last.offsetLeft + last.offsetWidth - v.clientWidth);
  }, []);
  const go = useCallback(
    (d: number) => {
      const first = track.current?.children[0] as HTMLElement | undefined;
      if (!first || !track.current) return;
      const gap = parseFloat(getComputedStyle(track.current).columnGap) || 0;
      const step = first.offsetWidth + gap;
      dir.current = d;
      target.current = Math.max(
        0,
        Math.min(maxScroll(), pos.current + d * step),
      );
    },
    [maxScroll],
  );
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - last, 50) / 1000;
      last = now;
      const max = maxScroll();
      if (track.current && max > 0) {
        if (target.current !== null) {
          const diff = target.current - pos.current;
          if (Math.abs(diff) < 1) {
            pos.current = target.current;
            target.current = null;
          } else pos.current += diff * Math.min(1, dt * 8);
        } else if (!paused.current) {
          pos.current += dir.current * SPEED * dt;
          if (pos.current >= max) {
            pos.current = max;
            dir.current = -1;
          } else if (pos.current <= 0) {
            pos.current = 0;
            dir.current = 1;
          }
        }
        track.current.style.transform = `translate3d(${-pos.current}px,0,0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [maxScroll]);
  const hold = (v: boolean) => () => {
    paused.current = v;
  };
  return (
    <div
      className="campaign-carousel"
      onMouseEnter={hold(true)}
      onMouseLeave={hold(false)}
      onFocus={hold(true)}
      onBlur={hold(false)}
      onTouchStart={hold(true)}
      onTouchEnd={() => window.setTimeout(hold(false), 3000)}
    >
      <button
        type="button"
        className="carousel-btn prev"
        aria-label="Chiến dịch trước"
        onClick={() => go(-1)}
      >
        <ChevronLeft size={20} />
      </button>
      <div className="carousel-viewport" ref={viewport}>
        <div className="carousel-track" ref={track}>
          {items.map((c) => (
            <div className="carousel-item" key={c.id}>
              <CampaignCard c={c} />
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="carousel-btn next"
        aria-label="Chiến dịch tiếp theo"
        onClick={() => go(1)}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
export function Home({ data }: { data: AppData }) {
  const campaigns = data.campaigns.filter((c) =>
    ["published", "active"].includes(c.status),
  );
  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="tiny-sun">✳</span> KẾT NỐI ĐỂ NHỮNG ĐIỀU TỐT ĐẸP
              LAN XA
            </span>
            <h1>
              Mỗi hành động nhỏ.
              <br />
              <span>Một thay đổi lớn.</span>
            </h1>
            <p>
              Trao thời gian, gửi yêu thương. Cùng NOI tìm một hành trình tình
              nguyện ý nghĩa và tạo nên những thay đổi tích cực cho cộng đồng.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/chien-dich">
                Tìm chiến dịch phù hợp <ArrowUpRight size={19} />
              </Link>
              <Link className="text-link" href="/gioi-thieu">
                Tìm hiểu về NOI <ArrowRight size={17} />
              </Link>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack">
                <span>H</span>
                <span>L</span>
                <span>V</span>
                <span>+</span>
              </div>
              <div>
                <strong>Những tấm lòng, cùng một hướng</strong>
                <small>Bắt đầu hành trình đồng hành của bạn</small>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-arch">
              <img
                src="/images/community.webp"
                alt="Những người trẻ cùng vun trồng mầm xanh cho cộng đồng"
              />
            </div>
            <div className="float-card float-top">
              <span className="heart-disc">
                <Heart size={21} />
              </span>
              <div>
                <strong>Góp một điều tử tế</strong>
                <small>Bắt đầu từ hôm nay</small>
              </div>
            </div>
            <div className="float-card float-bottom">
              <span className="blue-disc">
                <ShieldCheck size={22} />
              </span>
              <div>
                <strong>Đồng hành có trách nhiệm</strong>
                <small>Rõ thông tin · Rõ đóng góp</small>
              </div>
              <span className="check-disc">
                <Check size={14} />
              </span>
            </div>
            <span className="hero-spark">✳</span>
          </div>
        </div>
      </section>
      <section className="values-strip">
        <div className="container values-grid">
          <span>
            <Users />
            Kết nối tình nguyện viên
          </span>
          <span>
            <ShieldCheck />
            Thông tin minh bạch
          </span>
          <span>
            <Heart />
            Ghi nhận từng đóng góp
          </span>
          <span>
            <Sprout />
            Cùng cộng đồng phát triển
          </span>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">TÌM MỘT HÀNH TRÌNH CỦA BẠN</span>
            <h2>Điều tốt đẹp đang chờ bạn</h2>
            <p>Một chút thời gian của bạn có thể tạo nên nhiều điều ý nghĩa.</p>
          </div>
          <Link className="text-link" href="/chien-dich">
            Tất cả chiến dịch <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="category-links">
          {[
            [Heart, "Tất cả"],
            [BookOpen, "Giáo dục"],
            [HandHeart, "Cộng đồng"],
            [Sprout, "Môi trường"],
          ].map(([I, t]) => {
            const Icon = I as typeof Heart;
            return (
              <Link
                key={String(t)}
                href={"/chien-dich?linh-vuc=" + encodeURIComponent(String(t))}
                className={t === "Tất cả" ? "selected" : ""}
              >
                <Icon size={16} />
                {String(t)}
              </Link>
            );
          })}
        </div>
        <CampaignCarousel items={campaigns} />
        {data.mode === "demo" && (
          <p className="data-note">
            Các chiến dịch và số liệu trên là dữ liệu minh họa để trải nghiệm
            sản phẩm.
          </p>
        )}
      </section>
      <section className="how-section">
        <div className="container">
          <div className="section-heading centered">
            <div>
              <span className="eyebrow">ĐƠN GIẢN ĐỂ BẮT ĐẦU</span>
              <h2>Từ một kết nối đến một hành trình</h2>
              <p>
                NOI ở đây để việc đóng góp của bạn thuận tiện và rõ ràng hơn.
              </p>
            </div>
          </div>
          <div className="steps-grid">
            {[
              [
                "01",
                Search,
                "Tìm điều bạn quan tâm",
                "Khám phá chiến dịch và đọc đầy đủ thông tin trước khi lựa chọn.",
              ],
              [
                "02",
                Heart,
                "Đăng ký đồng hành",
                "Gửi đăng ký, nhận kết quả và xác nhận khả năng tham gia.",
              ],
              [
                "03",
                Sprout,
                "Góp sức và lan tỏa",
                "Tham gia, điểm danh và lưu giữ những đóng góp được ghi nhận.",
              ],
            ].map(([n, I, t, p]) => {
              const Icon = I as typeof Heart;
              return (
                <div className="step" key={String(n)}>
                  <div className="step-top">
                    <span className="step-icon">
                      <Icon size={27} />
                    </span>
                    <span className="step-number">{String(n)}</span>
                  </div>
                  <h3>{String(t)}</h3>
                  <p>{String(p)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="impact-feature">
          <div className="impact-art">
            <img
              src="/images/children.webp"
              alt="Minh họa những em nhỏ bên sách và quà tặng"
            />
            <span className="art-label">
              <Heart size={16} /> Mỗi đóng góp đều đáng trân trọng
            </span>
          </div>
          <div className="impact-copy">
            <span className="eyebrow">ĐỒNG HÀNH BẰNG NIỀM TIN</span>
            <h2>
              Điều tử tế cần
              <br />
              được nhìn thấy rõ ràng.
            </h2>
            <p>
              Từ thông tin tổ chức, trạng thái đăng ký đến nguồn đóng góp và kết
              quả hoạt động — bạn luôn biết hành trình của mình đang ở đâu.
            </p>
            <ul>
              <li>
                <Check size={17} /> Công khai phạm vi xác minh
              </li>
              <li>
                <Check size={17} /> Theo dõi nguồn lực và kết quả hỗ trợ
              </li>
              <li>
                <Check size={17} /> Ghi nhận đóng góp sau xác nhận thực tế
              </li>
            </ul>
            <Link className="text-link" href="/minh-bach">
              Tìm hiểu cách NOI giữ sự minh bạch <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
      <section className="container">
        <div className="join-banner">
          <div>
            <span className="eyebrow">CHÚNG TA CÓ THỂ LÀM ĐƯỢC NHIỀU HƠN</span>
            <h2>
              Một người góp sức.
              <br />
              Cả cộng đồng cùng lớn lên.
            </h2>
            <p>
              Bạn có thể bắt đầu bằng một chiến dịch, một buổi sáng, một điều
              nhỏ.
            </p>
          </div>
          <Link className="button dark" href="/chien-dich">
            Bắt đầu đồng hành <ArrowUpRight size={18} />
          </Link>
          <Sprout className="join-sprout" />
        </div>
      </section>
    </main>
  );
}

export function CampaignList({
  data,
  initialCategory = "Tất cả",
}: {
  data: AppData;
  initialCategory?: string;
}) {
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState(initialCategory),
    [availability, setAvailability] = useState(false);
  const list = data.campaigns.filter(
    (c) =>
      ["published", "active", "closed"].includes(c.status) &&
      `${c.title} ${c.location}`
        .toLocaleLowerCase("vi")
        .includes(query.toLocaleLowerCase("vi")) &&
      (category === "Tất cả" || c.category === category) &&
      (!availability ||
        ((c.confirmed || 0) < c.capacity &&
          Date.parse(c.starts_at) > Date.now())),
  );
  return (
    <main className="container section">
      <PageHeading
        eyebrow="CÙNG NHAU TẠO NÊN ĐIỀU TỐT ĐẸP"
        title="Tìm hành trình dành cho bạn"
        description="Khám phá những chiến dịch cộng đồng và lựa chọn cách bạn muốn đồng hành."
      />
      <div className="filter-bar">
        <label className="search-box">
          <Search size={20} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm chiến dịch hoặc địa điểm…"
            aria-label="Tìm chiến dịch"
          />
        </label>
        <label className="filter-select">
          <SlidersHorizontal size={18} />
          <select
            aria-label="Lĩnh vực"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={availability}
            onChange={(e) => setAvailability(e.target.checked)}
          />{" "}
          Còn tuyển người
        </label>
      </div>
      <div className="results-heading">
        <strong>{list.length} chiến dịch</strong>
        <span>Chọn một hoạt động, bắt đầu một kết nối</span>
      </div>
      {list.length ? (
        <div className="campaign-grid">
          {list.map((c) => (
            <CampaignCard c={c} key={c.id} />
          ))}
        </div>
      ) : (
        <Empty
          title="Chưa tìm thấy chiến dịch"
          body="Thử từ khóa khác hoặc thay đổi bộ lọc để xem thêm cơ hội."
        />
      )}
    </main>
  );
}

export function DonationForm({ data, c }: { data: AppData; c?: Campaign }) {
  return (
    <>
      <div className="notice">
        {data.mode === "demo"
          ? "Giao dịch thử nghiệm — không chuyển tiền thật. Đơn tạo ra sẽ chờ admin đối chiếu mô phỏng."
          : "Chưa kết nối nhà cung cấp thanh toán. Không chuyển tiền trước khi có hướng dẫn tiếp nhận đã xác minh."}
      </div>
      {data.user ? (
        <ActionForm
          action="donate"
          hidden={{
            campaign_id: c?.id || null,
            purpose: c ? "campaign" : "operations",
          }}
          fields={[
            {
              name: "amount",
              label: "Số tiền muốn đóng góp (VNĐ)",
              type: "number",
              min: 1000,
              value: 100000,
            },
          ]}
          submit={
            data.mode === "demo"
              ? "Tạo đóng góp thử nghiệm"
              : "Tạo yêu cầu đóng góp"
          }
        />
      ) : (
        <Link className="button" href="/dang-nhap">
          Đăng nhập để đồng hành <ArrowRight size={17} />
        </Link>
      )}
    </>
  );
}
export function CampaignDetail({ data, c }: { data: AppData; c: Campaign }) {
  const [tab, setTab] = useState("Tổng quan");
  const app = data.applications.find(
    (a: any) => a.campaign_id === c.id && a.user_id === data.user?.id,
  );
  const reports = data.reports.filter(
    (r: any) => r.campaign_id === c.id && r.status === "published",
  );
  return (
    <main className="container detail-page">
      <div className="breadcrumb">
        <Link href="/chien-dich">Chiến dịch</Link>
        <span>/</span>
        <span>{c.category}</span>
      </div>
      <div className="detail-grid">
        <div>
          <div className="detail-cover">
            <img src={c.image} alt={"Minh họa " + c.title} />
            <Badge status={c.status} />
          </div>
          <div className="org-line">
            <ShieldCheck size={18} />
            {c.organization}
            <span>·</span>
            <span>
              Dữ liệu {data.mode === "demo" ? "minh họa" : "đã công khai"}
            </span>
          </div>
          <h1 className="detail-title">{c.title}</h1>
          <p className="detail-summary">{c.summary}</p>
          <div className="tabs" role="tablist">
            {["Tổng quan", "Hướng dẫn", "Minh bạch & báo cáo"].map((t) => (
              <button
                role="tab"
                aria-selected={tab === t}
                key={t}
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="prose">
            {tab === "Tổng quan" ? (
              <>
                <h2>Một hành trình có bạn</h2>
                {c.description.split("\n").map((s, i) => (
                  <p key={i}>{s}</p>
                ))}
                <h3>Thông tin hoạt động</h3>
                <p>
                  <CalendarDays size={17} /> {date(c.starts_at)} ·{" "}
                  {new Date(c.starts_at).toLocaleTimeString("vi-VN", {
                    timeZone:"Asia/Ho_Chi_Minh",hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  –{" "}
                  {new Date(c.ends_at).toLocaleTimeString("vi-VN", {
                    timeZone:"Asia/Ho_Chi_Minh",hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p>
                  <MapPin size={17} /> {c.address}
                </p>
                <h3>Bạn sẽ đồng hành như thế nào?</h3>
                <p>
                  Đăng ký tham gia chiến dịch, chờ tổ chức xét duyệt và xác
                  nhận. Nhiệm vụ cụ thể được tổ chức hướng dẫn trước hoạt động.
                </p>
              </>
            ) : tab === "Hướng dẫn" ? (
              <>
                <h2>Chuẩn bị cho ngày đồng hành</h2>
                <p>{c.instructions}</p>
                <h3>Điểm danh trên NOI</h3>
                <p>
                  Check-in mở trước giờ bắt đầu 60 phút. Điểm danh đóng sau giờ
                  kết thúc 2 giờ. Chụp ảnh trực tiếp trong phạm vi {c.radius} m,
                  với sai số định vị không quá 100 m. Khi gặp lỗi, gửi yêu cầu
                  để tổ chức đối chiếu.
                </p>
                <p>
                  Ảnh và vị trí chỉ hỗ trợ xác nhận sự có mặt. Điểm Phước được
                  ghi nhận sau khi tổ chức xác nhận kết quả.
                </p>
              </>
            ) : (
              <>
                <h2>Nguồn lực được theo dõi rõ ràng</h2>
                <MoneySummary c={c} />
                <p>
                  Mục tiêu: {money(c.goal)}. Số đã tiếp nhận chỉ bao gồm giao
                  dịch được đối chiếu.
                </p>
                {data.expenses
                  .filter(
                    (e: any) =>
                      e.campaign_id === c.id && e.status === "published",
                  )
                  .map((e: any) => (
                    <div className="list-row" key={e.id}>
                      <span>{e.title}</span>
                      <strong>{money(e.amount)}</strong>
                      <a href={e.evidence} target="_blank" rel="noreferrer">
                        Minh chứng
                      </a>
                    </div>
                  ))}
                <h3>Báo cáo hoạt động</h3>
                {reports.length ? (
                  reports.map((r: any) => (
                    <article key={r.id}>
                      <h3>{r.title}</h3>
                      <p>{r.body}</p>
                      <span>{r.beneficiaries} người thụ hưởng</span>
                    </article>
                  ))
                ) : (
                  <p>
                    Báo cáo sẽ xuất hiện sau khi hoạt động được tổng kết và
                    duyệt công khai.
                  </p>
                )}
                <Link href="/minh-bach" className="text-link">
                  Tìm hiểu phạm vi xác minh <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>
        </div>
        <aside className="detail-aside">
          <div className="panel">
            <span className="eyebrow">CÙNG GÓP MỘT PHẦN SỨC</span>
            <h2>Đồng hành cùng chiến dịch</h2>
            <div className="quick-info">
              <span>
                <MapPin size={18} />
                {c.location}
              </span>
              <span>
                <CalendarDays size={18} />
                {date(c.starts_at)}
              </span>
              <span>
                <Users size={18} />
                {c.confirmed || 0}/{c.capacity} người đã xác nhận
              </span>
            </div>
            <div className="progress">
              <span
                style={{
                  width:
                    Math.min(100, ((c.confirmed || 0) / c.capacity) * 100) +
                    "%",
                }}
              />
            </div>
            <p className="muted small-text">
              {c.applied || 0} hồ sơ đăng ký ·{" "}
              {Math.max(0, c.capacity - (c.confirmed || 0))} chỗ còn lại
            </p>
            {app ? (
              <>
                <Badge status={app.status} />
                <Link className="button full" href="/ca-nhan/dang-ky">
                  Xem đăng ký của tôi <ArrowRight size={16} />
                </Link>
              </>
            ) : !data.user ? (
              <Link
                className="button full"
                href={
                  "/dang-nhap?next=" +
                  encodeURIComponent("/chien-dich/" + c.slug)
                }
              >
                Đăng ký tham gia <ArrowUpRight size={18} />
              </Link>
            ) : Date.parse(c.starts_at) < Date.now() ||
              c.status === "closed" ? (
              <div className="notice">Chiến dịch đã hết thời gian đăng ký.</div>
            ) : (
              <ActionForm
                action="apply"
                hidden={{ campaign_id: c.id }}
                fields={[
                  {
                    name: "motivation",
                    label: "Lời nhắn đến tổ chức",
                    type: "textarea",
                    placeholder:
                      "Chia sẻ lý do bạn muốn tham gia (ít nhất 10 ký tự)…",
                  },
                ]}
                submit="Gửi đăng ký tham gia"
              />
            )}
            <p className="privacy-note">
              <ShieldCheck size={14} /> Thông tin đăng ký chỉ dành cho bên có
              trách nhiệm.
            </p>
          </div>
          {c.goal > 0 && (
            <div className="panel">
              <div className="eyebrow">THÊM MỘT CÁCH ĐỒNG HÀNH</div>
              <h3>Góp những món quà nhỏ</h3>
              <p className="muted">
                Đã tiếp nhận <strong>{money(c.received || 0)}</strong> /{" "}
                {money(c.goal)}
              </p>
              <DonationForm data={data} c={c} />
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

export function PublicPage({ path, data }: { path: string; data: AppData }) {
  if (path === "/to-chuc")
    return (
      <main className="container section">
        <PageHeading
          eyebrow="NHỮNG NGƯỜI CÙNG ĐỒNG HÀNH"
          title="Kết nối với các tổ chức"
          description="Tìm hiểu đơn vị tổ chức và phạm vi thông tin được công khai."
        />
        <div className="organization-grid">
          {data.organizations.map((o: any) => (
            <Link
              href={"/to-chuc/" + o.slug}
              className="panel organization-card"
              key={o.id}
            >
              <div className="org-avatar">
                <Sprout size={34} />
              </div>
              <Badge status={o.status} />
              <h2>{o.name}</h2>
              <p>{o.description}</p>
              <span className="text-link">
                Tìm hiểu tổ chức <ArrowUpRight size={17} />
              </span>
            </Link>
          ))}
        </div>
      </main>
    );
  if (path.startsWith("/to-chuc/")) {
    const o = data.organizations.find(
      (x: any) => "/to-chuc/" + x.slug === path,
    );
    return (
      <main className="container section">
        {o ? (
          <>
            <PageHeading
              eyebrow="TỔ CHỨC ĐỒNG HÀNH"
              title={o.name}
              description={o.description}
            />
            <div className="notice">
              <ShieldCheck size={20} />
              {o.scope}
            </div>
            <h2 className="section-title">Chiến dịch của tổ chức</h2>
            <div className="campaign-grid">
              {data.campaigns
                .filter((c) => c.organization_id === o.id)
                .map((c) => (
                  <CampaignCard c={c} key={c.id} />
                ))}
            </div>
          </>
        ) : (
          <Empty title="Không tìm thấy tổ chức" />
        )}
      </main>
    );
  }
  if (path === "/minh-bach")
    return (
      <main className="container section">
        <PageHeading
          eyebrow="NIỀM TIN ĐƯỢC XÂY TỪ SỰ RÕ RÀNG"
          title="Minh bạch trong từng bước"
          description="Biết ai tổ chức, nguồn lực đi đâu và đóng góp được ghi nhận như thế nào."
        />
        <div className="info-grid">
          {[
            [
              ShieldCheck,
              "Xác minh có phạm vi",
              "Thông tin công khai cho biết nội dung đã kiểm tra. Huy hiệu không bảo đảm tuyệt đối mọi hoạt động trong tương lai.",
            ],
            [
              HandHeart,
              "Nguồn tiền được tách biệt",
              "Quyên góp chiến dịch, nguồn khẩn cấp và chi phí vận hành NOI được theo dõi riêng. Không lấy tiền chiến dịch làm doanh thu.",
            ],
            [
              Users,
              "Ghi nhận có căn cứ",
              "Ảnh và vị trí hỗ trợ đối chiếu. Chỉ sau xác nhận của tổ chức, đóng góp và điểm Phước mới được ghi nhận.",
            ],
          ].map(([I, t, p]) => {
            const Icon = I as typeof Heart;
            return (
              <div className="panel" key={String(t)}>
                <Icon className="feature-icon" />
                <h3>{String(t)}</h3>
                <p>{String(p)}</p>
              </div>
            );
          })}
        </div>
        <div className="panel prose">
          <h2>Luôn có một nơi để phản hồi</h2>
          <p>
            Nếu bạn phát hiện thông tin không chính xác hoặc gặp vấn đề trong
            hoạt động, hãy gửi phản ánh. Kết quả xử lý và lý do được lưu lại để
            có thể kiểm tra.
          </p>
          <Link className="button" href="/ca-nhan/ho-tro">
            Gửi yêu cầu hỗ trợ <ArrowRight size={17} />
          </Link>
        </div>
      </main>
    );
  if (path === "/diem-phuoc")
    return (
      <main className="container section">
        <PageHeading
          eyebrow="GHI DẤU NHỮNG ĐIỀU TỬ TẾ"
          title="Điểm Phước, một lời cảm ơn"
          description="Được ghi nhận sau hoạt động, không phải thước đo lòng tốt hay giá trị của một người."
        />
        <div className="points-explainer">
          <Flame size={48} />
          <div>
            <h2>Mỗi đóng góp đều có câu chuyện riêng</h2>
            <p>
              Quy tắc thử nghiệm: 10 điểm cho mỗi giờ tham gia được tổ chức xác
              nhận. Điểm không chuyển nhượng, không đổi thành tiền và không phát
              sinh theo số tiền quyên góp.
            </p>
          </div>
        </div>
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
              <strong>{g.cost} điểm Phước</strong>
              <Link className="button secondary" href="/ca-nhan/diem-phuoc">
                Xem quà đồng hành <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </main>
    );
  if (path === "/bao-cao-tac-dong")
    return (
      <main className="container section">
        <PageHeading
          eyebrow="NHÌN LẠI NHỮNG ĐIỀU ĐÃ LÀM"
          title="Báo cáo tác động"
          description="Kết quả được tổ chức tổng hợp và xét duyệt trước khi công khai."
        />
        {data.reports.filter((r: any) => r.status === "published").length ? (
          data.reports
            .filter((r: any) => r.status === "published")
            .map((r: any) => (
              <article className="panel prose" key={r.id}>
                <Badge>Đã công khai</Badge>
                <h2>{r.title}</h2>
                <p>{r.body}</p>
                <p>{r.beneficiaries} người thụ hưởng</p>
                <button
                  className="button secondary no-print"
                  onClick={() => window.print()}
                >
                  <Download size={16} />
                  In / lưu PDF
                </button>
              </article>
            ))
        ) : (
          <Empty
            title="Những câu chuyện tác động đang được viết"
            body="Báo cáo sẽ được công khai sau khi chiến dịch hoàn thành và nội dung được duyệt."
            href="/chien-dich"
          />
        )}
      </main>
    );
  if (path === "/noi-for-business")
    return (
      <main className="container section">
        <PageHeading
          eyebrow="NOI FOR BUSINESS"
          title="Cùng đội ngũ làm điều ý nghĩa"
          description="Kết nối doanh nghiệp với hoạt động cộng đồng và xây dựng chương trình tình nguyện nhân viên."
        />
        <div className="split-layout">
          <div className="prose">
            <img
              className="rounded-image"
              src="/images/community.webp"
              alt="Cùng nhau xây dựng cộng đồng"
            />
            <h2>Một hành trình chung cho cả đội ngũ</h2>
            <p>
              Trao đổi với NOI về nhu cầu tổ chức chương trình, phối hợp tình
              nguyện viên và tổng hợp báo cáo đóng góp. Chi phí dịch vụ được
              tách riêng khỏi nguồn quyên góp.
            </p>
            <div className="notice">
              Đang tiếp nhận nhu cầu thử nghiệm. Gói dịch vụ, hợp đồng và thanh
              toán chưa được kích hoạt.
            </div>
          </div>
          <div className="panel">
            <h2>Kết nối với NOI</h2>
            {data.user ? (
              <ActionForm
                action="lead"
                hidden={{ type: "business" }}
                fields={[
                  { name: "company", label: "Tên doanh nghiệp" },
                  { name: "email", label: "Email liên hệ", type: "email" },
                  {
                    name: "message",
                    label: "Nhu cầu của đội ngũ",
                    type: "textarea",
                  },
                ]}
                submit="Gửi nhu cầu tư vấn"
              />
            ) : (
              <Link href="/dang-nhap" className="button">
                Đăng nhập để gửi nhu cầu
              </Link>
            )}
          </div>
        </div>
      </main>
    );
  if (path === "/thung-dong-hanh")
    return (
      <main className="container section narrow">
        <PageHeading
          eyebrow="NUÔI DƯỠNG NHỮNG KẾT NỐI"
          title="Thùng đồng hành NOI"
          description="Một nguồn đóng góp riêng dành cho việc duy trì và phát triển nền tảng."
        />
        <div className="panel prose">
          <p>
            Khoản hỗ trợ vận hành được theo dõi riêng, không trộn với tiền dành
            cho chiến dịch hoặc hỗ trợ khẩn cấp.
          </p>
          <DonationForm data={data} />
        </div>
      </main>
    );
  if (path === "/ho-tro-khan-cap")
    return (
      <main className="container section narrow">
        <PageHeading
          eyebrow="NGUỒN HỖ TRỢ DỰ PHÒNG"
          title="Sẵn sàng khi cộng đồng cần"
          description="Phương án hỗ trợ chi phí điều trị, chuyển trực tiếp đến bệnh viện khi đủ điều kiện."
        />
        <div className="panel prose">
          <Badge status="pending">Chưa kích hoạt vận hành</Badge>
          <h2>Chỉ mở khi có đủ điều kiện</h2>
          <p>
            Nguồn cần có đơn vị quản lý, bệnh viện phối hợp, kinh phí thực nhận
            và quy trình phê duyệt. Cam kết tài trợ chưa chuyển tiền không được
            tính vào số dư khả dụng.
          </p>
          <p>
            Hiện chưa tiếp nhận tiền hoặc hồ sơ y tế qua trang này. NOI không
            cam kết hỗ trợ khi chưa có căn cứ và nguồn kinh phí.
          </p>
          <Link href="/lien-he" className="button secondary">
            Trao đổi về hợp tác <ArrowRight size={17} />
          </Link>
        </div>
      </main>
    );
  if (path === "/tro-giup")
    return (
      <main className="container section narrow">
        <PageHeading
          eyebrow="CHÚNG MÌNH Ở ĐÂY"
          title="Bạn cần NOI hỗ trợ gì?"
          description="Những câu hỏi thường gặp trên hành trình đồng hành."
        />
        <div className="faq-list">
          {faqs.map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <ChevronDown size={19} />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
        <Link className="button" href="/ca-nhan/ho-tro">
          Gửi yêu cầu hỗ trợ <ArrowRight size={17} />
        </Link>
      </main>
    );
  if (path === "/lien-he")
    return (
      <main className="container section narrow">
        <PageHeading
          eyebrow="CÙNG TRÒ CHUYỆN"
          title="Kết nối với NOI"
          description="Chia sẻ câu hỏi, góp ý hoặc mong muốn hợp tác của bạn."
        />
        <div className="panel">
          {data.user ? (
            <ActionForm
              action="ticket"
              fields={[
                { name: "title", label: "Chủ đề" },
                { name: "body", label: "Nội dung", type: "textarea" },
              ]}
              submit="Gửi lời nhắn"
            />
          ) : (
            <>
              <p>
                Đăng nhập để gửi lời nhắn và theo dõi phản hồi trong tài khoản.
              </p>
              <Link className="button" href="/dang-nhap">
                Đăng nhập <ArrowRight size={17} />
              </Link>
            </>
          )}
        </div>
      </main>
    );
  if (path === "/chinh-sach")
    return (
      <main className="container section narrow">
        <PageHeading
          eyebrow="THÔNG TIN DÀNH CHO NGƯỜI DÙNG"
          title="Chính sách sử dụng thử nghiệm"
        />
        <div className="panel prose">
          <h2>Phạm vi thử nghiệm</h2>
          <p>
            NOI đang trong giai đoạn phát triển. Chiến dịch, tổ chức, quà và
            giao dịch trong chế độ demo là dữ liệu minh họa. Không sử dụng môi
            trường này để nhận tiền thật hoặc gửi hồ sơ nhạy cảm.
          </p>
          <h2>Ảnh và vị trí điểm danh</h2>
          <p>
            Vị trí chỉ được lấy khi bạn điểm danh; không theo dõi liên tục. Ảnh
            được lưu riêng tư và chỉ người có trách nhiệm được truy cập. Trong
            bản cục bộ, dữ liệu tồn tại cho tới khi môi trường thử nghiệm được
            đặt lại. Chính sách lưu trữ chính thức cần hoàn thiện trước khi
            triển khai thực tế.
          </p>
          <h2>Ghi nhận và phản hồi</h2>
          <p>
            Tổ chức xác nhận kết quả hoạt động. Bạn có quyền đề nghị xem xét
            thông tin chưa chính xác. Điểm Phước không phải tiền, không chuyển
            nhượng hoặc quy đổi thành tiền.
          </p>
          <Link href="/ca-nhan/ho-tro" className="text-link">
            Gửi yêu cầu về dữ liệu cá nhân <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  if(path==='/doi-tac')return <main className="container section narrow"><PageHeading eyebrow="CÙNG NOI ĐỒNG HÀNH" title="Kết nối nguồn lực cho cộng đồng" description="Tổ chức và doanh nghiệp có thể đề xuất chương trình tình nguyện, hỗ trợ nguồn lực hoặc quà đồng hành."/><div className="panel prose"><p>Các nội dung hợp tác được trao đổi và xác minh trước khi công khai. Danh sách đối tác thực tế sẽ được cập nhật khi có thỏa thuận.</p><Link href="/noi-for-business" className="button">Gửi nhu cầu hợp tác <ArrowRight size={17}/></Link></div></main>;
  const entry = data.content.find(
    (c: any) => "/" + c.slug === path && c.status === "published",
  );
  return (
    <main className="container section narrow">
      {entry ? (
        <>
          <PageHeading eyebrow="CÂU CHUYỆN NOI" title={entry.title} />
          <img
            className="rounded-image"
            src="/images/community.webp"
            alt="Minh họa cộng đồng NOI"
          />
          <div className="prose">
            {entry.body.split("\n").map((p: string, i: number) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <Link href="/chien-dich" className="button">
            Cùng bắt đầu hành trình <ArrowRight size={18} />
          </Link>
        </>
      ) : (
        <Empty
          title="Nội dung đang được chuẩn bị"
          body="Thông tin sẽ được công khai sau khi hoàn tất xét duyệt."
          href="/chien-dich"
        />
      )}
    </main>
  );
}
