"use client";

import { FooterBtnGroup } from "@/components/memory";
import { ModalCloseBtn } from "../modalLayout";
import useForm from "@/hooks/use-form";
import { useModal } from "@/hooks/use-modal";
import {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useEffect,
  type ChangeEvent,
} from "react";
import endpoint from "@/api/endpoint";
import { isEmpty } from "@/utility";
import { toast } from "sonner";
import { Sheet } from "react-modal-sheet";
import useFileUpload from "@/hooks/use-file-upload";
import { v4 as uuidv4 } from "uuid";
import { createPortal } from "react-dom";
import { mutate } from "swr";
import { CloseWithFilesConfirmation } from "../memory/close-with-files-confirmation";
import { Selectinput, Textinput } from "@/components/Form";
import { useStore } from "@/hooks/use-store";
import * as yup from "yup";
import useFetcher from "@/hooks/use-fetcher";

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

interface IContentProps {
  data: any;
}

const Content = forwardRef(({ data }: IContentProps, ref) => {
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
  const { values, errors, handleChange, setValues, handleSubmit } = useForm({
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
      // If already checking or toast exists or has files, exit immediately
      if (
        isCheckingClipboard.current ||
        activeToastId.current ||
        files.length > 0
      ) {
        return;
      }

      // Set flag to prevent concurrent checks
      isCheckingClipboard.current = true;

      try {
        const items = await navigator.clipboard.read();
        const hasImage = items.some((item) =>
          item.types.some((t) => t.startsWith("image/")),
        );

        // Double check - maybe another call beat us to it
        if (hasImage && !activeToastId.current) {
          activeToastId.current = toast.info("Image detected in clipboard!", {
            duration: 8000,
            description: "Click Paste or press Ctrl+V (Cmd+V on Mac)",
            position: "bottom-right",
            classNames: {
              actionButton:
                "!bg-orange hover:!bg-[#C55A1D] !font-semibold !px-4 !py-2 !rounded-lg transition-colors",
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
        // Reset flag after a small delay
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

  // Separate effect to dismiss toast when files are added
  useEffect(() => {
    if (files.length > 0 && activeToastId.current) {
      toast.dismiss(activeToastId.current);
      activeToastId.current = undefined;
    }
  }, [files.length]);

  // Keyboard paste listener
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

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="py-2">
          <h4 className="modal-title">Send Feedback</h4>
        </div>

        <Selectinput
          className="w-full"
          label="Type"
          data={FEEDBACK_OPTIONS}
          name="type"
          value={values.type}
          onChange={handleChange}
          error={errors.type}
        />

        <div className="input-container">
          <label className="input-label">Message</label>
          <textarea
            name="message"
            value={values.message}
            onChange={handleChange}
            placeholder="Tell us what happened…"
            className="input-base w-full font-inter text-sm !h-24"
          />
          {errors.message && (
            <small className="text-xs text-danger">{errors.message}</small>
          )}
        </div>

        {!user && (
          <Textinput
            label="Email (optional)"
            type="email"
            placeholder="you@example.com"
            name="email"
            value={values.email}
            onChange={handleChange}
            error={errors.email}
          />
        )}

        <div className="input-container">
          <label className="input-label">Screenshots (optional)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleScreenshots}
            className="w-full font-inter text-sm text-grey-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sand-2 file:text-sand-10 hover:file:bg-sand-3 file:cursor-pointer"
          />
          <p className="mt-1 text-xs text-grey-600">
            Or press Ctrl+V (Cmd+V on Mac) to paste from clipboard
          </p>

          {files.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="relative group rounded-lg overflow-hidden border border-sand-6 bg-sand-2"
                >
                  <div className="aspect-video relative">
                    <img
                      src={file.base64}
                      alt={file.file.name}
                      className="w-full h-full object-cover"
                    />
                    {!file.uploadedFile && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-1" />
                          <span className="text-xs text-white font-medium">
                            {file.progress}%
                          </span>
                        </div>
                      </div>
                    )}
                    {file.uploadedFile && (
                      <div className="absolute top-1 right-1 bg-blue-6 rounded-full p-1">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
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
                      onClick={() => handleDeleteFile(file)}
                      className="absolute top-1 left-1 bg-danger rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  {/*<div className="p-2 bg-sand-1">
                    <p
                      className="text-xs text-grey-600 truncate"
                      title={file.file.name}
                    >
                      {file.file.name}
                    </p>
                  </div>*/}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FooterBtnGroup
        cta="Send Feedback"
        onDiscard={handleDiscard}
        onSave={handleSubmit}
        disabled={files.some((f) => !f.uploadedFile)}
        saving={isMutating}
        editMode={editMode || !isEmpty(values.message)}
      />
    </div>
  );
});

Content.displayName = "Content";

export function Feedback({ data }) {
  const { close } = useModal();
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const contentRef = useRef(null);
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
        <div className="modal-container" style={{ minWidth: "618px" }}>
          <ModalCloseBtn onClick={handleCloseWithConfirmation} />
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
          <Sheet.Container className="bg-sand-1">
            <Sheet.Header className="bg-sand-1 rounded-3xl" />
            <Sheet.Content className="bg-sand-1 px-4 pb-6">
              <ModalCloseBtn
                className="!relative ml-auto !right-0 !top-0 mb-2"
                onClick={handleCloseWithConfirmation}
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
