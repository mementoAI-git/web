import { useLocation, useNavigate } from "react-router-dom";
import { PricingOverlay } from "@/features/pricing/pricing-overlay";

export default function PricingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const origin =
    (location.state as { returnTo?: string } | null)?.returnTo ??
    new URLSearchParams(location.search).get("returnTo");
  const returnTo =
    typeof origin === "string" &&
    origin.startsWith("/") &&
    !origin.startsWith("//") &&
    !origin.includes("\\") &&
    origin.split(/[?#]/)[0] !== "/pricing"
      ? origin
      : "/overview";
  return (
    <PricingOverlay
      open
      onOpenChange={(open) => {
        if (!open) navigate(returnTo, { replace: true });
      }}
    />
  );
}
