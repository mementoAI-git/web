import { Outlet } from "react-router-dom";
import AuthCheck from "@/components/layouts/auth-check";

export default function OnboardingGrootLayout() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <AuthCheck>
        <Outlet />
      </AuthCheck>
    </div>
  );
}
