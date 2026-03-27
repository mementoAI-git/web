import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import GoBack from "./go-back";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("GoBack", () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it("renders with v3 surface and label", () => {
    render(
      <MemoryRouter>
        <GoBack />
      </MemoryRouter>,
    );

    const btn = screen.getByRole("button", { name: /go back/i });
    expect(btn.className).toMatch(/\bbg-v3-fill-weak\b/);
    expect(btn.className).toMatch(/\btext-v3-text-weak\b/);
  });

  it("navigates back one step when clicked", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <GoBack />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /go back/i }));
    expect(navigateMock).toHaveBeenCalledWith(-1);
  });
});
