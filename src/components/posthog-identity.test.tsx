import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { PostHogIdentity } from "./posthog-identity";

const state = vi.hoisted(() => ({
  hydrated: true,
  auth: {} as object | null,
  user: {
    _id: "user-1",
    email: "test@example.com",
    nickname: "Tester",
    password: "private",
  } as object | null,
}));
const sdk = vi.hoisted(() => ({
  __loaded: true,
  identify: vi.fn(),
  reset: vi.fn(),
  get_property: vi.fn(),
}));
vi.mock("@/hooks/use-store", () => ({ useStore: () => state }));
vi.mock("@/lib/posthog", () => ({ default: sdk }));

beforeEach(() => {
  vi.clearAllMocks();
  sdk.__loaded = true;
  sdk.get_property.mockReturnValue(undefined);
  state.hydrated = true;
  state.auth = {};
  state.user = {
    _id: "user-1",
    email: "test@example.com",
    nickname: "Tester",
    password: "private",
  };
});

it("identifies once under StrictMode with only approved profile fields", () => {
  render(
    <StrictMode>
      <PostHogIdentity />
    </StrictMode>,
  );
  expect(sdk.identify).toHaveBeenCalledExactlyOnceWith("user-1", {
    email: "test@example.com",
    name: "Tester",
  });
});

it("resets a persisted identity on signed-out startup after hydration", () => {
  state.auth = null;
  state.user = null;
  state.hydrated = false;
  sdk.get_property.mockReturnValue("old-user");
  const view = render(<PostHogIdentity />);
  expect(sdk.reset).not.toHaveBeenCalled();
  state.hydrated = true;
  view.rerender(<PostHogIdentity />);
  expect(sdk.reset).toHaveBeenCalledOnce();
  expect(sdk.identify).not.toHaveBeenCalled();
});

it("waits for profile loading and resets before switching accounts", () => {
  state.user = null;
  sdk.get_property.mockReturnValue("previous-user");
  const view = render(<PostHogIdentity />);
  expect(sdk.reset).not.toHaveBeenCalled();
  state.user = { _id: "user-2", email: "next@example.com", nickname: "Next" };
  view.rerender(<PostHogIdentity />);
  expect(sdk.reset).toHaveBeenCalledOnce();
  expect(sdk.identify).toHaveBeenCalledWith("user-2", {
    email: "next@example.com",
    name: "Next",
  });
  expect(sdk.reset.mock.invocationCallOrder[0]).toBeLessThan(
    sdk.identify.mock.invocationCallOrder[0],
  );
});

it("clears identity on logout and does nothing when analytics is unconfigured", () => {
  const view = render(<PostHogIdentity />);
  sdk.get_property.mockReturnValue("user-1");
  state.auth = null;
  state.user = null;
  view.rerender(<PostHogIdentity />);
  expect(sdk.reset).toHaveBeenCalledOnce();
  sdk.__loaded = false;
  view.rerender(<PostHogIdentity />);
  expect(sdk.reset).toHaveBeenCalledOnce();
});
