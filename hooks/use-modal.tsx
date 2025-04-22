"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from "react";

interface IState {
  name: string;
  props?: any;
}
export const initialStates = { state: null };

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
    setState(p => [{ name, props }, ...p]);
  }, []);

  const close = useCallback((name?: string) => {
    if (!name && state[0]) {
      name = state[0].name
    }
    setState(p => {
      if (name && p.some(a => a.name === name)) {
        return p.filter((n) => n.name !== name);
      }

      return p
    });
  }, []);
  return (
    <modal.Provider value={{ state, open, push, close }}>{children}</modal.Provider>
  );
}

export const useModal = () => useContext(modal);
