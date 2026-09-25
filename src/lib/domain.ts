export type Role = "volunteer" | "organizer" | "admin";
export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  organization_id: string | null;
  phone?: string;
  interests?: string;
};
export type Campaign = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  location: string;
  address: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  status: string;
  organization_id: string;
  image: string;
  goal: number;
  latitude: number;
  longitude: number;
  radius: number;
  instructions: string;
  created_at: string;
  confirmed?: number;
  applied?: number;
  received?: number;
  spent?: number;
  organization?: string;
};
export type Application = {
  id: string;
  user_id: string;
  campaign_id: string;
  status: string;
  motivation: string;
  created_at: string;
};
export type RecordRow = Record<string, any>;
export const labels: Record<string, string> = {
  draft: "Bản nháp",
  pending: "Chờ xét duyệt",
  published: "Đang tuyển",
  active: "Đang diễn ra",
  closed: "Đã kết thúc",
  changes: "Cần bổ sung",
  rejected: "Chưa được duyệt",
  submitted: "Đã đăng ký",
  selected: "Chờ xác nhận",
  waitlisted: "Danh sách dự phòng",
  confirmed: "Đã xác nhận",
  cancelled: "Đã hủy",
  completed: "Đã ghi nhận",
  verified: "Đã xác minh",
  open: "Đang xử lý",
  resolved: "Đã giải quyết",
  fulfilled: "Đã nhận quà",
  success: "Đã tiếp nhận",
  volunteer: "Cá nhân",
  organizer: "Tổ chức",
  admin: "Quản trị viên",
};
export const categories = [
  "Tất cả",
  "Giáo dục",
  "Cộng đồng",
  "Môi trường",
  "Sức khỏe",
];
export function money(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + " ₫";
}
export function date(s: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(s));
}
export function distanceMeters(a: number, b: number, c: number, d: number) {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((c - a) * rad) / 2) ** 2 +
    Math.cos(a * rad) * Math.cos(c * rad) * Math.sin(((d - b) * rad) / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}
export function validateAttendance(
  c: Campaign,
  kind: string,
  latitude: number,
  longitude: number,
  accuracy: number,
  now: number,
  hasIn: boolean,
  hasOut: boolean,
) {
  if (!["published", "active"].includes(c.status))
    throw Error("Chiến dịch chưa mở điểm danh.");
  if (
    now < Date.parse(c.starts_at) - 60 * 60 * 1000 ||
    now > Date.parse(c.ends_at) + 2 * 60 * 60 * 1000
  )
    throw Error(
      "Ngoài khung giờ điểm danh. Check-in mở trước 60 phút; điểm danh đóng sau hoạt động 2 giờ.",
    );
  if (accuracy > 100)
    throw Error(
      "Vị trí chưa đủ chính xác (sai số trên 100 m). Hãy thử lại hoặc gửi yêu cầu hỗ trợ.",
    );
  if (distanceMeters(latitude, longitude, c.latitude, c.longitude) > c.radius)
    throw Error("Bạn đang ở ngoài phạm vi điểm danh " + c.radius + " m.");
  if (kind === "out" && !hasIn)
    throw Error("Cần có check-in trước khi check-out.");
  if ((kind === "in" && hasIn) || (kind === "out" && hasOut))
    throw Error("Lượt điểm danh này đã được ghi nhận.");
}

export function localDateTime(s: string) {
  const d = new Date(s);
  return new Date(d.getTime() + 7 * 3600000)
    .toISOString()
    .slice(0, 16);
}
