import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import AuthSocials from "./auth-social";

describe("AuthSocials", () => {
  it("shows the rule row by default", () => {
    render(<AuthSocials />);
    expect(screen.getByText("Or")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
  });

  it("can omit the rule row when the page already has a divider", () => {
    render(<AuthSocials showDivider={false} />);
    expect(screen.queryByText("Or")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
  });
});
