import { useEffect, useState, useCallback } from "react";
import * as yup from "yup";
import ReactDOM from "react-dom";
import { Taginput } from "@/components/Form";
import { ModalCloseBtn } from "../../modalLayout";
import { useModal } from "@/hooks/use-modal";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import useForm from "@/hooks/use-form";
import { toast } from "sonner";
import Spinner from "@/components/spinner";
import useFileUpload from "@/hooks/use-file-upload";
import { isEmpty, cn } from "@/utility";
import useSWR, { mutate } from "swr";
import type { IMemory, IFile } from "@/utility/interface";
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
import { Sheet } from "react-modal-sheet";
import TimeCapsuleBadge from "@/pages/dashboard/time-capsule-new/components/TimeCapsuleBadge";
import { useStore } from "@/hooks/use-store";
import { X } from "lucide-react";

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
  schedule_date: "",
  title: "",
  body: "",
  status: "scheduled",
  recipients: [] as string[],
};

interface CreateCapsuleProps {
  data?: any;
  mode?: "create" | "edit" | "view";
}

// ─── Portal — renders sheets directly into document.body to escape
//     any parent stacking context (backdrop-filter, transform, overflow)
function MobileSheetPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    setMounted(true);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!mounted || !isMobile) return null;

  return ReactDOM.createPortal(children, document.body);
}

function DatePickerWrapper({
  onDateSelect,
  onClose,
}: {
  onDateSelect: (date: Date) => void;
  onClose: () => void;
}) {
  const [show, setShow] = useState(true);
  return (
    <div className="relative">
      <DatePicker
        show={show}
        setShow={(value) => {
          setShow(value);
          if (!value) onClose();
        }}
        onChange={(date) => {
          onDateSelect(date);
          setShow(false);
          onClose();
        }}
        position="bottom"
        options={{ minDate: new Date() }}
      >
        <div className="invisible h-0" />
      </DatePicker>
    </div>
  );
}

// ─── Sheet header row (title + close btn) ────────────────────────────────────
function SheetHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h4 className="text-lg font-semibold text-[#1D2939]">{title}</h4>
      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function PeekCard() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: "-10px", // Adjusted slightly for better overlap
        left: "12px",
        right: "12px",
        height: "124px",
        minWidth: "343px",
        margin: "0 auto",
        background: "#FBF5EB",
        opacity: 0.8,
        borderRadius: "20px 20px 0 0",
        zIndex: 0, // Bottom-most layer
      }}
    />
  );
}

const SheetBackground = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: "#ffffff",
      borderRadius: "24px 24px 0 0",
      zIndex: 1, // Sits above the PeekCard
      boxShadow: "0 -8px 24px rgba(0,0,0,0.08)",
    }}
  />
);

// ─── Form sheet ───────────────────────────────────────────────────────────────
function MobileFormSheet({
  isOpen,
  onClose,
  values,
  errors,
  handleChange,
  handleValue,
  handleSave,
  handleSaveToDraft,
  isEditMode,
  isFormValid,
  isMutating,
  beneficiaries,
  recentMedia,
  selectedMedia,
  handleRecipientSelect,
  handleMediaSelect,
  onOpenMemory,
  onOpenMedia,
  onTapPreview,
  dragHandlers,
  isDragging,
  handleUpload,
  cardStyle,
  onStyleChange,
  previewRecipients,
  previewAssets,
  user,
}: any) {
  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0, 1]}
      initialSnap={1}
      style={{ zIndex: 9995 }}
    >
      <Sheet.Container
        style={{
          background: "transparent", // Important: made transparent to show peek card behind
          borderRadius: "24px 24px 0 0",
          overflow: "visible",
          boxShadow: "none",
        }}
      >
        <PeekCard />
        <SheetBackground />

        {/* All content must be relative and higher z-index than SheetBackground */}
        <Sheet.Header className="relative z-10">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>
        </Sheet.Header>

        <Sheet.Content className="relative z-10">
          {/* Scrollable body */}
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto px-4 pb-4">
              <SheetHeader
                title={isEditMode ? "Edit Capsule" : "Create Capsule"}
                onClose={onClose}
              />

              {/* ── Recipients ── */}
              <div className="mb-5">
                <p className="text-xs text-[#667085] mb-1.5">
                  Select recipient(s)
                </p>
                <Taginput
                  values={values.recipients}
                  placeholder="Enter recipients email address"
                  setValue={(recipients) =>
                    handleValue("recipients", recipients)
                  }
                  error={errors.recipients as string}
                />
              </div>

              {/* ── Recent beneficiaries ── */}
              <div className="bg-[#F9FAFB] rounded-xl p-3 mb-5">
                <p className="text-xs text-[#667085] mb-3">Recent</p>
                <div className="overflow-x-auto">
                  <RecentRecipients
                    recipients={beneficiaries?.data?.docs}
                    selectedRecipients={values.recipients}
                    onSelect={handleRecipientSelect}
                    onSeeAll={() => {}}
                    hideRelationship
                  />
                </div>
              </div>

              {/* ── Upload media ── */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[#1D2939]">
                    Upload media
                  </span>
                  <button
                    type="button"
                    onClick={onOpenMemory}
                    className="text-sm font-medium text-orange"
                  >
                    Add from memory
                  </button>
                </div>

                {/* Drag & drop zone */}
                <div
                  {...dragHandlers}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl py-8 px-4 transition-all duration-200",
                    isDragging
                      ? "border-orange bg-orange/5 scale-[1.02]"
                      : "border-gray-200 bg-transparent",
                  )}
                >
                  <p className="text-sm font-semibold text-center text-[#1D2939]">
                    {isDragging ? (
                      "Drop files here to upload"
                    ) : (
                      <>
                        Drag and drop your file
                        <br />
                        here or click to upload
                      </>
                    )}
                  </p>
                  <p className="text-xs text-[#667085] text-center">
                    Supports JPG, PNG, MP4, MP3, PDF,
                    <br />
                    DOC, TXT. Max file size: 120mb
                  </p>
                  <BrowseFileBtn onUpload={handleUpload} />
                </div>
              </div>

              {/* ── Recent media strip ── */}
              <div className="mb-5">
                <p className="text-sm text-[#667085] mb-3">Recent</p>
                <div className="bg-[#F9FAFB] rounded-xl p-3">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    <RecentMedia
                      items={recentMedia?.data?.docs}
                      selectedItems={selectedMedia.map(
                        (m: any) => m.id || m._id,
                      )}
                      onSelect={handleMediaSelect}
                      onSeeMore={onOpenMedia}
                    />
                    {/* + add more button */}
                    {/*<button
                      type="button"
                      onClick={onOpenMedia}
                      className="shrink-0 w-14 h-14 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-orange"
                    >
                      <span className="text-2xl font-light">+</span>
                    </button>*/}
                  </div>
                </div>
              </div>

              {/* ── Write a message ── */}
              <div className="border-t border-[#0011661A] pt-5 mb-5">
                <p className="text-sm font-medium text-[#1D2939] mb-3">
                  Write a message
                </p>
                <div className="flex flex-col gap-2">
                  <div className="w-full rounded-xl border border-gray-200 bg-[#F9FAFB] px-3 py-2">
                    <input
                      placeholder="Header here"
                      name="title"
                      onChange={handleChange}
                      value={values.title}
                      className="w-full h-9 font-semibold font-garamond outline-none bg-transparent text-[#1D2939] placeholder:text-gray-400"
                    />
                  </div>
                  {errors.title && (
                    <small className="text-xs text-danger">
                      {errors.title}
                    </small>
                  )}

                  <div className="w-full rounded-xl border border-gray-200 bg-[#F9FAFB] px-3 py-2">
                    <textarea
                      placeholder="Message here..."
                      name="body"
                      onChange={handleChange}
                      value={values.body}
                      className="w-full resize-none font-garamond outline-none bg-transparent text-[#1D2939] placeholder:text-gray-400 leading-6"
                      rows={5}
                    />
                  </div>
                  {errors.body && (
                    <small className="text-xs text-danger">{errors.body}</small>
                  )}
                </div>
              </div>

              {/* ── Delivery date ── */}
              <div className="mb-5">
                <p className="text-xs text-[#667085] mb-2">
                  Capsule delivery date:
                </p>
                <DateOptionsDropdown
                  onDateSelect={(date) =>
                    handleValue("schedule_date", date.toISOString())
                  }
                  CustomCalendarComponent={DatePickerWrapper}
                  defaultLabel="In 3 days"
                />
              </div>

              {/* ── Preview section ── */}
              <div className="mb-6">
                <p className="text-sm font-medium text-[#1D2939] mb-3">
                  Preview
                </p>

                {/* Style controls — Theme swatches + Style dropdown + Size dropdown */}
                <div className="mb-3">
                  <StyleControls
                    cardStyle={cardStyle}
                    onStyleChange={onStyleChange}
                  />
                </div>

                {/* Mini preview card with "Tap to preview" overlay */}
                <div
                  className="relative w-full rounded-2xl overflow-hidden cursor-pointer h-[340px]"
                  onClick={onTapPreview}
                >
                  {/* Centering wrapper */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-[268px] h-[343px] scale-[0.85] origin-center">
                      <CapsulePreviewCard
                        style={cardStyle}
                        recipients={previewRecipients}
                        title={values.title}
                        body={values.body}
                        assets={previewAssets}
                        sender={user}
                        onAssetClick={() => {}}
                        className="h-full w-full p-4 rounded-xl overflow-hidden"
                      />
                    </div>
                  </div>

                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-black/40 rounded-2xl" />

                  {/* Tap to preview pill */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <button
                      type="button"
                      className="flex items-center gap-2 bg-[#061528BA] text-white text-sm font-medium px-5 py-2.5 rounded-full"
                    >
                      {/* <Expand size={16} /> */}
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3 21L21 3M3 21H9M3 21L3 15M21 3H15M21 3V9"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Tap to preview
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Sticky bottom action bar ── */}
            <div className="flex-shrink-0 flex items-center gap-3 px-4 py-4 border-t border-gray-100 bg-white">
              {!isEditMode && (
                <button
                  type="button"
                  onClick={handleSaveToDraft}
                  className="flex-1 h-12 rounded-full border border-gray-300 text-sm font-medium text-[#1D2939] flex items-center justify-center gap-2"
                >
                  Save as Draft
                  {values.status === "draft" && (
                    <Spinner loading={isMutating} className="size-4!" />
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={!isFormValid || isMutating}
                className="flex-1 h-12 rounded-full bg-orange text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isEditMode ? "Update Capsule" : "Schedule Capsule"}
                {values.status === "scheduled" && (
                  <Spinner loading={isMutating} className="size-4!" />
                )}
              </button>
            </div>
          </div>
        </Sheet.Content>
      </Sheet.Container>
      {/* No backdrop — preview sheet is behind */}
    </Sheet>
  );
}

// ─── Preview sheet ────────────────────────────────────────────────────────────
function MobilePreviewSheet({
  isOpen,
  onClose,
  cardStyle,
  onStyleChange,
  previewRecipients,
  values,
  previewAssets,
  user,
}: any) {
  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0, 1]}
      initialSnap={1}
      style={{ zIndex: 9998 }}
    >
      <Sheet.Container
        style={{
          background: "transparent",
          borderRadius: "24px 24px 0 0",
          overflow: "visible",
          boxShadow: "none",
        }}
      >
        <PeekCard />
        <SheetBackground />

        <Sheet.Header className="relative z-10">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>
        </Sheet.Header>
        <Sheet.Content className="relative z-10">
          <div className="flex flex-col h-full overflow-auto px-4 pb-8">
            <SheetHeader title="Preview Capsule" onClose={onClose} />
            {/* Style controls (Theme + Size) */}
            <div className="mb-4">
              <StyleControls
                cardStyle={cardStyle}
                onStyleChange={onStyleChange}
              />
            </div>
            {/* Full capsule card */}
            <div className="flex-1 rounded-2xl overflow-hidden">
              <CapsulePreviewCard
                style={cardStyle}
                recipients={previewRecipients}
                title={values.title}
                body={values.body}
                assets={previewAssets}
                sender={user}
                onAssetClick={() => {}}
                className="h-full w-full p-6"
              />
            </div>
          </div>
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop onTap={onClose} />
    </Sheet>
  );
}

// ─── Memory sheet ─────────────────────────────────────────────────────────────
function MobileMemorySheet({
  isOpen,
  onClose,
  selectedIds,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onConfirm: (memories: IMemory[]) => void;
}) {
  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0, 1]}
      initialSnap={1}
      style={{ zIndex: 9999 }}
    >
      <Sheet.Container
        style={{
          background: "transparent",
          borderRadius: "24px 24px 0 0",
          overflow: "visible",
          boxShadow: "none",
        }}
      >
        <PeekCard />
        <SheetBackground />

        <Sheet.Header className="relative z-10">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>
        </Sheet.Header>
        <Sheet.Content className="relative z-10">
          <div className="h-full overflow-auto px-4 pb-8">
            <SheetHeader title="Select item from memory" onClose={onClose} />
            <SelectFromMemory
              selectedIds={selectedIds}
              handleClose={onClose}
              onConfirm={onConfirm}
              className="w-full flex-1"
              hideHeader
            />
          </div>
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop onTap={onClose} />
    </Sheet>
  );
}

// ─── Media sheet ──────────────────────────────────────────────────────────────
function MobileMediaSheet({
  isOpen,
  onClose,
  selectedIds,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onConfirm: (files: IFile[]) => void;
}) {
  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0, 1]}
      initialSnap={1}
      style={{ zIndex: 9999 }}
    >
      <Sheet.Container
        style={{
          background: "transparent",
          borderRadius: "24px 24px 0 0",
          overflow: "visible",
          boxShadow: "none",
        }}
      >
        {/* Peek card */}
        <PeekCard />
        <SheetBackground />
        <Sheet.Header className="relative z-10">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>
        </Sheet.Header>
        <Sheet.Content className="relative z-10">
          <div className="h-full overflow-auto px-4 pb-8">
            <SheetHeader
              title="Select item from Recent Media"
              onClose={onClose}
            />
            <SelectFromMedia
              selectedIds={selectedIds}
              handleClose={onClose}
              onConfirm={onConfirm}
              className="w-full flex-1"
              hideHeader
            />
          </div>
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop onTap={onClose} />
    </Sheet>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CreateCapsule({
  data = null,
  mode = "create",
}: CreateCapsuleProps) {
  const [currentMode, setCurrentMode] = useState<"view" | "edit">(
    mode === "view" ? "view" : "edit",
  );
  const isEditMode = !isEmpty(data) && currentMode === "edit";
  const isViewMode = currentMode === "view";

  const { close } = useModal();
  const { user } = useStore();
  const { files, handleUpload } = useFileUpload();
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

  // Desktop
  const [desktopShowMemory, setDesktopShowMemory] = useState(false);
  const [desktopShowMedia, setDesktopShowMedia] = useState(false);

  // Mobile sheets
  const [formSheetOpen] = useState(true);
  const [previewSheetOpen, setPreviewSheetOpen] = useState(false);
  const [memorySheetOpen, setMemorySheetOpen] = useState(false);
  const [mediaSheetOpen, setMediaSheetOpen] = useState(false);

  const onSubmit = async (
    payload: any,
    { setValues }: { setValues: (v: typeof initial) => void },
  ) => {
    const submission = { ...payload };
    if (submission.status === "draft") {
      const { schedule_date, ...rest } = submission;
      Object.assign(submission, rest);
    }
    const uploadedIds = !isEmpty(files)
      ? files.map((f: any) => f.uploadedFile?._id).filter(Boolean)
      : [];

    const attachmentIds = [...uploadedIds];
    const memoryIds: string[] = [];

    selectedMedia.forEach((m: any) => {
      if (m.isMemory) {
        memoryIds.push(m.id || m._id);
      } else {
        attachmentIds.push(m.id || m._id);
      }
    });

    submission.attachments = Array.from(new Set(attachmentIds));
    submission.memories = Array.from(new Set(memoryIds));
    const result = await trigger(submission);
    if (result?.success) {
      toast.custom(() => <TimeCapsuleBadge />);
      mutate(`${endpoint.capsule}?page=1`);
      setValues(initial);
      close?.("create-capsule");
    }
  };

  const { setValues, values, errors, handleSubmit, handleChange, handleValue } =
    useForm({ initial, schema, onSubmit });

  useEffect(() => {
    if (data) {
      setValues({
        title: data?.title || "",
        body: data?.body || "",
        schedule_date: data?.schedule_date || "",
        status: data?.status || "scheduled",
        recipients:
          data?.recipients?.map((r: { email: string }) => r.email) || [],
      });
      if (data?.attachments?.length) {
        setSelectedMedia(
          data.attachments.map((a: any) => ({
            id: a._id,
            _id: a._id,
            type: a.type?.split("/")[0] || "image",
            thumbnail: a.url || a.thumbnail,
            title: a.name || a.title,
            url: a.url,
            duration: a.duration,
          })),
        );
      }
    }
  }, [data, setValues]);

  const [cardStyle, setCardStyle] = useState<CardCustomization>({
    themeId: "sage",
    backgroundColor: "#F0FCD4",
    fontFamily: "Geist Mono",
    fontSize: "1x",
    textColor: "#2C3E2F",
    headerColor: "#1A2419",
  });

  const previewAssets = [
    ...files.map((f: any) => ({
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
            : "image") as any,
      thumbnail: m.url || m.thumbnail || m.attachments?.[0]?.url || "",
      title: m.title || m.name || "Media file",
      duration: m.duration,
    })),
  ];

  const previewRecipients = values.recipients.map((email) => {
    const b = beneficiaries?.data?.docs?.find((b: any) => b.email === email);
    return b?.name || b?.user?.name || email;
  });

  const handleStyleChange = (updates: Partial<CardCustomization>) =>
    setCardStyle((prev) => ({ ...prev, ...updates }));

  const handleCloseClick = () => {
    close?.("create-capsule");
    close?.("view-capsule");
    close?.("edit-capsule");
  };

  const handleFileDrop = useCallback(
    (droppedFiles: FileList) => {
      const MAX = 120 * 1024 * 1024;
      Array.from(droppedFiles).forEach((file) => {
        const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
        const valid =
          CAPSULE_SUPPORTED_FILE_TYPES.includes(file.type as any) ||
          (EXTENSION_TO_MIME[ext] &&
            CAPSULE_SUPPORTED_FILE_TYPES.includes(
              EXTENSION_TO_MIME[ext] as any,
            ));
        if (!valid) {
          toast.error(`File type "${file.type || ext}" is not supported`);
          return;
        }
        if (file.size > MAX) {
          toast.error(`${file.name} exceeds 120MB limit`);
          return;
        }
        handleUpload({ id: uuidv4(), file, progress: 0 });
      });
    },
    [handleUpload],
  );

  const { isDragging, handlers: dragHandlers } = useDragAndDrop({
    onDrop: handleFileDrop,
  });

  const handleRecipientSelect = (recipient: any) => {
    console.log(recipient, "Recipeint");
    const email = recipient.email;
    if (!email) return;
    const curr = values.recipients || [];
    handleValue(
      "recipients",
      curr.includes(email) ? curr.filter((r) => r !== email) : [...curr, email],
    );
  };

  const handleMediaSelect = (item: any) => {
    const id = item.id || item._id;
    setSelectedMedia((prev) =>
      prev.some((m) => (m.id || m._id) === id)
        ? prev.filter((m) => (m.id || m._id) !== id)
        : [...prev, item],
    );
  };

  const [shouldSubmit, setShouldSubmit] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<
    "draft" | "scheduled" | null
  >(null);

  useEffect(() => {
    if (shouldSubmit && pendingStatus && values.status === pendingStatus) {
      handleSubmit();
      setShouldSubmit(false);
      setPendingStatus(null);
    }
  }, [values.status, shouldSubmit, pendingStatus, handleSubmit]);

  const handleSaveToDraft = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMutating) return;
    handleValue("status", "draft");
    setPendingStatus("draft");
    setShouldSubmit(true);
  };

  const handleSave = () => {
    if (isMutating) return;
    handleValue("status", "scheduled");
    setPendingStatus("scheduled");
    setShouldSubmit(true);
  };

  const handleMemorySelectionConfirm = useCallback((memories: IMemory[]) => {
    setSelectedMedia((prev) => {
      const mapped = memories.map((m) => ({
        id: m._id,
        _id: m._id,
        type: m.attachments?.[0]?.type?.includes("video") ? "video" : "image",
        thumbnail: m.attachments?.[0]?.url || "",
        title: m.title,
        attachments: m.attachments,
        isMemory: true,
      }));
      const existing = prev.map((p) => p.id || p._id);
      return [...prev, ...mapped.filter((m) => !existing.includes(m.id))];
    });
    setMemorySheetOpen(false);
    setDesktopShowMemory(false);
  }, []);

  const handleMediaSelectionConfirm = useCallback((files: IFile[]) => {
    setSelectedMedia((prev) => {
      const mapped = files.map((f) => ({
        id: f._id,
        _id: f._id,
        type: f.type.split("/")[0] || "image",
        thumbnail: f.url,
        title: f.name,
        url: f.url,
        duration: f.duration,
      }));
      const existing = prev.map((p) => p.id || p._id);
      return [...prev, ...mapped.filter((m) => !existing.includes(m.id))];
    });
    setMediaSheetOpen(false);
    setDesktopShowMedia(false);
  }, []);

  const isFormValid =
    values.status === "draft"
      ? values.title.trim() !== "" &&
        values.body.trim() !== "" &&
        values.recipients.length > 0
      : !!values.schedule_date &&
        values.title.trim() !== "" &&
        values.body.trim() !== "" &&
        values.recipients.length > 0;

  const sharedFormProps = {
    values,
    errors,
    handleChange,
    handleValue,
    handleSave,
    handleSaveToDraft,
    isEditMode,
    isFormValid,
    isMutating,
    beneficiaries,
    recentMedia,
    selectedMedia,
    handleRecipientSelect,
    handleMediaSelect,
    dragHandlers,
    isDragging,
    handleUpload,
    cardStyle,
    onStyleChange: handleStyleChange,
    previewRecipients,
    previewAssets,
    user,
  };

  const sharedPreviewProps = {
    cardStyle,
    onStyleChange: handleStyleChange,
    previewRecipients,
    values,
    previewAssets,
    user,
  };

  // Desktop sub-view overrides
  if (desktopShowMemory) {
    return (
      <div className="hidden sm:block">
        <SelectFromMemory
          selectedIds={selectedMedia.map((m) => m.id || m._id)}
          handleClose={() => setDesktopShowMemory(false)}
          onConfirm={handleMemorySelectionConfirm}
        />
      </div>
    );
  }
  if (desktopShowMedia) {
    return (
      <div className="hidden sm:block">
        <SelectFromMedia
          selectedIds={selectedMedia.map((m) => m.id || m._id)}
          handleClose={() => setDesktopShowMedia(false)}
          onConfirm={handleMediaSelectionConfirm}
        />
      </div>
    );
  }

  // ==================== VIEW MODE ====================
  if (isViewMode) {
    return (
      <>
        {/* Desktop */}
        <div className="hidden sm:flex max-w-[1440px] flex-col justify-center items-center max-h-[900px] h-full w-full relative">
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
                  onAssetClick={() => {}}
                  className="h-full w-full p-6"
                />
              </div>
              <div className="flex items-center justify-end gap-4 w-full">
                <button
                  type="button"
                  onClick={handleCloseClick}
                  className="btn-outline"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!data) return;
                    setCurrentMode("edit");
                  }}
                  className="btn"
                >
                  Edit Capsule
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile */}
        <MobileSheetPortal>
          <MobilePreviewSheet
            isOpen
            onClose={handleCloseClick}
            {...sharedPreviewProps}
          />
        </MobileSheetPortal>
      </>
    );
  }

  // ==================== CREATE / EDIT MODE ====================
  return (
    <>
      {/* Desktop */}
      <div className="hidden sm:flex flex-row gap-3 w-full h-full items-stretch overflow-hidden">
        <div className="flex-1 min-w-0 flex justify-center items-center h-full">
          <div
            className="bg-black/60 gap-6 w-full rounded-2xl h-full py-8 px-6 lg:px-24 flex flex-col justify-center items-center"
            style={{ height: "100%" }}
          >
            <div className="w-full max-w-[560px]">
              <StyleControls
                cardStyle={cardStyle}
                onStyleChange={handleStyleChange}
              />
            </div>
            <div
              className="w-full max-w-[560px]"
              style={{ flex: "1 1 0", minHeight: 0, overflow: "hidden", height: 300 }}
            >
              <CapsulePreviewCard
                style={cardStyle}
                recipients={previewRecipients}
                title={values.title}
                body={values.body}
                assets={previewAssets}
                sender={user}
                onAssetClick={() => {}}
                className="h-full bg-orange-500 w-full p-6 pb-0"
              />
            </div>
          </div>
        </div>
        <div className="modal-container overflow-hidden scrollbar-hide !w-[500px] !max-w-[500px] !h-full !max-h-full !p-6 !rounded-3xl shrink-0 !bg-white">
          <ModalCloseBtn onClick={handleCloseClick} />
          <div className="flex flex-col gap-8 w-full h-full">
              <h4 className="modal-title">
                {isEditMode ? "Edit Capsule" : "Create Capsule"}
              </h4>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
                className="flex flex-col gap-8 pb-6"
              >
                <div className="flex flex-col gap-2">
                  <Taginput
                    values={values.recipients}
                    placeholder="Enter recipients email address"
                    inputClassName="!px-2"
                    label={
                      <div className="mb-2 text-base text-[var(--color-gray-800)] normal-case">
                        Select recipient(s)
                      </div>
                    }
                    setValue={(r) => {
                      console.log(r, "REcipeint");
                      handleValue("recipients", r);
                    }}
                    error={errors.recipients as string}
                  />
                  <div className="flex flex-col gap-1 rounded-xl text-sm text-white p-0">
                    <RecentRecipients
                      recipients={beneficiaries?.data?.docs}
                      selectedRecipients={values.recipients}
                      onSelect={handleRecipientSelect}
                      onSeeAll={() => {}}
                      hideRelationship
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col">
                    <div className="flex justify-between mb-2">
                      <span className="text-base text-[var(--color-gray-800)]">Upload Media</span>
                      <span
                        className="cursor-pointer text-sm font-medium text-orange"
                        onClick={() => setDesktopShowMemory(true)}
                      >
                        Select from memory
                      </span>
                    </div>
                    <div
                      {...dragHandlers}
                      className={cn(
                        "h-fit justify-center flex flex-col items-center gap-1 border-2 border-dashed rounded-2xl py-5 px-3 transition-all",
                        isDragging
                          ? "border-orange bg-orange/5"
                          : "border-black/5",
                      )}
                    >
                      <span className="mt-6 text-sm font-medium text-center text-[var(--color-gray-900)]">
                        {isDragging ? (
                          "Drop files here"
                        ) : (
                          <>
                            {`Drag and drop your file`}
                            <br />
                            here or click to upload
                          </>
                        )}
                      </span>
                      <p className="mb-6 text-xs font-light text-center max-w-[240px] text-[var(--color-gray-600)]">
                        Supports JPG, PNG, MP4, MP3, PDF, DOC, TXT. Max 120mb
                      </p>
                      <BrowseFileBtn onUpload={handleUpload} />
                    </div>
                  </div>
                  <div className="flex flex-col border-t-0 rounded-2xl bg-[#f5f5f5] p-3">
                    <span className="block mb-2 text-xs text-[var(--color-gray-600)] font-medium">Recently uploaded</span>
                    <RecentMedia
                      items={recentMedia?.data?.docs}
                      selectedItems={selectedMedia.map((m) => m.id || m._id)}
                      onSelect={handleMediaSelect}
                      onSeeMore={() => setDesktopShowMedia(true)}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-0 justify-start items-start pt-8 h-fit">
                  <span className="block mb-4">Write a message</span>
                  <div className="flex flex-col gap-2 w-full">
                    <div className="w-full rounded-xl border border-[rgba(150,150,150,0.1)] bg-grey-700 px-3 py-1 focus-within:border-2 focus-within:border-primary">
                      <input
                        placeholder="Header here"
                        name="title"
                        onChange={handleChange}
                        value={values.title}
                        className="h-9 w-full outline-0 bg-transparent font-medium text-sm"
                      />
                    </div>
                    {errors.title && (
                      <small className="text-xs text-danger">
                        {errors.title}
                      </small>
                    )}
                    <div className="w-full rounded-xl border border-[rgba(150,150,150,0.1)] bg-grey-700 px-3 py-1 focus-within:border-2 focus-within:border-primary">
                      <textarea
                        placeholder="Message here..."
                        name="body"
                        onChange={handleChange}
                        value={values.body}
                        className="w-full resize-none outline-0 bg-transparent font-medium text-lg leading-9 font-garamond"
                        rows={5}
                      />
                    </div>
                    {errors.body && (
                      <small className="text-xs text-danger">
                        {errors.body}
                      </small>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-base text-[var(--color-gray-800)] block">
                    Capsule delivery date:
                  </span>
                  <DateOptionsDropdown
                    dropDirection="up"
                    onDateSelect={(date) =>
                      handleValue("schedule_date", date.toISOString())
                    }
                    CustomCalendarComponent={DatePickerWrapper}
                    defaultLabel="In 3 days"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 mb-8 h-fit">
                  {!isEditMode && (
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={handleSaveToDraft}
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
              </form>
            </div>
          </div>
        </div>

      {/* ── Mobile sheets — portaled to document.body ── */}
      <MobileSheetPortal>
        {/* 1. Form sheet */}
        <MobileFormSheet
          isOpen={formSheetOpen}
          onClose={handleCloseClick}
          {...sharedFormProps}
          onOpenMemory={() => setMemorySheetOpen(true)}
          onOpenMedia={() => setMediaSheetOpen(true)}
          onTapPreview={() => setPreviewSheetOpen(true)}
        />

        {/* 2. Preview sheet — opens over form on "Tap to preview" */}
        <MobilePreviewSheet
          isOpen={previewSheetOpen}
          onClose={() => setPreviewSheetOpen(false)}
          {...sharedPreviewProps}
        />

        {/* 3. Memory sheet */}
        <MobileMemorySheet
          isOpen={memorySheetOpen}
          onClose={() => setMemorySheetOpen(false)}
          selectedIds={selectedMedia.map((m) => m.id || m._id)}
          onConfirm={handleMemorySelectionConfirm}
        />

        {/* 4. Media sheet */}
        <MobileMediaSheet
          isOpen={mediaSheetOpen}
          onClose={() => setMediaSheetOpen(false)}
          selectedIds={selectedMedia.map((m) => m.id || m._id)}
          onConfirm={handleMediaSelectionConfirm}
        />
      </MobileSheetPortal>
    </>
  );
}
