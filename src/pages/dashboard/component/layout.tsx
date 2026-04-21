import { useEffect, useState } from "react";
import { cn } from "@/utility";
import { Outlet, useLocation, useMatch, useNavigate } from "react-router-dom";
import AuthCheck from "@/components/layouts/auth-check";
import OnboardingGuard from "@/components/layouts/onboarding-guard";
import { OnboardingNudgeBanner } from "@/features/onboarding-groot";
import { SecurityNudgeBanner } from "@/components/security-nudge-banner";
import { TrialBanner } from "@/components/trial-banner";
import { useModal } from "@/hooks/use-modal";
import { useChatSidebar } from "@/contexts/chat-sidebar";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSideBar } from "./dashboard-sidebar";
import { DashboardChatSidebar } from "./dashboard-chat-sidebar";
import Modal from "@/components/modal";
import { ConversationChromeProvider } from "@/contexts/conversation-chrome";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mainSidebarCollapsed, setMainSidebarCollapsed] = useState(false);
  const { chatOpen, setChatOpen } = useChatSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { open } = useModal();
  const isVoiceChatRoute = Boolean(
    useMatch({ path: "/chat/:id/voice", end: true }),
  );

  useEffect(() => {
    const modalName = (location.state as { openModal?: string } | null)?.openModal;
    if (modalName) {
      open(modalName);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, open, navigate]);

  useEffect(() => () => setChatOpen(false), [setChatOpen]);

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
      <div className="bg-white w-full h-full min-h-screen flex flex-col md:flex-row overflow-hidden hide-scrollbar dynamic-height">
        <Modal />
        {sidebarOpen && (
          <div
            className="fixed inset-0 modal-overlay bg-overlay-backdrop z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div
          className={cn(
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            "fixed md:relative inset-y-0 left-0 z-50 md:z-auto",
            "transition-all duration-300 ease-in-out md:transition-all",
            "w-full md:w-[250px] shrink-0",
            mainSidebarCollapsed && "md:!w-0 md:!min-w-0 md:overflow-hidden md:opacity-0",
          )}
        >
          <DashboardSideBar onClose={() => setSidebarOpen(false)} />
        </div>
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden dynamic-height-content">
          <ConversationChromeProvider>
            {!isVoiceChatRoute ? (
              <DashboardHeader
                onMenuClick={() => setSidebarOpen(true)}
                mobileSidebarOpen={sidebarOpen}
                mainSidebarCollapsed={mainSidebarCollapsed}
                onMainSidebarToggle={handleMainSidebarToggle}
              />
            ) : null}
            <div
              className={cn(
                "flex flex-1 flex-col overflow-hidden md:flex-row",
                !isVoiceChatRoute && "pt-[60px] sm:pt-0",
              )}
            >
<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                  <div className={cn(
                    "w-full min-w-0 shrink-0 px-4 pt-[3px] pb-0.5 text-v3-text-strong sm:px-6",
                    isVoiceChatRoute ? "bg-sand-1" : "bg-white"
                  )}>
                    <OnboardingNudgeBanner />
                    <TrialBanner />
                    <SecurityNudgeBanner />
                  </div>
                <div className="hide-scrollbar h-full min-h-0 w-full flex-1 overflow-y-auto">
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
        </main>
      </div>
      </OnboardingGuard>
    </AuthCheck>
  );
}

