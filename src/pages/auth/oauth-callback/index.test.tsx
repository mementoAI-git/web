import {StrictMode} from "react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {screen, waitFor} from "@testing-library/react";
import {renderWithProviders, mockAuth} from "@/test";
import {captureReferral, getReferralCode} from "@/features/referrals/attribution";
import OAuthCallbackPage from "./index";
const {trigger, navigate} = vi.hoisted(() => ({trigger:vi.fn(),navigate:vi.fn()}));
vi.mock("@/hooks/use-fetcher", () => ({default:() => ({trigger,data:null,error:null,isMutating:false})}));
vi.mock("@/utility", async (original) => ({...await original<typeof import("@/utility")>(),clearCache:vi.fn().mockResolvedValue(undefined)}));
vi.mock("react-router-dom", async (original) => ({...await original<typeof import("react-router-dom")>(),useNavigate:() => navigate,useParams:() => ({provider:"google"}),useSearchParams:() => [new URLSearchParams("code=google-code")]}));
describe("OAuth invite attribution", () => {
 beforeEach(() => {trigger.mockReset();navigate.mockReset();captureReferral(`?ref=${"a".repeat(32)}`);});
 it("sends the referral once in StrictMode and clears it after authentication", async () => {
  trigger.mockResolvedValue({success:true,data:{...mockAuth,onboarded:false}});
  renderWithProviders(<StrictMode><OAuthCallbackPage /></StrictMode>);
  await waitFor(() => expect(navigate).toHaveBeenCalledWith("/onboarding"));
  expect(trigger).toHaveBeenCalledExactlyOnceWith({code:"google-code",referral_code:"a".repeat(32)});
  expect(getReferralCode()).toBeUndefined();
 });
 it("sends accounts with two-factor authentication to the code step", async () => {
  trigger.mockResolvedValue({success:true,data:{requires_2fa:true,two_fa_token:"pending-2fa"}});
  renderWithProviders(<OAuthCallbackPage />);
  await waitFor(() => expect(navigate).toHaveBeenCalledWith(expect.stringMatching(/^\/two-factor\?/)));
  const target = new URLSearchParams(navigate.mock.calls[0][0].split("?")[1]);
  expect(target.get("token")).toBe("pending-2fa");
  expect(screen.queryByText("Sign in failed")).not.toBeInTheDocument();
 });
 it("keeps the referral when authorization fails", async () => {
  trigger.mockRejectedValue(new Error("Provider unavailable"));
  renderWithProviders(<OAuthCallbackPage />);
  expect(await screen.findByText("Sign in failed")).toBeInTheDocument();
  expect(getReferralCode()).toBe("a".repeat(32));
  expect(navigate).not.toHaveBeenCalled();
 });
});
