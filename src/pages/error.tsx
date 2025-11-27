import { useNavigate } from "react-router-dom";
import notFoundImage from "@/assets/image/error.png";
import { ArrowLeftIcon } from "@/components/icons";

export default function ErrorPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="flex w-screen h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center justify-center gap-[56px]">
        <img src={notFoundImage} alt="Not Found" className="w-full max-w-[370.75px] h-auto object-cover" />
        <div className="text-center space-y-10">
          <div className="space-y-6">
            <div className="space-y-3">
              <span className="font-inter text-base font-medium text-orange uppercase">Error 505</span>
              <p className="font-garamond text-[40px] leading-[48px] font-medium text-gray-800">
                Sorry, We Seem to be Having an Issue
              </p>
            </div>
            <p className="font-garamond text-2xl text-gray-950/90">
              We have been automatically notified of this issue and will resolve it.
            </p>
          </div>
          <div className="flex gap-6 justify-center items-center">
            <button onClick={handleGoBack} className="btn-outline !gap-[4px] !py-[18px] !px-12">
              <ArrowLeftIcon className="size-4 text-lg" />
              <span>Go back</span>
            </button>
            <button onClick={handleGoHome} className="btn !py-[18px] !px-12">Homepage</button>
          </div>
        </div>
      </div>
    </div>
  )
}