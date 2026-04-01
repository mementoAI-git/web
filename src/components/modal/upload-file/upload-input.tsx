import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import { AddImageIcon } from "@/components/icons";
import type { FileState } from "./index";

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
      className="flex h-full min-h-[40px] max-h-[300px] flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-grey-500 bg-white p-2 text-center sm:min-h-[154px] sm:max-h-[425px] sm:rounded-2xl sm:p-3 sm:text-left lg:p-4"
    >
      <AddImageIcon className="h-4 w-4 text-grey-600 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />

      <input id="file-upload-input" type="file" accept="audio/*,video/*,image/*,application/*" hidden onChange={handleUpload} />

      <div className="flex flex-col items-center justify-center gap-1 font-inter text-center sm:gap-2">
        <span className="text-xs leading-tight text-grey-600 sm:text-sm lg:text-base">
          <span className="hidden sm:inline">Drag and drop your file here or </span>
          <span className="sm:hidden">Tap to upload</span>
          <span className="hidden sm:inline">click to upload</span>
        </span>
        <span className="text-xs leading-tight text-grey-800">Max file size: 120mb</span>
      </div>

      {height > 154 && (
        <span className="btn px-3 py-2 text-xs !font-medium sm:px-4 sm:py-2.5 sm:text-sm">
          Browse files
        </span>
      )}
    </label>
  );
}

