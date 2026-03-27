import "../instrument";
import * as Sentry from "@sentry/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import "dialkit/styles.css";
import "react-spring-bottom-sheet/dist/style.css";
import { router } from "./router";
import { ModalProvider } from "./hooks/use-modal";
import { SWRConfig } from "swr";
import { Toaster } from "sonner";
import { fetcher } from "@/api/fetcher";
import { StoreProvider } from "@/hooks/use-store";
import { ChatProvider } from "@/hooks/use-chat";
import { BackgroundMusicProvider } from "@/hooks/use-background-music";
import { ErrorPage } from "./pages";
import { RootAppShell } from "@/components/layouts/root-app-shell";

const sentryHandler = {
  // Callback called when an error is thrown and not caught by an ErrorBoundary.
  onUncaughtError: Sentry.reactErrorHandler((error, errorInfo) => {
    console.warn("Uncaught error", error, errorInfo.componentStack);
  }),
  // Callback called when React catches an error in an ErrorBoundary.
  onCaughtError: Sentry.reactErrorHandler(),
  // Callback called when React automatically recovers from errors.
  onRecoverableError: Sentry.reactErrorHandler(),
};

createRoot(document.getElementById("root")!, sentryHandler).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorPage />}>
      <StoreProvider>
        <BackgroundMusicProvider>
          <ModalProvider>
            <ChatProvider>
              <SWRConfig value={{ fetcher }}>
                <RootAppShell>
                  <RouterProvider router={router} />
                </RootAppShell>
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
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
