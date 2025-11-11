"use client";

import { clearCache } from "@/utility";
import { storageKeys } from "@/utility/constant";
import type { IAuth, IUser } from "@/utility/interface";
import { authService } from "@/utility/auth-service";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { PropsWithChildren } from "react";

interface IState {
  headerTitle: string | null;
  auth: IAuth | null;
  user: IUser | null;
  hydrated: boolean;
}

export const initialStates: IState = {
  headerTitle: null,
  auth: null,
  user: null,
  hydrated: false,
};

interface StoreContext extends IState {
  setAuth?: (value: IAuth) => void;
  setUser?: (value: IUser) => void;
  setHeaderTitle?: (value: string) => void;
  unsetAuth?: () => Promise<void>;
}

const store = createContext<StoreContext>(initialStates);

export function StoreProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(initialStates);

  const setAuth = useCallback((auth: IAuth) => {
    localStorage.setItem(storageKeys.auth, JSON.stringify(auth));
    setState((p) => ({ ...p, auth }));
  }, []);

  const unsetAuth = useCallback(async () => {
    await authService.logout();
    setState((p) => ({ ...p, auth: null, user: null }));
    clearCache();
  }, []);

  const setUser = useCallback((user: IUser) => {
    setState((p) => ({
      ...p,
      user: p.user ? { ...p.user, ...user } : user,
    }));
  }, []);

  const setHeaderTitle = useCallback((title: string) => {
    setState((p) => ({ ...p, headerTitle: title }));
  }, []);

  useEffect(() => {
    const auth = localStorage.getItem(storageKeys.auth);
    if (auth) {
      setState((p) => ({ ...p, auth: JSON.parse(auth), hydrated: true }));
    } else {
      setState((p) => ({ ...p, hydrated: true }));
    }
  }, []);
  return (
    <store.Provider
      value={{ ...state, unsetAuth, setAuth, setUser, setHeaderTitle }}
    >
      {children}
    </store.Provider>
  );
}

export const useStore = () => useContext(store);

