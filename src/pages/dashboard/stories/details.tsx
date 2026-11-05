import { useEffect, useState } from "react";
import useSWR from "swr";
import Spinner from "@/components/spinner";
import endpoint from "@/api/endpoint";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useModal } from "@/hooks/use-modal";
import StoriesPage from "./index";
import MobileStoryDetails from "./mobile-details";

/** Existing story links use the same viewer as the stories library. */
export default function StoriesDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useSWR(id ? `${endpoint.memories}/${id}` : null);
  const isReflection = Boolean(data?.data?.prompt_type);
  useEffect(() => {
    if (isReflection && id)
      navigate(`/chat/reflection/${id}`, { replace: true });
  }, [isReflection, id, navigate]);
  const { open, close } = useModal();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (isLoading || isReflection || isMobile || !id) return;
    open?.("view-memory", { memoryId: id });
    return () => close?.("view-memory");
  }, [id, isMobile, open, close, isLoading, isReflection]);

  if (isLoading || isReflection) return <div role="status" aria-label="Opening story" className="flex flex-1 items-center justify-center"><Spinner loading /></div>;
  return isMobile ? <MobileStoryDetails /> : <StoriesPage />;
}
