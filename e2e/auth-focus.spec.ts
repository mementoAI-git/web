import { expect, test } from "@playwright/test";

const routes = [
  { path: "/verify-email?email=test%40example.com", fields: 6 },
  { path: "/login", fields: 2 },
  { path: "/register", fields: 4 },
  { path: "/forget-password", fields: 1 },
  { path: "/check-mail?email=test%40example.com", fields: 6 },
  { path: "/set-password?token=visual-test", fields: 2 },
  { path: "/two-factor?token=visual-test", fields: 6 },
];

for (const width of [390, 1280]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test.describe(`${width}px ${colorScheme}`, () => {
      test.use({ viewport: { width, height: 800 }, colorScheme });

      for (const { path, fields } of routes) {
        test(`${path} leaves room for every input focus ring`, async ({
          page,
        }) => {
          await page.goto(path);
          const inputs = page.locator('main input[data-slot="input"]');
          await expect(inputs).toHaveCount(fields);
          for (const input of await inputs.all()) {
            await input.focus();
            await expect(input).toBeFocused();
            const clippedAncestors = await input.evaluate((element) => {
              const rect = element.getBoundingClientRect();
              // Input's focus-visible:ring-[3px] extends beyond its border box.
              const ring = 3;
              const clipped: string[] = [];
              for (
                let parent = element.parentElement;
                parent;
                parent = parent.parentElement
              ) {
                const style = getComputedStyle(parent);
                const bounds = parent.getBoundingClientRect();
                const left = bounds.left + parent.clientLeft;
                const top = bounds.top + parent.clientTop;
                const clipsX =
                  style.overflowX !== "visible" &&
                  (rect.left - ring < left ||
                    rect.right + ring > left + parent.clientWidth);
                const clipsY =
                  style.overflowY !== "visible" &&
                  (rect.top - ring < top ||
                    rect.bottom + ring > top + parent.clientHeight);
                if (clipsX || clipsY)
                  clipped.push(
                    `${parent.tagName}[${parent.dataset.slot ?? parent.className}]`,
                  );
              }
              return clipped;
            });
            expect(clippedAncestors).toEqual([]);
          }
        });
      }
    });
  }
}
