"use client"

import { createContext, useContext, useState, useCallback, useEffect, PropsWithChildren } from "react";

export const initialStates: States = {
  edit_mode: false,
  type: "text",
  navigations: []
}

type States = {
  edit_mode: boolean
  type: "text" | "video" | "audio"
  navigations: string[]
};

interface IPromptContext extends States {
  set?: (key: keyof States, value: any) => void
  push?: (form: string) => void
  back?: (form?: string) => void
  onSave?: () => void
  onDiscard?: () => void
}

const store = createContext<IPromptContext>(initialStates)

export function PromtProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(initialStates)

  const set = useCallback((key: keyof States, value: any) => {
    setState(s => ({
      ...s,
      [key]: value
    }))
  }, [])

  const push = useCallback((form: string) => {
    setState(p => {
      if (p.navigations.includes(form)) {
        return {
          ...p,
          navigations: [form, ...p.navigations.filter(n => n !== form)]
        }
      }
      return { ...p, navigations: [form, ...p.navigations] }
    })
  }, [])

  const back = useCallback((form?: string) => {
    setState(p => {
      if (form && p.navigations.includes(form)) {
        return {
          ...p,
          navigations: p.navigations.filter(n => n !== form)
        }
      }
      return { ...p, navigations: p.navigations.filter(n => n !== p.navigations[0]) }
    })
  }, [])

  return (
    <store.Provider value={{ ...state, set, push, back }}> {children} </store.Provider>
  )
}

export const usePrompt = () => useContext(store)