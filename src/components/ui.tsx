"use client";
import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  MapPin,
  Users,
  CalendarDays,
  ArrowRight,
  Heart,
  Loader2,
  Check,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import { date, labels, money, type Campaign } from "@/lib/domain";
export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="NOI về trang chủ">
      <span className="logo-mark">
        <Heart size={25} strokeWidth={2.5} />
        <Sprout size={16} />
      </span>
      <span>
        noi<span className="logo-dot">.</span>
      </span>
    </Link>
  );
}
export function Badge({
  status,
  children,
}: {
  status?: string;
  children?: ReactNode;
}) {
  return (
    <span className={"badge " + (status || "")}>
      {children || labels[status || ""] || status}
    </span>
  );
}
export function Empty({
  title = "Chưa có dữ liệu",
  body = "Khi có hoạt động mới, thông tin sẽ xuất hiện tại đây.",
  href,
  label,
}: {
  title?: string;
  body?: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Sprout size={30} />
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
      {href && (
        <Link className="button secondary" href={href}>
          {label || "Khám phá chiến dịch"}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  function run(action: string, payload: unknown, onDone?: () => void) {
    setError("");
    setMessage("");
    start(async () => {
      try {
        const res = await fetch("/api/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, payload }),
        });
        const body = await res.json();
        if (!res.ok) throw Error(body.error);
        setMessage("Đã lưu thành công.");
        router.refresh();
        onDone?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Đã có lỗi.");
      }
    });
  }
  return { pending, message, error, run };
}
export function Feedback({
  message,
  error,
}: {
  message?: string;
  error?: string;
}) {
  return (
    <>
      {error && (
        <p className="feedback error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="feedback success" role="status">
          <Check size={16} />
          {message}
        </p>
      )}
    </>
  );
}
export type Field = {
  name: string;
  label: string;
  type?: string;
  options?: { value: string; label: string }[];
  value?: string | number;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
};
export function ActionForm({
  action,
  fields,
  hidden = {},
  submit = "Lưu thông tin",
  onDone,
}: {
  action: string;
  fields: Field[];
  hidden?: Record<string, unknown>;
  submit?: string;
  onDone?: () => void;
}) {
  const a = useAction();
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        const p: Record<string, unknown> = { ...data, ...hidden };
        for (const f of fields) {
          if (f.type === "number") p[f.name] = Number(p[f.name]);
          if (f.type === "datetime-local" && p[f.name])
            p[f.name] = new Date(String(p[f.name])+"+07:00").toISOString();
        }
        a.run(action, p, onDone);
      }}
    >
      {fields.map((f) => (
        <label className="field" key={f.name}>
          <span>
            {f.label}
            {f.required !== false && <small> *</small>}
          </span>
          {f.type === "textarea" ? (
            <textarea
              name={f.name}
              defaultValue={f.value}
              placeholder={f.placeholder}
              required={f.required !== false}
              rows={4}
            />
          ) : f.options ? (
            <select
              name={f.name}
              defaultValue={f.value}
              required={f.required !== false}
            >
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={f.type || "text"}
              name={f.name}
              defaultValue={f.value}
              min={f.min}
              max={f.max}
              step={f.type === "number" ? "any" : undefined}
              placeholder={f.placeholder}
              required={f.required !== false}
            />
          )}
        </label>
      ))}
      <Feedback {...a} />
      <button className="button" disabled={a.pending}>
        {a.pending ? (
          <Loader2 className="spin" size={18} />
        ) : (
          <Check size={17} />
        )}{" "}
        {a.pending ? "Đang xử lý…" : submit}
      </button>
    </form>
  );
}
export function ActionButton({
  action,
  payload,
  children,
  confirm,
  className = "secondary",
}: {
  action: string;
  payload: Record<string, unknown>;
  children: ReactNode;
  confirm?: string;
  className?: string;
}) {
  const a = useAction();
  return (
    <div className="inline-action">
      <button
        className={"button small " + className}
        disabled={a.pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          a.run(action, payload);
        }}
      >
        {a.pending ? <Loader2 size={15} className="spin" /> : children}
      </button>
      <Feedback {...a} />
    </div>
  );
}
export function CampaignCard({ c }: { c: Campaign }) {
  const percent = Math.min(
    100,
    Math.round(((c.confirmed || 0) / c.capacity) * 100),
  );
  return (
    <article className="campaign-card">
      <Link href={"/chien-dich/" + c.slug} className="card-image">
        <img src={c.image} alt={"Minh họa chiến dịch " + c.title} />
        <span className="image-label">{c.category}</span>
        <span className="image-arrow">
          <ArrowUpRight size={19} />
        </span>
      </Link>
      <div className="card-body">
        <div className="meta">
          <MapPin size={14} />
          {c.location}
        </div>
        <Link href={"/chien-dich/" + c.slug}>
          <h3>{c.title}</h3>
        </Link>
        <p>{c.summary}</p>
        <div className="org-line">
          <ShieldCheck size={15} />
          {c.organization}
        </div>
        <div className="progress">
          <span style={{ width: percent + "%" }} />
        </div>
        <div className="card-stats">
          <span>
            <Users size={15} />
            <strong>{c.confirmed || 0}</strong>/{c.capacity} đã xác nhận
          </span>
          <span>{date(c.starts_at).slice(0, 5)}</span>
        </div>
      </div>
    </article>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="stat-card">
      <div>
        {label}
        {icon}
      </div>
      <strong>{value}</strong>
    </div>
  );
}
export function MoneySummary({ c }: { c: Campaign }) {
  return (
    <div className="money-summary">
      <div>
        <span>Đã tiếp nhận</span>
        <strong>{money(c.received || 0)}</strong>
      </div>
      <div>
        <span>Đã sử dụng</span>
        <strong>{money(c.spent || 0)}</strong>
      </div>
      <div>
        <span>Còn lại</span>
        <strong>{money((c.received || 0) - (c.spent || 0))}</strong>
      </div>
    </div>
  );
}
export function CampaignOptions({ campaigns }: { campaigns: Campaign[] }) {
  return campaigns.map((c) => (
    <option key={c.id} value={c.id}>
      {c.title}
    </option>
  ));
}
