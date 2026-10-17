import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import { AddImageIcon } from "@/components/icons";
import type { FileState } from "./index";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UploadInputProps {
  onUpload: (file: FileState) => void;
}

export default function UploadInput({ onUpload }: UploadInputProps) {
  const labelRef = useRef<HTMLLabelElement>(null);
  const [height, setHeight] = useState(425);

  const handleUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      onUpload({ id: uuidv4(), file, progress: 0 });
      event.target.value = "";
    },
    [onUpload],
  );

  useEffect(() => {
    if (!labelRef.current) return;

    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        setHeight(entry.contentRect.height);
      });
    });

    observer.observe(labelRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <label
      htmlFor="file-upload-input"
      ref={labelRef}
      className={cn(
        "relative flex min-h-[220px] w-full cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-dashed border-border bg-muted/25 px-6 py-8 text-center transition-colors hover:border-border/80 hover:bg-muted/40",
        height > 260 && "min-h-[280px]",
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border/70">
        <AddImageIcon className="size-5 text-muted-foreground" />
      </div>

      <input id="file-upload-input" type="file" accept="audio/*,video/*,image/*,application/*" hidden onChange={handleUpload} />

      <div className="flex max-w-md flex-col items-center justify-center gap-2 font-inter text-center">
        <p className="text-sm font-medium text-foreground sm:text-base">
          Drag and drop your file here, or browse from your device
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          Supports photos, video, audio, and documents up to 120 MB.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Badge variant="outline">Images</Badge>
        <Badge variant="outline">Video</Badge>
        <Badge variant="outline">Audio</Badge>
        <Badge variant="outline">Docs</Badge>
      </div>

      {height > 154 ? (
        <Button type="button" variant="outline" className="pointer-events-none">
          Browse files
        </Button>
      ) : null}
    </label>
  );
}
