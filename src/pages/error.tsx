import { useNavigate } from "react-router-dom";
import errorImage from "@/assets/image/error.png";
import { ErrorState } from "@/components/error-state";

export default function ErrorPage() {
  const navigate = useNavigate();

  return (
    <ErrorState
      image={errorImage}
      imageAlt="Error"
      code="Error 505"
      title={
        <>
          Sorry, we seem to be <em>having an issue</em>
        </>
      }
      description="We have been automatically notified of this issue and will resolve it."
      primaryLabel="Homepage"
      onBack={() => navigate(-1)}
      onPrimary={() => navigate("/")}
    />
  );
}
