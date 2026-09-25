import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { demoMode, mutate } from "@/lib/demo-db";
import { parseAction } from "@/lib/validation";
import { guardRequest } from "@/lib/http";
import { supabase } from "@/lib/supabase";
import { ZodError } from "zod";
export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user)
      return NextResponse.json(
        { error: "Vui lòng đăng nhập." },
        { status: 401 },
      );
    guardRequest(request, user.id);
    if (Number(request.headers.get("content-length") || 0) > 100000)
      throw Error("Dữ liệu quá lớn.");
    const { action, payload } = await request.json();
    if (action === "attendance")
      throw Error("Điểm danh phải gửi kèm ảnh trực tiếp.");
    const p = parseAction(action, payload);
    if (demoMode())
      return NextResponse.json({
        ok: true,
        data: mutate(user, action, p as Record<string, unknown>),
      });
    const client = await supabase();
    const { data, error } = await client.rpc("noi_action", {
      action_name: action,
      payload: p,
    });
    if (error) throw Error(error.message);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const msg =
      e instanceof ZodError
        ? e.issues.map((x) => x.message).join(" ")
        : e instanceof Error
          ? e.message
          : "Không thể thực hiện.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
