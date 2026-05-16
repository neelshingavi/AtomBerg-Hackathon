import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

const baseURL = () => process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

/** Sign in via NextAuth API (reliable; avoids RHF/Base UI input quirks in the browser). */
export async function login(
  page: Page,
  email: string,
  password = "password123"
) {
  const csrfResponse = await page.request.get(`${baseURL()}/api/auth/csrf`);
  expect(csrfResponse.ok()).toBeTruthy();
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

  const signInResponse = await page.request.post(
    `${baseURL()}/api/auth/callback/credentials`,
    {
      form: {
        csrfToken,
        email,
        password,
        redirect: "false",
        json: "true",
      },
    }
  );

  const body = (await signInResponse.json().catch(() => ({}))) as {
    url?: string;
    error?: string;
  };

  if (body.error) {
    throw new Error(`Login failed: ${body.error}`);
  }

  await page.goto(body.url ?? "/");
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
}
