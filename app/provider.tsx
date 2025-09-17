"use client";

import { fetcher } from "@/api/fetcher";
import { ModalProvider } from "@/hooks/use-modal";
import { StoreProvider } from "@/hooks/use-store";
import { ChatProvider } from "@/hooks/use-chat";
import { BackgroundMusicProvider } from "@/hooks/use-background-music";
import { PropsWithChildren } from "react";
import { Toaster } from "sonner";
import { SWRConfig } from "swr";
import { LiveAPIProvider } from "@/hooks/use-live-api/context";

export default function Providers({ children }: PropsWithChildren) {
  return (
    <StoreProvider>
      <BackgroundMusicProvider>
        <ModalProvider>
          <ChatProvider>
            <LiveAPIProvider>
              <SWRConfig value={{ fetcher }}>
                {children}
                <Toaster
                  position="top-center"
                  closeButton
                  toastOptions={{
                    classNames: {
                      success: "!text-success",
                      error: "!text-danger"
                    }
                  }}
                />
              </SWRConfig>
            </LiveAPIProvider>
          </ChatProvider>
        </ModalProvider>
      </BackgroundMusicProvider>
    </StoreProvider>
  );
}
