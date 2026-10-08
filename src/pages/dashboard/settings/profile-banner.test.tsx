import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import { ProfileBanner } from "./profile-banner";

const api = vi.hoisted(() => ({put: vi.fn(), post: vi.fn()}));
vi.mock("@/api/mutations", () => api);

describe("ProfileBanner", () => {
  beforeEach(() => vi.clearAllMocks());

  it("discards an adjustment when cancelled", async () => {
    renderWithProviders(<ProfileBanner />, {auth: true});
    fireEvent.click(screen.getByRole("button", {name: "Adjust banner"}));
    fireEvent.change(screen.getByLabelText("Vertical position"), {target: {value: "10"}});
    expect(screen.getByAltText("Banner position preview")).toHaveStyle({objectPosition: "50% 10%"});
    fireEvent.click(screen.getByRole("button", {name: "Cancel"}));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByAltText("Profile banner")).toHaveStyle({objectPosition: "50% 100%"});
    expect(api.put).not.toHaveBeenCalled();
  });

  it("aligns to the bottom and saves the user's adjusted position", async () => {
    api.put.mockResolvedValue({success: true, data: {banner_position: {x: 50, y: 30}}});
    renderWithProviders(<ProfileBanner />, {auth: true});
    expect(screen.getByAltText("Profile banner")).toHaveStyle({objectPosition: "50% 100%"});
    fireEvent.click(screen.getByRole("button", {name: "Adjust banner"}));
    fireEvent.change(screen.getByLabelText("Vertical position"), {target: {value: "30"}});
    fireEvent.click(screen.getByRole("button", {name: "Save position"}));
    await waitFor(() => expect(screen.getByAltText("Profile banner")).toHaveStyle({objectPosition: "50% 30%"}));
    expect(api.put).toHaveBeenCalledWith("/users/banner-position", {x: 50, y: 30});
  });

  it("uses the blue clouds by default and opens a banner dialog", () => {
    renderWithProviders(<ProfileBanner />, {auth: true});
    expect(screen.getByAltText("Profile banner")).toHaveAttribute("src", expect.stringContaining("blue-clouds.webp"));
    fireEvent.click(screen.getByRole("button", {name: "Change banner"}));
    expect(screen.getByRole("dialog", {name: "Change banner"})).toBeInTheDocument();
    expect(screen.getByRole("button", {name: "Blue clouds (default)"})).toHaveAttribute("aria-pressed", "true");
    for (const name of ["Leaf shadows", "Orange sky", "Sunlit village"]) expect(screen.getByRole("button", {name})).toBeInTheDocument();
  });

  it("saves an alternative and closes the dialog", async () => {
    api.put.mockResolvedValue({success: true, data: {banner_preset: 3, banner_url: null}});
    renderWithProviders(<ProfileBanner />, {auth: true});
    fireEvent.click(screen.getByRole("button", {name: "Change banner"}));
    fireEvent.click(screen.getByRole("button", {name: "Sunlit village"}));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByAltText("Profile banner")).toHaveAttribute("src", expect.stringContaining("sunlit-village.webp"));
    expect(api.put).toHaveBeenCalledWith("/users/banner", {banner_preset: 3});
  });

  it("uploads a file and uses the server WebP URL", async () => {
    api.post.mockResolvedValue({success: true, data: {banner_preset: 0, banner_url: "/files/banner.webp"}});
    renderWithProviders(<ProfileBanner />, {auth: true});
    fireEvent.click(screen.getByRole("button", {name: "Change banner"}));
    const file = new File(["png"], "banner.png", {type: "image/png"});
    fireEvent.change(screen.getByLabelText("Upload banner image"), {target: {files: [file]}});
    await waitFor(() => expect(screen.getByAltText("Profile banner")).toHaveAttribute("src", "/files/banner.webp"));
    expect(api.post.mock.calls[0][1].get("file")).toBe(file);
  });

  it("keeps the current banner if saving fails", async () => {
    api.post.mockRejectedValue(new Error("offline"));
    renderWithProviders(<ProfileBanner />, {auth: true});
    fireEvent.click(screen.getByRole("button", {name: "Change banner"}));
    fireEvent.change(screen.getByLabelText("Upload banner image"), {target: {files: [new File(["png"], "banner.png", {type: "image/png"})]}});
    await waitFor(() => expect(screen.getByRole("button", {name: "Upload image"})).not.toBeDisabled());
    expect(screen.getByAltText("Profile banner")).toHaveAttribute("src", expect.stringContaining("blue-clouds.webp"));
  });
});
