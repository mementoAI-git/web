import { expect, test } from "@playwright/test";

async function mockLoggedInPricingContext(page: Parameters<typeof test>[0]["page"]) {
  await page.route("**/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "Login successful",
        data: {
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          refresh_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          onboarded: true,
        },
      }),
    });
  });

  await page.route("**/users/profile", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          _id: "user-123",
          email: "test@example.com",
          first_name: "Test",
          last_name: "User",
          onboarded: true,
        },
      }),
    });
  });

  await page.route("**/billing/subscription", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          tier: "free",
          status: "active",
          features: [],
          usage: {
            storage_used_bytes: 0,
            beneficiary_count: 0,
            timed_message_count: 0,
          },
        },
      }),
    });
  });
}

test("pricing checkout redirects to backend checkout URL", async ({ page }) => {
  await mockLoggedInPricingContext(page);

  await page.route("**/billing/checkout", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          checkout_url: "http://127.0.0.1:5173/checkout-mock",
        },
      }),
    });
  });

  await page.goto("/login?redirect=%2Fpricing");
  await page.getByLabel("Email").fill("test@example.com");
  await page.locator('input[name="password"]').fill("password123");
  await page.getByRole("button", { name: /^login$/i }).click();

  await expect(
    page.getByRole("heading", { name: /plans that grow with your memories/i }),
  ).toBeVisible();

  await page.getByRole("button", { name: /start 14-day trial/i }).first().click();

  await expect(page).toHaveURL(/\/checkout-mock$/);
});

test("pricing checkout shows error toast when checkout URL is missing", async ({ page }) => {
  await mockLoggedInPricingContext(page);

  await page.route("**/billing/checkout", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {},
      }),
    });
  });

  await page.goto("/login?redirect=%2Fpricing");
  await page.getByLabel("Email").fill("test@example.com");
  await page.locator('input[name="password"]').fill("password123");
  await page.getByRole("button", { name: /^login$/i }).click();

  await page.getByRole("button", { name: /start 14-day trial/i }).first().click();

  await expect(page.getByText(/no checkout url returned/i)).toBeVisible();
  await expect(page).toHaveURL(/\/pricing$/);
});

test("pricing checkout shows fallback error when backend returns failure", async ({ page }) => {
  await mockLoggedInPricingContext(page);

  await page.route("**/billing/checkout", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        message: "Server unavailable",
      }),
    });
  });

  await page.goto("/login?redirect=%2Fpricing");
  await page.getByLabel("Email").fill("test@example.com");
  await page.locator('input[name="password"]').fill("password123");
  await page.getByRole("button", { name: /^login$/i }).click();

  await page.getByRole("button", { name: /start 14-day trial/i }).first().click();

  await expect(page.getByText(/server unavailable/i)).toBeVisible();
  await expect(page).toHaveURL(/\/pricing$/);
});
