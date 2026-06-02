"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type DashboardHeaderActionsState = {
  showStoriesActions: boolean;
};

type DashboardHeaderActionsContextValue = {
  actions: DashboardHeaderActionsState;
  setShowStoriesActions: (show: boolean) => void;
};

const defaultDashboardHeaderActionsContextValue: DashboardHeaderActionsContextValue = {
  actions: { showStoriesActions: false },
  setShowStoriesActions: () => {},
};

const DashboardHeaderActionsContext =
  createContext<DashboardHeaderActionsContextValue>(defaultDashboardHeaderActionsContextValue);

export function DashboardHeaderActionsProvider({ children }: { children: ReactNode }) {
  const [showStoriesActions, setShowStoriesActionsState] = useState(false);

  const setShowStoriesActions = useCallback((show: boolean) => {
    setShowStoriesActionsState(show);
  }, []);

  const value = useMemo(
    () => ({
      actions: { showStoriesActions },
      setShowStoriesActions,
    }),
    [showStoriesActions, setShowStoriesActions],
  );

  return (
    <DashboardHeaderActionsContext.Provider value={value}>
      {children}
    </DashboardHeaderActionsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDashboardHeaderActions() {
  return useContext(DashboardHeaderActionsContext);
}
