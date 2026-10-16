import { act, renderHook } from "@testing-library/react";
import { vi, it, expect } from "vitest";
import { toast } from "sonner";
import { useRequestRecovery } from "./use-request-recovery";
vi.mock("sonner", () => ({ toast: { error: vi.fn().mockReturnValue("toast-1"), dismiss: vi.fn() } }));
it("reports once per failure episode and handles retry rejection", async () => {
  const refresh = vi.fn().mockRejectedValue(new Error("offline"));
  const { result, rerender, unmount } = renderHook(({ error, scope }) => useRequestRecovery(scope, error, refresh, "Try again"), { initialProps: { error: true, scope: "one" } });
  expect(toast.error).toHaveBeenCalledTimes(1);
  rerender({ error: true, scope: "one" });
  expect(toast.error).toHaveBeenCalledTimes(1);
  await act(() => result.current());
  expect(refresh).toHaveBeenCalledTimes(1);
  rerender({ error: false, scope: "one" });
  expect(toast.dismiss).toHaveBeenCalledWith("toast-1");
  rerender({ error: true, scope: "two" });
  expect(toast.error).toHaveBeenCalledTimes(2);
  unmount();
});
