import { createContext, FC, ReactNode, useContext } from "react";
import { useLiveAPI, UseLiveAPIResults } from ".";

const LiveAPIContext = createContext<UseLiveAPIResults | undefined>(undefined);

export type LiveAPIProviderProps = {
  children: ReactNode;
};

const host = "generativelanguage.googleapis.com";
const url = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

export const LiveAPIProvider: FC<LiveAPIProviderProps> = ({ children }) => {
  const liveAPI = useLiveAPI({ url, apiKey: "AIzaSyA1CkTAac-3xD04CdZ-iw0BjFFc95HKBkw" });

  return (
    <LiveAPIContext.Provider value={liveAPI}>
      {children}
    </LiveAPIContext.Provider>
  );
};

export const useLiveAPIContext = () => {
  const context = useContext(LiveAPIContext);
  if (!context) {
    throw new Error("useLiveAPIContext must be used wihin a LiveAPIProvider");
  }
  return context;
};
