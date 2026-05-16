import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Employee journey", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "employee@demo.com");
  });

  test("views goal sheets list", async ({ page }) => {
    await page.goto("/employee/goals");
    await expect(page.getByRole("heading", { name: "My Goals" })).toBeVisible();
    await expect(page.getByRole("link", { name: "New goal sheet" })).toBeVisible();
    await expect(page.getByRole("link", { name: "View" }).first()).toBeVisible();
  });

  test("opens approved goal sheet with locked status", async ({ page }) => {
    await page.goto("/employee/goals");
    const approvedRow = page.getByRole("row").filter({ hasText: "Approved" });
    await approvedRow.getByRole("link", { name: "View" }).click();
    await expect(page).toHaveURL(/\/employee\/goals\/[^/]+$/);
    await expect(page.getByTestId("status-badge")).toContainText("Approved", {
      timeout: 15_000,
    });
    await expect(page.getByText("Locked")).toBeVisible();
    await expect(page.getByRole("link", { name: /quarterly check-in/i })).toBeVisible();
  });

  test("new goal form shows weightage tracker", async ({ page }) => {
    await page.goto("/employee/goals/new");
    await expect(page.getByText("Weightage distribution")).toBeVisible();
    await expect(page.getByTestId("weightage-total")).toBeVisible();
    await expect(page.getByRole("button", { name: /add another goal/i })).toBeVisible();
  });
});

test.describe("Employee full journey (SOLUTION §16.3)", () => {
  test("can add multiple goals on create form", async ({ page }) => {
    await login(page, "employee@demo.com");
    await page.goto("/employee/goals/new");
    await expect(page.getByText("Goal #1")).toBeVisible();
    await expect(page.getByTestId("weightage-total")).toBeVisible();
    await page.getByRole("button", { name: /add another goal/i }).click();
    await expect(page.getByText("Goal #2")).toBeVisible();
    await page.getByRole("button", { name: /add another goal/i }).click();
    await expect(page.getByText("Goal #3")).toBeVisible();
  });

  test("can submit draft goal sheet for approval", async ({ page }) => {
    await login(page, "employee3@demo.com");
    await page.goto("/employee/goals/sheet-employee3-draft");
    await expect(page.getByTestId("status-badge")).toContainText("Draft");
    await page.getByRole("button", { name: /submit for approval/i }).click();
    await expect(page.getByTestId("status-badge")).toContainText("Submitted", {
      timeout: 10_000,
    });
  });

  test("can log Q1 achievement on approved sheet", async ({ page }) => {
    await login(page, "employee@demo.com");
    await page.goto("/employee/goals");
    const approvedRow = page.getByRole("row").filter({ hasText: "Approved" });
    await approvedRow.getByRole("link", { name: "View" }).click();
    await expect(page).toHaveURL(/\/employee\/goals\/[^/]+$/);
    const sheetUrl = page.url();
    await page.goto(`${sheetUrl}/checkin`);
    await expect(page.getByRole("heading", { name: "Quarterly check-in" })).toBeVisible();

    const firstGoal = page.locator('[data-slot="card"]').filter({
      hasText: "Increase Regional Sales Revenue",
    });
    await firstGoal.getByRole("radio", { name: "On track" }).check();
    await firstGoal.getByRole("spinbutton").fill("25");
    await page.getByRole("button", { name: /save q1 achievements/i }).click();
    await expect(page.getByText(/Q1 achievements saved/i)).toBeVisible({ timeout: 10_000 });
  });
});
