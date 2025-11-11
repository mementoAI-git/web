import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import "react-spring-bottom-sheet/dist/style.css";
import { router } from "./router";
import { ModalProvider } from "./hooks/use-modal";
import { SWRConfig } from "swr";
import { Toaster } from "sonner";
import { fetcher } from "@/api/fetcher";
import { StoreProvider } from "@/hooks/use-store";
import { ChatProvider } from "@/hooks/use-chat";
import { BackgroundMusicProvider } from "@/hooks/use-background-music";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider>
      <BackgroundMusicProvider>
        <ModalProvider>
          <ChatProvider>
            <SWRConfig value={{ fetcher }}>
              <RouterProvider router={router} />
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
  </StrictMode>,
);
