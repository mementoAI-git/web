import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy, type RenderTask } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Button } from "@/components/ui/button";

export default function PdfPreview({ data, onRetry }: { data: ArrayBuffer; onRetry: () => void }) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [width, setWidth] = useState(600);
  const [zoom, setZoom] = useState(1);
  const [rendering, setRendering] = useState(true);
  const [error, setError] = useState(false);
  const [pageText, setPageText] = useState("");
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!pdf || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      setPageNumber((value) => Math.max(1, Math.min(pdf.numPages, value + (event.key === "ArrowRight" ? 1 : -1))));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pdf]);

  useEffect(() => {
    GlobalWorkerOptions.workerSrc = workerUrl;
    // PDF.js transfers the buffer to its worker; keep the source reusable for retries.
    const task = getDocument({ data: new Uint8Array(data.slice(0)), isEvalSupported: false });
    let cancelled = false;
    setPdf(null);
    setError(false);
    setPageNumber(1);
    void task.promise.then((document) => {
      if (!cancelled) setPdf(document);
    }).catch(() => {
      if (!cancelled) setError(true);
    });
    return () => {
      cancelled = true;
      void task.destroy().catch(() => undefined);
    };
  }, [data]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const resize = () => setWidth(Math.max(100, viewport.clientWidth - 32));
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!pdf) return;
    let cancelled = false;
    let task: RenderTask | undefined;
    setRendering(true);
    setPageText("");
    setError(false);
    viewportRef.current?.scrollTo?.(0, 0);
    const render = async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context) throw new Error("Canvas unavailable");
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: (width / base.width) * zoom });
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.ceil(viewport.width * pixelRatio);
        canvas.height = Math.ceil(viewport.height * pixelRatio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        task = page.render({ canvas, canvasContext: context, viewport, transform: [pixelRatio, 0, 0, pixelRatio, 0, 0] });
        await task.promise;
        const text = await page.getTextContent();
        if (!cancelled) {
          setPageText(text.items.map((item) => "str" in item ? item.str : "").join(" "));
          setRendering(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    };
    void render();
    return () => { cancelled = true; task?.cancel(); };
  }, [pdf, pageNumber, width, zoom]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-2 border-b border-stroke-neutral-weak p-2">
        <Button variant="ghost" size="icon" aria-label="Previous PDF page" disabled={!pdf || pageNumber <= 1} onClick={() => setPageNumber((value) => value - 1)}><ChevronLeft aria-hidden /></Button>
        <span aria-live="polite" className="text-sm tabular-nums">Page {pageNumber} of {pdf?.numPages ?? "…"}</span>
        <Button variant="ghost" size="icon" aria-label="Next PDF page" disabled={!pdf || pageNumber >= pdf.numPages} onClick={() => setPageNumber((value) => value + 1)}><ChevronRight aria-hidden /></Button>
        <label className="flex items-center gap-2 text-sm">Zoom
          <select value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="rounded-md border border-stroke-neutral-weak bg-bg-neutral-solid p-1 focus-visible:outline-2 focus-visible:outline-text-neutral-strong">
            <option value={1}>Fit width</option><option value={1.5}>150%</option><option value={2}>200%</option>
          </select>
        </label>
      </div>
      <div ref={viewportRef} tabIndex={0} aria-label="PDF document pages" className="min-h-0 flex-1 overflow-auto bg-fill-neutral-weaker p-4">
        {error ? <div className="space-y-3 p-4 text-center"><p role="alert" className="text-sm text-text-neutral-weak">Unable to preview this PDF. Try again or download it to open in a PDF reader.</p><Button variant="outline" onClick={onRetry}>Retry preview</Button></div>
          : (!pdf || rendering) ? <p role="status" className="p-4 text-center text-sm text-text-neutral-weak">Loading PDF page…</p> : null}
        <canvas ref={canvasRef} role="img" aria-label={`PDF page ${pageNumber}`} hidden={!pdf || rendering || error} className="mx-auto shrink-0 shadow-sm" />
        <p className="sr-only">{pageText}</p>
      </div>
    </>
  );
}
