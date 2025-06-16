"use client";

import { clearCache } from "@/utility";
import { storageKeys } from "@/utility/constant";
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
  unsetAuth?: () => void;
}

const store = createContext<StoreContext>(initialStates);

export function StoreProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(initialStates);

  const setAuth = useCallback((auth: IAuth) => {
    localStorage.setItem(storageKeys.auth, JSON.stringify(auth));
    setState((p) => ({ ...p, auth }));
  }, []);

  const unsetAuth = useCallback(() => {
    localStorage.removeItem(storageKeys.auth);
    setState((p) => ({ ...p, auth: null, user: null }));
    clearCache()
  }, []);

  const setUser = useCallback((user: IUser) => {
    setState((p) => ({
      ...p,
      user: p.user ? { ...p.user, ...user } : user,
    }));
  }, []);

  useEffect(() => {
    const auth = localStorage.getItem(storageKeys.auth);
    if (auth) {
      setState(p => ({ ...p, auth: JSON.parse(auth), hydrated: true }))
    } else {
      setState(p => ({ ...p, hydrated: true }))
    }
  }, []);
  return (
    <store.Provider value={{ ...state, unsetAuth, setAuth, setUser }}>
      {children}
    </store.Provider>
  );
}

export const useStore = () => useContext(store);
