import { useEffect, useState, useCallback } from "react";
import * as yup from "yup";
import { Taginput } from "@/components/Form";
import { ModalCloseBtn } from "../../modalLayout";
import { useModal } from "@/hooks/use-modal";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import useForm from "@/hooks/use-form";
import { toast } from "sonner";
import Spinner from "@/components/spinner";
import FileAttachment from "@/components/file-attachment";
import useFileUpload from "@/hooks/use-file-upload";
import { isEmpty, cn } from "@/utility";
import useSWR, { mutate } from "swr";
import type { IOnUploadPayload, IMemory, IFile } from "@/utility/interface";
import { ImagePlusIcon } from "@/components/icons";
import SelectFromMemory from "../../select-from-memory";
import SelectFromMedia from "../../select-from-media";
import DateOptionsDropdown from "@/pages/dashboard/time-capsule-new/components/DateInputWithCustomDropdown";
import DatePicker from "@/components/date-picker";
import BrowseFileBtn from "./browse-file-btn";
import RecentRecipients from "@/pages/dashboard/time-capsule-new/components/RecentRecipients";
import RecentMedia from "@/pages/dashboard/time-capsule-new/components/RecentMedia";
import type { CardCustomization } from "@/pages/dashboard/time-capsule-new/components/CapsulePreviewCard";
import StyleControls from "@/pages/dashboard/time-capsule-new/components/StyleControls";
import CapsulePreviewCard from "@/pages/dashboard/time-capsule-new/components/CapsulePreviewCard";
import { useDragAndDrop } from "@/hooks/use-drag-and-drop";
import { v4 as uuidv4 } from "uuid";
import {
  CAPSULE_SUPPORTED_FILE_TYPES,
  EXTENSION_TO_MIME,
} from "@/utility/constant";

import TimeCapsuleBadge from "@/pages/dashboard/time-capsule-new/components/TimeCapsuleBadge";
import { useStore } from "@/hooks/use-store";

// const schema = yup.object().shape({
//   // delivery_date: yup.date().required("Delivery date is required"),
//   schedule_date: yup.date().required("Delivery date is required"),
//   title: yup.string().required("Title is required"),
//   body: yup.string().required("Body is required"),
//   status: yup.string().default("scheduled").required("Status is required"),
//   recipients: yup.array().min(1, "At least one recipient is required"),
// });

const schema = yup.object().shape({
  schedule_date: yup.date().when("status", {
    is: "scheduled",
    then: (schema) => schema.required("Delivery date is required"),
    otherwise: (schema) => schema.nullable(),
  }),
  title: yup.string().required("Title is required"),
  body: yup.string().required("Body is required"),
  status: yup.string().default("scheduled").required("Status is required"),
  recipients: yup.array().min(1, "At least one recipient is required"),
});

const initial = {
  // delivery_date: "",
  schedule_date: "",
  title: "",
  body: "",
  status: "scheduled",
  recipients: [] as string[],
};

interface CreateCapsuleProps {
  data?: any;
  mode?: "create" | "edit" | "view"; // NEW: support view mode
}

function DatePickerWrapper({
  onDateSelect,
  onClose,
}: {
  onDateSelect: (date: Date) => void;
  onClose: () => void;
}) {
  const [show, setShow] = useState(true);

  const handleDateChange = (selectedDate: Date) => {
    onDateSelect(selectedDate);
    setShow(false);
    onClose();
  };

  return (
    <div className="relative">
      <DatePicker
        show={show}
        setShow={(value) => {
          setShow(value);
          if (!value) onClose();
        }}
        onChange={handleDateChange}
        position="bottom"
        options={{
          minDate: new Date(),
        }}
      >
        <div className="invisible h-0" />
      </DatePicker>
    </div>
  );
}

export default function CreateCapsule({
  data = null,
  mode = "create",
}: CreateCapsuleProps) {
  // NEW: State to track current mode (can toggle between view and edit)
  const [currentMode, setCurrentMode] = useState<"view" | "edit">(
    mode === "view" ? "view" : "edit",
  );

  const isEditMode = !isEmpty(data) && currentMode === "edit";
  const isViewMode = currentMode === "view";

  const { close } = useModal();
  const { user } = useStore();
  const { files, handleUpload, handleDeleteFile } = useFileUpload();
  const { trigger, isMutating } = useFetcher(
    isEmpty(data) ? endpoint.capsule : `${endpoint.capsule}/${data?._id}`,
    isEmpty(data) ? "post" : "put",
  );
  const [page] = useState(1);
  const { data: beneficiaries } = useSWR(endpoint.beneficiaries, undefined, {
    revalidateIfStale: false,
  });
  const { data: recentMedia } = useSWR(`${endpoint.files}?page=${page}`);
  const [selectedMedia, setSelectedMedia] = useState<any[]>([]);

  const [showMemoryList, setShowMemoryList] = useState(false);
  const [showMediaList, setShowMediaList] = useState(false);

  // Form setup
  const onSubmit = async (
    payload: any,
    { setValues }: { setValues: (values: typeof initial) => void },
  ) => {
    const submission = { ...payload };

    const uploadedIds = !isEmpty(files)
      ? files
          .map((file) => file.uploadedFile?._id)
          .filter((id): id is string => Boolean(id))
      : [];

    const selectedMediaIds = selectedMedia.map((m) => m.id || m._id);

    submission.attachments = [...uploadedIds, ...selectedMediaIds];

    const result = await trigger(submission);
    if (result?.success) {
      toast.custom(() => <TimeCapsuleBadge />);
      mutate(`${endpoint.capsule}?page=1`);
      setValues(initial);
      close?.("create-capsule");
    }
  };

  const { setValues, values, errors, handleSubmit, handleChange, handleValue } =
    useForm({
      initial,
      schema,
      onSubmit,
    });

  // Initialize form when data changes
  useEffect(() => {
    if (data) {
      setValues({
        title: data?.title || "",
        body: data?.body || "",
        // delivery_date: data?.delivery_date || "",
        schedule_date: data?.schedule_date || "",
        status: data?.status || "scheduled",
        recipients:
          data?.recipients?.map(
            (recipient: { email: string }) => recipient.email,
          ) || [],
      });

      // Pre-populate attachments
      if (data?.attachments && Array.isArray(data.attachments)) {
        const mediaItems = data.attachments.map((attachment: any) => ({
          id: attachment._id,
          _id: attachment._id,
          type: attachment.type?.split("/")[0] || "image",
          thumbnail: attachment.url || attachment.thumbnail,
          title: attachment.name || attachment.title,
          url: attachment.url,
          duration: attachment.duration,
        }));
        setSelectedMedia(mediaItems);
      }
    }
  }, [data, setValues]);

  // Card style state
  const [cardStyle, setCardStyle] = useState<CardCustomization>({
    backgroundColor: "#E2EADF",
    fontFamily: "Geist Mono",
    fontSize: "1x",
    textColor: "#2C3E2F",
    headerColor: "#1A2419",
  });

  // Build preview assets
  const previewAssets = [
    ...files.map((f) => ({
      id: f.id,
      type: (f.file?.type?.split("/")[0] || "image") as
        | "image"
        | "video"
        | "audio",
      thumbnail: f.base64 || "",
      title: f.file?.name || "Uploaded file",
    })),
    ...selectedMedia.map((m) => ({
      id: m.id || m._id,
      type: (m.isMemory
        ? "memory"
        : m.type?.includes("video")
          ? "video"
          : m.type?.includes("audio")
            ? "audio"
            : "image") as "image" | "video" | "audio" | "memory",
      thumbnail: m.url || m.thumbnail || m.attachments?.[0]?.url || "",
      title: m.title || m.name || "Media file",
      duration: m.duration,
    })),
  ];

  // Map recipients to names for preview
  const previewRecipients = values.recipients.map((email) => {
    const beneficiary = beneficiaries?.data?.docs?.find(
      (b: any) => b.email === email,
    );
    return beneficiary?.name || beneficiary?.user?.name || email;
  });

  // Handlers
  const handleStyleChange = (updates: Partial<CardCustomization>) => {
    setCardStyle((prev) => ({ ...prev, ...updates }));
  };

  const handleEditClick = () => {
    if (!data) {
      toast.error("No capsule data available to edit");
      return;
    }
    setCurrentMode("edit");
  };

  const handleCloseClick = () => {
    close?.("create-capsule");
    close?.("view-capsule");
    close?.("edit-capsule");
  };

  // File drop handler
  const handleFileDrop = useCallback(
    (droppedFiles: FileList) => {
      const MAX_FILE_SIZE = 120 * 1024 * 1024;

      Array.from(droppedFiles).forEach((file) => {
        const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
        const isValidType =
          CAPSULE_SUPPORTED_FILE_TYPES.includes(file.type as any) ||
          (EXTENSION_TO_MIME[extension] &&
            CAPSULE_SUPPORTED_FILE_TYPES.includes(
              EXTENSION_TO_MIME[extension] as any,
            ));

        if (!isValidType) {
          toast.error(`File type "${file.type || extension}" is not supported`);
          return;
        }

        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name} exceeds 120MB limit`);
          return;
        }

        handleUpload({
          id: uuidv4(),
          file,
          progress: 0,
        });
      });
    },
    [handleUpload],
  );

  const { isDragging, handlers: dragHandlers } = useDragAndDrop({
    onDrop: handleFileDrop,
  });

  const handleRecipientSelect = (recipient: any) => {
    const email = recipient.email;
    if (!email) return;

    const currentRecipients = values.recipients || [];
    const isSelected = currentRecipients.includes(email);

    let newRecipients;
    if (isSelected) {
      newRecipients = currentRecipients.filter((r) => r !== email);
    } else {
      newRecipients = [...currentRecipients, email];
    }
    handleValue("recipients", newRecipients);
  };

  const handleMediaSelect = (item: any) => {
    const id = item.id || item._id;
    const isSelected = selectedMedia.some((m) => (m.id || m._id) === id);

    if (isSelected) {
      setSelectedMedia((prev) => prev.filter((m) => (m.id || m._id) !== id));
    } else {
      setSelectedMedia((prev) => [...prev, item]);
    }
  };

  const [shouldSubmit, setShouldSubmit] = useState(false);

  // Trigger submission after status changes to draft
  useEffect(() => {
    if (shouldSubmit && values.status === "draft") {
      handleSubmit();
      setShouldSubmit(false);
    }
  }, [values.status, shouldSubmit, handleSubmit]);

  const handleSaveToDraft = (event: React.FormEvent<HTMLButtonElement>) => {
    if (isMutating) return;
    handleValue("status", "draft");
    handleSubmit(event as unknown as React.FormEvent<HTMLFormElement>);
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    console.log(event, "Save");
    if (isMutating) return;
    handleValue("status", "scheduled");
    handleSubmit(event);
  };

  const renderFileAttachment = (file: IOnUploadPayload) => (
    <FileAttachment
      key={file.id}
      onDelete={handleDeleteFile}
      progressType="text"
      file={file}
      className="max-w-67 bg-white"
    />
  );

  const handleMemoryClose = useCallback(() => {
    setShowMemoryList(false);
  }, []);

  const handleMediaListClose = useCallback(() => {
    setShowMediaList(false);
  }, []);

  const handleMemorySelectionConfirm = useCallback((memories: IMemory[]) => {
    setSelectedMedia((prev) => {
      const mappedMemories = memories.map((m) => ({
        id: m._id,
        _id: m._id,
        type: m.attachments?.[0]?.type?.includes("video") ? "video" : "image",
        thumbnail: m.attachments?.[0]?.url || "",
        title: m.title,
        attachments: m.attachments,
        isMemory: true,
      }));

      const existingIds = prev.map((p) => p.id || p._id);
      const newItems = mappedMemories.filter(
        (m) => !existingIds.includes(m.id),
      );
      return [...prev, ...newItems];
    });
  }, []);

  const handleMediaSelectionConfirm = useCallback((files: IFile[]) => {
    setSelectedMedia((prev) => {
      const mappedFiles = files.map((f) => ({
        id: f._id,
        _id: f._id,
        type: f.type.split("/")[0] || "image",
        thumbnail: f.url,
        title: f.name,
        url: f.url,
        duration: f.duration,
      }));

      const existingIds = prev.map((p) => p.id || p._id);
      const newItems = mappedFiles.filter((m) => !existingIds.includes(m.id));
      return [...prev, ...newItems];
    });
  }, []);

  // Sub-views for memory/media selection
  if (showMemoryList) {
    return (
      <SelectFromMemory
        selectedIds={selectedMedia.map((m) => m.id || m._id)}
        handleClose={handleMemoryClose}
        onConfirm={handleMemorySelectionConfirm}
      />
    );
  }

  if (showMediaList) {
    return (
      <SelectFromMedia
        selectedIds={selectedMedia.map((m) => m.id || m._id)}
        handleClose={handleMediaListClose}
        onConfirm={handleMediaSelectionConfirm}
      />
    );
  }

  const isFormValid =
    // values.delivery_date &&
    values.schedule_date &&
    values.title.trim() !== "" &&
    values.body.trim() !== "" &&
    values.recipients.length > 0;

  // ==================== VIEW MODE ====================
  if (isViewMode) {
    return (
      <>
        <div className="max-w-[1440px] flex flex-col justify-center items-center max-h-[900px] h-full w-full relative">
          <ModalCloseBtn onClick={handleCloseClick} />

          <div className="flex flex-col items-center justify-center w-full">
            <div className="bg-black/60 gap-6 h-fit mt-10 min-w-[560px] max-w-5xl w-full rounded-2xl py-8 px-6 lg:px-24 flex flex-col items-center">
              <StyleControls
                cardStyle={cardStyle}
                onStyleChange={handleStyleChange}
              />

              <div className="h-[770px] w-full">
                <CapsulePreviewCard
                  style={cardStyle}
                  recipients={previewRecipients}
                  title={values.title}
                  body={values.body}
                  assets={previewAssets}
                  sender={user}
                  onAssetClick={(asset) => console.log("Clicked:", asset)}
                  className="h-full w-full p-6"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 w-full">
                <button
                  type="button"
                  onClick={handleCloseClick}
                  className="btn-outline"
                >
                  Close
                </button>

                <button type="submit" onClick={handleEditClick} className="btn">
                  Edit Capsule
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ==================== EDIT/CREATE MODE ====================
  return (
    <div className="max-w-[1440px] flex flex-col justify-center max-h-[900px] h-full w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-10">
        {/* Left: Preview Card (Smaller in edit mode) */}
        <div className="flex justify-center w-full">
          <div className="bg-black/60 gap-6 h-fit mt-10 min-w-[560px] w-full rounded-2xl py-8 px-6 lg:px-24 flex flex-col items-center">
            <StyleControls
              cardStyle={cardStyle}
              onStyleChange={handleStyleChange}
            />

            <div className="h-[770px] w-full">
              <CapsulePreviewCard
                style={cardStyle}
                recipients={previewRecipients}
                title={values.title}
                body={values.body}
                assets={previewAssets}
                sender={user}
                onAssetClick={(asset) => console.log("Clicked:", asset)}
                className="h-full w-full p-6"
              />
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="modal-container overflow-auto scrollbar-hide">
          <ModalCloseBtn onClick={handleCloseClick} />
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="modal-title">
                {isEditMode ? "Edit Capsule" : "Create Capsule"}
              </h4>
              {/* Optional: Back to view button */}
              {/*{data && (
                <button
                  onClick={() => setCurrentMode("view")}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Preview
                </button>
              )}*/}
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <Taginput
                values={values.recipients}
                placeholder="Enter recipients email address"
                label={
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-inter font-normal text-[#667085]">
                      Select recipient(s)
                    </span>
                  </div>
                }
                setValue={(recipients) => handleValue("recipients", recipients)}
                error={errors.recipients as string}
              />

              <div className="bg-black/2 rounded-xl text-sm text-weak/40 p-3">
                <span className="mb-2 block">Beneficiaries</span>
                <RecentRecipients
                  recipients={beneficiaries?.data?.docs}
                  selectedRecipients={values.recipients}
                  onSelect={handleRecipientSelect}
                  onSeeAll={() => console.log("See all clicked")}
                />
              </div>

              <div className="border-t border-[#0011661A] py-2 pt-8">
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Upload Media</span>
                  <span
                    className="cursor-pointer text-sm font-medium text-orange"
                    onClick={() => setShowMemoryList(true)}
                  >
                    Select from memory
                  </span>
                </div>

                {/* Drag and Drop Zone */}
                <div
                  {...dragHandlers}
                  className={cn(
                    "h-56 justify-center flex flex-col items-center gap-6 border-2 border-dashed rounded-2xl p-3 transition-all duration-200",
                    isDragging
                      ? "border-orange bg-orange/5 scale-[1.02]"
                      : "border-black/5 bg-transparent",
                  )}
                >
                  <ImagePlusIcon
                    width={24}
                    height={24}
                    className={cn(
                      "transition-colors",
                      isDragging ? "text-orange" : "text-gray-400",
                    )}
                  />

                  <span className="mt-6 text-sm font-semibold leading-5 text-gray-950 text-center">
                    {isDragging ? (
                      "Drop files here to upload"
                    ) : (
                      <>
                        Drag and drop your file <br /> here or click to upload
                      </>
                    )}
                  </span>

                  <p className="mb-6 text-xs text-weak text-center">
                    Supports JPG, PNG, MP4, MP3, PDF, <br /> DOC, TXT. Max file
                    size: 120mb
                  </p>

                  <BrowseFileBtn onUpload={handleUpload} />

                  <div className="w-full space-y-3">
                    {/*{files.map((file) => renderFileAttachment(file))}*/}
                  </div>
                </div>
              </div>

              <div>
                <span className="block mb-2">Recent</span>
                <RecentMedia
                  items={recentMedia?.data?.docs}
                  selectedItems={selectedMedia.map((m) => m.id || m._id)}
                  onSelect={handleMediaSelect}
                  onSeeMore={() => setShowMediaList(true)}
                />
              </div>

              <div className="border-y border-[#0011661A] py-8">
                <span className="block mb-4">Write a message</span>

                <div className="flex flex-col gap-2">
                  <div className="h-fit w-full rounded-xl border border-grey-100 bg-grey-700 px-3 py-1 focus-within:border-2 focus-within:border-primary">
                    <input
                      placeholder="Header here"
                      name="title"
                      onChange={handleChange}
                      value={values.title}
                      className="h-9 w-full min-h-9 resize-none font-semibold font-garamond first-letter:capitalize outline-0 bg-transparent"
                    />
                    {errors.title && (
                      <small className="text-xs text-danger">
                        {errors.title}
                      </small>
                    )}
                  </div>

                  {errors.body && (
                    <small className="text-xs text-danger">{errors.body}</small>
                  )}

                  <div className="h-fit w-full rounded-xl border border-grey-100 bg-grey-700 px-3 py-1 focus-within:border-2 focus-within:border-primary">
                    <textarea
                      placeholder="Message here..."
                      name="body"
                      onChange={handleChange}
                      value={values.body}
                      className="flex-1 resize-none w-full font-semibold font-garamond outline-0 leading-9 overflow-hidden bg-transparent"
                      rows={5}
                    />
                  </div>
                </div>
              </div>

              <span className="font-inter text-xs mb-2 font-normal text-[#667085] block">
                Capsule delivery date:
              </span>
              <DateOptionsDropdown
                onDateSelect={(date) =>
                  // handleValue("delivery_date", date.toISOString())
                  handleValue("schedule_date", date.toISOString())
                }
                CustomCalendarComponent={DatePickerWrapper}
                defaultLabel="In 3 days"
              />

              <div className="flex items-center justify-end">
                <div className="flex items-center gap-3">
                  {!isEditMode && (
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        e.nativeEvent.preventDefault();
                        e.nativeEvent.stopPropagation();
                        handleSaveToDraft(e);
                        console.log("Save to draft clicked");
                      }}
                    >
                      Save to draft
                      {values.status === "draft" && (
                        <Spinner loading={isMutating} className="size-4!" />
                      )}
                    </button>
                  )}

                  <button
                    type="submit"
                    className="btn"
                    disabled={!isFormValid || isMutating}
                  >
                    {isEditMode ? "Update Capsule" : "Schedule Capsule"}
                    {values.status === "scheduled" && (
                      <Spinner loading={isMutating} className="size-4!" />
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
