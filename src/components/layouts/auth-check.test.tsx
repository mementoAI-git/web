import { mockAuth, mockUser } from "@/test/fixtures";
import endpoint from "@/api/endpoint";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { SWRConfig } from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthCheck from "./auth-check";

const { fetcher, useStore } = vi.hoisted(() => ({ fetcher: vi.fn(), useStore: vi.fn() }));
vi.mock("@/api/fetcher", () => ({ fetcher }));
vi.mock("@/hooks/use-store", () => ({ useStore }));

describe("AuthCheck request gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.mockReturnValue({ auth: null, user: null, hydrated: false });
  });

  it.each([false, true])("does not fetch a profile without a session (hydrated: %s)", (hydrated) => {
    useStore.mockReturnValue({ auth: null, user: null, hydrated });
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <MemoryRouter><Routes><Route path="/" element={<AuthCheck><span>Protected content</span></AuthCheck>} /><Route path="/login" element={<span>Sign in</span>} /></Routes></MemoryRouter>
      </SWRConfig>,
    );
    expect(fetcher).not.toHaveBeenCalled();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });
});

it("hydrates the profile store when SWR already has the profile cached", async () => {
  const setUser = vi.fn();
  useStore.mockReturnValue({ auth: mockAuth, user: null, hydrated: true, setUser });
  const cache = new Map([[endpoint.profile, { data: { success: true, data: mockUser } }]]);
  render(
    <SWRConfig value={{ provider: () => cache, revalidateIfStale: false }}>
      <MemoryRouter><AuthCheck><span>Protected content</span></AuthCheck></MemoryRouter>
    </SWRConfig>,
  );
  await waitFor(() => expect(setUser).toHaveBeenCalledWith(mockUser));
  expect(fetcher).not.toHaveBeenCalled();
});
