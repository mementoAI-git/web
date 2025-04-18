"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  PropsWithChildren,
  useMemo,
} from "react";

export const initialStates: States = {
  type: "text",
  navigations: [],
  data: null,
};

type States = {
  type: "text" | "video" | "audio";
  navigations: string[];
  data: any;
};

interface IPromptContext extends States {
  set?: (key: keyof States, value: any) => void;
  push?: (form: string) => void;
  back?: (form?: string) => void;
}

const store = createContext<IPromptContext>(initialStates);

export function PromtProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(initialStates);

  const set = useCallback((key: keyof States, value: any) => {
    setState((s) => ({
      ...s,
      [key]:
        typeof value === "object" && s[key] !== null
          ? { ...s[key], ...value }
          : value,
    }));
  }, []);

  const push = useCallback((form: string) => {
    setState((p) => {
      if (p.navigations.includes(form)) {
        return {
          ...p,
          navigations: [form, ...p.navigations.filter((n) => n !== form)],
        };
      }
      return { ...p, navigations: [form, ...p.navigations] };
    });
  }, []);

  const back = useCallback((form?: string) => {
    setState((p) => {
      if (form && p.navigations.includes(form)) {
        return {
          ...p,
          navigations: p.navigations.filter((n) => n !== form),
        };
      }
      return {
        ...p,
        navigations: p.navigations.filter((n) => n !== p.navigations[0]),
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      set,
      push,
      back,
    }),
    [state, set, push, back],
  );

  return <store.Provider value={value}> {children} </store.Provider>;
}

export const usePrompt = () => useContext(store);
