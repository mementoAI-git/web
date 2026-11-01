import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/** AI artwork is independent of user avatars and DiceBear styles. */
export function VoiceAvatar({ artwork, title, className }: { artwork: string; title: string; className?: string }) {
  const gradient = artwork.startsWith("linear-gradient(");
  return (
    <Avatar className={cn("overflow-hidden", className)}>
      {gradient ? (
        <span role="img" aria-label={`${title} voice avatar`} className="size-full" style={{ backgroundImage: artwork }} />
      ) : (
        <AvatarImage src={artwork} alt={`${title} voice avatar`} />
      )}
      {!gradient && <AvatarFallback>{title.slice(0, 2).toUpperCase()}</AvatarFallback>}
    </Avatar>
  );
}
