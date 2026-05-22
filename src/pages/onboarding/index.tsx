import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import onboardingImage from "@/assets/image/onboarding image 2.png";

const primaryButtonClass =
  "rounded-[64px] !bg-fill-brand-strong px-8 sm:px-12 py-6 font-inter text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90";

export function OnboardPage() {
  const navigate = useNavigate();

  const handleLetGo = () => {
    navigate("/onboarding/welcome");
  };

  return (
    <div className="flex flex-col items-center gap-5 pb-4 text-center sm:gap-8">
      <img
        src={onboardingImage}
        alt="Welcome - memories and moments to cherish"
        className="mx-auto h-auto w-full max-w-[700px] object-cover"
      />
      <div className="flex w-full max-w-[600px] flex-col items-center justify-start gap-0 space-y-3 sm:space-y-4">
        <h1 className="font-garamond max-w-[18ch] text-2xl font-normal leading-[32px] text-[var(--v3-text-strong)] sm:text-[26px] sm:leading-[36px] md:text-[26px] md:leading-[32px]">
          Your quiet space to reflect, to preserve, to remember
        </h1>
        <p className="mx-auto w-full px-2 font-inter text-[14px] font-normal leading-6 text-[var(--v3-text-strong)] sm:px-0">
          Welcome to Memento AI. A safe, gentle memory box where all your life&apos;s experiences are cherished. Capture your thoughts, share your ideas, and preserve what truly matters.
        </p>
      </div>
      <Button onClick={handleLetGo} type="button" className={`w-full sm:w-auto ${primaryButtonClass}`}>
        Let&apos;s go!
      </Button>
    </div>
  );
}

export { default as WelcomePage } from "./welcome";
export { default as NicknamePage } from "./nickname";
export { default as MiscPage } from "./misc";
export { default as OnboardingSummaryPage } from "./summary";
export { default as BeneficiaryPage } from "./beneficiary";
export { default as OnboardLayout } from "./layout";
