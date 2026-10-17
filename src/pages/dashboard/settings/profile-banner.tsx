import { useRef, useState } from "react";
import { Check, ImagePlus, Upload } from "lucide-react";
import { mutate } from "swr";
import { toast } from "sonner";
import endpoint from "@/api/endpoint";
import { post, put } from "@/api/mutations";
import { useStore } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";
import { BannerPositionDialog } from "./banner-position-dialog";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import blueClouds from "@/assets/image/profile-banners/blue-clouds.webp";
import leafShadows from "@/assets/image/profile-banners/leaf-shadows.webp";
import orangeSky from "@/assets/image/profile-banners/orange-sky.webp";
import sunlitVillage from "@/assets/image/profile-banners/sunlit-village.webp";

const banners = [
  { image: blueClouds, name: "Blue clouds (default)" },
  { image: leafShadows, name: "Leaf shadows" },
  { image: orangeSky, name: "Orange sky" },
  { image: sunlitVillage, name: "Sunlit village" },
];

type BannerSelection = {
  banner_url: string | null;
  banner_preset: number;
  banner_position?: { x: number; y: number };
};

export function ProfileBanner() {
  const { user, setUser } = useStore();
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState<BannerSelection | null>(null);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const custom = selection ? selection.banner_url : user?.banner_url;

  const preset = selection?.banner_preset ?? user?.banner_preset ?? 0;
  const banner = banners[preset] || banners[0];
  const position = selection
    ? (selection.banner_position ?? { x: 50, y: 100 })
    : (user?.banner_position ?? { x: 50, y: 100 });

  const candidate = custom || banner.image;
  const displayedImage =
    candidate === failedImage ? banners[0].image : candidate;

  async function savePosition(next: { x: number; y: number }) {
    try {
      const result = await put(endpoint.profileBannerPosition, next);
      if (result.success === false) throw new Error("Position update failed");
      setSelection({
        banner_url: custom ?? null,
        banner_preset: preset,
        banner_position: next,
      });
      if (user) setUser?.({ ...user, banner_position: next });
      void mutate(endpoint.profile).catch(() => undefined);
      toast.success("Banner position updated");
      return true;
    } catch {
      toast.error("Couldn’t save your banner position. Please try again.");
      return false;
    }
  }

  async function saveBanner(choice: File | number) {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      let result;
      if (typeof choice === "number") {
        result = await put<BannerSelection>(endpoint.profileBanner, {
          banner_preset: choice,
        });
      } else {
        const body = new FormData();
        body.append("file", choice);
        result = await post<BannerSelection>(endpoint.uploadBanner, body, {
          headers: { "Content-Type": undefined },
        });
      }
      if (result.success === false || !result.data)
        throw new Error("Banner update failed");
      setSelection(result.data);
      if (user) setUser?.({ ...user, ...result.data });
      void mutate(endpoint.profile).catch(() => undefined);
      toast.success("Banner updated");
      setOpen(false);
    } catch {
      toast.error("Couldn’t update your banner. Please try again.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!savingRef.current) setOpen(next);
      }}
    >
      <div
        ref={bannerRef}
        className="relative h-[148px] overflow-hidden rounded-3xl bg-fill-neutral-weak"
      >
        <img
          src={displayedImage}
          onError={() => setFailedImage(candidate)}
          alt="Profile banner"
          className="h-full w-full object-cover"
          style={{ objectPosition: `${position.x}% ${position.y}%` }}
        />
        <div className="absolute right-4 top-4 flex gap-2">
          <BannerPositionDialog
            image={displayedImage}
            disabled={candidate === failedImage}
            position={position}
            getAspectRatio={() => (bannerRef.current?.clientWidth || 888) / 148}
            onSave={savePosition}
          />
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-2 border-stroke-neutral-weak bg-bg-neutral text-text-neutral-strong shadow-sm hover:bg-fill-neutral-weak aria-expanded:bg-bg-neutral aria-expanded:text-text-neutral-strong"
            >
              <ImagePlus className="size-4" aria-hidden />
              Change banner
            </Button>
          </DialogTrigger>
        </div>
      </div>
      <DialogContent
        onEscapeKeyDown={(event) => {
          if (savingRef.current) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (savingRef.current) event.preventDefault();
        }}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto bg-bg-neutral text-text-neutral-strong"
      >
        <DialogHeader>
          <DialogTitle>Change banner</DialogTitle>
          <DialogDescription className="text-text-neutral-weak">
            Choose a background or upload your own image.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {banners.map((option, index) => (
            <button
              key={option.name}
              type="button"
              aria-label={option.name}
              aria-pressed={!custom && preset === index}
              disabled={saving}
              onClick={() => void saveBanner(index)}
              className="relative overflow-hidden rounded-xl border border-stroke-neutral-weak focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-brand-strong disabled:opacity-60"
            >
              <img
                src={option.image}
                alt=""
                className="aspect-[2/1] w-full object-cover object-bottom"
              />
              <span className="block bg-bg-neutral px-3 py-2 text-left font-inter text-xs text-text-neutral-strong">
                {option.name}
              </span>
              {!custom && preset === index && (
                <span className="absolute right-2 top-2 rounded-full bg-bg-neutral p-1 text-icon-neutral-strong">
                  <Check className="size-4" aria-hidden />
                </span>
              )}
            </button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          className="mt-3 gap-2"
          disabled={saving}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" aria-hidden />
          {saving ? "Saving banner…" : "Upload image"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          aria-label="Upload banner image"
          accept="image/*"
          className="sr-only"
          disabled={saving}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            if (
              !file.type.startsWith("image/") ||
              file.size > 15 * 1024 * 1024
            ) {
              toast.error("Choose an image smaller than 15 MB.");
              return;
            }
            void saveBanner(file);
          }}
        />
        {saving && (
          <p role="status" className="text-sm text-text-neutral-weak">
            Saving your banner…
          </p>
        )}
        <p className="mt-2 font-inter text-xs text-text-neutral-weak">
          Images up to 15 MB. Saved as WebP.
        </p>
      </DialogContent>
    </Dialog>
  );
}
