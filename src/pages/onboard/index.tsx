import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const primaryButtonClass =
  "rounded-full !bg-orange hover:!bg-[#C55A1D] px-8 sm:px-12 py-4 sm:py-[18px] font-inter text-sm font-semibold text-white shadow-sm";

export function OnboardPage() {
  const navigate = useNavigate();

  const handleLetGo = () => {
    navigate("/onboard/welcome");
  };

  return (
    <div className="flex flex-col items-center gap-6 sm:gap-8 text-center">
      <div className="space-y-3 sm:space-y-4">
        <h1 className="font-garamond text-2xl sm:text-[28px] md:text-[32px] font-medium leading-[32px] sm:leading-[36px] md:leading-[38px] text-[#4A4A4A]">
          Your quiet space to reflect, to preserve, to remember
        </h1>
        <p className="font-garamond max-w-[546px] mx-auto text-base sm:text-xl md:text-[24px] font-normal leading-[24px] sm:leading-[28px] md:leading-[32px] text-[#4A4A4A]/90">
          Welcome to Memento AI. A safe, gentle memory box where all your life&apos;s experiences are cherished. Capture your thoughts, share your ideas, and preserve what truly matters.
        </p>
      </div>
      <Button onClick={handleLetGo} type="button" className={primaryButtonClass}>
        Let&apos;s go!
      </Button>
    </div>
  );
}

export { default as WelcomePage } from "./welcome";
export { default as NicknamePage } from "./nickname";
export { default as MiscPage } from "./misc";
export { default as BeneficiaryPage } from "./beneficiary";
export { default as OnboardLayout } from "./layout";