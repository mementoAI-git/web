import { Navigate } from "react-router-dom";
import { useStore } from "@/hooks/use-store";

/** Keep existing Settings links working while People has one management surface. */
export default function BeneficiaryAndGroup() {
  const { user } = useStore();
  return (
    <Navigate
      to={`/chat/${user?.primary_conversation_id || "new"}?people=1`}
      replace
    />
  );
}
