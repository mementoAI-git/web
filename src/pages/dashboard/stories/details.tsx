import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useModal } from "@/hooks/use-modal";
import StoriesPage from "./index";
import MobileStoryDetails from "./mobile-details";

/** Existing story links use the same viewer as the stories library. */
export default function StoriesDetails() {
  const { id } = useParams();
  const { open, close } = useModal();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (isMobile || !id) return;
    open?.("view-memory", { memoryId: id });
    return () => close?.("view-memory");
  }, [id, isMobile, open, close]);

  return isMobile ? <MobileStoryDetails /> : <StoriesPage />;
}
