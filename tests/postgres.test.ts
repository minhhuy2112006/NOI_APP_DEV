import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("PostgreSQL migrations, RPC permissions and main lifecycle", async () => {
  const pg = new PGlite();
  try {
    await pg.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create function storage.foldername(text) returns text[] language sql as $$ select string_to_array($1,'/') $$;
 grant usage on schema auth,storage to anon,authenticated;
 grant select,insert,delete on storage.objects to authenticated;`);
    for (const file of ["001_core.sql", "002_private_storage.sql", "003_campaign_lifecycle.sql"])
      await pg.exec(await readFile("supabase/migrations/" + file, "utf8"));
    const v = "00000000-0000-4000-8000-000000000001",
      o = "00000000-0000-4000-8000-000000000002",
      admin = "00000000-0000-4000-8000-000000000003";
    await pg.query(
      'insert into auth.users(id,email,raw_user_meta_data) values($1,\'huy@example.com\',\'{"name":"Minh Huy","role":"admin"}\'),($2,\'org@example.com\',\'{"name":"Tổ chức"}\'),($3,\'admin@example.com\',\'{"name":"Quản trị"}\')',
      [v, o, admin],
    );
    const roles = await pg.query<{ role: string }>(
      "select role from profiles where id=$1",
      [v],
    );
    assert.equal(roles.rows[0].role, "volunteer");
    await pg.query("update profiles set role='admin' where id=$1", [admin]);
    const asUser = async (id: string) => {
      await pg.exec("reset role");
      await pg.query("select set_config('request.jwt.claim.sub',$1,false)", [
        id,
      ]);
      await pg.exec("set role authenticated");
    };
    const action = async (name: string, p: unknown) => {
      const r = await pg.query<{ data: any }>(
        "select noi_action($1,$2::jsonb) as data",
        [name, JSON.stringify(p)],
      );
      return r.rows[0].data;
    };
    const snap = async () => {
      const r = await pg.query<{ data: any }>("select noi_snapshot() as data");
      return r.rows[0].data;
    };
    await asUser(o);
    const org = await action("organization", {
      name: "Đội kiểm thử",
      description: "Một tổ chức để kiểm thử",
      contact: "org@example.com",
      evidence: "https://example.com/proof",
    });
    await assert.rejects(
      () => pg.query("update profiles set role='admin' where id=$1", [o]),
      /permission denied/,
    );
    await assert.rejects(() =>
      action("organization-review", {
        id: org.id,
        status: "verified",
        reason: "Tự duyệt tổ chức",
      }),
    );
    await asUser(admin);
    await action("organization-review", {
      id: org.id,
      status: "verified",
      reason: "Đã kiểm tra hồ sơ thử nghiệm",
    });
    await asUser(o);
    const campaign = await action("campaign", {
      title: "Chiến dịch kiểm thử PostgreSQL",
      summary: "Thử nghiệm quy trình tình nguyện trên PostgreSQL",
      description:
        "Nội dung minh họa đủ dài cho chiến dịch kiểm thử cơ sở dữ liệu.",
      category: "Cộng đồng",
      location: "TP.HCM",
      address: "Điểm kiểm thử",
      starts_at: new Date(Date.now() + 86400000).toISOString(),
      ends_at: new Date(Date.now() + 100800000).toISOString(),
      capacity: 1,
      goal: 0,
      latitude: 10.7,
      longitude: 106.6,
      instructions: "Hướng dẫn kiểm thử",
      status: "pending",
    });
    await asUser(admin);
    await action("campaign-review", {
      id: campaign.id,
      status: "published",
      reason: "Đã kiểm tra nội dung chiến dịch",
    });
    await asUser(v);
    const app = await action("apply", {
      campaign_id: campaign.id,
      motivation: "Tôi muốn tham gia hoạt động cộng đồng.",
    });
    await assert.rejects(() =>
      action("application", { id: app.id, status: "selected" }),
    );
    await assert.rejects(
      () =>
        action("apply", {
          campaign_id: campaign.id,
          motivation: "Đăng ký lần thứ hai không hợp lệ",
        }),
      /unique/,
    );
    await asUser(o);
    await action("application", { id: app.id, status: "selected" });
    await asUser(v);
    await action("application", { id: app.id, status: "confirmed" });
    assert.equal((await snap()).applications[0].status, "confirmed");
    await assert.rejects(
      () =>
        action("donate", {
          campaign_id: campaign.id,
          purpose: "campaign",
          amount: 100000,
        }),
      /chưa được kết nối/,
    );
    await pg.exec("reset role");
    await pg.query(
      "update campaigns set starts_at=now()-interval '1 hour',ends_at=now()+interval '3 hours' where id=$1",
      [campaign.id],
    );
    const photo = v + "/camera.jpg";
    await pg.query(
      "insert into storage.objects(bucket_id,name) values('attendance-private',$1)",
      [photo],
    );
    await asUser(v);
    await assert.rejects(
      () =>
        action("attendance", {
          campaign_id: campaign.id,
          kind: "in",
          latitude: 0,
          longitude: 0,
          accuracy: 10,
          photo_path: photo,
        }),
      /phạm vi/,
    );
    const checkin = await action("attendance", {
      campaign_id: campaign.id,
      kind: "in",
      latitude: 10.7,
      longitude: 106.6,
      accuracy: 10,
      photo_path: photo,
    });
    await assert.rejects(
      () =>
        action("attendance", {
          campaign_id: campaign.id,
          kind: "in",
          latitude: 10.7,
          longitude: 106.6,
          accuracy: 10,
          photo_path: photo,
        }),
      /unique/,
    );
    await asUser(admin);
    assert.equal(
      (await pg.query("select * from attendance where id=$1", [checkin.id]))
        .rows.length,
      0,
    );
    await asUser(o);
    assert.equal(
      (await pg.query("select * from attendance where id=$1", [checkin.id]))
        .rows.length,
      1,
    );
    await action("complete", {
      id: app.id,
      hours: 4,
      reason: "Đã đối chiếu sự tham gia trực tiếp",
    });
    await assert.rejects(() =>
      action("complete", {
        id: app.id,
        hours: 4,
        reason: "Không được cộng điểm lần hai",
      }),
    );
    await pg.exec("reset role");
    const gift = (
      await pg.query<{ id: string }>(
        "insert into gifts(name,cost,stock) values('Quà thử',30,1) returning id",
      )
    ).rows[0];
    await asUser(v);
    assert.equal((await snap()).points[0].amount, 40);
    const reward = await action("redeem", { id: gift.id });
    await assert.rejects(() => action("redeem", { id: gift.id }));
    await action("redemption", { id: reward.id, status: "cancelled" });
    await assert.rejects(() =>
      action("redemption", { id: reward.id, status: "cancelled" }),
    );
    assert.equal(
      (await snap()).points.reduce((s: number, p: any) => s + p.amount, 0),
      40,
    );
    await pg.exec("reset role");
    await pg.query("select set_config('request.jwt.claim.sub','',false)");
    await pg.exec("set role anon");
    const pub = await snap();
    assert.equal(pub.applications.length, 0);
    assert.equal(pub.attendance.length, 0);
    assert.equal(pub.points.length, 0);
    assert.equal(pub.organizations[0].evidence, undefined);
    await assert.rejects(
      () => action("profile", { name: "Xấu", phone: "", interests: "" }),
      /permission denied/,
    );
  } finally {
    await pg.close();
  }
});
