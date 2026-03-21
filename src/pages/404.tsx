import { useNavigate } from "react-router-dom";
import notFoundImage from "@/assets/image/error_404.png";
import { ErrorStateGoBackButton } from "@/components/error-state-outline-button";

export default function NotFoundPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoOverview = () => {
    navigate("/overview");
  };

  return (
    <div className="flex w-screen min-h-screen items-center justify-center bg-background px-4 py-8 sm:px-6 md:px-8">
      <div className="flex flex-col items-center justify-center gap-8 sm:gap-12 md:gap-[56px] w-full max-w-4xl">
        <img
          src={notFoundImage}
          alt="Not Found"
          className="w-full max-w-[250px] sm:max-w-[300px] h-[130px] object-cover"
        />
        <div className="text-center space-y-6 sm:space-y-8 md:space-y-10 w-full flex flex-col justify-start items-center">
          <div className="space-y-4 sm:space-y-5 md:space-y-6 flex flex-col justify-start items-center">
            <div className="flex flex-col items-center justify-start gap-2 sm:gap-3">
              <span className="font-inter text-xs font-medium uppercase text-v3-brand-strong">
                Error 404
              </span>
              <p className="font-garamond text-2xl sm:text-3xl md:text-3xl leading-tight sm:leading-[36px] md:leading-[40px] font-normal text-v3-text-strong px-4 w-fit">
                Sorry, We Couldn't Find That Page
              </p>
              <p className="font-garamond text-[20px] text-v3-text-weak px-4 w-fit">
                The page you are looking for doesn't exist or has been moved.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center w-full px-4">
            <ErrorStateGoBackButton onClick={handleGoBack} />
            <button
              onClick={handleGoOverview}
              className="btn h-fit !bg-v3-brand-strong !text-white !py-3 sm:!py-4 md:!py-[14px] !px-6 sm:!px-8 md:!px-12 w-full sm:w-auto"
            >
              Overview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
