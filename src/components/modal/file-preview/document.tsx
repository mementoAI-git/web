import { lazy, Suspense, useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSignedMediaAccess } from "@/features/media/signed-media-access";
import type { FilePreviewItemBase } from "./index";
import { getDocumentKind } from "./document-kind";

const PdfPreview = lazy(() => import("./pdf"));
const MAX_TEXT_BYTES = 5 * 1024 * 1024;

export default function DocumentPreview(props: FilePreviewItemBase) {
  const { src, onError } = useSignedMediaAccess(props);
  const kind = getDocumentKind(props);
  const [content, setContent] = useState<string | ArrayBuffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (kind === "unsupported") return;
    const controller = new AbortController();
    setContent(null);
    setError(null);
    const load = async () => {
      try {
        if (kind === "text" && Number(props.size) > MAX_TEXT_BYTES) {
          throw new Error("This text file is too large to preview. Download it to read the full file.");
        }
        const response = await fetch(src, { signal: controller.signal });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            const refreshed = await onError();
            if (refreshed?.url && refreshed.url !== src) return;
          }
          throw new Error("Unable to load this document. Try again or download the file.");
        }
        const result = kind === "pdf" ? await response.arrayBuffer() : await response.text();
        if (typeof result === "string" && result.length > MAX_TEXT_BYTES) {
          throw new Error("This text file is too large to preview. Download it to read the full file.");
        }
        if (!controller.signal.aborted) setContent(result);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Unable to load this document.");
      }
    };
    void load();
    return () => controller.abort();
  }, [src, kind, attempt, onError, props.size]);

  return (
    <div data-document-content className="flex h-full min-h-0 w-full max-w-[960px] flex-col overflow-hidden rounded-xl bg-bg-neutral-solid text-text-neutral-strong shadow-2xl" role="region" aria-label={`Document ${props.name || "preview"}`}>
      {kind === "unsupported" ? (
        <div className="m-auto space-y-3 p-6 text-center">
          <FileText className="mx-auto size-10 text-icon-neutral-weak" aria-hidden />
          <p className="font-semibold">Preview unavailable for this file type</p>
          <p className="text-sm text-text-neutral-weak">Download this file to view it in a compatible app.</p>
        </div>
      ) : error ? (
        <div className="m-auto space-y-4 p-6 text-center">
          <p role="alert" className="text-sm text-text-neutral-weak">{error}</p>
          <Button variant="outline" onClick={() => setAttempt((value) => value + 1)}>Retry preview</Button>
        </div>
      ) : content === null ? <DocumentLoading />
        : typeof content === "string" ? (
          <div className="min-h-0 flex-1 overflow-auto p-5 sm:p-8" tabIndex={0} aria-label="Text document content">
            {content.length ? <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-6">{content}</pre>
              : <p className="text-text-neutral-weak">This text file is empty.</p>}
          </div>
        ) : <Suspense fallback={<DocumentLoading />}><PdfPreview data={content} onRetry={() => setAttempt((value) => value + 1)} /></Suspense>}
    </div>
  );
}

function DocumentLoading() {
  return <p role="status" className="m-auto p-6 text-sm text-text-neutral-weak">Loading document…</p>;
}
