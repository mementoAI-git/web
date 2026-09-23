import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";
import { SWRConfig } from "swr";
import { StoreProvider } from "@/hooks/use-store";
import { ModalProvider } from "@/hooks/use-modal";
import { ChatProvider } from "@/hooks/use-chat";
import { SubscriptionProvider } from "@/contexts/subscription";
import { ThemeProvider } from "@/contexts/theme";
import { fetcher } from "@/api/fetcher";
import type { ReactElement } from "react";
import { seedAuth, clearAuth } from "./auth-helpers";
import type { IAuth } from "@/utility/interface";

interface ProviderOptions {
  route?: string;
  routerProps?: Partial<MemoryRouterProps>;
  auth?: Partial<IAuth> | boolean;
}

function createWrapper(options: ProviderOptions = {}) {
  const { route = "/", routerProps, auth } = options;

  if (auth) {
    seedAuth(auth === true ? undefined : auth);
  } else {
    clearAuth();
  }

  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider>
        <StoreProvider>
          <ModalProvider>
            <ChatProvider>
              <SWRConfig
                value={{
                  fetcher,
                  dedupingInterval: 0,
                  provider: () => new Map(),
                }}
              >
                <SubscriptionProvider>
                  <MemoryRouter initialEntries={[route]} {...routerProps}>
                    {children}
                  </MemoryRouter>
                </SubscriptionProvider>
              </SWRConfig>
            </ChatProvider>
          </ModalProvider>
        </StoreProvider>
      </ThemeProvider>
    );
  };
}

export function renderWithProviders(
  ui: ReactElement,
  options: ProviderOptions & Omit<RenderOptions, "wrapper"> = {},
) {
  const { route, routerProps, auth, ...renderOptions } = options;
  const wrapper = createWrapper({ route, routerProps, auth });

  return {
    ...render(ui, { wrapper, ...renderOptions }),
    rerender: (rerenderUi: ReactElement) =>
      render(rerenderUi, { wrapper, ...renderOptions }),
  };
}
