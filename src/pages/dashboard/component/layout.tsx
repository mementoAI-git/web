import { VoiceSessionProvider } from "@/contexts/voice-session";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/utility";
import { Outlet, useLocation, useMatch, useNavigate } from "react-router-dom";
import AuthCheck from "@/components/layouts/auth-check";
import OnboardingGuard from "@/components/layouts/onboarding-guard";
import { WebsiteReflectionSync } from "@/features/website-reflection/sync-component";
import { OnboardingNudgeBanner } from "@/features/onboarding-groot";
import { SecurityNudgeBanner } from "@/components/security-nudge-banner";
import { TrialBanner } from "@/components/trial-banner";
import { useIsMobile } from "@/hooks/use-mobile";
import "@/components/motion/navigation-motion.css";
import { useModal } from "@/hooks/use-modal";
import { useChatSidebar } from "@/contexts/chat-sidebar";
import { useStoryMobileViewport } from "@/components/modal/memory/story-reader-utils";
import { isSkyCardPage } from "./sky-card-page";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSideBar } from "./dashboard-sidebar";
import { DashboardChatSidebar } from "./dashboard-chat-sidebar";
import Modal from "@/components/modal";
import { ConversationChromeProvider } from "@/contexts/conversation-chrome";
import { DashboardHeaderActionsProvider } from "@/contexts/dashboard-header-actions";
import { DASHBOARD_RIGHT_COLUMN_ID } from "@/components/memory/chat-settings-inline";

export default function DashboardLayout() {
  const isMobile = useIsMobile();
  const mainRef = useRef<HTMLElement>(null);
  const restoreSidebarFocus = useRef(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mainSidebarCollapsed, setMainSidebarCollapsed] = useState(false);
  const { chatOpen, setChatOpen } = useChatSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  /** Chat handles its own scroll column; outer overflow-y-auto breaks sticky composer on small viewports. */
  const isChatRoute = location.pathname.startsWith("/chat");
  const isPeopleRoute = location.pathname === "/people" || location.pathname.startsWith("/people/");
  const isSettingsRoute = location.pathname === "/settings" || location.pathname.startsWith("/settings/");
  /** These pages scroll their own content column. */
  const isInsightsRoute = location.pathname === "/insights";
  /** Phones and tablets read a story full screen, with its own back button. */
  const isStoryViewport = useStoryMobileViewport();
  const storyRoute = useMatch({ path: "/stories/:id", end: true });
  const isMobileStoryRoute = isStoryViewport && Boolean(storyRoute);
  const { open } = useModal();
  const isVoiceChatRoute = Boolean(
    useMatch({ path: "/chat/:id/voice", end: true }),
  );

  useEffect(() => {
    const { openModal: modalName, openModalProps } = (location.state ?? {}) as {
      openModal?: string;
      openModalProps?: unknown;
    };
    if (modalName) {
      open(modalName, openModalProps);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, open, navigate]);

  useEffect(() => () => setChatOpen(false), [setChatOpen]);

  // The mobile menu sits over the page, so going anywhere has to reveal it.
  useEffect(() => setSidebarOpen(false), [location.pathname]);

  useLayoutEffect(() => {
    if (!restoreSidebarFocus.current) return;
    restoreSidebarFocus.current = false;
    const toggles = mainRef.current?.querySelectorAll<HTMLButtonElement>("[data-sidebar-toggle]");
    const visibleToggle = Array.from(toggles ?? []).find((button) => getComputedStyle(button).display !== "none");
    visibleToggle?.focus();
  }, [sidebarOpen, mainSidebarCollapsed]);

  const handleMainSidebarToggle = () => {
    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(min-width: 768px)").matches
    ) {
      setMainSidebarCollapsed((c) => !c);
    } else {
      setSidebarOpen((o) => !o);
    }
  };

  return (
    <AuthCheck>
      <WebsiteReflectionSync />
      <OnboardingGuard>
        <VoiceSessionProvider>
        <div data-sky-card-page={isSkyCardPage(location.pathname) ? "" : undefined} className="bg-background w-full h-full flex flex-col md:flex-row overflow-hidden hide-scrollbar dynamic-height pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          <Modal />
          <div
            data-open={sidebarOpen}
            className="navigation-sidebar-scrim fixed inset-0 bg-overlay-backdrop z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div
              inert={isMobile ? !sidebarOpen : mainSidebarCollapsed}
              data-open={sidebarOpen}
              onClick={(event) => {
                // Items that open a modal stay on this route, so they close it here.
                if ((event.target as HTMLElement).closest('[data-slot="sidebar-menu-button"]'))
                  setSidebarOpen(false);
              }}
              className={cn(
                sidebarOpen
                  ? "translate-x-0"
                  : "-translate-x-full md:translate-x-0",
                "fixed md:relative inset-y-0 left-0 z-50 md:z-auto",
                "navigation-sidebar",
                "w-[80%] shrink-0 overflow-hidden rounded-r-[12px] md:rounded-none",
                "md:w-[252px]",
                mainSidebarCollapsed &&
                  "md:!w-0 md:!min-w-0 md:overflow-hidden md:opacity-0",
              )}
            >
              <DashboardSideBar compact={false} onCollapse={() => {
                restoreSidebarFocus.current = true;
                handleMainSidebarToggle();
              }} />
            </div>
          <main ref={mainRef} className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <DashboardHeaderActionsProvider>
              <ConversationChromeProvider>
                {!isVoiceChatRoute && !isMobileStoryRoute ? (
                  <DashboardHeader
                    onMenuClick={() => setSidebarOpen(true)}
                    mobileSidebarOpen={sidebarOpen}
                    mainSidebarCollapsed={mainSidebarCollapsed}
                    onMainSidebarToggle={handleMainSidebarToggle}
                  />
                ) : null}
                {!isSettingsRoute && !isMobileStoryRoute ? (
                  // One banner at a time, in priority order: the first that
                  // renders shows; the next appears once it is dismissed or done.
                  <div className="shrink-0 [&>*:not(:first-child)]:hidden">
                    <OnboardingNudgeBanner />
                    <TrialBanner />
                    <SecurityNudgeBanner />
                  </div>
                ) : null}
                <div
                  className="flex flex-1 flex-col overflow-hidden md:flex-row"
                >
                  <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <div
                      className={cn(
                        "hide-scrollbar h-full min-h-0 w-full flex-1",
                        isChatRoute || isPeopleRoute || isSettingsRoute || isInsightsRoute ? "overflow-hidden" : "overflow-y-auto",
                      )}
                    >
                      <Outlet />
                    </div>
                  </div>
                  <aside
                    className={cn(
                      "flex w-full flex-shrink-0 flex-col overflow-hidden rounded-[16px] md:mx-2 md:my-2 md:w-[300px] md:max-w-[315px] lg:w-[315px] bg-v3-fill-weak",
                      !chatOpen && "hidden",
                    )}
                  >
                    <DashboardChatSidebar onClose={() => setChatOpen(false)} />
                  </aside>
                </div>
              </ConversationChromeProvider>
            </DashboardHeaderActionsProvider>
          </main>
          {/* A full-height third column, filled by panels such as Chat settings. */}
          <div id={DASHBOARD_RIGHT_COLUMN_ID} className="hidden min-h-0 shrink-0 md:flex" />
        </div>
      </VoiceSessionProvider>
      </OnboardingGuard>
    </AuthCheck>
  );
}
