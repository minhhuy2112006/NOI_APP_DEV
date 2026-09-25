import { test } from "node:test";
import assert from "node:assert/strict";
import { all, get, put, mutate, snapshot } from "../src/lib/demo-db";
import { parseAction } from "../src/lib/validation";
import {
  validateAttendance,
  type Campaign,
  type User,
} from "../src/lib/domain";
process.env.NOI_MODE = "demo";
process.env.NOI_TEST_DB = ":memory:";
const volunteer = get<User>("users", "u-minh")!;
const org = get<User>("users", "u-org")!;
const admin = get<User>("users", "u-admin")!;
const act = (u: User, a: string, p: unknown) =>
  mutate(u, a, parseAction(a, p) as Record<string, any>);
test("campaign applications: ownership, duplicate, selection, capacity and confirmation", () => {
  const a = act(volunteer, "apply", {
    campaign_id: "c1",
    motivation: "Tôi muốn đồng hành cùng chiến dịch.",
  });
  assert.throws(() =>
    act(volunteer, "apply", {
      campaign_id: "c1",
      motivation: "Đăng ký trùng chiến dịch",
    }),
  );
  assert.throws(() =>
    act(volunteer, "application", { id: a.id, status: "selected" }),
  );
  assert.throws(() =>
    act(volunteer, "application", { id: a.id, status: "confirmed" }),
  );
  act(org, "application", { id: a.id, status: "selected" });
  assert.throws(() =>
    act(admin, "application", { id: a.id, status: "confirmed" }),
  );
  act(volunteer, "application", { id: a.id, status: "confirmed" });
  put("campaigns", { ...get("campaigns", "c1"), capacity: 1 });
  const other = { ...volunteer, id: "other", email: "other@example.com" };
  put("users", other);
  const b = act(other, "apply", {
    campaign_id: "c1",
    motivation: "Một đăng ký khác khi đã đủ người.",
  });
  act(org, "application", { id: b.id, status: "selected" });
  assert.throws(
    () => act(other, "application", { id: b.id, status: "confirmed" }),
    /đủ người/,
  );
  assert.equal(snapshot(other).applications.length, 1);
  assert.equal(snapshot(null).applications.length, 0);
});
test("attendance validates geography, time window, accuracy, order and duplicates", () => {
  const c = {
    ...get<Campaign>("campaigns", "c1")!,
    starts_at: new Date(Date.now() - 3600000).toISOString(),
    ends_at: new Date(Date.now() + 3600000).toISOString(),
  };
  assert.doesNotThrow(() =>
    validateAttendance(
      c,
      "in",
      c.latitude,
      c.longitude,
      10,
      Date.now(),
      false,
      false,
    ),
  );
  assert.throws(
    () => validateAttendance(c, "in", 0, 0, 10, Date.now(), false, false),
    /phạm vi/,
  );
  assert.throws(
    () =>
      validateAttendance(
        c,
        "in",
        c.latitude,
        c.longitude,
        150,
        Date.now(),
        false,
        false,
      ),
    /chính xác/,
  );
  assert.throws(
    () =>
      validateAttendance(
        c,
        "out",
        c.latitude,
        c.longitude,
        10,
        Date.now(),
        false,
        false,
      ),
    /check-in/,
  );
  assert.throws(
    () =>
      validateAttendance(
        c,
        "in",
        c.latitude,
        c.longitude,
        10,
        Date.now(),
        true,
        false,
      ),
    /đã được/,
  );
  assert.throws(
    () =>
      validateAttendance(
        c,
        "in",
        c.latitude,
        c.longitude,
        10,
        Date.now() + 86400000,
        false,
        false,
      ),
    /khung giờ/,
  );
});
test("completion requires organizer and real start; points cannot be duplicated", () => {
  const a = all("applications").find(
    (a) => a.user_id === volunteer.id && a.campaign_id === "c1",
  )!;
  assert.throws(
    () =>
      act(org, "complete", {
        id: a.id,
        hours: 4,
        reason: "Đã đối chiếu trực tiếp",
      }),
    /trước khi/,
  );
  put("campaigns", {
    ...get("campaigns", "c1"),
    starts_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    ends_at: new Date(Date.now() + 3600000).toISOString(),
  });
  assert.throws(
    () =>
      act(volunteer, "complete", {
        id: a.id,
        hours: 4,
        reason: "Đã đối chiếu trực tiếp",
      }),
    /quyền/,
  );
  act(org, "complete", {
    id: a.id,
    hours: 4,
    reason: "Đối chiếu trực tiếp do điện thoại không định vị được.",
  });
  assert.equal(
    snapshot(volunteer).points.reduce((s, p) => s + p.amount, 0),
    40,
  );
  assert.throws(() =>
    act(org, "complete", {
      id: a.id,
      hours: 4,
      reason: "Gửi lại cùng yêu cầu",
    }),
  );
  assert.equal(snapshot(volunteer).points.length, 1);
});
test("donation confirmation idempotent; overspending blocked; rejection frees reserved funds", () => {
  const d = act(volunteer, "donate", {
    campaign_id: "c2",
    purpose: "campaign",
    amount: 100000,
  });
  assert.equal(
    snapshot(null).campaigns.find((c) => c.id === "c2")!.received,
    0,
  );
  assert.throws(() =>
    act(volunteer, "donation-confirm", {
      id: d.id,
      reason: "Tự xác nhận giao dịch",
    }),
  );
  act(admin, "donation-confirm", { id: d.id, reason: "Đối chiếu thử nghiệm" });
  act(admin, "donation-confirm", {
    id: d.id,
    reason: "Gửi lại đối chiếu thử nghiệm",
  });
  assert.equal(
    snapshot(null).campaigns.find((c) => c.id === "c2")!.received,
    100000,
  );
  const e = act(org, "expense", {
    campaign_id: "c2",
    amount: 90000,
    title: "Mua dụng cụ",
    evidence: "https://example.com/proof",
  });
  assert.throws(() =>
    act(org, "expense", {
      campaign_id: "c2",
      amount: 20000,
      title: "Vượt tiền còn lại",
      evidence: "https://example.com/proof",
    }),
  );
  act(admin, "publish", {
    id: e.id,
    table: "expenses",
    status: "rejected",
    reason: "Cần sửa chứng từ",
  });
  assert.doesNotThrow(() =>
    act(org, "expense", {
      campaign_id: "c2",
      amount: 100000,
      title: "Khoản chi đúng",
      evidence: "https://example.com/proof",
    }),
  );
  assert.throws(
    () => act(volunteer, "donate", { purpose: "emergency", amount: 100000 }),
    /chưa được/,
  );
});
test("reward redemption reserves balance and stock atomically; cancellation refunds once", () => {
  put("gifts", { id: "test-gift", name: "Quà kiểm thử", cost: 30, stock: 1 });
  const r = act(volunteer, "redeem", { id: "test-gift" });
  assert.equal(get("gifts", "test-gift")!.stock, 0);
  assert.equal(
    snapshot(volunteer).points.reduce((s, p) => s + p.amount, 0),
    10,
  );
  assert.throws(() => act(volunteer, "redeem", { id: "test-gift" }));
  assert.throws(() =>
    act(volunteer, "redemption", { id: r.id, status: "fulfilled" }),
  );
  act(volunteer, "redemption", { id: r.id, status: "cancelled" });
  assert.equal(get("gifts", "test-gift")!.stock, 1);
  assert.equal(
    snapshot(volunteer).points.reduce((s, p) => s + p.amount, 0),
    40,
  );
  assert.throws(() =>
    act(volunteer, "redemption", { id: r.id, status: "cancelled" }),
  );
});
test("input validation blocks negative money, wrong campaign purpose, invalid chronology", () => {
  assert.throws(() =>
    parseAction("donate", { purpose: "operations", amount: -1000 }),
  );
  assert.throws(() =>
    parseAction("donate", {
      purpose: "operations",
      amount: 1000,
      campaign_id: "c1",
    }),
  );
  assert.throws(() =>
    parseAction("apply", { campaign_id: "c1", motivation: "x" }),
  );
  assert.throws(() => parseAction("admin-role", { id: volunteer.id }));
});
