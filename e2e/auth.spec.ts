import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Authentication", () => {
  test("employee redirects to employee dashboard", async ({ page }) => {
    await login(page, "employee@demo.com");
    await expect(page).toHaveURL(/\/employee/);
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
  });

  test("manager redirects to manager dashboard", async ({ page }) => {
    await login(page, "manager@demo.com");
    await expect(page).toHaveURL(/\/manager/);
  });

  test("admin redirects to admin dashboard", async ({ page }) => {
    await login(page, "admin@demo.com");
    await expect(page).toHaveURL(/\/admin/);
  });

  test("invalid credentials show error", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill("employee@demo.com");
    await page.locator("#password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByText(/Invalid email or password/i)).toBeVisible();
  });
});
