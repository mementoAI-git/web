import AuthCheck from "@/components/layouts/auth-check";
import { Link, Outlet, useNavigate } from "react-router-dom";
import Logo from "@/components/logo";
import { storageKeys } from "@/utility/constant";

export default function OnboardLayout() {
  const navigate = useNavigate();

  const handleSkip = () => {
    try {
      localStorage.setItem(storageKeys.onboardingSkipped, "true");
    } catch {
      // ignore
    }
    navigate("/overview");
  };

  return (
    <div className="flex h-dvh w-screen flex-col bg-white">
      {/* Header: always visible, outside AuthCheck so it shows immediately */}
      <header className="sticky top-0 z-[100] flex shrink-0 items-center justify-between border-b border-[#E4D9CC] bg-white px-4 py-6 sm:px-6 shadow-sm">
        <Link
          to="/"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8956C] focus-visible:ring-offset-2 rounded"
        >
          <Logo />
        </Link>
        <button
          type="button"
          onClick={handleSkip}
          className="text-sm font-medium text-[#7A6A5E] hover:text-[#2C1F15] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8956C] focus-visible:ring-offset-2 rounded"
        >
          Skip for now →
        </button>
      </header>
      <AuthCheck>
        <main className="min-h-0 flex-1 overflow-y-auto bg-white">
          <div className="mx-auto w-full max-w-[640px] px-4 py-8 sm:py-12">
            <Outlet />
          </div>
        </main>
      </AuthCheck>
    </div>
  );
}

