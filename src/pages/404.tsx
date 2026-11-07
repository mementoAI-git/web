import { useNavigate } from "react-router-dom";
import notFoundImage from "@/assets/image/error_404.png";
import { ErrorState } from "@/components/error-state";

export default function NotFoundPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (typeof window.history.state?.idx === "number" && window.history.state.idx > 0) navigate(-1);
    else navigate("/overview", { replace: true });
  };

  return (
    <ErrorState
      image={notFoundImage}
      imageAlt="Not Found"
      code="Error 404"
      title={
        <>
          Sorry, we couldn’t <em>find that page</em>
        </>
      }
      description="The page you are looking for doesn’t exist or has been moved."
      primaryLabel="Overview"
      onBack={handleGoBack}
      onPrimary={() => navigate("/overview")}
    />
  );
}
