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
  type ChangeEvent,
} from "react";
import endpoint from "@/api/endpoint";
import useSWRMutation from "swr/mutation";
import { fileUploadFetcher } from "@/api/fetcher";
import { isEmpty } from "@/utility";
import { toast } from "sonner";
import { Sheet } from "react-modal-sheet";
import useFileUpload from "@/hooks/use-file-upload";
import { v4 as uuidv4 } from "uuid";
import { createPortal } from "react-dom";
import { mutate } from "swr";
import { SUPPORTED_FILE_TYPES } from "@/utility/constant";
import { CloseWithFilesConfirmation } from "../memory/close-with-files-confirmation";
import { Selectinput, Textinput } from "@/components/Form";
import { useStore } from "@/hooks/use-store";

const FEEDBACK_OPTIONS = [
  { label: "Bug", value: "Bug" },
  { label: "Feature Request", value: "Feature Request" },
  { label: "UI/UX Issue", value: "UI/UX Issue" },
  { label: "General Feedback", value: "General Feedback" },
  { label: "Other", value: "Other" },
];

interface IContentProps {
  data: any;
}

const Content = forwardRef(({ data }: IContentProps, ref) => {
  const { payload, type: declaredType } = data;
  const { open } = useModal();
  const { user } = useStore();

  const initial = {
    type: FEEDBACK_OPTIONS[0].label,
    email: user?.email ?? "",
    message: "",
    screenshot: null,
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editMode, setEditMode] = useState(false);

  const { trigger, isMutating } = useSWRMutation(
    endpoint.feedback,
    fileUploadFetcher,
  );
  const { files, handleUpload, handleDeleteFile, setFiles } = useFileUpload();

  const {
    values,
    errors,
    handleChange,
    setValues,
    handleSubmit,
    handleValue,
    getField,
  } = useForm({
    initial: { ...initial, ...payload },
    async onSubmit(p) {
      if (isEmpty(p.message)) {
        return toast.error("Message is required");
      }

      console.log(p, "p");
      // return;

      const result = await trigger({ ...p });
      console.log(result, "RESULT");
      if (result?.success) {
        mutate(
          (key) => typeof key === "string" && key.startsWith(endpoint.feedback),
        );
        setFiles([]);
      }
    },
  });

  const handleScreenshot = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValues((prev) => ({ ...prev, screenshot: file }));
    }
  };

  // Create delete all files function and assign to ref
  const handleDeleteAllFiles = useCallback(async () => {
    if (files.length === 0) return;

    const deletePromises = files.map(async (file) => {
      if (file.uploadedFile) {
        await handleDeleteFile(file);
      }
    });
    await Promise.all(deletePromises);

    setFiles([]);
    handleValue("file", null);
  }, [handleDeleteFile, handleValue, setFiles, files]);

  useImperativeHandle(
    ref,
    () => ({
      handleDeleteAllFiles,
      hasFiles: files.length > 0,
    }),
    [handleDeleteAllFiles, files.length],
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    for (const file of selectedFiles) {
      // Convert to base64 for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const payload = {
          id: uuidv4(),
          file,
          base64: reader.result as string,
          progress: 0,
        };
        handleUpload(payload);
      };
      reader.readAsDataURL(file);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDiscard = () => {
    setEditMode(false);
    setValues(initial);
    // setRecording(false);
    setFiles([]);
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={SUPPORTED_FILE_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="space-y-4">
        <div className="py-2">
          <h4 className="modal-title">Send Feedback</h4>
        </div>

        <div className="flex gap-6 border-b border-gray-200 w-full">
          <Selectinput
            className="w-full"
            label="Type"
            data={FEEDBACK_OPTIONS}
            {...getField("type")}
          />
        </div>

        <div className="input-container">
          <label className="input-label">Message</label>
          <textarea
            required
            placeholder="Tell us what happened…"
            {...getField("message")}
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
            {...getField("email")}
          />
        )}

        <div className="input-container">
          <label className="input-label">Screenshot (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleScreenshot}
            className="w-full font-inter text-sm text-grey-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sand-2 file:text-sand-10 hover:file:bg-sand-3 file:cursor-pointer"
          />
          {values.screenshot && (
            <span className="font-inter text-xs text-grey-600 mt-1">
              Selected: {values.screenshot.name}
            </span>
          )}
        </div>
      </div>
      <FooterBtnGroup
        cta="Send Feedback"
        // onAddFileBtnClick={handleAddFileClick}
        onDiscard={handleDiscard}
        onSave={handleSubmit}
        disabled={files.some((f) => !f.uploadedFile)}
        saving={isMutating}
        editMode={editMode || !isEmpty(values.body)}
      />
    </div>
  );
});

export function Feedback({ data }) {
  const { close } = useModal();
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const contentRef = useRef(null);

  const handleCloseWithConfirmation = () => {
    if (contentRef.current?.hasFiles) {
      setShowCloseConfirmation(true);
    } else {
      close("create-feedback");
    }
  };

  const handleConfirmClose = async () => {
    setShowCloseConfirmation(false);

    if (contentRef.current) {
      await contentRef.current?.handleDeleteAllFiles();
    }
    close("create-feedback");
  };

  return (
    <div>
      <div className="hidden min-w-[618px]! sm:block modal-container">
        <ModalCloseBtn onClick={handleCloseWithConfirmation} />
        <Content data={data} ref={contentRef} />
      </div>
      <Sheet
        detent="content"
        className="block sm:hidden"
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

      {/* Confirmation Dialog */}
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
