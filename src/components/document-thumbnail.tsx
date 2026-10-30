import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";
import type { PDFDocumentLoadingTask, RenderTask } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { IFile } from "@/utility/interface";
import { useSignedMediaAccess } from "@/features/media/signed-media-access";
import { getDocumentKind } from "@/components/modal/file-preview/document-kind";
import { extractPlainTextPreview } from "@/components/modal/memory/create/document-preview";

export default function DocumentThumbnail({ file }: { file: IFile }) {
  const { src, onError } = useSignedMediaAccess(file);
  const kind = getDocumentKind(file);
  const [text, setText] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    let loadingTask: PDFDocumentLoadingTask | undefined;
    let renderTask: RenderTask | undefined;
    setText(null);
    setReady(false);
    if (kind === "unsupported" || (kind === "text" && Number(file.size) > 5 * 1024 * 1024)) return;
    const load = async () => {
      try {
        const response = await fetch(src, { signal: controller.signal });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) await onError();
          return;
        }
        if (kind === "text") {
          const value = await response.text();
          if (!controller.signal.aborted) setText(extractPlainTextPreview(value));
          return;
        }
        const data = await response.arrayBuffer();
        const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
        if (controller.signal.aborted) return;
        GlobalWorkerOptions.workerSrc = workerUrl;
        loadingTask = getDocument({ data, isEvalSupported: false });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        if (controller.signal.aborted) return;
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context) return;
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: 200 / base.width });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        renderTask = page.render({ canvas, canvasContext: context, viewport });
        await renderTask.promise;
        if (!controller.signal.aborted) setReady(true);
      } catch {
        // Keep a named file tile when a thumbnail cannot be generated.
      } finally {
        if (loadingTask) void loadingTask.destroy().catch(() => undefined);
      }
    };
    void load();
    return () => {
      controller.abort();
      renderTask?.cancel();
      if (loadingTask) void loadingTask.destroy().catch(() => undefined);
    };
  }, [src, kind, onError, file.size]);

  return (
    <div className="relative flex size-full flex-col overflow-hidden rounded-lg bg-bg-neutral-solid p-2 text-text-neutral-strong">
      <canvas ref={canvasRef} role="img" aria-label={`First page of ${file.name}`} hidden={!ready} className="absolute inset-0 size-full object-cover object-top" />
      {!ready && <>
        <span className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase text-text-neutral-weak"><FileText className="size-3" aria-hidden />{kind === "pdf" ? "PDF" : kind === "text" ? "Text" : "File"}</span>
        {text ? <p className="line-clamp-4 whitespace-pre-wrap break-words font-mono text-[9px] leading-3">{text}</p> : null}
      </>}
      <span className="absolute inset-x-0 bottom-0 truncate bg-bg-neutral-solid/95 px-2 py-1 text-[9px] font-medium" title={file.name}>{file.name}</span>
    </div>
  );
}
