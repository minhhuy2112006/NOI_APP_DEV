"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Feedback } from "./ui";
export function AuthScreen({ mode }: { mode: string }) {
  const router = useRouter(),
    search = useSearchParams();
  const [signup, setSignup] = useState(false),
    [show, setShow] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  async function submit(body: unknown) {
    setPending(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw Error(j.error);
      if (j.message) {
        setMessage(j.message);
        return;
      }
      const next = search.get("next");
      const safe =
        next &&
        next.startsWith("/") &&
        !next.startsWith("//") &&
        !next.includes("\\") &&
        !/[\u0000-\u001f]/.test(next);
      router.push(
        safe
          ? next
          : j.role === "admin"
            ? "/quan-tri"
            : j.role === "organizer"
              ? "/to-chuc/quan-ly"
              : "/ca-nhan",
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể đăng nhập.");
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="auth-page container">
      <div className="auth-art">
        <span className="eyebrow">MỖI KẾT NỐI, MỘT ĐIỀU TỐT ĐẸP</span>
        <h1>
          Hành trình tử tế
          <br />
          bắt đầu từ bạn<span>.</span>
        </h1>
        <img src="/images/community.webp" alt="Cộng đồng cùng nhau đồng hành" />
        <p>
          Đóng góp thời gian. Kết nối cộng đồng.
          <br />
          Lưu giữ những điều ý nghĩa.
        </p>
      </div>
      <section className="auth-box">
        <span className="eyebrow">CHÀO MỪNG ĐẾN VỚI NOI</span>
        <h2>{signup ? "Tạo tài khoản của bạn" : "Đăng nhập"}</h2>
        <p className="muted">
          {signup
            ? "Bắt đầu hành trình đóng góp của bạn."
            : "Tiếp tục hành trình đồng hành cùng cộng đồng."}
        </p>
        {mode === "demo" && (
          <div className="notice">
            Bạn đang sử dụng bản thử nghiệm. Vui lòng dùng thông tin thử nghiệm
            khi tạo tài khoản.
          </div>
        )}
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            submit({
              action: signup ? "signup" : "login",
              ...Object.fromEntries(new FormData(e.currentTarget)),
            });
          }}
        >
          {signup && (
            <label className="field">
              Họ và tên
              <input
                required
                name="name"
                minLength={2}
                maxLength={100}
                autoComplete="name"
              />
            </label>
          )}
          <label className="field">
            Email
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              placeholder="ban@example.com"
            />
          </label>
          <label className="field">
            Mật khẩu
            <span className="password-field">
              <input
                name="password"
                type={show ? "text" : "password"}
                minLength={10}
                maxLength={128}
                required
                autoComplete={signup ? "new-password" : "current-password"}
                placeholder={signup ? "Ít nhất 10 ký tự" : "Nhập mật khẩu"}
              />
              <button
                type="button"
                className="icon-button"
                aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          <Feedback error={error} message={message} />
          <button className="button" disabled={pending}>
            {pending ? "Đang xử lý…" : signup ? "Tạo tài khoản" : "Đăng nhập"}
            <ArrowRight size={17} />
          </button>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setSignup(!signup);
              setError("");
              setMessage("");
            }}
          >
            {signup
              ? "Đã có tài khoản? Đăng nhập"
              : "Chưa có tài khoản? Đăng ký"}
          </button>
        </form>
        <p className="auth-policy">
          Bằng việc tiếp tục, bạn đồng ý với{" "}
          <a href="/chinh-sach">điều khoản và chính sách quyền riêng tư</a> của
          NOI.
        </p>
      </section>
    </main>
  );
}
