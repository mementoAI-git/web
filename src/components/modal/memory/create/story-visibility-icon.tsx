import { Users } from "lucide-react";
import privateIcon from "@/assets/icon/mingcute_lock-fill.svg";
import everyoneIcon from "@/assets/icon/heroicons_users-16-solid.svg";

/** The icon for who can see a story, shared by the access field and Story Details. */
export function StoryVisibilityIcon({
  audience,
}: {
  audience: "private" | "everyone" | "shared";
}) {
  if (audience === "shared") {
    return <Users className="size-4 shrink-0 text-text-neutral-weaker" aria-hidden />;
  }
  return (
    <img
      data-testid="story-visibility-icon"
      src={audience === "everyone" ? everyoneIcon : privateIcon}
      alt=""
      aria-hidden="true"
      className="size-4 shrink-0 object-contain"
    />
  );
}
