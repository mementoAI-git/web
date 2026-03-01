"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import type { PropsWithChildren } from "react";

interface IState {
  name: string;
  props?: any;
}

export const initialStates: ModalContext = { state: [] };

interface ModalContext {
  state: IState[];
  open?: (name: string, props?: any) => void;
  push?: (name: string, props?: any) => void;
  close?: (name?: string) => void;
}

const modal = createContext<ModalContext>(initialStates);

export function ModalProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<IState[]>([]);

  const open = useCallback((name: string, props: any = null) => {
    setState([{ name, props }]);
  }, []);

  const push = useCallback((name: string, props: any = null) => {
    setState((p) => [{ name, props }, ...p]);
  }, []);

  const close = useCallback((name?: string) => {
    setState((p) => {
      const modalName = name ?? p[0]?.name;
      if (modalName && p.some((a) => a.name === modalName)) {
        return p.filter((n) => n.name !== modalName);
      }
      return p;
    });
  }, []);
  return (
    <modal.Provider value={{ state, open, push, close }}>
      {children}
    </modal.Provider>
  );
}

export const useModal = () => useContext(modal);

