import { useRef, useState } from "react";
import { Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Position = {x: number; y: number};
const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function BannerPositionDialog({image, position, getAspectRatio, onSave}: {
  image: string;
  position: Position;
  getAspectRatio: () => number;
  onSave: (position: Position) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(position);
  const [ratio, setRatio] = useState(6);
  const [saving, setSaving] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{x: number; y: number; position: Position} | null>(null);
  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (saving) return;
      if (value) {setDraft(position); setRatio(getAspectRatio());}
      setOpen(value);
    }}>
      <DialogTrigger asChild><Button type="button" size="sm" variant="secondary" className="gap-2 bg-bg-neutral shadow-none"><Move className="size-4" aria-hidden />Adjust banner</Button></DialogTrigger>
      <DialogContent data-sky-card-page="" className="sky-card max-h-[calc(100dvh-2rem)] overflow-y-auto bg-bg-neutral text-text-neutral-strong">
        <DialogHeader><DialogTitle>Adjust banner</DialogTitle><DialogDescription className="text-text-neutral-weak">Drag the image or use the sliders to choose what appears in your banner.</DialogDescription></DialogHeader>
        <div className="touch-none overflow-hidden rounded-2xl bg-fill-neutral-weak" style={{aspectRatio: ratio}}>
          <img ref={imageRef} src={image} alt="Banner position preview" draggable={false} className="h-full w-full cursor-grab select-none object-cover active:cursor-grabbing" style={{objectPosition: `${draft.x}% ${draft.y}%`}}
            onPointerDown={(event) => {
              if (saving) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              drag.current = {x: event.clientX, y: event.clientY, position: draft};
            }}
            onPointerMove={(event) => {
              const start = drag.current;
              const img = imageRef.current;
              if (!start || !img?.naturalWidth) return;
              const scale = Math.max(img.clientWidth / img.naturalWidth, img.clientHeight / img.naturalHeight);
              const overflowX = img.naturalWidth * scale - img.clientWidth;
              const overflowY = img.naturalHeight * scale - img.clientHeight;
              setDraft({x: overflowX > 1 ? clamp(start.position.x - (event.clientX - start.x) / overflowX * 100) : start.position.x, y: overflowY > 1 ? clamp(start.position.y - (event.clientY - start.y) / overflowY * 100) : start.position.y});
            }}
            onPointerUp={() => {drag.current = null;}}
            onPointerCancel={() => {drag.current = null;}}
            onLostPointerCapture={() => {drag.current = null;}}
          />
        </div>
        <div className="space-y-4">
          <label className="flex flex-col gap-2 font-inter text-sm">Vertical position<input type="range" min="0" max="100" value={draft.y} disabled={saving} onChange={(event) => setDraft({...draft, y: Number(event.target.value)})} /></label>
          <label className="flex flex-col gap-2 font-inter text-sm">Horizontal position<input type="range" min="0" max="100" value={draft.x} disabled={saving} onChange={(event) => setDraft({...draft, x: Number(event.target.value)})} /></label>
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="ghost" disabled={saving} onClick={() => setDraft({x: 50, y: 100})}>Align to bottom</Button>
          <Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="button" disabled={saving} onClick={async () => {setSaving(true); try {if (await onSave(draft)) setOpen(false);} finally {setSaving(false);}}}>{saving ? "Saving…" : "Save position"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
