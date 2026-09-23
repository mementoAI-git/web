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
import { SubscriptionProvider } from "@/contexts/subscription";
import { FeatureFlagsProvider } from "@/contexts/feature-flags";
import { FeatureFlagsAdminProvider } from "@/contexts/feature-flags-admin";
import { ThemeProvider } from "@/contexts/theme";
import { initializeTheme } from "@/lib/theme";
// Dev-only: admin tools for previewing empty states.
// Gated behind import.meta.env.DEV — Vite tree-shakes this from production.
// eslint-disable-next-line react-refresh/only-export-components
let DevAdminProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <>{children}</>;
if (import.meta.env.DEV) {
  DevAdminProvider = (await import("@/dev/admin-tools")).DevAdminProvider;
}

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

initializeTheme();

createRoot(document.getElementById("root")!, sentryHandler).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorPage />}>
      <ThemeProvider>
        <StoreProvider>
          <BackgroundMusicProvider>
            <ModalProvider>
              <ChatProvider>
                <SWRConfig value={{ fetcher }}>
                  <SubscriptionProvider>
                    <FeatureFlagsProvider>
                      <FeatureFlagsAdminProvider>
                        <DevAdminProvider>
                          <RootAppShell>
                            <RouterProvider router={router} />
                          </RootAppShell>
                        </DevAdminProvider>
                      </FeatureFlagsAdminProvider>
                    </FeatureFlagsProvider>
                  </SubscriptionProvider>
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
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
