import { render, screen } from "@testing-library/react";
import { SWRConfig } from "swr";
import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { FeatureFlagsProvider, useFeatureFlags } from "./feature-flags";
vi.mock("@/hooks/use-store", () => ({
  useStore: () => ({ auth: { access_token: "customer-test-token" } }),
}));
function Consumer() {
  const { canUse, isReady } = useFeatureFlags();
  return (
    <p>
      {isReady ? (canUse("memory.create") ? "enabled" : "disabled") : "loading"}
    </p>
  );
}
describe("customer feature evaluation", () => {
  it("uses only customer evaluation and honors a disabled flag", async () => {
    let managementCalls = 0;
    server.use(
      http.get("*/feature-flags", () => {
        managementCalls++;
        return new HttpResponse(null, { status: 403 });
      }),
      http.get("*/feature-flags/evaluated", () =>
        HttpResponse.json({
          status: "success",
          message: "Evaluated",
          data: { "memory.create": { enabled: false, source: "user" } },
        }),
      ),
    );
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <FeatureFlagsProvider>
          <Consumer />
        </FeatureFlagsProvider>
      </SWRConfig>,
    );
    expect(await screen.findByText("disabled")).toBeInTheDocument();
    expect(managementCalls).toBe(0);
  });
});
