import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { guardRequest } from "@/lib/http";
import { demoMode, mutate } from "@/lib/demo-db";
import { parseAction } from "@/lib/validation";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { supabase } from "@/lib/supabase";
export async function POST(request: Request) {
  let localPath: string | undefined;
  try {
    const user = await currentUser();
    if (!user)
      return NextResponse.json(
        { error: "Vui lòng đăng nhập." },
        { status: 401 },
      );
    guardRequest(request, user.id, 20);
    if (Number(request.headers.get("content-length") || 0) > 5_000_000)
      throw Error("Ảnh quá lớn.");
    const form = await request.formData();
    const file = form.get("photo");
    if (
      !(file instanceof File) ||
      file.size > 4_000_000 ||
      file.size < 100 ||
      file.type !== "image/jpeg"
    )
      throw Error("Ảnh điểm danh phải là JPEG dưới 4 MB.");
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255)
      throw Error("Định dạng ảnh không hợp lệ.");
    const filename = user.id + "/" + randomUUID() + ".jpg";
    const p = parseAction("attendance", {
      campaign_id: form.get("campaign_id"),
      kind: form.get("kind"),
      latitude: Number(form.get("latitude")),
      longitude: Number(form.get("longitude")),
      accuracy: Number(form.get("accuracy")),
      photo_path: filename,
    }) as Record<string, any>;
    if (demoMode()) {
      localPath = join(process.cwd(), ".data", "photos", filename);
      await mkdir(join(process.cwd(), ".data", "photos", user.id), {
        recursive: true,
      });
      await writeFile(localPath, bytes);
      const data = mutate(user, "attendance", p);
      return NextResponse.json({
        ok: true,
        data: { id: data.id, created_at: data.created_at },
      });
    }
    const client = await supabase();
    const uploaded = await client.storage
      .from("attendance-private")
      .upload(filename, bytes, { contentType: "image/jpeg", upsert: false });
    if (uploaded.error) throw Error("Không thể lưu ảnh.");
    const { data, error } = await client.rpc("noi_action", {
      action_name: "attendance",
      payload: p,
    });
    if (error) {
      await client.storage.from("attendance-private").remove([filename]);
      throw Error(error.message);
    }
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    if (localPath) await unlink(localPath).catch(() => {});
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Không thể điểm danh." },
      { status: 400 },
    );
  }
}
