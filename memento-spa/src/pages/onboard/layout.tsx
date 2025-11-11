import AuthCheck from "@/components/layouts/auth-check";
import { Outlet } from "react-router-dom";

export default function OnboardLayout() {
  return (
    <div className="flex h-screen w-screen justify-center overflow-y-auto bg-background">
      <AuthCheck>
        <div className="mx-auto h-fit w-full max-w-[640px] py-[100px]">
          <Outlet />
        </div>
      </AuthCheck>
    </div>
  );
}

