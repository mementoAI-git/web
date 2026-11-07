"use client";
import { reportFetcherError } from "@/api/report-fetcher-error";

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
  type CSSProperties,
  type ReactNode,
} from "react";
import endpoint from "@/api/endpoint";
import { isEmpty } from "@/utility";
import { toast } from "sonner";
import useFileUpload from "@/hooks/use-file-upload";
import { v4 as uuidv4 } from "uuid";
import { mutate } from "swr";
import { useStore } from "@/hooks/use-store";
import * as yup from "yup";
import useFetcher from "@/hooks/use-fetcher";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Check, Paperclip, X } from "lucide-react";
import {
  FormDialogField,
  FormDialogFooter,
  FormDialogInput,
  FormDialogSelectContent,
  FormDialogSelectTrigger,
  FormDialogTextarea,
} from "@/components/modal/form-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLocation } from "react-router-dom";
import { isSkyCardPage } from "@/pages/dashboard/component/sky-card-page";
import { DashboardHeader } from "@/pages/dashboard/component/dashboard-header";
import { DashboardOverlayFrame } from "@/pages/dashboard/component/dashboard-overlay-frame";
import "@/components/motion/page-motion.css";
import "@/components/modal/memory-insights/insights.css";
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Values are the API's feedback types; only the labels are ours.
const FEEDBACK_OPTIONS = [
  { label: "Bugs", value: "Bug" },
  { label: "Feature requests", value: "Feature Request" },
  { label: "General feedback", value: "General Feedback" },
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
  onClose: () => boolean;
}

const Content = forwardRef<
  { handleDeleteAllFiles: () => Promise<void>; hasFiles: boolean; busy: boolean },
  IContentProps
>(({ data, onClose }, ref) => {
  const fieldId = useId();
  const messageFieldId = `${fieldId}-message`;
  const typeFieldId = `${fieldId}-type`;
  const emailFieldId = `${fieldId}-email`;
  const screenshotsFieldId = `${fieldId}-screenshots`;
  const { payload } = data;
  const isMobile = useIsMobile();
  const { user } = useStore();
  const { close } = useModal();

  const initial = {
    type: FEEDBACK_OPTIONS[0].value,
    email: user?.email ?? "",
    message: "",
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeToastId = useRef<string | number | undefined>(undefined);
  const isCheckingClipboard = useRef(false);

  const pending = useRef(false);
  const { trigger, isMutating } = useFetcher(endpoint.feedback);
  const { files, handleUpload, handleDeleteFile, setFiles } = useFileUpload();
  const { values, errors, handleChange, handleSubmit, handleValue } = useForm({
    initial: { ...initial, ...payload },
    schema,
    async onSubmit(p) {
      if (pending.current || files.some(file => !file.uploadedFile)) return;
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

      pending.current = true;
      try {
        const result = await trigger(payload);
        if (!result?.success) throw new Error(result?.message || "Couldn’t send feedback. Please retry.");
        if (result?.success) {
          toast.success("Feedback sent successfully!");
          void mutate(
            (key) =>
              typeof key === "string" && key.startsWith(endpoint.feedback),
          ).catch(() => undefined);
          setFiles([]);
          close("create-feedback", { force: true });
        }
      } catch (error) {
        reportFetcherError(error, "Failed to send feedback");
      } finally { pending.current = false; }
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
                "!bg-fill-brand-strong !rounded-lg !px-4 !py-2 !font-semibold transition-colors hover:!opacity-90",
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
    () => ({ handleDeleteAllFiles, hasFiles: files.length > 0, get busy() { return isMutating || pending.current; } }),
    [handleDeleteAllFiles, files.length, isMutating],
  );

  return (
    <FeedbackPage onClose={onClose} busy={isMutating}>
      <form
        onSubmit={handleSubmit}
        className="page-rise flex flex-col gap-10"
        style={{ "--page-rise-index": 1 } as CSSProperties}
        noValidate
      >
        <fieldset disabled={isMutating} className="flex min-w-0 flex-col gap-10">
          {isMobile ? (
            <FormDialogField label="Feedback type" htmlFor={typeFieldId} error={errors.type}>
              <Select
                name="type"
                value={values.type}
                onValueChange={(value) => handleValue("type", value)}
              >
                <FormDialogSelectTrigger
                  id={typeFieldId}
                  aria-invalid={Boolean(errors.type)}
                  aria-describedby={errors.type ? `${typeFieldId}-error` : undefined}
                >
                  <SelectValue />
                </FormDialogSelectTrigger>
                <FormDialogSelectContent>
                  <SelectGroup>
                    {FEEDBACK_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </FormDialogSelectContent>
              </Select>
            </FormDialogField>
          ) : (
            // Wider screens pick the type from pills, like the Insights tabs.
            <fieldset className="flex min-w-0 flex-col gap-2">
              <legend className="sr-only">
                Feedback type
              </legend>
              <div className="flex flex-wrap gap-3">
                {FEEDBACK_OPTIONS.map((option) => {
                  const checked = values.type === option.value;
                  return (
                    <label
                      key={option.value}
                      data-active={checked ? "" : undefined}
                      className="insights-tab inline-flex cursor-pointer items-center text-sm font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-stroke-neutral-strong has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
                    >
                      <input
                        type="radio"
                        name="type"
                        value={option.value}
                        checked={checked}
                        onChange={() => handleValue("type", option.value)}
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
              {errors.type ? (
                <span role="alert" className="text-xs text-text-error-strong">
                  {errors.type}
                </span>
              ) : null}
            </fieldset>
          )}
          <FormDialogField label="Message" htmlFor={messageFieldId} error={errors.message}>
            <FormDialogTextarea
              id={messageFieldId}
              name="message"
              value={values.message}
              onChange={handleChange}
              placeholder="What happened, or what would you like to see?"
              className="min-h-32 max-h-64 rounded-2xl"
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? `${messageFieldId}-error` : undefined}
              required
            />
          </FormDialogField>
          {!user && (
            <FormDialogField label="Email (optional)" htmlFor={emailFieldId} error={errors.email}>
              <FormDialogInput
                id={emailFieldId}
                type="email"
                name="email"
                autoComplete="email"
                value={values.email}
                onChange={handleChange}
                placeholder="you@example.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? `${emailFieldId}-error` : undefined}
              />
            </FormDialogField>
          )}
          <div className="flex flex-col gap-3">
            <input
              id={screenshotsFieldId}
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleScreenshots}
              className="sr-only"
              tabIndex={-1}
            />
            <button
              type="button"
              aria-describedby={`${screenshotsFieldId}-hint`}
              className="flex w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-stroke-neutral-weak bg-[color-mix(in_srgb,var(--insights-card)_50%,transparent)] px-6 py-4 text-center transition-colors hover:bg-[var(--insights-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-neutral-strong disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="flex items-center gap-2 text-base font-semibold text-text-neutral-strong">
                <Paperclip className="size-4" aria-hidden />
                Add screenshots
              </span>
              {/* Read as the button's description, not part of its name. */}
              <span
                id={`${screenshotsFieldId}-hint`}
                aria-hidden
                className="text-sm text-text-neutral-weaker"
              >
                Or paste an image from your clipboard.
              </span>
            </button>
            {files.length > 0 && (
              <div className="mt-1 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {files.map((file) => (
                  <div key={file.id} className="flex min-w-0 flex-col gap-1.5">
                    <div className="relative aspect-video overflow-hidden rounded-lg border border-stroke-neutral-weak bg-fill-neutral-weak">
                      {file.base64 && (
                        <img
                          src={file.base64}
                          alt={file.file.name}
                          className="size-full object-cover"
                        />
                      )}
                      {!file.uploadedFile && (
                        <div
                          className="absolute inset-0 flex items-center justify-center gap-2 bg-fill-neutral-strong/60 text-text-inverse-strong"
                          role="status"
                          aria-label={`Uploading ${file.file.name}`}
                        >
                          <Spinner className="size-4" />
                          <span className="text-xs tabular-nums">
                            {file.progress}%
                          </span>
                        </div>
                      )}
                      {file.uploadedFile && (
                        <span
                          className="absolute bottom-1.5 left-1.5 rounded-full bg-fill-success-strong p-1 text-icon-inverse-strong"
                          aria-label="Uploaded"
                        >
                          <Check className="size-3" />
                        </span>
                      )}
                      <div className="absolute right-1.5 top-1.5 rounded-full bg-bg-neutral">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${file.file.name}`}
                          onClick={() => void handleDeleteFile(file)}
                        >
                          <X />
                        </Button>
                      </div>
                    </div>
                    <span
                      className="truncate text-xs text-text-neutral-weak"
                      title={file.file.name}
                    >
                      {file.file.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </fieldset>
        <FormDialogFooter
          submitLabel="Send feedback"
          busyLabel="Sending…"
          busy={isMutating}
          disabled={files.some((f) => !f.uploadedFile)}
          onDismiss={onClose}
        />
      </form>
    </FeedbackPage>
  );
});

Content.displayName = "Content";

// Matches PageHeading, which can't take the dialog title's id.
const pageHeadingClass =
  "min-w-0 font-garamond text-[28px] font-normal leading-tight text-text-neutral-strong sm:text-[32px] [&_em]:text-text-neutral-weaker";

/** Full-screen like the plan page, laid out as the Insights column: heading, then the form. */
function FeedbackPage({
  onClose,
  busy,
  children,
}: {
  onClose: () => boolean | void;
  busy: boolean;
  children: ReactNode;
}) {
  const { pathname, key: locationKey } = useLocation();
  const { open: openModal } = useModal();
  const returnFocusRef = useRef(document.activeElement as HTMLElement | null);

  // The frame's sidebar can navigate, and the new page would stay hidden behind this.
  const openedAtLocation = useRef(locationKey);
  useEffect(() => {
    if (locationKey === openedAtLocation.current) return;
    openedAtLocation.current = locationKey;
    onClose();
  }, [locationKey, onClose]);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        data-sky-card-page={isSkyCardPage(pathname) ? "" : undefined}
        showCloseButton={false}
        className="insights-overlay"
        overlayClassName="insights-overlay-backdrop z-[100]"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
        }}
      >
        <TooltipProvider>
          <DashboardOverlayFrame>
            <DashboardHeader
              overlay={{
                // The Overview header's title style.
                title: (
                  <p className="min-w-0 truncate font-inter text-base font-semibold text-foreground">
                    Feedback
                  </p>
                ),
                searchLabel: "Search memories",
                closeLabel: "Close",
                onSearch: () => {
                  // Search opens beneath this page, so leave it first.
                  if (onClose()) openModal?.("search-memory");
                },
                onClose,
              }}
            />
            <div className="insights-scroll">
              <main className="page-motion insights-main">
                <div className="page-rise page-rise--heading flex flex-col gap-2">
                  <DialogTitle className={pageHeadingClass}>
                    Send <em>feedback</em>
                  </DialogTitle>
                  <DialogDescription className="text-base text-text-neutral-weak">
                    Share a bug, an idea, or something we could improve.
                  </DialogDescription>
                </div>
                {children}
              </main>
            </div>
          </DashboardOverlayFrame>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}

export function Feedback({ data }: { data: FeedbackModalData }) {
  const { close, registerCloseGuard } = useModal();
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const contentRef = useRef<{
    handleDeleteAllFiles: () => Promise<void>;
    hasFiles: boolean; busy: boolean;
  } | null>(null);

  const handleClose = useCallback(() => {
    if (contentRef.current?.busy) return false;
    if (contentRef.current?.hasFiles) {
      setShowCloseConfirmation(true);
      return false;
    }
    return true;
  }, []);

  useEffect(
    () => registerCloseGuard?.("create-feedback", handleClose),
    [registerCloseGuard, handleClose],
  );

  const requestClose = () => {
    if (!handleClose()) return false;
    close("create-feedback");
    return true;
  };

  const handleConfirmClose = async () => {
    setIsDiscarding(true);
    try {
      await contentRef.current?.handleDeleteAllFiles();
      close("create-feedback", { force: true });
    } catch {
      toast.error("Could not remove screenshots. Please try again.");
    } finally {
      setIsDiscarding(false);
    }
  };

  return (
    <>
      <Content data={data} ref={contentRef} onClose={requestClose} />
      <AlertDialog
        open={showCloseConfirmation}
        onOpenChange={setShowCloseConfirmation}
      >
        <AlertDialogContent className="z-[130]" overlayClassName="z-[125]">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard feedback?</AlertDialogTitle>
            <AlertDialogDescription>
              Your screenshots will be removed. This feedback won’t be sent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDiscarding}>
              Keep editing
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isDiscarding}
              onClick={() => void handleConfirmClose()}
            >
              {isDiscarding && <Spinner data-icon="inline-start" />}
              {isDiscarding ? "Discarding…" : "Discard feedback"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
