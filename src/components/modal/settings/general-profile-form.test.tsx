import { useState } from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test";
import { mockUser } from "@/test/fixtures";
import { server } from "@/test/mocks/server";
import { initialStates, StoreValueProvider } from "@/hooks/use-store";
import { GeneralProfileForm } from "./general-profile-form";

function Harness() {
  const [user, setUser] = useState(mockUser);
  return (
    <StoreValueProvider value={{ ...initialStates, user, setUser }}>
      <GeneralProfileForm />
      <button
        onClick={() =>
          setUser((current) => ({ ...current, first_name: "Refreshed" }))
        }
      >
        Refresh profile
      </button>
      <output aria-label="Saved display name">{user.nickname}</output>
    </StoreValueProvider>
  );
}

describe("inline profile editing", () => {
  it("saves only trimmed changes and updates the visible profile without a modal", async () => {
    const submitted = vi.fn();
    server.use(
      http.put("*/users/profile", async ({ request }) => {
        submitted(await request.json());
        return HttpResponse.json({ success: true, message: "Profile updated" });
      }),
    );
    renderWithProviders(<Harness />, { auth: true });
    const user = userEvent.setup();
    const save = screen.getByRole("button", { name: "Save changes" });
    expect(save).toBeDisabled();
    expect(screen.getByLabelText("Email")).toHaveAttribute("readonly");
    await user.clear(screen.getByLabelText("Display name"));
    await user.type(screen.getByLabelText("Display name"), "  New name  ");
    await user.click(save);
    await waitFor(() =>
      expect(submitted).toHaveBeenCalledWith({ nickname: "New name" }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Saved display name")).toHaveTextContent(
        "New name",
      ),
    );
    expect(screen.getByLabelText("Display name")).toHaveValue("New name");
    expect(save).toBeDisabled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps drafts after a failed save and allows retry", async () => {
    let requests = 0;
    server.use(
      http.put("*/users/profile", () => {
        requests += 1;
        return HttpResponse.json(
          requests === 1
            ? { success: false, message: "Please try again later" }
            : { success: true },
        );
      }),
    );
    renderWithProviders(<Harness />, { auth: true });
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Location"), "Lagos");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please try again later",
    );
    expect(screen.getByLabelText("Location")).toHaveValue("Lagos");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Location")).toHaveValue("Lagos");
    expect(requests).toBe(2);
  });

  it("preserves dirty fields when the profile refreshes and ignores whitespace-only changes", async () => {
    renderWithProviders(<Harness />, { auth: true });
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Display name"), " ");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    await user.clear(screen.getByLabelText("Display name"));
    await user.type(screen.getByLabelText("Display name"), "Draft nickname");
    await user.click(screen.getByRole("button", { name: "Refresh profile" }));
    expect(screen.getByLabelText("Display name")).toHaveValue("Draft nickname");
    expect(screen.getByLabelText("First name")).toHaveValue("Refreshed");
  });

  it("supports clearing optional fields, including birthday", async () => {
    const submitted = vi.fn();
    server.use(
      http.put("*/users/profile", async ({ request }) => {
        submitted(await request.json());
        return HttpResponse.json({ success: true });
      }),
    );
    renderWithProviders(<Harness />, { auth: true });
    const user = userEvent.setup();
    fireEvent.change(screen.getByLabelText("Birthday"), {
      target: { value: "" },
    });
    await user.clear(screen.getByLabelText("Phone"));
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(submitted).toHaveBeenCalledWith({ dob: "", phone_number: "" }),
    );
  });

  it("locks fields and prevents duplicate submissions while saving", async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const submitted = vi.fn();
    server.use(
      http.put("*/users/profile", async () => {
        submitted();
        await pending;
        return HttpResponse.json({ success: true });
      }),
    );
    renderWithProviders(<Harness />, { auth: true });
    fireEvent.change(screen.getByLabelText("Location"), {
      target: { value: "Lagos" },
    });
    const form = screen.getByRole("form", { name: "Profile details" });
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() => expect(submitted).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText("Location")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    release();
    await waitFor(() =>
      expect(screen.getByLabelText("Location")).toBeEnabled(),
    );
    expect(submitted).toHaveBeenCalledTimes(1);
  });
});
