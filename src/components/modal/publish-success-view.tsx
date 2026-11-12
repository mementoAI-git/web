import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePublicShareGate } from "@/features/sharing/use-public-share-gate";
import { cn } from "@/utility";
import { PublishSuccessRays } from "./publish-success-rays";
import glow from "@/assets/image/publish-success/glow.svg";
import glowDark from "@/assets/image/publish-success/glowDark.svg";
import planet from "@/assets/image/publish-success/planet.svg";
import smallCloud from "@/assets/image/publish-success/smallCloud.svg";
import bigCloud from "@/assets/image/publish-success/bigCloud.svg";
import surfer from "@/assets/image/publish-success/surfer.svg";
import LinkedIn from "@/assets/image/publish-success/linkedin.svg?react";
import Facebook from "@/assets/image/publish-success/facebook.svg?react";
import Instagram from "@/assets/image/publish-success/instagram.svg?react";
import X from "@/assets/image/publish-success/x.svg?react";

const SOCIAL = [
  { label: "LinkedIn", Icon: LinkedIn, href: (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${url}` },
  { label: "Facebook", Icon: Facebook, href: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${url}` },
  { label: "Instagram", Icon: Instagram, href: () => "https://www.instagram.com/" },
  { label: "X", Icon: X, href: (url: string) => `https://x.com/intent/tweet?url=${url}` },
];

/** The rays and glow. A bottom sheet places this behind its whole surface, so the art has no top edge. */
export function PublishSuccessBackdrop() {
  return <div data-testid="publish-success-rays" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]" aria-hidden="true">
    <PublishSuccessRays />
    <img src={glow} alt="" className="absolute -top-[33.4px] left-1/2 w-[451.354px] max-w-none -translate-x-1/2 dark:hidden" />
    <img src={glowDark} alt="" className="absolute -top-[33.4px] left-1/2 hidden w-[451.354px] max-w-none -translate-x-1/2 dark:block" />
  </div>;
}

/** Port of mobile's PublishSuccessView, using its original illustration assets. */
export function PublishSuccessView({ publishedUrl, memoryId, sheet = false, onDismiss, onAddAnother }: {
  publishedUrl: string;
  /** The story behind the link. Sharing a private one asks to make it public first. */
  memoryId?: string;
  /** Inside a bottom sheet, which owns the backdrop: the actions are pinned so they're never cut off. */
  sheet?: boolean;
  onDismiss: () => void;
  onAddAnother: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const mounted = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; clearTimeout(timer.current); };
  }, []);
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publishedUrl);
      if (!mounted.current) return;
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("We couldn’t copy the link. Please try again.");
    }
  }
  const gate = usePublicShareGate(memoryId ?? "", { onCopy: () => void copyLink() });
  return <div className={cn("relative isolate font-inter text-text-neutral-strong", !sheet && "overflow-hidden rounded-[inherit] bg-bg-neutral")}>
    {sheet ? null : <PublishSuccessBackdrop />}
    <div className={cn("relative flex flex-col", !sheet && "px-4 pb-4 pt-2")}>
      <div className="relative mx-auto aspect-[361/300] w-1/2 max-w-[180.5px]" aria-hidden="true">
        <img src={planet} alt="" className="absolute left-[16.61%] top-[24.97%] w-[8.40%] rotate-[14.22deg]" />
        <img src={smallCloud} alt="" className="absolute left-1/2 top-[13.16%] w-[6.66%]" />
        <img src={bigCloud} alt="" className="absolute left-[59.21%] top-[8.18%] w-[21.33%]" />
        <img src={surfer} alt="" className="absolute left-[24.93%] top-[30.60%] w-[50.14%]" />
      </div>
      <h2 className="mx-auto my-4 max-w-[250px] text-center text-2xl font-semibold leading-8">Story published <br />successfully</h2>
      <div className="space-y-4 rounded-[20px] bg-fill-neutral-weak p-4">
        <p className="text-sm">Share this story with friends</p>
        <div className="flex min-w-0 items-stretch overflow-hidden rounded-lg border border-stroke-neutral-weak bg-fill-neutral-weaker">
          <span className="min-w-0 flex-1 truncate px-3 py-2.5 text-base" title={publishedUrl}>{publishedUrl}</span>
          <Button variant="ghost" aria-label="Copy story link" onClick={() => (memoryId ? gate.copy(publishedUrl) : void copyLink())} className="h-auto min-h-11 shrink-0 gap-2 rounded-none border-l border-stroke-neutral-weak px-4 text-text-brand-strong">
            {copied ? <Check className="size-5 text-text-success-strong" /> : <Copy className="size-5" />}
            <span aria-live="polite" className={copied ? "text-text-success-strong" : undefined}>{copied ? "Copied" : "Copy"}</span>
          </Button>
        </div>
        <div className="flex items-center gap-3 text-xs text-text-neutral-weak"><span className="h-px flex-1 bg-stroke-neutral-weak" />Or share on social media<span className="h-px flex-1 bg-stroke-neutral-weak" /></div>
        <div className="flex justify-center gap-[22px]">
          {SOCIAL.map(({ label, Icon, href }) => <Button key={label} asChild variant="ghost" className="size-12 rounded-full bg-fill-neutral-weak p-3">
            <a href={href(encodeURIComponent(publishedUrl))} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${label}`} onClick={memoryId ? (event) => {
              event.preventDefault();
              gate.open(href(encodeURIComponent(publishedUrl)));
            } : undefined}><Icon className="size-6" aria-hidden="true" /></a>
          </Button>)}
        </div>
      </div>
      {gate.dialog}
      {sheet ? null : <div className="min-h-10 flex-1" />}
      <div className={cn("flex gap-3", sheet && "sticky bottom-0 z-10 bg-bg-raised pb-[max(1rem,env(safe-area-inset-bottom))] pt-4")}>
        <Button variant="ghost" onClick={onDismiss} className="min-h-[52px] flex-[0.45] rounded-full bg-fill-neutral-weaker px-3 text-base font-semibold">Dismiss</Button>
        <Button onClick={onAddAnother} className="min-h-[52px] flex-[0.55] rounded-full px-3 text-base font-semibold">Add another story</Button>
      </div>
    </div>
  </div>;
}
