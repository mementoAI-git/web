import { useNavigate } from "react-router-dom";
import welcomeImage from "@/assets/image/onboarding/welcome-image.png";

export function OnboardPage() {
  const navigate = useNavigate();

  const handleLetGo = () => {
    navigate("/onboard/welcome");
  };

  return (
    <div className="space-y-6 sm:space-y-8 px-4 sm:px-5 py-6 sm:py-8">
      <img
        src={welcomeImage}
        alt="Welcome"
        className="w-full h-auto max-w-[525.95px] max-h-[337.87px] mx-auto object-cover"
      />
      <div className="space-y-3 sm:space-y-4">
        <h3 className="font-garamond w-full max-w-[352px] mx-auto text-center text-2xl sm:text-[28px] md:text-[32px] font-medium leading-[32px] sm:leading-[36px] md:leading-[38px] text-gray-800 px-2">
          Your quiet space to reflect, to preserve, to remember
        </h3>
        <p className="font-garamond w-full max-w-[546.35px] mx-auto text-center text-base sm:text-xl md:text-[24px] font-normal leading-[24px] sm:leading-[28px] md:leading-[32px] text-gray-950/90 px-4 sm:px-2">
          Welcome to Memento AI, A safe, gentle memory box where all your life's experiences are cherished. Capture your thoughts, share your ideas, and preserve what truly matters.
        </p>
      </div>
      <div className="w-full flex justify-center">
        <button
          onClick={handleLetGo}
          type="button"
          className="bg-[#52A1DD] cursor-pointer py-4 sm:py-[18px] px-8 sm:px-[48px] rounded-full font-inter text-white font-semibold text-sm sm:text-[14px] leading-[20px] transition-colors duration-200 hover:bg-[#4A8FC9] active:bg-[#427DB5]"
        >
          Let's go!
        </button>
      </div>
    </div>
  );
}

export { default as WelcomePage } from "./welcome";
export { default as NicknamePage } from "./nickname";
export { default as MiscPage } from "./misc";
export { default as BeneficiaryPage } from "./beneficiary";
export { default as OnboardLayout } from "./layout";