import { useNavigate } from "react-router-dom";
import notFoundImage from "@/assets/image/error.png";
import { ErrorStateGoBackButton } from "@/components/error-state-outline-button";

export default function ErrorPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="flex w-screen min-h-screen items-center justify-center bg-background px-4 py-8 sm:px-6 md:px-8">
      <div className="flex flex-col items-center justify-center gap-8 sm:gap-12 md:gap-[56px] w-full max-w-4xl">
        <img
          src={notFoundImage}
          alt="Error"
          className="w-full max-w-[250px] sm:max-w-[300px] md:max-w-[370.75px] h-auto object-cover"
        />
        <div className="flex w-full flex-col items-center text-center gap-6 sm:gap-8 md:gap-10">
          <div className="flex flex-col items-center gap-2 sm:gap-3">
            <span className="font-inter text-xs font-medium uppercase text-[var(--v3-brand-strong)]">
              Error 505
            </span>
            <p className="font-garamond text-2xl sm:text-3xl md:text-xl leading-tight sm:leading-[36px] md:leading-[40px] font-normal text-[var(--v3-text-strong)] px-4 w-fit">
              Sorry, We Seem to be Having an Issue
            </p>
            <p className="font-garamond text-[20px] text-[var(--v3-text-strong)] px-4 w-fit">
              We have been automatically notified of this issue and will resolve it.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center w-full px-4">
            <ErrorStateGoBackButton onClick={handleGoBack} />
            <button
              onClick={handleGoHome}
              className="btn !py-3 sm:!py-4 md:!py-[18px] !px-6 sm:!px-8 md:!px-12 w-full sm:w-auto"
            >
              Homepage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
