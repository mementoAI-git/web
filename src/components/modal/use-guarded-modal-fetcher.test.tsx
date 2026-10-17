import { act, renderHook } from "@testing-library/react";
import { useGuardedModalFetcher } from "./use-guarded-modal-fetcher";
const mocks = vi.hoisted(() => ({
  trigger: vi.fn(),
  registerCloseGuard: vi.fn(),
}));
vi.mock("@/hooks/use-fetcher", () => ({
  default: () => ({ trigger: mocks.trigger }),
}));
vi.mock("@/hooks/use-modal", () => ({
  useModal: () => ({ registerCloseGuard: mocks.registerCloseGuard }),
}));
beforeEach(() => vi.clearAllMocks());
it("rejects overlapping writes and blocks shell dismissal only while pending", async () => {
  let resolve!: (value: unknown) => void;
  mocks.trigger.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const { result } = renderHook(() =>
    useGuardedModalFetcher("add-group", "/groups"),
  );
  const guard = mocks.registerCloseGuard.mock.calls[0][1];
  let pending!: Promise<unknown>;
  act(() => {
    pending = result.current.trigger({ name: "Family" });
  });
  expect(guard()).toBe(false);
  await act(() => result.current.trigger({ name: "Family" }));
  expect(mocks.trigger).toHaveBeenCalledTimes(1);
  await act(async () => {
    resolve({ success: true });
    await pending;
  });
  expect(guard()).toBe(true);
  expect(result.current.isMutating).toBe(false);
});
it("catches failed requests and unlocks retry", async () => {
  mocks.trigger.mockRejectedValue(new Error("offline"));
  const { result } = renderHook(() =>
    useGuardedModalFetcher("resend-invite", "/invite"),
  );
  await act(() => result.current.trigger({ email: "test@example.com" }));
  expect(result.current.isMutating).toBe(false);
  expect(mocks.registerCloseGuard.mock.calls[0][1]()).toBe(true);
});
