import { useState } from "react";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test";
import { mockUser } from "@/test/fixtures";
import { server } from "@/test/mocks/server";
import { initialStates, StoreValueProvider } from "@/hooks/use-store";
import { GeneralProfileForm } from "./general-profile-form";

const contact = () => within(screen.getByRole("form", { name: "Your contact details" }));
const identity = () => within(screen.getByRole("form", { name: "Your name and birthday" }));

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
    const save = identity().getByRole("button", { name: "Save changes" });
    expect(save).toBeDisabled();
    expect(screen.getByLabelText("Email address")).toHaveAttribute("readonly");
    await user.clear(screen.getByLabelText(/^Display name/));
    await user.type(screen.getByLabelText(/^Display name/), "  New name  ");
    await user.click(save);
    await waitFor(() =>
      expect(submitted).toHaveBeenCalledWith({ nickname: "New name" }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Saved display name")).toHaveTextContent(
        "New name",
      ),
    );
    expect(screen.getByLabelText(/^Display name/)).toHaveValue("New name");
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
    await user.click(contact().getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please try again later",
    );
    expect(screen.getByLabelText("Location")).toHaveValue("Lagos");
    await user.click(contact().getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Location")).toHaveValue("Lagos");
    expect(requests).toBe(2);
  });

  it("preserves dirty fields when the profile refreshes and ignores whitespace-only changes", async () => {
    renderWithProviders(<Harness />, { auth: true });
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^Display name/), " ");
    expect(identity().getByRole("button", { name: "Save changes" })).toBeDisabled();
    await user.clear(screen.getByLabelText(/^Display name/));
    await user.type(screen.getByLabelText(/^Display name/), "Draft nickname");
    await user.click(screen.getByRole("button", { name: "Refresh profile" }));
    expect(screen.getByLabelText(/^Display name/)).toHaveValue("Draft nickname");
    expect(screen.getByLabelText("Name")).toHaveValue("Refreshed User");
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
    await user.click(identity().getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(submitted).toHaveBeenCalledWith({ dob: "" }));
    await user.clear(screen.getByLabelText("Phone number"));
    await user.click(contact().getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(submitted).toHaveBeenCalledWith({ phone_number: "" }),
    );
  });

  it("splits a single name field into first and last name", async () => {
    const submitted = vi.fn();
    server.use(
      http.put("*/users/profile", async ({ request }) => {
        submitted(await request.json());
        return HttpResponse.json({ success: true });
      }),
    );
    renderWithProviders(<Harness />, { auth: true });
    const user = userEvent.setup();
    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Ada King Lovelace");
    await user.click(identity().getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(submitted).toHaveBeenCalledWith({ first_name: "Ada", last_name: "King Lovelace" }),
    );
  });

  it("does not allow saving an empty name", async () => {
    renderWithProviders(<Harness />, { auth: true });
    const user = userEvent.setup();
    await user.clear(screen.getByLabelText("Name"));
    expect(identity().getByRole("button", { name: "Save changes" })).toBeDisabled();
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
    const form = screen.getByRole("form", { name: "Your contact details" });
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
