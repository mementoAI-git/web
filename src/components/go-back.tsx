import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@/components/icons";

export default function GoBack() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center gap-1.5 rounded-full bg-v3-fill-weak py-2.5 px-3.5 text-sm font-medium text-v3-text-weak transition hover:scale-95"
      type="button"
    >
      <ArrowLeftIcon className="size-3 shrink-0 text-v3-text-weak" />
      <span>Go back</span>
    </button>
  );
}