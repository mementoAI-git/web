import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@/components/icons";

export default function GoBack() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center gap-1.5 rounded-full bg-sand-3 py-2.5 px-3.5 text-sm font-medium text-sand-10 transition hover:scale-95"
      type="button"
    >
      <ArrowLeftIcon className="size-3 text-lg" />
      <span>Go back</span>
    </button>
  );
}