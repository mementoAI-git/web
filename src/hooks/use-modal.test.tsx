import { renderHook, act } from "@testing-library/react";
import { ModalProvider, useModal } from "@/hooks/use-modal";

function wrapper({ children }: { children: React.ReactNode }) {
  return <ModalProvider>{children}</ModalProvider>;
}

describe("ModalProvider / useModal", () => {
  it("initial state is empty array", () => {
    const { result } = renderHook(() => useModal(), { wrapper });
    expect(result.current.state).toEqual([]);
  });

  it("open(name) sets state to [{name, props: null}]", () => {
    const { result } = renderHook(() => useModal(), { wrapper });
    act(() => result.current.open?.("Settings"));
    expect(result.current.state).toEqual([{ name: "Settings", props: null }]);
  });

  it("push(name) adds to front of state array", () => {
    const { result } = renderHook(() => useModal(), { wrapper });
    act(() => result.current.open?.("First"));
    act(() => result.current.push?.("Second"));
    expect(result.current.state).toEqual([
      { name: "Second", props: null },
      { name: "First", props: null },
    ]);
  });

  it("close() removes first modal from state", () => {
    const { result } = renderHook(() => useModal(), { wrapper });
    act(() => result.current.push?.("A"));
    act(() => result.current.push?.("B"));
    act(() => result.current.close?.());
    expect(result.current.state).toEqual([{ name: "A", props: null }]);
  });

  it("close(name) removes specific modal by name", () => {
    const { result } = renderHook(() => useModal(), { wrapper });
    act(() => result.current.push?.("A"));
    act(() => result.current.push?.("B"));
    act(() => result.current.push?.("C"));
    act(() => result.current.close?.("B"));
    expect(result.current.state).toEqual([
      { name: "C", props: null },
      { name: "A", props: null },
    ]);
  });

  it("multiple opens replace state; pushes stack", () => {
    const { result } = renderHook(() => useModal(), { wrapper });
    act(() => result.current.open?.("Modal1"));
    expect(result.current.state).toEqual([{ name: "Modal1", props: null }]);
    act(() => result.current.open?.("Modal2"));
    expect(result.current.state).toEqual([{ name: "Modal2", props: null }]);
    act(() => result.current.push?.("Modal3"));
    expect(result.current.state).toEqual([
      { name: "Modal3", props: null },
      { name: "Modal2", props: null },
    ]);
  });
});
