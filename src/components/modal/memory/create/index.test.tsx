import { screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { CreateMemory } from "./index";
import { renderWithProviders } from "@/test";

vi.mock("@tiptap/react", () => {
  function chainable() {
    const api = { run: () => true };
    return new Proxy(api, {
      get(t, p) {
        if (p === "run") return t.run;
        return () => chainable();
      },
    });
  }
  const editorMock = {
    getHTML: () => "",
    getText: () => "",
    getAttributes: () => ({}),
    isActive: () => false,
    chain: () => chainable(),
    options: {editorProps: {}},
    setOptions: vi.fn(),
    state: {
      selection: {
        from: 0,
        to: 0,
        $anchor: { parent: { textContent: "", parentOffset: 0 } },
      },
      doc: { textBetween: () => "" },
    },
    view: { coordsAtPos: () => ({ top: 0, left: 0 }) },
  };
  return {
    useEditor: () => editorMock,
    EditorContent: () => <div data-testid="mock-editor" />,
  };
});

vi.mock("@emoji-mart/react", () => ({
  default: () => <div data-testid="emoji-mart-mock" />,
}));

vi.mock("./file-thumbnails", () => ({
  FileThumbnails: () => <div data-testid="file-thumbnails-mock" />,
}));

vi.mock("react-modal-sheet", () => {
  function MockSheet({ children }: { children: ReactNode }) {
    return <div data-testid="mock-sheet">{children}</div>;
  }
  MockSheet.Container = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div data-testid="sheet-container" className={className}>
      {children}
    </div>
  );
  MockSheet.Header = ({ className }: { className?: string }) => (
    <div data-testid="sheet-header" className={className} />
  );
  MockSheet.Content = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div data-testid="sheet-content" className={className}>
      {children}
    </div>
  );
  MockSheet.Backdrop = () => null;
  return { Sheet: MockSheet };
});

describe("CreateMemory", () => {
  it("uses v3 background on desktop story shell", () => {
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    const titleInput = screen.getByPlaceholderText(/enter title here/i);
    const shell = titleInput.closest('[class*="rounded-[16px]"]');
    expect(shell).toBeTruthy();
    expect(shell?.className).toContain("bg-white");
  });

  it("uses v3 background on mobile sheet surfaces", () => {
    renderWithProviders(<CreateMemory data={{}} isMobile />, { auth: true });

    expect(screen.getByTestId("sheet-container").className).toContain("bg-v3-bg");
    expect(screen.getByTestId("sheet-header").className).toContain("bg-v3-bg");
    expect(screen.getByTestId("sheet-content").className).toContain("bg-v3-bg");
  });
});
