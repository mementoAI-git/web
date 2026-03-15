import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AuthCheck from "@/components/layouts/auth-check";
import OnboardingGuard from "@/components/layouts/onboarding-guard";
import { OnboardingNudgeBanner } from "@/features/onboarding-groot";
import { useModal } from "@/hooks/use-modal";
import { DashboardHeader } from "./dashboard-header";
import { useState } from "react";
import { DashboardSideBar } from "./dashboard-sidebar";
import Modal from "@/components/modal";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
        <main className="flex-1 flex flex-col overflow-hidden dynamic-height-content w-full md:w-auto">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex-1 overflow-hidden pt-[60px] sm:pt-0 flex flex-col">
            <div className="shrink-0 px-4 py-4 sm:px-6">
              <OnboardingNudgeBanner />
            </div>
            <Outlet />
          </div>
        </main>
      </div>
      </OnboardingGuard>
    </AuthCheck>
  );
}

