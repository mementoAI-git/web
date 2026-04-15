import { useModal } from "@/hooks/use-modal";
import { TimesIcon } from "@/components/icons";
import { cn } from "@/utility";

export interface SettingsAboutMeModalData {
  paragraphs?: string[];
}

export default function SettingsAboutMeModal({
  data,
}: {
  data: SettingsAboutMeModalData;
  isMobile?: boolean;
}) {
  const { close } = useModal();
  const paragraphs = (data?.paragraphs ?? []).filter((p) => p.trim().length > 0);

  return (
    <div
      className={cn(
        "modal-container max-h-[min(85dvh,640px)] w-full max-w-[min(95vw,480px)] overflow-y-auto bg-white p-6 sm:p-8",
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id="settings-about-me-title" className="font-inter text-lg font-semibold text-v3-text-strong">
          About me
        </h2>
        <button
          type="button"
          onClick={() => close("settings-about-me")}
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full border border-v3-stroke-weak",
            "text-v3-text-strong motion-safe:transition-[background-color,transform] motion-safe:duration-200 motion-safe:ease-out",
            "hover:bg-v3-fill-weaker active:motion-safe:scale-[0.97]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2",
          )}
          aria-label="Close"
        >
          <TimesIcon className="size-5" aria-hidden />
        </button>
      </div>
      <div
        className="mt-5 space-y-4"
        role="region"
        aria-labelledby="settings-about-me-title"
      >
        {paragraphs.map((p, i) => (
          <p key={i} className="font-inter text-sm leading-relaxed text-pretty text-v3-text-strong">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
