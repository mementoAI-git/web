import { expect, test, type Locator, type Page } from "@playwright/test";

// Wheel/touch-style scrolling matters here: scrollIntoView can move even an
// overflow:hidden ancestor and would conceal the regression users reported.
async function scrollToAction(page: Page, action: Locator) {
  await action.waitFor({ state: "visible" });
  await page.mouse.move(150, 200);
  await page.mouse.wheel(0, 5000);
  await expect(action).toBeInViewport({ ratio: 1 });
  await expect(page.locator("h1")).toBeAttached();
  expect(
    await page.evaluate(() => {
      const shell = document.querySelector("main")?.parentElement;
      return (
        document.documentElement.scrollWidth <= innerWidth &&
        (!shell || shell.scrollWidth <= shell.clientWidth)
      );
    }),
  ).toBe(true);
}

async function mockOnboarding(page: Page) {
  // Keep this flow independent of live account/billing services. Specific
  // onboarding handlers below take precedence over this background fallback.
  await page.route("**/*", (route) => {
    if (["fetch", "xhr"].includes(route.request().resourceType())) {
      return route.fulfill({ json: { success: true, data: {} } });
    }
    return route.continue();
  });
  await page.addInitScript(() => {
    localStorage.setItem(
      "memento:auth",
      JSON.stringify({
        access_token: "mobile-test-token",
        refresh_token: "mobile-test-refresh",
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        refresh_expires_at: new Date(Date.now() + 86400000).toISOString(),
      }),
    );
  });
  let status: "never" | "skipped" | "completed" = "never";
  const profile = () => ({
    _id: "mobile-user",
    first_name: "Jane",
    last_name: "Doe",
    email: "mobile@example.com",
    nickname: "Jane",
    verified: true,
    onboarded: status === "completed",
    onboarding_status: status,
  });
  await page.route("**/users/profile", (route) =>
    route.fulfill({ json: { success: true, data: profile() } }),
  );
  await page.route("**/users/complete-onboarding", (route) => {
    status = "completed";
    return route.fulfill({ json: { success: true, data: profile() } });
  });
  await page.route("**/users/onboarding/skip", (route) => {
    status = "skipped";
    return route.fulfill({
      json: { success: true, data: { onboarding_status: "skipped" } },
    });
  });
}

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 667 },
  { width: 667, height: 375 },
]) {
  test.describe(`${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });
    for (const [path, actionName] of [
      ["/login", "Sign in"],
      ["/register", "Create account"],
      ["/forget-password", "Send code"],
      ["/verify-email?email=mobile%40example.com", "Verify code"],
      ["/check-mail?email=mobile%40example.com", "Verify code"],
      ["/set-password?token=mobile-test", "Reset password"],
      ["/two-factor?token=mobile-test", "Verify"],
    ]) {
      test(`${path} keeps the submit action reachable`, async ({ page }) => {
        await page.goto(path);
        await scrollToAction(
          page,
          page.getByRole("button", { name: actionName, exact: true }),
        );
      });
    }

    test("welcome and every onboarding step can be completed", async ({
      page,
    }) => {
      await mockOnboarding(page);
      await page.goto("/onboarding");
      const welcomeContinue = page.getByRole("link", {
        name: "Continue",
        exact: true,
      });
      await scrollToAction(page, welcomeContinue);
      await welcomeContinue.click();
      await expect(page).toHaveURL(/onboarding\/nickname/);
      await expect(page.locator("h1")).toBeInViewport({ ratio: 1 });
      await page
        .getByRole("textbox", { name: "Name", exact: true })
        .fill("Jane");
      const next = page.getByRole("button", { name: "Continue", exact: true });
      await scrollToAction(page, next);
      await next.click();
      await expect(page.locator("h1")).toBeInViewport({ ratio: 1 });
      await page
        .getByRole("button", { name: "Just exploring", exact: true })
        .click();
      await scrollToAction(page, next);
      await next.click();
      await page
        .getByRole("textbox", { name: "Enter About info", exact: true })
        .fill("I love my family and exploring new places.");
      await scrollToAction(page, next);
      await next.click();
      await page
        .getByRole("button", { name: "Identity and self", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Everyday life", exact: true })
        .click();
      await scrollToAction(page, next);
      await next.click();
      await expect(page).toHaveURL(/onboarding\/summary/);
      await scrollToAction(page, next);
      await next.click();
      await expect(page).toHaveURL(/\/overview/);
    });

    test("beneficiary Continue leaves onboarding without redirecting back", async ({
      page,
    }) => {
      await mockOnboarding(page);
      await page.route(/\/beneficiaries(?:\?.*)?$/, (route) =>
        route.fulfill({ json: { success: true, data: { docs: [] } } }),
      );
      await page.goto("/onboarding/beneficiary");
      const next = page.getByRole("button", { name: "Continue", exact: true });
      await next.waitFor({ state: "visible" });
      await page.mouse.move(150, 200);
      await page.mouse.wheel(0, 5000);
      await expect(next).toBeInViewport({ ratio: 1 });
      await next.click();
      await expect(page).toHaveURL(/\/overview/);
      await page.reload();
      await expect(page).toHaveURL(/\/overview/);
    });

    test("welcome can be skipped", async ({ page }) => {
      await mockOnboarding(page);
      await page.goto("/onboarding");
      const skip = page.getByRole("button", { name: "Skip", exact: true });
      await scrollToAction(page, skip);
      await skip.click();
      await expect(page).toHaveURL(/\/overview/);
    });
  });
}
