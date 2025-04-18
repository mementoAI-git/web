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
  state: IState;
  open?: (name: string, props?: any) => void;
  close?: (name?: string) => void;
}

const modal = createContext<ModalContext>(initialStates);

export function ModalProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(null);

  const open = useCallback((name: string, props: any = null) => {
    setState({ name, props });
  }, []);
  const close = useCallback(() => {
    setState(null);
  }, []);
  return (
    <modal.Provider value={{ state, open, close }}>{children}</modal.Provider>
  );
}

export const useModal = () => useContext(modal);
