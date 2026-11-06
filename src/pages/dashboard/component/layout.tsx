import { VoiceSessionProvider } from "@/contexts/voice-session";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/utility";
import { Outlet, useLocation, useMatch, useNavigate } from "react-router-dom";
import AuthCheck from "@/components/layouts/auth-check";
import OnboardingGuard from "@/components/layouts/onboarding-guard";
import { OnboardingNudgeBanner } from "@/features/onboarding-groot";
import { SecurityNudgeBanner } from "@/components/security-nudge-banner";
import { TrialBanner } from "@/components/trial-banner";
import { useIsMobile } from "@/hooks/use-mobile";
import "@/components/motion/navigation-motion.css";
import { useModal } from "@/hooks/use-modal";
import { useChatSidebar } from "@/contexts/chat-sidebar";
import { isSkyCardPage } from "./sky-card-page";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSideBar } from "./dashboard-sidebar";
import { DashboardChatSidebar } from "./dashboard-chat-sidebar";
import Modal from "@/components/modal";
import { ConversationChromeProvider } from "@/contexts/conversation-chrome";
import { DashboardHeaderActionsProvider } from "@/contexts/dashboard-header-actions";

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
  /** Settings is a full page with its own header, so the dashboard chrome steps aside. */
  const isSettingsRoute = location.pathname === "/settings" || location.pathname.startsWith("/settings/");
  const currentPath = location.pathname + location.search;
  const [settingsReturnTo, setSettingsReturnTo] = useState("/overview");
  if (!isSettingsRoute && settingsReturnTo !== currentPath) setSettingsReturnTo(currentPath);
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
      <OnboardingGuard>
        <VoiceSessionProvider>
        <div data-sky-card-page={isSkyCardPage(location.pathname) ? "" : undefined} className="bg-background w-full h-full min-h-screen flex flex-col md:flex-row overflow-hidden hide-scrollbar dynamic-height">
          <Modal />
          {sidebarOpen && (
            <div
              className="fixed inset-0 modal-overlay bg-overlay-backdrop z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          {!isSettingsRoute ? (
            <div
              inert={isMobile ? !sidebarOpen : mainSidebarCollapsed}
              className={cn(
                sidebarOpen
                  ? "translate-x-0"
                  : "-translate-x-full md:translate-x-0",
                "fixed md:relative inset-y-0 left-0 z-50 md:z-auto",
                "navigation-sidebar",
                "w-full shrink-0",
                "md:w-[280px]",
                mainSidebarCollapsed &&
                  "md:!w-0 md:!min-w-0 md:overflow-hidden md:opacity-0",
              )}
            >
              <DashboardSideBar compact={false} onCollapse={() => {
                restoreSidebarFocus.current = true;
                handleMainSidebarToggle();
              }} />
            </div>
          ) : null}
          <main ref={mainRef} className="flex min-w-0 flex-1 flex-col overflow-hidden dynamic-height-content">
            <DashboardHeaderActionsProvider>
              <ConversationChromeProvider>
                {!isVoiceChatRoute && !isSettingsRoute ? (
                  <DashboardHeader
                    onMenuClick={() => setSidebarOpen(true)}
                    mobileSidebarOpen={sidebarOpen}
                    mainSidebarCollapsed={mainSidebarCollapsed}
                    onMainSidebarToggle={handleMainSidebarToggle}
                  />
                ) : null}
                {!isSettingsRoute ? (
                  <div className={cn("shrink-0", !isVoiceChatRoute && "pt-[60px] sm:pt-0")}>
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
                        isChatRoute || isPeopleRoute || isSettingsRoute ? "overflow-hidden" : "overflow-y-auto",
                      )}
                    >
                      <Outlet context={{ settingsReturnTo }} />
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
        </div>
      </VoiceSessionProvider>
      </OnboardingGuard>
    </AuthCheck>
  );
}
