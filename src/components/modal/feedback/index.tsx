"use client";

import useForm from "@/hooks/use-form";
import { useModal } from "@/hooks/use-modal";
import {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useEffect,
  useId,
  type ChangeEvent,
} from "react";
import endpoint from "@/api/endpoint";
import { cn, isEmpty } from "@/utility";
import { toast } from "sonner";
import { Sheet } from "react-modal-sheet";
import useFileUpload from "@/hooks/use-file-upload";
import { v4 as uuidv4 } from "uuid";
import { createPortal } from "react-dom";
import { mutate } from "swr";
import { CloseWithFilesConfirmation } from "../memory/close-with-files-confirmation";
import { useStore } from "@/hooks/use-store";
import * as yup from "yup";
import useFetcher from "@/hooks/use-fetcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { X } from "lucide-react";

const FEEDBACK_OPTIONS = [
  { label: "Bug", value: "Bug" },
  { label: "Feature Request", value: "Feature Request" },
  { label: "UI/UX Issue", value: "UI/UX Issue" },
  { label: "General Feedback", value: "General Feedback" },
  { label: "Other", value: "Other" },
];

const schema = yup.object().shape({
  type: yup.string().required(),
  message: yup.string().required("Message is required"),
  email: yup.string().email("Invalid email address"),
});

export interface FeedbackModalData {
  payload?: Partial<{
    type: string;
    email: string;
    message: string;
  }>;
}

interface IContentProps {
  data: FeedbackModalData;
}

const triggerV3Outline =
  "font-inter w-full justify-between !rounded-[12px] border border-v3-stroke-weak bg-white px-3 py-2 text-left text-sm text-v3-text-strong shadow-none hover:bg-v3-fill-weaker data-focus-visible:outline-none data-focus-visible:ring-2 data-focus-visible:ring-v3-brand-strong data-focus-visible:ring-offset-0";

const textFieldV3 =
  "font-inter !rounded-[12px] border border-v3-stroke-weak bg-white px-3 py-2 text-sm text-v3-text-strong outline-none data-focus-visible:ring-2 data-focus-visible:ring-v3-brand-strong data-focus-visible:ring-offset-0";

const Content = forwardRef<
  { handleDeleteAllFiles: () => Promise<void>; hasFiles: boolean },
  IContentProps
>(({ data }, ref) => {
  const messageFieldId = useId();
  const { payload } = data;
  const { user } = useStore();
  const { close } = useModal();

  const initial = {
    type: FEEDBACK_OPTIONS[0].value,
    email: user?.email ?? "",
    message: "",
  };

  const [editMode, setEditMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeToastId = useRef<string | number | undefined>(undefined);
  const isCheckingClipboard = useRef(false);

  const { trigger, isMutating } = useFetcher(endpoint.feedback);
  const { files, handleUpload, handleDeleteFile, setFiles } = useFileUpload();
  const { values, errors, handleChange, setValues, handleSubmit, handleValue } =
    useForm({
      initial: { ...initial, ...payload },
      schema,
      async onSubmit(p) {
        if (isEmpty(p.message)) return toast.error("Message is required");

        const uploadedScreenshots = files
          .filter((f) => f.uploadedFile)
          .map((f) => f.uploadedFile._id);

        const payload = {
          type: p.type,
          message: p.message,
          email: p.email || user?.email,
          screenshots: uploadedScreenshots,
        };

        try {
          const result = await trigger(payload);
          if (result?.success) {
            toast.success("Feedback sent successfully!");
            mutate(
              (key) =>
                typeof key === "string" && key.startsWith(endpoint.feedback),
            );
            setFiles([]);
            close("create-feedback");
          }
        } catch (error) {
          console.error("Failed to send feedback:", error);
          toast.error("Failed to send feedback");
        }
      },
    });

  const uploadFileRef = useRef<((file: File) => Promise<void>) | undefined>(
    undefined,
  );

  uploadFileRef.current = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload only image files");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      handleUpload({
        id: uuidv4(),
        file,
        base64: reader.result as string,
        progress: 0,
      });
    };
    reader.readAsDataURL(file);
  };

  // Clipboard detection
  useEffect(() => {
    const checkAndShowToast = async () => {
      if (
        isCheckingClipboard.current ||
        activeToastId.current ||
        files.length > 0
      ) {
        return;
      }

      isCheckingClipboard.current = true;

      try {
        const items = await navigator.clipboard.read();
        const hasImage = items.some((item) =>
          item.types.some((t) => t.startsWith("image/")),
        );

        if (hasImage && !activeToastId.current) {
          activeToastId.current = toast.info("Image detected in clipboard!", {
            duration: 8000,
            description: "Click Paste or press Ctrl+V (Cmd+V on Mac)",
            position: "bottom-right",
            classNames: {
              actionButton:
                "!bg-v3-brand-strong !rounded-lg !px-4 !py-2 !font-semibold transition-colors hover:!opacity-90",
            },
            action: {
              label: "Paste",
              onClick: async () => {
                try {
                  const clipboardItems = await navigator.clipboard.read();
                  for (const item of clipboardItems) {
                    for (const type of item.types) {
                      if (type.startsWith("image/")) {
                        const blob = await item.getType(type);
                        const file = new File(
                          [blob],
                          `screenshot-${Date.now()}.png`,
                          {
                            type,
                          },
                        );
                        await uploadFileRef.current?.(file);
                        if (activeToastId.current) {
                          toast.dismiss(activeToastId.current);
                          activeToastId.current = undefined;
                        }
                        return;
                      }
                    }
                  }
                } catch (err) {
                  console.error("Failed to paste:", err);
                  toast.error("Failed to paste image.");
                }
              },
            },
          });
        }
      } catch {
        // Ignore clipboard errors
      } finally {
        setTimeout(() => {
          isCheckingClipboard.current = false;
        }, 200);
      }
    };

    checkAndShowToast();

    const handleFocus = () => {
      setTimeout(checkAndShowToast, 100);
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      if (activeToastId.current) {
        toast.dismiss(activeToastId.current);
        activeToastId.current = undefined;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (files.length > 0 && activeToastId.current) {
      toast.dismiss(activeToastId.current);
      activeToastId.current = undefined;
    }
  }, [files.length]);

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await uploadFileRef.current?.(file);
            if (activeToastId.current) {
              toast.dismiss(activeToastId.current);
              activeToastId.current = undefined;
            }
          }
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  const handleScreenshots = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    for (const file of Array.from(selectedFiles))
      await uploadFileRef.current?.(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteAllFiles = useCallback(async () => {
    if (files.length === 0) return;
    await Promise.all(
      files.map((file) =>
        file.uploadedFile ? handleDeleteFile(file) : Promise.resolve(),
      ),
    );
    setFiles([]);
  }, [files, handleDeleteFile, setFiles]);

  useImperativeHandle(
    ref,
    () => ({ handleDeleteAllFiles, hasFiles: files.length > 0 }),
    [handleDeleteAllFiles, files.length],
  );

  const handleDiscard = () => {
    setEditMode(false);
    setValues(initial);
    setFiles([]);
    close("create-feedback");
  };

  const submitDisabled = files.some((f) => !f.uploadedFile);
  const showContinueLabel = editMode || !isEmpty(values.message);
  const dimFooter = submitDisabled;

  return (
    <div className="w-full space-y-4">
      <div className="flex w-full flex-col gap-3">
        <div className="font-inter flex w-full flex-col gap-1.5">
          <Label className="font-inter text-sm font-medium text-v3-text-strong">
            Type
          </Label>
          <select
            name="type"
            value={values.type}
            onChange={(e) => handleValue("type", e.target.value)}
            className={triggerV3Outline}
          >
            {FEEDBACK_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {errors.type && (
          <small className="text-xs text-danger">{errors.type}</small>
        )}

        <div className="flex flex-col gap-1.5">
          <Label
            className="font-inter text-sm font-medium text-v3-text-strong"
            htmlFor={messageFieldId}
          >
            Message
          </Label>
          <Textarea
            id={messageFieldId}
            name="message"
            value={values.message}
            onChange={handleChange}
            placeholder="Attach a message"
            className={cn(
              textFieldV3,
              "min-h-24 resize-y placeholder:text-v3-text-weak",
            )}
          />
          {errors.message && (
            <small className="text-xs text-danger">{errors.message}</small>
          )}
        </div>

        {!user && (
          <div className="font-inter flex flex-col gap-1.5">
            <Label className="font-inter text-sm font-medium text-v3-text-strong">
              Email (optional)
            </Label>
            <Input
              type="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={textFieldV3}
            />
            {errors.email && (
              <small className="text-xs text-danger">{errors.email}</small>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label className="font-inter text-sm font-medium text-v3-text-strong">
            Screenshots (optional)
          </Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleScreenshots}
            className="sr-only"
          />
          <Button
            type="button"
            variant="secondary"
            className="font-inter w-full max-w-full justify-center rounded-full border border-v3-stroke-weak bg-v3-fill-weaker text-sm font-medium text-v3-text-strong hover:bg-v3-stroke-weak/20 sm:w-auto"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose images
          </Button>
          <p className="text-xs text-v3-text-weak">
            Or press Ctrl+V (Cmd+V on Mac) to paste from clipboard
          </p>

          {files.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="group relative overflow-hidden rounded-lg border border-v3-stroke-weak bg-v3-fill-weaker"
                >
                  <div className="relative aspect-video min-h-0 w-full">
                    <img
                      src={file.base64 ?? ""}
                      alt={file.file.name}
                      className="h-full w-full object-cover"
                    />
                    {!file.uploadedFile && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50">
                        <Spinner className="size-5 text-white" />
                        <span className="text-xs font-medium text-white">
                          {file.progress}%
                        </span>
                      </div>
                    )}
                    {file.uploadedFile && (
                      <div className="absolute right-1 top-1 rounded-full bg-v3-brand-strong p-1">
                        <svg
                          className="size-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                    <button
                      type="button"
                      aria-label={`Remove ${file.file.name}`}
                      onClick={() => void handleDeleteFile(file)}
                      className="absolute left-1 top-1 z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-black/55 text-white opacity-0 shadow-sm backdrop-blur-sm transition-opacity hover:bg-black/70 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-0 group-hover:opacity-100"
                    >
                      <X size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          "mt-2 flex items-center justify-end gap-2",
          dimFooter && "cursor-not-allowed opacity-40",
        )}
      >
        <Button
          type="button"
          variant="outline"
          disabled={submitDisabled}
          className="font-inter rounded-full border-v3-stroke-weak text-v3-text-strong"
          onClick={handleDiscard}
        >
          Cancel
        </Button>
        <Button
          type="button"
          disabled={submitDisabled}
          className="font-inter rounded-full !bg-v3-brand-strong !text-white hover:!opacity-90"
          onClick={() => void handleSubmit()}
        >
          {showContinueLabel ? "Continue" : "Send Feedback"}
          {isMutating ? (
            <Spinner className="size-4 text-white" />
          ) : null}
        </Button>
      </div>
    </div>
  );
});

Content.displayName = "Content";

function FeedbackHeader({
  onClose,
  className,
}: {
  onClose: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-1 flex items-center justify-between gap-3",
        className,
      )}
    >
      <h4 className="modal-title min-w-0 flex-1 text-left leading-tight">
        Send Feedback
      </h4>
      <button
        type="button"
        onClick={onClose}
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-v3-fill-weaker text-v3-text-strong hover:bg-v3-stroke-weak/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-brand-strong focus-visible:ring-offset-2"
        aria-label="Close"
      >
        <X size={14} strokeWidth={1.5} />
      </button>
    </div>
  );
}

export function Feedback({ data }: { data: FeedbackModalData }) {
  const { close } = useModal();
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const contentRef = useRef<{
    handleDeleteAllFiles: () => Promise<void>;
    hasFiles: boolean;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleCloseWithConfirmation = () => {
    if (contentRef.current?.hasFiles) {
      setShowCloseConfirmation(true);
    } else {
      close("create-feedback");
    }
  };

  const handleConfirmClose = async () => {
    setShowCloseConfirmation(false);
    if (contentRef.current) await contentRef.current.handleDeleteAllFiles();
    close("create-feedback");
  };

  return (
    <div>
      {!isMobile ? (
        <div className="modal-container flex flex-col gap-4 !w-[500px] !min-w-[500px] !max-w-[500px] !p-6 sm:!p-6 md:!p-6">
          <FeedbackHeader onClose={handleCloseWithConfirmation} />
          <Content data={data} ref={contentRef} />
        </div>
      ) : (
        <Sheet
          detent="content"
          isOpen
          onClose={handleCloseWithConfirmation}
          snapPoints={[0.5, 0.75, 1]}
          initialSnap={1}
        >
          <Sheet.Container className="bg-white">
            <Sheet.Header className="rounded-3xl bg-white" />
            <Sheet.Content className="bg-white px-4 pb-6">
              <FeedbackHeader
                onClose={handleCloseWithConfirmation}
                className="mb-3"
              />
              <Content data={data} ref={contentRef} />
            </Sheet.Content>
          </Sheet.Container>
          <Sheet.Backdrop />
        </Sheet>
      )}

      {showCloseConfirmation &&
        createPortal(
          <CloseWithFilesConfirmation
            open={showCloseConfirmation}
            close={() => setShowCloseConfirmation(false)}
            onConfirm={handleConfirmClose}
          />,
          document.body,
        )}
    </div>
  );
}
