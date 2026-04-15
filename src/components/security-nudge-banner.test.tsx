import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import { SecurityNudgeBanner } from "./security-nudge-banner";

const STORAGE_KEY = "memento:security:nudge:dismissed_at";
const mockNavigate = vi.fn();
let mockedUser: any = null;
let mockedHydrated = true;

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/hooks/use-store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-store")>();
  return {
    ...actual,
    useStore: () => {
      const base = actual.useStore();
      return { ...base, user: mockedUser, hydrated: mockedHydrated };
    },
  };
});

describe("SecurityNudgeBanner", () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
    mockedUser = null;
    mockedHydrated = true;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("does not render when user is null", () => {
    mockedUser = null;
    renderWithProviders(<SecurityNudgeBanner />, { auth: true });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("does not render when store is not yet hydrated", () => {
    mockedHydrated = false;
    mockedUser = { two_factor: { enabled: false }, passkeys: [] };
    renderWithProviders(<SecurityNudgeBanner />, { auth: true });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("does not render when 2FA is enabled", () => {
    mockedUser = { two_factor: { enabled: true }, passkeys: [] };
    renderWithProviders(<SecurityNudgeBanner />, { auth: true });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("does not render when user has a passkey", () => {
    mockedUser = {
      two_factor: { enabled: false },
      passkeys: [{ credential_id: "cred-1", device_name: "iPhone", created_at: new Date().toISOString() }],
    };
    renderWithProviders(<SecurityNudgeBanner />, { auth: true });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("does not render when banner was recently dismissed", () => {
    // Dismissed 1 day ago — within the 14-day window
    localStorage.setItem(STORAGE_KEY, String(Date.now() - 24 * 60 * 60 * 1000));
    mockedUser = { two_factor: { enabled: false }, passkeys: [] };
    renderWithProviders(<SecurityNudgeBanner />, { auth: true });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders when user has no 2FA and no passkeys and was not dismissed", () => {
    mockedUser = { two_factor: { enabled: false }, passkeys: [] };
    renderWithProviders(<SecurityNudgeBanner />, { auth: true });
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/secure your account/i)).toBeInTheDocument();
  });

  it("renders when dismissed timestamp is older than 14 days", () => {
    // Dismissed 15 days ago — outside the window
    localStorage.setItem(STORAGE_KEY, String(Date.now() - 15 * 24 * 60 * 60 * 1000));
    mockedUser = { two_factor: { enabled: false }, passkeys: [] };
    renderWithProviders(<SecurityNudgeBanner />, { auth: true });
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders when passkeys is undefined (no field set)", () => {
    mockedUser = { two_factor: { enabled: false } };
    renderWithProviders(<SecurityNudgeBanner />, { auth: true });
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("dismiss button hides the banner and stores timestamp", async () => {
    const user = userEvent.setup();
    mockedUser = { two_factor: { enabled: false }, passkeys: [] };
    renderWithProviders(<SecurityNudgeBanner />, { auth: true });

    expect(screen.getByRole("status")).toBeInTheDocument();
    await user.click(screen.getByLabelText(/dismiss security reminder/i));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    expect(Number(stored)).toBeGreaterThan(Date.now() - 5000);
  });

  it("passkey/2FA link navigates to /settings/security and dismisses", async () => {
    const user = userEvent.setup();
    mockedUser = { two_factor: { enabled: false }, passkeys: [] };
    renderWithProviders(<SecurityNudgeBanner />, { auth: true });

    await user.click(screen.getByText(/passkey or 2fa/i));

    expect(mockNavigate).toHaveBeenCalledWith("/settings/security");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
