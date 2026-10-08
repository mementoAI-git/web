import { afterEach, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import AuthEntryLayout from "./entry-layout";

afterEach(() => {
  localStorage.removeItem(THEME_STORAGE_KEY);
  document.documentElement.classList.remove("dark");
});

it("keeps the theme switcher available and changes the illustration with the theme", async () => {
  localStorage.setItem(THEME_STORAGE_KEY, "light");
  const user = userEvent.setup();
  const { container } = renderWithProviders(
    <AuthEntryLayout
      title={
        <>
          Create an <em>account</em>
        </>
      }
      footer="Account actions"
    >
      <p>Form fields</p>
    </AuthEntryLayout>,
  );
  const lightImage = container
    .querySelector(".auth-entry-gradient")
    ?.getAttribute("src");
  expect(
    screen.getByRole("region", { name: "Create an account" }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Choose theme" }));
  await user.click(screen.getByRole("menuitemradio", { name: "Dark", exact: true }));
  expect(document.documentElement).toHaveClass("dark");
  expect(
    container.querySelector(".auth-entry-gradient")?.getAttribute("src"),
  ).not.toBe(lightImage);
  await user.click(
    screen.getByRole("button", { name: "Choose theme" }),
  );
  await user.click(screen.getByRole("menuitemradio", { name: "Light", exact: true }));
  expect(
    container.querySelector(".auth-entry-gradient")?.getAttribute("src"),
  ).toBe(lightImage);
});
