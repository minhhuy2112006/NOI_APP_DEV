"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ArrowUpRight,
  Menu,
  X,
  Heart,
  Instagram,
  ArrowRight,
  LayoutDashboard,
  FileText,
  CalendarCheck,
  Flame,
  HandCoins,
  UserRound,
  Bell,
  LifeBuoy,
  Users,
  ShieldCheck,
  Settings,
  LogOut,
  PenLine,
  Gift,
  Building2,
  ClipboardList,
} from "lucide-react";
import { Logo } from "./ui";
import type { User } from "@/lib/domain";
const routes = [
  ["/chien-dich", "Khám phá chiến dịch"],
  ["/gioi-thieu", "Về NOI"],
  ["/minh-bach", "Minh bạch"],
  ["/noi-for-business", "Dành cho doanh nghiệp"],
];
export function Header({ user, mode }: { user: User | null; mode: string }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  if (user) return <MemberHeader key={path} user={user} />;
  return (
    <>
      <div className="demo-banner">
        <span className="live-dot" />
        {mode === "demo"
          ? "Không gian trải nghiệm • Chiến dịch và giao dịch là dữ liệu minh họa"
          : "Kết nối những tấm lòng, góp những điều tốt đẹp"}
      </div>
      <header className="site-header">
        <div className="container nav-inner">
          <Logo />
          <nav className={open ? "nav-links open" : "nav-links"}>
            {routes.map(([href, label]) => (
              <Link
                onClick={() => setOpen(false)}
                className={path === href ? "active" : ""}
                key={href}
                href={href}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="nav-actions">
            <>
              <Link className="login-link" href="/dang-nhap">
                Đăng nhập
              </Link>
              <Link className="button small" href="/dang-nhap">
                Cùng đồng hành
                <ArrowUpRight size={16} />
              </Link>
            </>

            <button
              aria-label={open ? "Đóng menu" : "Mở menu"}
              className="icon-button mobile-toggle"
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p>
            Kết nối những tấm lòng.
            <br />
            Cùng tạo nên những điều tốt đẹp.
          </p>
          <span className="footer-note">Một dự án của đội Nảy Mầm.</span>
        </div>
        <div>
          <h4>Khám phá NOI</h4>
          <Link href="/chien-dich">Chiến dịch cộng đồng</Link>
          <Link href="/to-chuc">Các tổ chức</Link>
          <Link href="/cau-chuyen">Câu chuyện đồng hành</Link>
          <Link href="/diem-phuoc">Điểm Phước</Link>
        </div>
        <div>
          <h4>Cùng đồng hành</h4>
          <Link href="/noi-for-business">NOI for Business</Link>
          <Link href="/thung-dong-hanh">Thùng đồng hành</Link>
          <Link href="/ho-tro-khan-cap">Hỗ trợ khẩn cấp</Link>
          <Link href="/bao-cao-tac-dong">Báo cáo tác động</Link>
        </div>
        <div>
          <h4>Luôn ở đây để hỗ trợ</h4>
          <Link href="/tro-giup">Trung tâm trợ giúp</Link>
          <Link href="/lien-he">
            Liên hệ với NOI <ArrowUpRight size={14} />
          </Link>
          <Link href="/chinh-sach">Chính sách & quyền riêng tư</Link>
          <Link href="/minh-bach">Cam kết minh bạch</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} NOI · Đội Nảy Mầm</span>
        <span>
          Làm điều tử tế, theo cách của bạn <Heart size={14} />
        </span>
      </div>
    </footer>
  );
}
const personal = [
  ["/ca-nhan", "Tổng quan", LayoutDashboard],
  ["/ca-nhan/dang-ky", "Đăng ký của tôi", ClipboardList],
  ["/ca-nhan/diem-danh", "Điểm danh", CalendarCheck],
  ["/ca-nhan/quyen-gop", "Quyên góp", HandCoins],
  ["/ca-nhan/diem-phuoc", "Điểm Phước & quà", Flame],
  ["/ca-nhan/thong-bao", "Thông báo", Bell],
  ["/ca-nhan/ho-so", "Hồ sơ cá nhân", UserRound],
  ["/ca-nhan/ho-tro", "Yêu cầu hỗ trợ", LifeBuoy],
] as const;
const organization = [
  ["/to-chuc/quan-ly", "Tổng quan", LayoutDashboard],
  ["/to-chuc/quan-ly/chien-dich", "Chiến dịch", Heart],
  ["/to-chuc/quan-ly/ung-vien", "Đăng ký tình nguyện", Users],
  ["/to-chuc/quan-ly/diem-danh", "Điểm danh & kết quả", CalendarCheck],
  ["/to-chuc/quan-ly/tai-chinh", "Quyên góp & khoản chi", HandCoins],
  ["/to-chuc/quan-ly/bao-cao", "Báo cáo tác động", FileText],
  ["/to-chuc/quan-ly/ho-so", "Hồ sơ tổ chức", Building2],
  ["/to-chuc/quan-ly/ho-tro", "Phản ánh", LifeBuoy],
] as const;
const admin = [
  ["/quan-tri", "Tổng quan", LayoutDashboard],
  ["/quan-tri/to-chuc", "Xác minh tổ chức", Building2],
  ["/quan-tri/chien-dich", "Duyệt chiến dịch", ShieldCheck],
  ["/quan-tri/tai-chinh", "Tài chính thử nghiệm", HandCoins],
  ["/quan-tri/noi-dung", "Nội dung website", PenLine],
  ["/quan-tri/bao-cao", "Báo cáo & khoản chi", FileText],
  ["/quan-tri/qua", "Đổi quà", Gift],
  ["/quan-tri/phan-anh", "Phản ánh", LifeBuoy],
  ["/quan-tri/nhat-ky", "Nhật ký hệ thống", Settings],
] as const;

type NavItem = readonly [string, string, ...unknown[]];
function MemberHeader({ user }: { user: User }) {
  const path = usePathname();
  const router = useRouter();
  const root = useRef<HTMLElement>(null);
  const [mobile, setMobile] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) {
        setExpanded(null);
        setMobile(false);
      }
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        const trigger = root.current?.querySelector<HTMLButtonElement>(
          'button[aria-expanded="true"]:not(.member-toggle)',
        );
        setExpanded(null);
        trigger?.focus();
        if (!trigger) {
          setMobile(false);
          root.current
            ?.querySelector<HTMLButtonElement>(".member-toggle")
            ?.focus();
        }
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  const personalSpace = path.startsWith("/ca-nhan");
  const links = personalSpace
    ? personal
    : user.role === "admin"
      ? admin
      : user.role === "organizer"
        ? organization
        : personal;
  const home = links[0][0];
  function group(label: string, items: readonly NavItem[]) {
    const active = items.some(
      ([href]) =>
        path === href ||
        (href === "/chien-dich" && path.startsWith("/chien-dich/")),
    );
    const id = "member-menu-" + label.replaceAll(" ", "-");
    return (
      <div className="member-dropdown" key={label}>
        <button
          className={active ? "member-nav-link active" : "member-nav-link"}
          aria-expanded={expanded === label}
          aria-controls={id}
          onClick={() => setExpanded(expanded === label ? null : label)}
        >
          {label}
          <ChevronDown size={15} />
        </button>
        {expanded === label && (
          <div className="member-popover" id={id}>
            {items.map(([href, text]) => (
              <Link
                key={href}
                href={href}
                aria-current={path === href ? "page" : undefined}
                onClick={() => {
                  setExpanded(null);
                  setMobile(false);
                }}
              >
                {text}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <header className="member-header" ref={root}>
      <div className="member-bar">
        <Logo />
        <button
          className="icon-button member-toggle"
          aria-label={mobile ? "Đóng menu" : "Mở menu"}
          aria-expanded={mobile}
          aria-controls="member-navigation"
          onClick={() => {
            setMobile(!mobile);
            setExpanded(null);
          }}
        >
          {mobile ? <X /> : <Menu />}
        </button>
        <nav
          aria-label="Điều hướng thành viên"
          id="member-navigation"
          className={mobile ? "member-nav is-open" : "member-nav"}
        >
          <Link
            className={
              path === home ? "member-nav-link active" : "member-nav-link"
            }
            aria-current={path === home ? "page" : undefined}
            href={home}
          >
            Tổng quan
          </Link>
          {group("Khám phá", [
            ["/chien-dich", "Chiến dịch cộng đồng"],
            ["/to-chuc", "Các tổ chức"],
            ["/cau-chuyen", "Câu chuyện đồng hành"],
          ])}
          {links === personal ? (
            <>
              {group("Hoạt động của tôi", personal.slice(1, 4))}
              <Link
                className={
                  path === personal[4][0]
                    ? "member-nav-link active"
                    : "member-nav-link"
                }
                href={personal[4][0]}
                aria-current={path === personal[4][0] ? "page" : undefined}
              >
                Điểm Phước & quà
              </Link>
            </>
          ) : links === organization ? (
            <>
              {group("Quản lý chiến dịch", organization.slice(1, 4))}
              {group("Tài chính & báo cáo", organization.slice(4, 6))}
            </>
          ) : (
            <>
              {group("Kiểm duyệt", [admin[1], admin[2], admin[4]])}
              {group("Quản lý", [
                admin[3],
                admin[5],
                admin[6],
                admin[7],
                admin[8],
              ])}
            </>
          )}
          {group("Về NOI", [
            ["/gioi-thieu", "Giới thiệu NOI"],
            ["/minh-bach", "Minh bạch"],
            ["/noi-for-business", "Dành cho doanh nghiệp"],
          ])}
        </nav>
        <div className="member-tools">
          <Link
            className="icon-button"
            href="/ca-nhan/thong-bao"
            aria-label="Thông báo"
            aria-current={path === "/ca-nhan/thong-bao" ? "page" : undefined}
          >
            <Bell size={20} />
          </Link>
          <div className="member-dropdown member-account">
            <button
              className="member-account-trigger"
              aria-expanded={expanded === "account"}
              aria-controls="account-navigation"
              onClick={() =>
                setExpanded(expanded === "account" ? null : "account")
              }
            >
              <span className="member-avatar">
                {user.name.trim().charAt(0)}
              </span>
              <span className="member-name">{user.name.split(" ").at(-1)}</span>
              <ChevronDown size={15} />
            </button>
            {expanded === "account" && (
              <div className="member-popover" id="account-navigation">
                <div className="member-identity">
                  <strong>{user.name}</strong>
                  <small>
                    {user.role === "admin"
                      ? "Quản trị viên"
                      : user.role === "organizer"
                        ? "Tổ chức"
                        : "Thành viên"}
                  </small>
                </div>
                <Link href="/ca-nhan/ho-so">Hồ sơ cá nhân</Link>
                {(user.role === "organizer" || user.role === "admin") && (
                  <Link href="/ca-nhan">Không gian cá nhân</Link>
                )}
                {user.role === "organizer" && (
                  <>
                    <Link href="/to-chuc/quan-ly">Không gian tổ chức</Link>
                    <Link href="/to-chuc/quan-ly/ho-so">Hồ sơ tổ chức</Link>
                  </>
                )}
                {user.role === "admin" && (
                  <Link href="/quan-tri">Không gian quản trị</Link>
                )}
                <Link
                  href={
                    links === organization
                      ? "/to-chuc/quan-ly/ho-tro"
                      : links === admin
                        ? "/quan-tri/phan-anh"
                        : "/ca-nhan/ho-tro"
                  }
                >
                  Hỗ trợ & phản ánh
                </Link>
                <button
                  className="member-logout"
                  disabled={leaving}
                  onClick={async () => {
                    setLeaving(true);
                    setError("");
                    try {
                      const result = await fetch("/api/auth", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "logout" }),
                      });
                      if (!result.ok) throw new Error();
                      router.push("/");
                      router.refresh();
                    } catch {
                      setError("Chưa thể đăng xuất. Vui lòng thử lại.");
                      setLeaving(false);
                    }
                  }}
                >
                  <LogOut size={16} />
                  {leaving ? "Đang đăng xuất…" : "Đăng xuất"}
                </button>
                {error && <p role="alert">{error}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
export function WorkspaceShell({
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  return (
    <div className="workspace member-workspace">
      <main className="workspace-main">{children}</main>
    </div>
  );
}
