import { NextResponse } from "next/server";
import { createLocalSession, logout, currentUser } from "@/lib/auth";
import { localLogin, localSignup } from "@/lib/local-credentials";
import { guardRequest } from "@/lib/http";
import { supabase } from "@/lib/supabase";
import { demoMode } from "@/lib/demo-db";
import { z } from "zod";
const credentials = z
  .object({
    action: z.enum(["login", "signup"]),
    email: z.string().trim().toLowerCase().pipe(z.email()),
    password: z.string().min(10, "Mật khẩu cần ít nhất 10 ký tự.").max(128),
    name: z.string().trim().min(2).max(100).optional(),
  })
  .refine((p) => p.action !== "signup" || !!p.name, {
    message: "Vui lòng nhập họ và tên.",
  });
export async function POST(request: Request) {
  try {
    guardRequest(request, "auth:" + request.headers.get("x-forwarded-for"), 20);
    const raw = await request.text();
    if (raw.length > 10000) throw Error("Dữ liệu quá lớn.");
    const body = JSON.parse(raw);
    if (body.action === "logout") {
      await logout();
      return NextResponse.json({ ok: true });
    }
    const input = credentials.parse(body);
    if (demoMode()) {
      const user =
        input.action === "signup"
          ? await localSignup(input.name!, input.email, input.password)
          : await localLogin(input.email, input.password);
      await createLocalSession(user.id);
      return NextResponse.json({ ok: true, role: user.role });
    }
    const client = await supabase();
    const response =
      input.action === "signup"
        ? await client.auth.signUp({
            email: input.email,
            password: input.password,
            options: {
              data: { name: input.name },
              emailRedirectTo: new URL(
                "/auth/callback",
                process.env.NEXT_PUBLIC_SITE_URL!,
              ).href,
            },
          })
        : await client.auth.signInWithPassword({
            email: input.email,
            password: input.password,
          });
    if (response.error)
      throw Error(
        "Không thể xác thực. Kiểm tra thông tin hoặc email xác nhận.",
      );
    if (input.action === "signup" && !response.data.session)
      return NextResponse.json({
        ok: true,
        message: "Kiểm tra email để xác nhận tài khoản, sau đó đăng nhập.",
      });
    return NextResponse.json({
      ok: true,
      role: (await currentUser())?.role || "volunteer",
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof z.ZodError
            ? e.issues.map((x) => x.message).join(" ")
            : e instanceof Error
              ? e.message
              : "Không thể đăng nhập.",
      },
      { status: 400 },
    );
  }
}
