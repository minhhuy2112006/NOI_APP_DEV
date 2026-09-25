import { test, expect, type Page } from "@playwright/test";
import { DatabaseSync } from "node:sqlite";
import { resolve } from "node:path";

const origin = "http://localhost:3100";

function requireEnv(name: string): string {
    const value = process.env[name];
  
    if (!value) {
      throw new Error(`${name} chưa được cấu hình.`);
    }
  
    return value;
  }

const demoPassword: string = requireEnv("NOI_DEMO_PASSWORD");

async function login(page: Page, email: string, password:string = demoPassword) {
  await page.goto("/dang-nhap");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).not.toHaveURL(/dang-nhap/);
}
test("one login form, signup, registration, organization selection and confirmation", async ({
  page,
  browser,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/dang-nhap");
  await expect(page.getByRole("button", { name: "Quản trị viên" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Đơn vị tổ chức" }),
  ).toHaveCount(0);
  const backdoor = await page.request.post("/api/auth", {
    headers: { Origin: origin },
    data: { action: "demo", id: "u-admin" },
  });
  expect(backdoor.ok()).toBe(false);
  await page.getByLabel("Email", { exact: true }).fill("huy@noi.example");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("incorrect-password");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.locator(".feedback[role=alert]")).toContainText(
    "chưa đúng",
  );
  await page
    .getByRole("button", { name: "Chưa có tài khoản? Đăng ký" })
    .click();
  const email = `e2e-${Date.now()}@example.com`;
  await page.getByLabel("Họ và tên").fill("Bạn kiểm thử");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("E2e-password-2026!");
  await page
    .getByRole("button", { name: "Tạo tài khoản", exact: true })
    .click();
  await expect(page).toHaveURL(/ca-nhan$/);
  await page.goto("/ca-nhan/ho-so");
  await page.getByLabel("Số điện thoại").fill("0900000000");
  await page.getByLabel("Lĩnh vực quan tâm").fill("Giáo dục");
  await page
    .getByRole("button", { name: "Lưu thông tin", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Đã lưu");
  await page.reload();
  await expect(page.getByLabel("Số điện thoại")).toHaveValue("0900000000");
  await page.goto("/chien-dich/trung-thu-cho-em");
  await page
    .getByLabel("Lời nhắn đến tổ chức")
    .fill("Tôi muốn tham gia hỗ trợ chiến dịch cùng cộng đồng.");
  await page.getByRole("button", { name: "Gửi đăng ký tham gia" }).click();
  await expect(
    page.getByRole("link", { name: "Xem đăng ký của tôi" }),
  ).toBeVisible();
  const ctx = await browser.newContext();
  const organizer = await ctx.newPage();
  await login(organizer, "tochuc@noi.example");
  await organizer.goto("/to-chuc/quan-ly/ung-vien");
  const app = organizer
    .locator("article")
    .filter({
      has: organizer.getByRole("heading", {
        name: "Bạn kiểm thử",
        exact: true,
      }),
    })
    .last();
  organizer.on("dialog", (d) => d.accept());
  await app.getByRole("button", { name: "Lựa chọn", exact: true }).click();
  await expect(app.getByText("Chờ xác nhận", { exact: true })).toBeVisible();
  await page.goto("/ca-nhan/dang-ky");
  page.on("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Xác nhận tham gia", exact: true })
    .click();
  await expect(page.getByText("Đã xác nhận", { exact: true })).toBeVisible();
  await page.goto("/quan-tri");
  await expect(page).toHaveURL(/ca-nhan$/);
  expect(errors).toEqual([]);
  await ctx.close();
});
test("public pages render without broken assets and mobile overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of [
    "/",
    "/chien-dich",
    "/gioi-thieu",
    "/minh-bach",
    "/to-chuc",
    "/tro-giup",
    "/noi-for-business",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1").first()).toBeVisible();
    expect(
      await page
        .locator("img")
        .evaluateAll((imgs) =>
          imgs.some(
            (i) =>
              (i as HTMLImageElement).complete &&
              !(i as HTMLImageElement).naturalWidth,
          ),
        ),
    ).toBe(false);
  }
  await page.goto("/");
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dang-nhap");
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/login-mobile.png",
    fullPage: true,
  });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("admin uses same credentials form and unauthorized actions are rejected", async ({
  page,
}) => {
  await login(page, "admin@noi.example");
  await expect(page).toHaveURL(/quan-tri$/);
  await page.goto("/quan-tri/chien-dich");
  await expect(
    page.getByRole("heading", { name: "Duyệt chiến dịch", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await expect(page).toHaveURL(origin + "/");
  const response = await page.request.post("/api/action", {
    headers: { Origin: origin },
    data: {
      action: "profile",
      payload: { name: "Không đăng nhập", phone: "", interests: "" },
    },
  });
  expect(response.status()).toBe(401);
});
