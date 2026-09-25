"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  MapPin,
  RefreshCw,
  CheckCircle,
  Loader2,
  X,
} from "lucide-react";
import type { AppData } from "@/lib/data";
import { distanceMeters } from "@/lib/domain";
import { ActionForm, Badge, Empty, Feedback } from "./ui";
export function Attendance({ data }: { data: AppData }) {
  const apps = data.applications.filter(
    (a: any) => a.user_id === data.user?.id && a.status === "confirmed",
  );
  const [campaignId, setCampaignId] = useState(apps[0]?.campaign_id || "");
  const campaign = data.campaigns.find((c) => c.id === campaignId);
  const [position, setPosition] = useState<GeolocationPosition | null>(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false);
  const video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null);
  const router = useRouter();
  const records = data.attendance.filter(
    (r: any) => r.campaign_id === campaignId && r.user_id === data.user?.id,
  );
  const checkedIn = records.some((r: any) => r.kind === "in"),
    checkedOut = records.some((r: any) => r.kind === "out");
  function stop() {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setReady(false);
  }
  useEffect(
    () => () => {
      stream.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );
  async function prepare() {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia || !navigator.geolocation)
        throw Error(
          "Trình duyệt cần HTTPS hoặc localhost để dùng camera và vị trí.",
        );
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }),
      );
      setPosition(pos);
      stream.current?.getTracks().forEach((t) => t.stop());
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 960 } },
        audio: false,
      });
      stream.current = s;
      if (video.current) {
        video.current.srcObject = s;
        await video.current.play();
      }
      setReady(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Không truy cập được camera hoặc vị trí. Kiểm tra quyền trình duyệt hoặc gửi yêu cầu hỗ trợ.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function capture() {
    if (!video.current || !position || !campaign) return;
    setBusy(true);
    setError("");
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }),
      );
      setPosition(pos);
      const v = video.current;
      if (!v.videoWidth) throw Error("Camera chưa sẵn sàng.");
      const canvas = document.createElement("canvas");
      canvas.width = v.videoWidth;
      canvas.height = v.videoHeight;
      canvas.getContext("2d")!.drawImage(v, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.8),
      );
      if (!blob) throw Error("Không thể chụp ảnh.");
      const f = new FormData();
      f.set("photo", blob, "attendance.jpg");
      f.set("campaign_id", campaign.id);
      f.set("kind", checkedIn ? "out" : "in");
      f.set("latitude", String(pos.coords.latitude));
      f.set("longitude", String(pos.coords.longitude));
      f.set("accuracy", String(pos.coords.accuracy));
      const res = await fetch("/api/attendance", { method: "POST", body: f });
      const j = await res.json();
      if (!res.ok) throw Error(j.error);
      setMessage(
        "Đã " +
          (checkedIn ? "check-out" : "check-in") +
          " và lưu dữ liệu thành công.",
      );
      stop();
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Chưa gửi thành công. Vui lòng thử lại.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!apps.length)
    return (
      <Empty
        title="Chưa có chiến dịch cần điểm danh"
        body="Sau khi được lựa chọn và xác nhận tham gia, chiến dịch sẽ xuất hiện tại đây."
        href="/ca-nhan/dang-ky"
        label="Xem đăng ký của tôi"
      />
    );
  return (
    <div className="split-layout">
      <section className="panel">
        <label className="field">
          Chiến dịch
          <select
            value={campaignId}
            onChange={(e) => {
              stop();
              setPosition(null);
              setCampaignId(e.target.value);
              setError("");
              setMessage("");
            }}
          >
            {apps.map((a: any) => (
              <option key={a.id} value={a.campaign_id}>
                {a.campaign_title}
              </option>
            ))}
          </select>
        </label>
        <div className="camera-stage">
          <video
            ref={video}
            muted
            playsInline
            className={ready ? "" : "hidden"}
          />
          {!ready && (
            <div>
              <Camera size={42} />
              <p>Ảnh chụp trực tiếp tại hoạt động</p>
              <small>Ảnh chỉ được truy cập theo trách nhiệm phù hợp.</small>
            </div>
          )}
        </div>
        {campaign && (
          <div className="location-status">
            <MapPin size={20} />
            <div>
              <strong>
                {position
                  ? Math.round(
                      distanceMeters(
                        position.coords.latitude,
                        position.coords.longitude,
                        campaign.latitude,
                        campaign.longitude,
                      ),
                    ) + " m đến điểm danh"
                  : "Chưa lấy vị trí"}
              </strong>
              <small>
                Phạm vi {campaign.radius} m
                {position
                  ? " · Sai số " + Math.round(position.coords.accuracy) + " m"
                  : ""}
              </small>
            </div>
          </div>
        )}
        <Feedback error={error} message={message} />
        {checkedOut ? (
          <div className="feedback success">
            <CheckCircle size={20} /> Đã check-out. Chờ tổ chức xác nhận kết
            quả.
          </div>
        ) : (
          <div className="button-row">
            {!ready ? (
              <button className="button" disabled={busy} onClick={prepare}>
                {busy ? (
                  <Loader2 className="spin" size={18} />
                ) : (
                  <Camera size={18} />
                )}
                Mở camera và lấy vị trí
              </button>
            ) : (
              <>
                <button className="button" disabled={busy} onClick={capture}>
                  {busy ? (
                    <Loader2 className="spin" size={18} />
                  ) : (
                    <Camera size={18} />
                  )}
                  Chụp ảnh & {checkedIn ? "check-out" : "check-in"}
                </button>
                <button className="button secondary" onClick={stop}>
                  Đóng camera
                </button>
              </>
            )}
          </div>
        )}
        <p className="privacy-note">
          NOI chỉ lấy vị trí khi điểm danh, không theo dõi liên tục. Ảnh và GPS
          không thay thế xác nhận hoàn thành của tổ chức.
        </p>
      </section>
      <aside>
        <div className="panel">
          <h3>Trước khi điểm danh</h3>
          <ol className="checklist">
            <li>Đã xác nhận tham gia chiến dịch.</li>
            <li>Trong khung giờ mở điểm danh.</li>
            <li>Ở trong phạm vi 500 m, sai số vị trí tối đa 100 m.</li>
            <li>Cho phép camera và vị trí trong trình duyệt.</li>
          </ol>
          {records.map((r: any) => (
            <div className="list-row" key={r.id}>
              <Badge status="confirmed">
                {r.kind === "in" ? "Check-in" : "Check-out"}
              </Badge>
              <span>{new Date(r.created_at).toLocaleTimeString("vi-VN")}</span>
            </div>
          ))}
        </div>
        <div className="panel">
          <h3>Không điểm danh được?</h3>
          <p className="muted">
            Gửi yêu cầu để tổ chức đối chiếu. Lỗi camera hoặc vị trí không tự
            động khiến bạn bị xem là vắng mặt.
          </p>
          <ActionForm
            action="ticket"
            hidden={{ campaign_id: campaignId, title: "Hỗ trợ điểm danh" }}
            fields={[
              { name: "body", label: "Mô tả tình huống", type: "textarea" },
            ]}
            submit="Gửi yêu cầu hỗ trợ"
          />
        </div>
      </aside>
    </div>
  );
}
