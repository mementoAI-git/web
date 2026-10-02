import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("disabled frontend features", () => {
  it("redirects the time capsule dashboard route to overview", () => {
    const routerSource = readFileSync(
      resolve(process.cwd(), "src/router.tsx"),
      "utf8",
    );

    expect(routerSource).toContain(
      '{ path: "capsule", element: <Navigate to="/overview" replace /> }',
    );
    expect(routerSource).not.toContain(
      'import TimeCapsulePage from "./pages/dashboard/time-capsule-new"',
    );
  });
});
