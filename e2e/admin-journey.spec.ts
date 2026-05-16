import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Admin journey", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin@demo.com");
  });

  test("admin dashboard shows stats", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText("Employees", { exact: true })).toBeVisible();
    await expect(page.getByText("Managers", { exact: true })).toBeVisible();
  });

  test("analytics page loads charts", async ({ page }) => {
    await page.goto("/admin/analytics");
    await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
    await expect(page.getByText("QoQ achievement trend")).toBeVisible();
  });

  test("audit log page loads", async ({ page }) => {
    await page.goto("/admin/audit-log");
    await expect(page.getByRole("heading", { name: /audit log/i })).toBeVisible();
  });
});
