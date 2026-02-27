import { test, expect } from '@playwright/test';

test('verify dashboard overview UI changes', async ({ page }) => {
    // Navigate to the dashboard (assuming it's on a dev server)
    // We might need to handle login if not already logged in
    await page.goto('http://localhost:5173/dashboard/overview');

    // Wait for the overview section to load
    await page.waitForSelector('h2.font-garamond');

    // Take a screenshot of the whole page
    await page.screenshot({ path: '/Users/admin/.gemini/antigravity/brain/d09b54a2-32c8-4fba-9b79-dbbd04a2818d/dashboard_overview_verification.png', fullPage: true });

    // Check if the old text "Streak count" is NOT present
    const streakText = page.locator('text=Streak count');
    await expect(streakText).not.toBeVisible();

    // Check if the old text "XP leaderboard" is NOT present
    const leaderboardText = page.locator('text=XP leaderboard');
    await expect(leaderboardText).not.toBeVisible();
});
