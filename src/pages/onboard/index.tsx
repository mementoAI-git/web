import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import welcomeImage from "@/assets/image/onboarding/welcome-image.png";

const primaryButtonClass =
  "rounded-[64px] !bg-fill-brand-strong hover:!bg-fill-brand-weak px-8 sm:px-12 py-6 font-inter text-sm font-semibold text-white shadow-sm";

export function OnboardPage() {
  const navigate = useNavigate();

  const handleLetGo = () => {
    navigate("/onboard/welcome");
  };

  return (
    <div className="flex flex-col items-center gap-6 sm:gap-8 text-center">
      <img
        src={welcomeImage}
        alt="Welcome - memories and moments to cherish"
        className="w-full h-auto max-w-[400px] max-h-[265px] mx-auto object-cover"
      />
      <div className="flex flex-col justify-start items-center gap-0 space-y-3 sm:space-y-4">
        <h1 className="font-garamond max-w-[349px] text-2xl sm:text-[26px] md:text-[26px] font-normal leading-[32px] sm:leading-[36px] md:leading-[32px] text-[var(--v3-text-strong)]">
          Your quiet space to reflect, to preserve, to remember
        </h1>
        <p className="font-garamond max-w-[492px] mx-auto text-base sm:text-xl md:text-[20px] font-light leading-[24px] sm:leading-[25px] md:leading-[25px] text-[var(--v3-text-strong)]">
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