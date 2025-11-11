import type { PropsWithChildren } from "react";
import { SWRConfig } from "swr";
import { Toaster } from "sonner";
import { fetcher } from "@/api/fetcher";
import { ModalProvider } from "@/hooks/use-modal";
import { StoreProvider } from "@/hooks/use-store";
import { ChatProvider } from "@/hooks/use-chat";
import { BackgroundMusicProvider } from "@/hooks/use-background-music";

export function Providers({ children }: PropsWithChildren) {
  return (
    <StoreProvider>
      <BackgroundMusicProvider>
        <ModalProvider>
          <ChatProvider>
            <SWRConfig value={{ fetcher }}>
              {children}
              <Toaster
                position="top-center"
                closeButton
                toastOptions={{
                  classNames: {
                    success: "!text-success",
                    error: "!text-danger",
                  },
                }}
              />
            </SWRConfig>
          </ChatProvider>
        </ModalProvider>
      </BackgroundMusicProvider>
    </StoreProvider>
  );
}

