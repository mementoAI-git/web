import Axios from "axios";
import { authService } from "./auth-service";
import { mockAuth } from "@/test/fixtures";

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });
it.each(["logout", "new-session"])("does not restore an old session after %s during refresh", async action => {
  authService.setAuthData(mockAuth);
  let resolve!: (value: unknown) => void;
  vi.spyOn(Axios, "post").mockImplementation(() => new Promise(done => { resolve = done; }));
  const pending = authService.refreshAccessToken();
  const rejected = expect(pending).rejects.toThrow("Session changed during refresh");
  if (action === "logout") authService.clearAuth();
  else authService.setAuthData({ ...mockAuth, access_token: "different-session" });
  resolve({ data: { success: true, data: { session: { ...mockAuth, access_token: "stale-refreshed-session" } } } });
  await rejected;
  if (action === "logout") expect(authService.getAuthData()).toBeNull();
  else expect(authService.getAuthData()?.access_token).toBe("different-session");
});
