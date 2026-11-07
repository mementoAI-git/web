"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import type { PropsWithChildren } from "react";

interface IState {
  name: string;
  props?: unknown;
}

// eslint-disable-next-line react-refresh/only-export-components
export const initialStates: ModalContext = { state: [] };

export type ModalCloseOptions = { force?: boolean };

interface ModalContext {
  state: IState[];
  open?: (name: string, props?: unknown) => void;
  push?: (name: string, props?: unknown) => void;
  close?: (name?: string, options?: ModalCloseOptions) => void;
  /** Return false from the guard to abort close (e.g. show a confirmation dialog). */
  registerCloseGuard?: (name: string, guard: () => boolean) => () => void;
}

const modal = createContext<ModalContext>(initialStates);

export function ModalProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<IState[]>([]);
  const closeGuardsRef = useRef<Map<string, () => boolean>>(new Map());
  const stateRef = useRef(state);
  stateRef.current = state;

  const registerCloseGuard = useCallback((name: string, guard: () => boolean) => {
    closeGuardsRef.current.set(name, guard);
    return () => {
      closeGuardsRef.current.delete(name);
    };
  }, []);

  const open = useCallback((name: string, props: unknown = null) => {
    setState([{ name, props }]);
  }, []);

  const push = useCallback((name: string, props: unknown = null) => {
    setState((p) => [{ name, props }, ...p]);
  }, []);

  const close = useCallback((name?: string, options?: ModalCloseOptions) => {
    // Guards may set state or save, so they can't run inside a state updater.
    if (!options?.force) {
      const guardName = name ?? stateRef.current[0]?.name;
      const guard = guardName ? closeGuardsRef.current.get(guardName) : undefined;
      if (guard && !guard()) return;
    }
    setState((p) => {
      const modalName = name ?? p[0]?.name;
      if (!modalName) return p;
      return p.filter((n) => n.name !== modalName);
    });
  }, []);
  return (
    <modal.Provider value={{ state, open, push, close, registerCloseGuard }}>
      {children}
    </modal.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useModal = () => useContext(modal);

