"use client"

import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from "react";

interface IAuth {
  access_token: string
  expires_at: string
}

interface IState {
  auth: IAuth | null
}

export const initialStates: IState = {
  auth: null
}

interface StoreContext extends IState {
  setAuth?: (value: IAuth) => any
}

const store = createContext<StoreContext>(initialStates)

export function StoreProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(initialStates)

  const setAuth = useCallback((auth: IAuth) => {
    localStorage.setItem("auth", JSON.stringify(auth))
    setState(p => ({ ...p, auth }))
  }, [])

  useEffect(() => {
    const auth = localStorage.getItem("auth")
    if (auth) {
      setState(p => ({ ...p, auth: JSON.parse(auth) }))
    }
  }, [])
  return (
    <store.Provider value={{ ...state, setAuth }}>
      {children}
    </store.Provider>
  )
}

export const useStore = () => useContext(store)