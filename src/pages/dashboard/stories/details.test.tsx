import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StoriesDetails from "./details";

vi.mock("@/hooks/use-store", () => ({
  useStore: () => ({ user: null, setHeaderTitle: vi.fn() }),
}));
vi.mock("swr", async (importOriginal) => ({
  ...(await importOriginal<typeof import("swr")>()),
  default: () => ({ data: undefined, isLoading: true }),
}));

const openModal = vi.fn();
const closeModal = vi.fn();
vi.mock("@/hooks/use-modal", () => ({
  useModal: () => ({ open: openModal, close: closeModal }),
}));
vi.mock("./index", () => ({ default: () => <div>Stories library</div> }));
vi.mock("./mobile-details", () => ({
  default: () => <div>Mobile story page</div>,
}));

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: 1024,
  });
});

function renderStoryLink() {
  return render(
    <MemoryRouter initialEntries={["/stories/story-1"]}>
      <Routes>
        <Route path="/stories/:id" element={<StoriesDetails />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("story links", () => {
  it("opens the standard desktop viewer above the stories library", () => {
    renderStoryLink();
    expect(openModal).toHaveBeenCalledWith("view-memory", {
      memoryId: "story-1",
    });
    expect(screen.getByText("Stories library")).toBeInTheDocument();
    expect(screen.queryByText("Mobile story page")).not.toBeInTheDocument();
  });
  it("keeps direct story links working on mobile", () => {
    window.innerWidth = 390;
    renderStoryLink();
    expect(screen.getByText("Mobile story page")).toBeInTheDocument();
    expect(openModal).not.toHaveBeenCalled();
  });
  it("switches to mobile presentation and closes the desktop viewer on resize", () => {
    renderStoryLink();
    window.innerWidth = 390;
    fireEvent(window, new Event("resize"));
    expect(screen.getByText("Mobile story page")).toBeInTheDocument();
    expect(closeModal).toHaveBeenCalledWith("view-memory");
  });
});
