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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Check, Paperclip, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
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
  onClose: () => void;
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

  const submitDisabled = isMutating || files.some((f) => !f.uploadedFile);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-0 flex-col gap-6"
      noValidate
    >
      <fieldset disabled={isMutating} className="min-w-0">
        <FieldGroup className="gap-5">
          <Field data-invalid={Boolean(errors.type)}>
            <FieldLabel htmlFor={typeFieldId}>Feedback type</FieldLabel>
            <Select
              name="type"
              value={values.type}
              onValueChange={(value) => handleValue("type", value)}
            >
              <SelectTrigger
                id={typeFieldId}
                className="w-full"
                aria-invalid={Boolean(errors.type)}
                aria-describedby={
                  errors.type ? `${typeFieldId}-error` : undefined
                }
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {FEEDBACK_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.type && (
              <FieldError id={`${typeFieldId}-error`}>{errors.type}</FieldError>
            )}
          </Field>
          <Field data-invalid={Boolean(errors.message)}>
            <FieldLabel htmlFor={messageFieldId}>Message</FieldLabel>
            <Textarea
              id={messageFieldId}
              name="message"
              value={values.message}
              onChange={handleChange}
              placeholder="What happened, or what would you like to see?"
              className="min-h-32 max-h-64 resize-y"
              aria-invalid={Boolean(errors.message)}
              aria-describedby={
                errors.message ? `${messageFieldId}-error` : undefined
              }
              required
            />
            {errors.message && (
              <FieldError id={`${messageFieldId}-error`}>
                {errors.message}
              </FieldError>
            )}
          </Field>
          {!user && (
            <Field data-invalid={Boolean(errors.email)}>
              <FieldLabel htmlFor={emailFieldId}>
                Email{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </FieldLabel>
              <Input
                id={emailFieldId}
                type="email"
                name="email"
                autoComplete="email"
                value={values.email}
                onChange={handleChange}
                placeholder="you@example.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={
                  errors.email ? `${emailFieldId}-error` : undefined
                }
              />
              {errors.email && (
                <FieldError id={`${emailFieldId}-error`}>
                  {errors.email}
                </FieldError>
              )}
            </Field>
          )}
          <Field>
            <FieldLabel htmlFor={screenshotsFieldId}>
              Screenshots{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </FieldLabel>
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
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip data-icon="inline-start" />
                Add screenshots
              </Button>
              <FieldDescription>
                Or paste an image from your clipboard.
              </FieldDescription>
            </div>
            {files.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {files.map((file) => (
                  <div key={file.id} className="flex min-w-0 flex-col gap-1.5">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-stroke-neutral-weak bg-fill-neutral-weaker">
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
                      className="truncate text-xs text-muted-foreground"
                      title={file.file.name}
                    >
                      {file.file.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Field>
        </FieldGroup>
      </fieldset>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={isMutating}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitDisabled}>
          {isMutating && <Spinner data-icon="inline-start" />}
          {isMutating ? "Sending…" : "Send feedback"}
        </Button>
      </DialogFooter>
    </form>
  );
});

Content.displayName = "Content";

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
    if (handleClose()) close("create-feedback");
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
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
      >
        <DialogContent
          className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[480px]"
          overlayClassName="bg-overlay-backdrop dark:bg-overlay-backdrop-dark"
        >
          <DialogHeader className="pr-8">
            <DialogTitle>Send feedback</DialogTitle>
            <DialogDescription>
              Share a bug, an idea, or something we could improve.
            </DialogDescription>
          </DialogHeader>
          <Content data={data} ref={contentRef} onClose={requestClose} />
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={showCloseConfirmation}
        onOpenChange={setShowCloseConfirmation}
      >
        <AlertDialogContent>
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
