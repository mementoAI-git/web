import errorImage from "@/assets/image/error.png";
import { ErrorState } from "@/components/error-state";

/**
 * Also the Sentry fallback, which renders outside the router, so it uses the
 * browser's history and a full load instead of router navigation. A full load
 * also clears whatever state crashed.
 */
export default function ErrorPage() {
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
      primaryLabel="Overview"
      onBack={() => window.history.back()}
      onPrimary={() => window.location.assign("/overview")}
    />
  );
}
