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
  data: null,
};

type States = {
  type: "text" | "video" | "audio";
  data: any;
};

interface IPromptContext extends States {
  set?: (key: keyof States, value: any) => void;
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

  const value = useMemo(
    () => ({ ...state, set }),
    [state, set]
  );

  return <store.Provider value={value}> {children} </store.Provider>;
}

export const usePrompt = () => useContext(store);
