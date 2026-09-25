import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const { error } = await (
      await supabase()
    ).auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/ca-nhan", url.origin));
  }
  return NextResponse.redirect(new URL("/dang-nhap", url.origin));
}
