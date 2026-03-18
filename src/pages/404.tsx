import { useNavigate } from "react-router-dom";
import notFoundImage from "@/assets/image/error_404.png";
import { ArrowLeftIcon } from "@/components/icons";

export default function NotFoundPage() {
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
          alt="Not Found"
          className="w-full max-w-[250px] sm:max-w-[300px] md:max-w-[370.75px] h-auto object-cover"
        />
        <div className="text-center space-y-6 sm:space-y-8 md:space-y-10 w-full">
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            <div className="space-y-2 sm:space-y-3">
              <span className="font-inter text-sm sm:text-base font-medium text-orange uppercase">Error 404</span>
              <p className="font-garamond text-2xl sm:text-3xl md:text-[40px] leading-tight sm:leading-[36px] md:leading-[48px] font-medium text-gray-800 px-4">
                Sorry, We Couldn't Find That Page
              </p>
            </div>
            <p className="font-garamond text-lg sm:text-xl md:text-2xl text-gray-950/90 px-4">
              The page you are looking for doesn't exist or has been moved.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center w-full px-4">
            <button
              onClick={handleGoBack}
              className="btn-outline gap-[4px]! py-3 sm:!py-4 md:!py-[18px] !px-6 sm:!px-8 md:!px-12 w-full sm:w-auto"
            >
              <ArrowLeftIcon className="size-4 text-lg" />
              <span>Go back</span>
            </button>
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
  )
}