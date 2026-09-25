import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { all, get, put, transaction, demoMode } from "./demo-db";
import type { User } from "./domain";
const derive = promisify(scrypt);

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} chưa được cấu hình.`);
  }

  return value;
}

const demoPassword: string = requireEnv("NOI_DEMO_PASSWORD");

let seeding: Promise<void> | undefined;
export async function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const digest = (await derive(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${digest.toString("hex")}`;
}
export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, salt, hex] = encoded.split(":");
  if (algorithm !== "scrypt" || !salt || !hex || hex.length !== 128)
    return false;
  const actual = (await derive(password, salt, 64)) as Buffer;
  return timingSafeEqual(actual, Buffer.from(hex, "hex"));
}
async function seedCredentials() {
  if (!demoMode()) throw Error("Đăng nhập cục bộ đã bị tắt.");
  if (!seeding)
    seeding = (async () => {
      for (const id of ["u-minh", "u-org", "u-admin"]) {
        if (get("users", id) && !get("credentials", id)) {
          const hash = await passwordHash(demoPassword);
          transaction(() => {
            if (!get("credentials", id))
              put("credentials", { id, password_hash: hash });
          });
        }
      }
    })().catch((error) => {
      seeding = undefined;
      throw error;
    });
  await seeding;
}
export async function localLogin(
  email: string,
  password: string,
): Promise<User> {
  await seedCredentials();
  const user = all<User>("users").find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
  );
  const credential = user ? get("credentials", user.id) : undefined;
  const encoded =
    credential?.password_hash || get("credentials", "u-minh")!.password_hash;
  const valid = await verifyPassword(password, encoded);
  if (!user || !credential || !valid)
    throw Error("Email hoặc mật khẩu chưa đúng.");
  return user;
}
export async function localSignup(
  name: string,
  email: string,
  password: string,
): Promise<User> {
  await seedCredentials();
  const normalized = email.trim().toLowerCase(),
    hash = await passwordHash(password);
  return transaction(() => {
    if (all<User>("users").some((u) => u.email.toLowerCase() === normalized))
      throw Error("Email này đã được sử dụng. Hãy đăng nhập.");
    const user: User = {
      id: randomUUID(),
      name: name.trim(),
      email: normalized,
      role: "volunteer",
      organization_id: null,
    };
    put("users", user);
    put("credentials", { id: user.id, password_hash: hash });
    return user;
  });
}
