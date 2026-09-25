import { currentUser } from "@/lib/auth";
import { demoMode, get } from "@/lib/demo-db";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { supabase } from "@/lib/supabase";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  if (!demoMode()) {
    const client = await supabase();
    const { data } = await client
      .from("attendance")
      .select("photo_path")
      .eq("id", id)
      .single();
    if (!data) return new Response("Not found", { status: 404 });
    const { data: url } = await client.storage
      .from("attendance-private")
      .createSignedUrl(data.photo_path, 60);
    return url
      ? Response.redirect(url.signedUrl)
      : new Response("Not found", { status: 404 });
  }
  const a = get("attendance", id);
  const c = a ? get("campaigns", a.campaign_id) : null;
  if (
    !a ||
    !(
      a.user_id === user.id ||
      (user.role === "organizer" && c?.organization_id === user.organization_id)
    )
  )
    return new Response("Forbidden", { status: 403 });
  try {
    const bytes = await readFile(
      join(process.cwd(), ".data/photos", a.photo_path),
    );
    return new Response(bytes, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
