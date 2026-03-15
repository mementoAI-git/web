import { useEffect, useState } from "react";
import { cn } from "@/utility";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AuthCheck from "@/components/layouts/auth-check";
import OnboardingGuard from "@/components/layouts/onboarding-guard";
import { OnboardingNudgeBanner } from "@/features/onboarding-groot";
import { useModal } from "@/hooks/use-modal";
import { useChatSidebar } from "@/contexts/chat-sidebar";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSideBar } from "./dashboard-sidebar";
import { DashboardChatSidebar } from "./dashboard-chat-sidebar";
import Modal from "@/components/modal";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { chatOpen, setChatOpen } = useChatSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { open } = useModal();

  useEffect(() => {
    const modalName = (location.state as { openModal?: string } | null)?.openModal;
    if (modalName) {
      open(modalName);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, open, navigate]);

  useEffect(() => () => setChatOpen(false), [setChatOpen]);

  return (
    <AuthCheck>
      <OnboardingGuard>
      <div className="bg-white w-full h-full min-h-screen flex flex-col md:flex-row overflow-hidden hide-scrollbar dynamic-height">
        <Modal />
        {sidebarOpen && (
          <div
            className="fixed inset-0 modal-overlay bg-[rgba(94,94,94,0.5)] z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          fixed md:relative inset-y-0 left-0 z-50 md:z-auto
          transition-transform duration-300 ease-in-out md:transition-none w-full md:w-[250px]
        `}>
          <DashboardSideBar onClose={() => setSidebarOpen(false)} />
        </div>
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden dynamic-height-content">
          <DashboardHeader
            onMenuClick={() => setSidebarOpen(true)}
            chatOpen={chatOpen}
            onChatToggle={() => setChatOpen(!chatOpen)}
          />
          <div className="flex flex-1 flex-col overflow-hidden pt-[60px] sm:pt-0 md:flex-row">
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <div className="shrink-0 px-4 py-2 sm:px-6">
                <OnboardingNudgeBanner />
              </div>
              <div className="flex-1 overflow-hidden">
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
        </main>
      </div>
      </OnboardingGuard>
    </AuthCheck>
  );
}

