import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { all, demoMode, put, get, remove } from "./demo-db";
import { supabase } from "./supabase";
import type { User } from "./domain";
export const hashToken = (s: string) =>
  createHash("sha256").update(s).digest("hex");
export async function currentUser(): Promise<User | null> {
  if (demoMode()) {
    const token = (await cookies()).get("noi_session")?.value;
    if (!token) return null;
    const session = get("sessions", hashToken(token));
    if (
      !session ||
      session.version !== 2 ||
      Date.parse(session.expires_at) < Date.now()
    )
      return null;
    return get<User>("users", session.user_id) || null;
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const client = await supabase();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;
  const { data } = await client
    .from("profiles")
    .select("id,name,email,role,organization_id,phone,interests")
    .eq("id", user.id)
    .single();
  return data as User | null;
}
export async function createLocalSession(id: string) {
  if (!demoMode()) throw Error("Tài khoản thử nghiệm đã bị tắt.");
  const user = all<User>("users").find((u) => u.id === id);
  if (!user) throw Error("Tài khoản không hợp lệ.");
  const jar = await cookies();
  const previous = jar.get("noi_session")?.value;
  if (previous) remove("sessions", hashToken(previous));
  const token = randomBytes(32).toString("hex");
  put("sessions", {
    id: hashToken(token),
    user_id: id,
    version: 2,
    expires_at: new Date(Date.now() + 86400000).toISOString(),
  });
  (await cookies()).set("noi_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") || false,
    path: "/",
    maxAge: 86400,
  });
  return user;
}
export async function logout() {
  if (demoMode()) {
    const jar = await cookies();
    const token = jar.get("noi_session")?.value;
    if (token) remove("sessions", hashToken(token));
    jar.delete("noi_session");
  } else await (await supabase()).auth.signOut();
}
