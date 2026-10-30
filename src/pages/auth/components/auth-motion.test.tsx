import { afterEach, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  AuthFieldMotion,
  AuthMotionHeading,
  PasswordVisibilityIcon,
} from "./auth-motion";

afterEach(() => vi.useRealTimers());

it("reveals headings without hiding or disabling the form", () => {
  render(
    <AuthMotionHeading>
      <h1 className="t-stagger-line">Welcome</h1>
    </AuthMotionHeading>,
  );
  expect(screen.getByRole("heading").parentElement).toHaveClass("is-shown");
});

it("ends the shake while preserving the validation message and input focus", () => {
  vi.useFakeTimers();
  const { rerender, container } = render(
    <AuthFieldMotion error="">
      <input aria-label="Email" />
    </AuthFieldMotion>,
  );
  const input = screen.getByRole("textbox");
  input.focus();
  rerender(
    <AuthFieldMotion error="Invalid email">
      <input aria-label="Email" aria-invalid="true" />
      <p role="alert">Invalid email</p>
    </AuthFieldMotion>,
  );
  expect(container.firstChild).toHaveClass("is-shaking");
  act(() => vi.advanceTimersByTime(1000));
  expect(container.firstChild).not.toHaveClass("is-shaking");
  expect(screen.getByRole("alert")).toHaveTextContent("Invalid email");
  expect(input).toHaveFocus();
  rerender(
    <AuthFieldMotion error="">
      <input aria-label="Email" />
    </AuthFieldMotion>,
  );
  expect(container.firstChild).not.toHaveClass("is-error");
});

it("updates the icon state without replacing or interrupting the password control", () => {
  const { rerender, container } = render(
    <button aria-label="Show password">
      <PasswordVisibilityIcon visible={false} />
    </button>,
  );
  const button = screen.getByRole("button");
  button.focus();
  fireEvent.click(button);
  rerender(
    <button aria-label="Hide password">
      <PasswordVisibilityIcon visible />
    </button>,
  );
  expect(screen.getByRole("button", { name: "Hide password" })).toHaveFocus();
  expect(container.querySelector(".t-icon-swap")).toHaveAttribute(
    "data-state",
    "b",
  );
  expect(container.querySelectorAll(".t-icon")).toHaveLength(2);
});
