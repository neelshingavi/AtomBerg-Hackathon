import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Manager journey", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "manager@demo.com");
  });

  test("sees pending approvals queue", async ({ page }) => {
    await page.goto("/manager/approvals");
    await expect(page.getByRole("heading", { name: "Approvals" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Review" }).first()).toBeVisible();
  });

  test("can open approval review page", async ({ page }) => {
    await page.goto("/manager/approvals");
    await page.getByRole("link", { name: "Review" }).first().click();
    await expect(page.getByRole("heading", { name: "Review goals" })).toBeVisible();
    await expect(page.getByRole("button", { name: /approve & lock/i })).toBeVisible();
  });

  test("team page lists direct reports", async ({ page }) => {
    await page.goto("/manager/team");
    await expect(page.getByRole("heading", { name: "My team" })).toBeVisible();
  });
});
