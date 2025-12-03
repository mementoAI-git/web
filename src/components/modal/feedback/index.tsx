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
import { postFetcher } from "@/api/fetcher";
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
import * as yup from "yup";

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
  // screenshot: yup.mixed().nullable(),
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

  const { trigger, isMutating } = useSWRMutation(
    endpoint.feedback,
    postFetcher,
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
    schema,
    async onSubmit(p) {
      if (isEmpty(p.message)) {
        return toast.error("Message is required");
      }

      const uploadedScreenshot = files.find((f) => f.uploadedFile);

      const payload = {
        type: p.type,
        message: p.message,
        email: p.email || user?.email,
        screenshot: uploadedScreenshot?.uploadedFile._id || null,
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

  const handleScreenshot = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
  };

  const handleDeleteAllFiles = useCallback(async () => {
    if (files.length === 0) return;

    const deletePromises = files.map(async (file) => {
      if (file.uploadedFile) {
        await handleDeleteFile(file);
      }
    });
    await Promise.all(deletePromises);

    setFiles([]);
  }, [handleDeleteFile, setFiles, files]);

  useImperativeHandle(
    ref,
    () => ({
      handleDeleteAllFiles,
      hasFiles: files.length > 0,
    }),
    [handleDeleteAllFiles, files.length],
  );

  const handleDiscard = () => {
    setEditMode(false);
    setValues(initial);
    setFiles([]);
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
          {...getField("type")}
        />

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

          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((file) => (
                <div key={file.id} className="text-xs">
                  {file.uploadedFile ? (
                    <span className="text-green-600">
                      ✓ {file.file.name} uploaded
                    </span>
                  ) : (
                    <span className="text-grey-600">
                      Uploading {file.file.name}... {file.progress}%
                    </span>
                  )}
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
