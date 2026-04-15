import { Outlet } from "react-router-dom";
import AuthCheck from "@/components/layouts/auth-check";

export default function OnboardingGrootLayout() {
  return (
    <div className="min-h-screen bg-v3-bg">
      <AuthCheck>
        <Outlet />
      </AuthCheck>
    </div>
  );
}
