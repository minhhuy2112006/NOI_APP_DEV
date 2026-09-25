import { test } from "node:test";
import assert from "node:assert/strict";
import {
  localLogin,
  localSignup,
  verifyPassword,
  passwordHash,
} from "../src/lib/local-credentials";
import { get, snapshot } from "../src/lib/demo-db";

process.env.NOI_MODE = "demo";
process.env.NOI_TEST_DB = ":memory:";

const demoPassword = process.env.NOI_DEMO_PASSWORD;

if (!demoPassword) {
  throw new Error('NOI_DEMO_PASSWORD chưa được cấu hình.');
}

test("email/password login, normalized email, password hashing and signup isolation", async () => {

  const user = await localLogin(" HUY@noi.example ", demoPassword);

  assert.equal(user.id, "u-minh");
  await assert.rejects(
    () => localLogin("huy@noi.example", "wrong-password"),
    /chưa đúng/,
  );
  
  await assert.rejects(
    () => localLogin("unknown@noi.example", demoPassword),
    /chưa đúng/,
  );
  
  const member = await localSignup(
    "Người thử nghiệm",
    " NEW@example.com ",
    "New-password-2026!",
  );
  assert.equal(member.role, "volunteer");
  assert.equal(member.organization_id, null);
  assert.equal(member.email, "new@example.com");
  assert.equal(
    (await localLogin("new@example.com", "New-password-2026!")).id,
    member.id,
  );
  await assert.rejects(() =>
    localSignup("Trùng email", "new@example.com", "Different-password-2026!"),
  );
  assert.notEqual(
    get("credentials", member.id)!.password_hash,
    "New-password-2026!",
  );
  assert.equal(JSON.stringify(snapshot(member)).includes("scrypt:"), false);
  const a = await passwordHash("same-password"),
    b = await passwordHash("same-password");
  assert.notEqual(a, b);
  assert.equal(await verifyPassword("same-password", a), true);
  assert.equal(await verifyPassword("other-password", a), false);
});
