import { PropsWithChildren, useContext, createContext, useState } from "react";

interface IState {
  payload: any
  editMode: false
}

const initial = {
  payload: null,
  editMode: false
}

const store = createContext<typeof initial>(initial);

export function StoreProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(initial);

  return (
    <store.Provider value={{ ...state }}>
      {children}
    </store.Provider>
  );
}

export const useCreateMemory = () => useContext(store);