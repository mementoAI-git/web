import { renderHook, waitFor, act } from "@testing-library/react";
import { StoreProvider, useStore, initialStates } from "@/hooks/use-store";
import { storageKeys } from "@/utility/constant";
import { mockAuth } from "@/test/fixtures";
import { clearAuth } from "@/test/auth-helpers";

function wrapper({ children }: { children: React.ReactNode }) {
  return <StoreProvider>{children}</StoreProvider>;
}

describe("StoreProvider / useStore", () => {
  beforeEach(() => clearAuth());

  it("initial state has auth=null, user=null, hydrated=false", () => {
    expect(initialStates.auth).toBeNull();
    expect(initialStates.user).toBeNull();
    expect(initialStates.hydrated).toBe(false);
  });

  it("after mount, reads localStorage memento:auth and sets auth + hydrated=true", async () => {
    localStorage.setItem(storageKeys.auth, JSON.stringify(mockAuth));
    const { result } = renderHook(() => useStore(), { wrapper });

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });
    expect(result.current.auth).toEqual(mockAuth);
  });

  it("setAuth stores to localStorage and updates state", async () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => result.current.setAuth?.(mockAuth));

    expect(localStorage.getItem(storageKeys.auth)).toBe(JSON.stringify(mockAuth));
    expect(result.current.auth).toEqual(mockAuth);
  });

  it("setUser updates user state", async () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    const user = { _id: "u1", email: "a@b.com", first_name: "A", last_name: "B" } as any;
    act(() => result.current.setUser?.(user));

    expect(result.current.user).toEqual(user);
  });

  it("setHeaderTitle updates headerTitle", async () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => result.current.setHeaderTitle?.("My Title"));

    expect(result.current.headerTitle).toBe("My Title");
  });
});
