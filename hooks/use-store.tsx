"use client";

import { IAuth, IUser } from "@/utility/interface";
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from "react";

interface IState {
  auth: IAuth | null
  user: IUser | null
  hydrated: boolean
}

export const initialStates: IState = {
  auth: null,
  user: null,
  hydrated: false
}

interface StoreContext extends IState {
  setAuth?: (value: IAuth) => void;
  setUser?: (value: IUser) => void;
}

const store = createContext<StoreContext>(initialStates);

export function StoreProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(initialStates);

  const setAuth = useCallback((auth: IAuth) => {
    localStorage.setItem("auth", JSON.stringify(auth));
    setState((p) => ({ ...p, auth }));
  }, []);

  const setUser = useCallback((user: IUser) => {
    setState((p) => ({
      ...p,
      user: p.user ? { ...p.user, ...user } : user,
    }));
  }, []);

  useEffect(() => {
    const auth = localStorage.getItem("auth");
    if (auth) {
      setState(p => ({ ...p, auth: JSON.parse(auth), hydrated: true }))
    } else {
      setState(p => ({ ...p, hydrated: true }))
    }
  }, []);
  return (
    <store.Provider value={{ ...state, setAuth, setUser }}>
      {children}
    </store.Provider>
  );
}

export const useStore = () => useContext(store);
