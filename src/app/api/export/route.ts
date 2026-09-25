import { getData } from "@/lib/data";
export async function GET() {
  const data = await getData();
  if (!data.user) return new Response("Unauthorized", { status: 401 });
  const safe = (v: unknown) =>
    '"' +
    String(v ?? "")
      .replace(/^[=+@-]/, "'")
      .replaceAll('"', '""') +
    '"';
  const rows = [
    ["Chiến dịch", "Người tham gia", "Trạng thái", "Ngày đăng ký"],
    ...data.applications.map((a: any) => [
      a.campaign_title,
      a.user_name,
      a.status,
      a.created_at,
    ]),
  ];
  return new Response(
    "\uFEFF" + rows.map((row) => row.map(safe).join(",")).join("\r\n"),
    {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="NOI-dang-ky.csv"',
        "Cache-Control": "no-store",
      },
    },
  );
}
