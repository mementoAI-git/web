import { useEffect, useState, useCallback, useMemo } from "react";
import dayjs from "dayjs";
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
import type {
  IMemory,
  IFile,
  ICapsule,
  IOnUploadPayload,
  IUser,
} from "@/utility/interface";
import SelectFromMemory from "../../select-from-memory";
import SelectFromMedia from "../../select-from-media";
import DateOptionsDropdown from "@/pages/dashboard/time-capsule-new/components/DateInputWithCustomDropdown";
import DatePicker from "@/components/date-picker";
import BrowseFileBtn from "./browse-file-btn";
import RecentRecipients from "@/pages/dashboard/time-capsule-new/components/RecentRecipients";
import RecentMedia from "@/pages/dashboard/time-capsule-new/components/RecentMedia";
import type {
  CardCustomization,
  MediaAsset,
} from "@/pages/dashboard/time-capsule-new/components/CapsulePreviewCard";
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
import { useSubscription } from "@/contexts/subscription";
import { handleSubscriptionGateError } from "@/features/pricing/subscription-errors";
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

type FormValues = typeof initial;

// Shape of items tracked in selectedMedia — a mix of uploaded files,
// previously saved attachments, and selected memories (isMemory=true).
type SelectedMediaItem = {
  id?: string;
  _id?: string;
  type?: string;
  thumbnail?: string;
  title?: string;
  name?: string;
  url?: string;
  duration?: number | string;
  isMemory?: boolean;
  attachments?: IFile[];
};

// Recipient shape returned by the /beneficiaries docs and RecentRecipients component.
type RecipientLike = {
  _id?: string;
  name?: string;
  email?: string;
  relationship?: string;
  avatar?: string;
  user?: {
    name?: string;
    picture_url?: string;
  };
};

// Item shape coming from RecentMedia's onSelect callback.
type MediaItemLike = {
  id: string;
  _id?: string;
  type: "video" | "image" | "audio";
  thumbnail: string;
  title?: string;
  url?: string;
  name?: string;
  duration?: number;
};

// Attachment shape as returned from the capsule API (loose — matches
// IFile plus a few optional fields present on some payloads).
type CapsuleAttachment = Partial<IFile> & {
  _id?: string;
  type?: string;
  url?: string;
  thumbnail?: string;
  name?: string;
  title?: string;
  duration?: number;
};

interface CreateCapsuleProps {
  data?: (Partial<ICapsule> & { _id?: string }) | null;
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
  maxDate,
}: {
  onDateSelect: (date: Date) => void;
  onClose: () => void;
  maxDate?: Date;
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
        options={{
          minDate: new Date(),
          ...(maxDate ? { maxDate } : {}),
        }}
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
      <h4 className="text-lg font-semibold text-v3-text-strong">{title}</h4>
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

// Props shared by the mobile form sheet — mirrors sharedFormProps + a few extras.
type MobileFormSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  values: FormValues;
  errors: Record<string, string | undefined>;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  handleValue: (name: string, value: unknown) => void;
  handleSave: () => void | Promise<void>;
  handleSaveToDraft: (e: React.FormEvent<HTMLButtonElement>) => void;
  isEditMode: boolean;
  isFormValid: boolean;
  isMutating: boolean;
  beneficiaries: { data?: { docs?: RecipientLike[] } } | undefined;
  recentMedia: { data?: { docs?: MediaItemLike[] } } | undefined;
  selectedMedia: SelectedMediaItem[];
  handleRecipientSelect: (recipient: RecipientLike) => void;
  handleMediaSelect: (item: MediaItemLike) => void;
  onOpenMemory: () => void;
  onOpenMedia: () => void;
  onTapPreview: () => void;
  dragHandlers: React.HTMLAttributes<HTMLDivElement>;
  isDragging: boolean;
  handleUpload: (file: IOnUploadPayload) => void;
  cardStyle: CardCustomization;
  onStyleChange: (updates: Partial<CardCustomization>) => void;
  previewRecipients: string[];
  previewAssets: MediaAsset[];
  user: IUser | null;
  isDirty: boolean;
  pendingStatus: "draft" | "scheduled" | null;
};

type MobilePreviewSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  cardStyle: CardCustomization;
  onStyleChange: (updates: Partial<CardCustomization>) => void;
  previewRecipients: string[];
  values: FormValues;
  previewAssets: MediaAsset[];
  user: IUser | null;
};

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
  isDirty,
  pendingStatus,
}: MobileFormSheetProps) {
  return (
    <Sheet
      detent="content"
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0, 0.8]}
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

        <Sheet.Content className="relative z-10 max-h-[80dvh] min-h-0 overflow-y-auto overscroll-contain">
          {/* Scrollable body */}
          <div className="flex min-h-0 flex-col">
            <div className="flex-1 overflow-auto px-4 pb-4">
              <SheetHeader
                title={isEditMode ? "Edit Time Capsule" : "Create Time Capsule"}
                onClose={onClose}
              />

              {/* ── Recipients ── */}
              <div className="mb-5">
                <p className="text-xs text-v3-text-weak mb-1.5">
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
              <div className="bg-v3-fill-weaker rounded-xl p-3 mb-5">
                <p className="text-xs text-v3-text-weak mb-3">Recent</p>
                <div className="overflow-x-auto">
                  <RecentRecipients
                    recipients={beneficiaries?.data?.docs}
                    selectedRecipients={values.recipients}
                    onSelect={handleRecipientSelect}
                    onSeeAll={() => { }}
                    hideRelationship
                  />
                </div>
              </div>

              {/* ── Upload media ── */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-v3-text-strong">
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
                  <p className="text-sm font-semibold text-center text-v3-text-strong">
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
                  <p className="text-xs text-v3-text-weak text-center">
                    Supports JPG, PNG, MP4, MP3, PDF,
                    <br />
                    DOC, TXT. Max file size: 120mb
                  </p>
                  <BrowseFileBtn onUpload={handleUpload} />
                </div>
              </div>

              {/* ── Recent media strip ── */}
              <div className="mb-5">
                <p className="text-sm text-v3-text-weak mb-3">Recent</p>
                <div className="bg-v3-fill-weaker rounded-xl p-3">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    <RecentMedia
                      items={recentMedia?.data?.docs ?? []}
                      selectedItems={selectedMedia.map(
                        (m) => (m.id || m._id) as string,
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
              <div className="border-t border-v3-stroke-weak pt-5 mb-5">
                <p className="text-sm font-medium text-v3-text-strong mb-3">
                  Write a message
                </p>
                <div className="flex flex-col gap-2">
                  <div className="w-full rounded-xl border border-gray-200 bg-v3-fill-weaker px-3 py-2">
                    <input
                      placeholder="Header here"
                      name="title"
                      onChange={handleChange}
                      value={values.title}
                      className="w-full h-9 font-semibold font-garamond outline-none bg-transparent text-v3-text-strong placeholder:text-gray-400"
                    />
                  </div>
                  {errors.title && (
                    <small className="text-xs text-danger">
                      {errors.title}
                    </small>
                  )}

                  <div className="w-full rounded-xl border border-gray-200 bg-v3-fill-weaker px-3 py-2">
                    <textarea
                      placeholder="Message here..."
                      name="body"
                      onChange={handleChange}
                      value={values.body}
                      className="w-full resize-none font-garamond outline-none bg-transparent text-v3-text-strong placeholder:text-gray-400 leading-6"
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
                <p className="text-xs text-v3-text-weak mb-2">
                  Capsule delivery date:
                </p>
                {capsuleMaxDate ? (
                  <p className="mb-2 font-inter text-[11px] leading-snug text-v3-text-weaker">
                    Free plan: latest delivery{" "}
                    <span className="font-medium text-v3-text-weak">
                      {dayjs(capsuleMaxDate).format("MMM D, YYYY")}
                    </span>
                    . Upgrade for longer schedules.
                  </p>
                ) : null}
                <DateOptionsDropdown
                  maxSelectableDate={capsuleMaxDate}
                  onDateSelect={(date) =>
                    handleValue("schedule_date", date.toISOString())
                  }
                  CustomCalendarComponent={DatePickerWrapper}
                  defaultLabel="In 3 days"
                />
              </div>

              {/* ── Preview section ── */}
              <div className="mb-6">
                <p className="text-sm font-medium text-v3-text-strong mb-3">
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
                    <div className="relative scale-[0.85] origin-center">
                      <CapsulePreviewCard
                        style={cardStyle}
                        recipients={previewRecipients}
                        title={values.title}
                        body={values.body}
                        assets={previewAssets}
                        sender={user}
                        onAssetClick={() => { }}
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
                  className="flex-1 h-12 rounded-full border border-gray-300 text-sm font-medium text-v3-text-strong flex items-center justify-center gap-2"
                >
                  Save as Draft
                  {pendingStatus === "draft" && (
                    <Spinner loading={isMutating} className="size-4! !text-v3-text-strong" />
                  )}
                </button>
              )}
              {isEditMode && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-12 rounded-full border border-gray-300 text-sm font-medium text-v3-text-strong flex items-center justify-center gap-2"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={
                  !isFormValid || isMutating || (isEditMode && !isDirty)
                }
                className="flex-1 h-12 rounded-full bg-orange text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isEditMode ? "Update Capsule" : "Schedule Capsule"}
                {pendingStatus === "scheduled" && (
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
}: MobilePreviewSheetProps) {
  return (
    <Sheet
      detent="content"
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0, 0.8]}
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
        <Sheet.Content className="relative z-10 max-h-[80dvh] min-h-0 overflow-y-auto overscroll-contain">
          <div className="flex min-h-0 flex-col overflow-auto px-4 pb-8">
            <SheetHeader title="Preview Capsule" onClose={onClose} />
            {/* Style controls (Theme + Size) */}
            <div className="mb-4">
              <StyleControls
                cardStyle={cardStyle}
                onStyleChange={onStyleChange}
              />
            </div>
            {/* Full capsule card */}
            <div className="flex-1 rounded-2xl w-full">
              <CapsulePreviewCard
                style={cardStyle}
                recipients={previewRecipients}
                title={values.title}
                body={values.body}
                assets={previewAssets}
                sender={user}
                onAssetClick={() => { }}
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
      detent="content"
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0, 0.8]}
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
        <Sheet.Content className="relative z-10 max-h-[80dvh] min-h-0 overflow-y-auto overscroll-contain">
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
      detent="content"
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0, 0.8]}
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
        <Sheet.Content className="relative z-10 max-h-[80dvh] min-h-0 overflow-y-auto overscroll-contain">
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

  const { close, push } = useModal();
  const { user } = useStore();
  const { canAccess } = useSubscription();
  const capsuleMaxDate = useMemo(() => {
    if (canAccess("time_capsule_window")) return undefined;
    return dayjs().add(6, "month").toDate();
  }, [canAccess]);
  const { files, handleUpload } = useFileUpload();
  const { trigger, isMutating } = useFetcher(
    isEmpty(data) ? endpoint.capsule : `${endpoint.capsule}/${data?._id}`,
    isEmpty(data) ? "post" : "put",
  );
  const [page] = useState(1);
  const { data: beneficiaries } = useSWR(endpoint.beneficiaries, undefined, {
    revalidateIfStale: true,
  });
  const { data: recentMedia } = useSWR(`${endpoint.files}?page=${page}`);
  const [selectedMedia, setSelectedMedia] = useState<SelectedMediaItem[]>([]);

  const [originalValues, setOriginalValues] = useState<typeof initial | null>(
    null,
  );
  const [originalMedia, setOriginalMedia] = useState<SelectedMediaItem[]>([]);

  // Desktop
  const [desktopShowMemory, setDesktopShowMemory] = useState(false);
  const [desktopShowMedia, setDesktopShowMedia] = useState(false);

  // Mobile sheets
  const [formSheetOpen] = useState(true);
  const [previewSheetOpen, setPreviewSheetOpen] = useState(false);
  const [memorySheetOpen, setMemorySheetOpen] = useState(false);
  const [mediaSheetOpen, setMediaSheetOpen] = useState(false);

  const onSubmit = async (
    payload: FormValues,
    { setValues }: { setValues: (v: typeof initial) => void },
  ) => {
    const submission: Partial<FormValues> & {
      attachments?: string[];
      memories?: string[];
    } = { ...payload };
    if (submission.status === "draft") {
      delete submission.schedule_date;
    }
    const uploadedIds = !isEmpty(files)
      ? files
          .map((f) => f.uploadedFile?._id)
          .filter((id): id is string => Boolean(id))
      : [];

    const attachmentIds: string[] = [...uploadedIds];
    const memoryIds: string[] = [];

    selectedMedia.forEach((m) => {
      const id = m.id || m._id;
      if (!id) return;
      if (m.isMemory) {
        memoryIds.push(id);
      } else {
        attachmentIds.push(id);
      }
    });

    submission.attachments = Array.from(new Set(attachmentIds));
    submission.memories = Array.from(new Set(memoryIds));

    if (
      submission.status === "scheduled" &&
      capsuleMaxDate &&
      submission.schedule_date
    ) {
      const scheduled = dayjs(submission.schedule_date);
      const cap = dayjs(capsuleMaxDate).endOf("day");
      if (scheduled.isAfter(cap)) {
        toast.error(
          "Free accounts can schedule delivery up to 6 months ahead. Choose an earlier date or upgrade.",
        );
        return;
      }
    }

    try {
      const result = await trigger(submission);
      if (result?.success) {
        if (isEditMode) {
          toast.success("Time Capsule Updated Successfully");
        } else if (submission.status === "draft") {
          toast.success("Time Capsule Saved to Draft");
        } else {
          toast.custom(() => <TimeCapsuleBadge />);
        }
        mutate(`${endpoint.capsule}?page=1`);
        setValues(initial);
        handleCloseClick();
      }
    } catch (e) {
      if (handleSubscriptionGateError(e)) return;
      toast.error("Could not save your timed message. Try again.");
    }
  };

  const { setValues, values, errors, handleChange, handleValue } =
    useForm({ initial, schema, onSubmit });

  useEffect(() => {
    if (data) {
      const populated = {
        title: data?.title || "",
        body: data?.body || "",
        // schedule_date: data?.schedule_date || "",
        schedule_date: data?.schedule_date
          ? new Date(data.schedule_date).toISOString()
          : "",
        status: data?.status || "scheduled",
        recipients:
          data?.recipients?.map((r: { email: string }) => r.email) || [],
      };
      setValues(populated);
      setOriginalValues(populated);

      if (data?.attachments?.length) {
        const mapped: SelectedMediaItem[] = (
          data.attachments as CapsuleAttachment[]
        ).map((a) => ({
          id: a._id,
          _id: a._id,
          type: a.type?.split("/")[0] || "image",
          thumbnail: a.url || a.thumbnail,
          title: a.name || a.title,
          url: a.url,
          duration: a.duration,
        })); // same as before

        setSelectedMedia(mapped);
        setOriginalMedia(mapped);
      }
    }
  }, [data, setValues]);

  const isDirty =
    isEditMode &&
    (JSON.stringify({
      ...values,
      recipients: [...values.recipients].sort(),
    }) !==
      JSON.stringify({
        ...originalValues,
        recipients: [...(originalValues?.recipients ?? [])].sort(),
      }) ||
      JSON.stringify(selectedMedia.map((m) => m.id || m._id).sort()) !==
      JSON.stringify(originalMedia.map((m) => m.id || m._id).sort()) ||
      files.length > 0);

  const [cardStyle, setCardStyle] = useState<CardCustomization>({
    themeId: "sage",
    backgroundColor: "#F0FCD4",
    fontSize: "1x",
    textColor: "#2C3E2F",
    headerColor: "#1A2419",
  });

  const previewAssets: MediaAsset[] = [
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
      id: (m.id || m._id) as string,
      type: (m.isMemory
        ? "memory"
        : m.type?.includes("video")
          ? "video"
          : m.type?.includes("audio")
            ? "audio"
            : "image") as MediaAsset["type"],
      thumbnail: m.url || m.thumbnail || m.attachments?.[0]?.url || "",
      title: m.title || m.name || "Media file",
      duration: m.duration as MediaAsset["duration"],
    })),
  ];

  const previewRecipients = values.recipients.map((email) => {
    const b = (
      (beneficiaries as { data?: { docs?: RecipientLike[] } } | undefined)?.data
        ?.docs ?? []
    ).find((b) => b.email === email);
    return b?.name || b?.user?.name || email;
  });

  const handleStyleChange = (updates: Partial<CardCustomization>) =>
    setCardStyle((prev) => ({ ...prev, ...updates }));

  const handleCloseClick = () => {
    close?.("create-capsule");
    close?.("view-capsule");
    close?.("edit-capsule");
  };

  const handleAttemptClose = () => {
    if (isDirty) {
      push?.("exit-confirmation", {
        onConfirm: () => {
          handleCloseClick();
        },
      });
    } else {
      handleCloseClick();
    }
  };

  const handleFileDrop = useCallback(
    (droppedFiles: FileList) => {
      const MAX = 120 * 1024 * 1024;
      Array.from(droppedFiles).forEach((file) => {
        const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
        const list = CAPSULE_SUPPORTED_FILE_TYPES as readonly string[];
        const fromName = EXTENSION_TO_MIME[ext];
        const valid =
          list.includes(file.type.split(";")[0]!.trim().toLowerCase()) ||
          (fromName && list.includes(fromName.split(";")[0]!.trim().toLowerCase()));
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

  const handleRecipientSelect = (recipient: RecipientLike) => {
    const email = recipient.email;
    if (!email) return;
    const curr = values.recipients || [];
    handleValue(
      "recipients",
      curr.includes(email) ? curr.filter((r) => r !== email) : [...curr, email],
    );
  };

  const handleMediaSelect = (item: MediaItemLike) => {
    const id = item.id || item._id;
    setSelectedMedia((prev) =>
      prev.some((m) => (m.id || m._id) === id)
        ? prev.filter((m) => (m.id || m._id) !== id)
        : [...prev, item],
    );
  };

  // Removed shouldSubmit / pendingStatus useEffect since we submit directly

  const [pendingStatus, setPendingStatus] = useState<
    "draft" | "scheduled" | null
  >(null);

  const handleSaveToDraft = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMutating) return;
    setPendingStatus("draft");
    handleValue("status", "draft");
    await onSubmit({ ...values, status: "draft" }, { setValues });
    setPendingStatus(null);
  };

  const handleSave = async () => {
    if (isMutating) return;
    setPendingStatus("scheduled");
    handleValue("status", "scheduled");
    await onSubmit({ ...values, status: "scheduled" }, { setValues });
    setPendingStatus(null);
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
    isDirty,
    pendingStatus,
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
        <div className="hidden sm:flex flex-col justify-center items-center h-full w-full relative">
          <div className="flex flexcol items-center justify-center wfull">
            <div className="bg-black/60 gap-6 hfit mt10 min-w-[560px] max-w-5xl aspect-560/697!  rounded-2xl py-8 px-6 lg:px-24 flex flex-col items-center">
              <ModalCloseBtn onClick={handleCloseClick} />
              <StyleControls
                cardStyle={cardStyle}
                onStyleChange={handleStyleChange}
              />
              <div className=" max-w-[560px]">
                <CapsulePreviewCard
                  style={cardStyle}
                  recipients={previewRecipients}
                  title={values.title}
                  body={values.body}
                  assets={previewAssets}
                  sender={user}
                  onAssetClick={() => { }}
                  className="hfull wfull p-6 bg-pink-500"
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
                  Edit Time Capsule
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
              className="w-full h-fit! max-w-[560px]"
              style={{
                // flex: "1 1 0",
                minHeight: 0,
                overflow: "hidden",
                // height: 300,
              }}
            >
              <CapsulePreviewCard
                style={cardStyle}
                recipients={previewRecipients}
                title={values.title}
                body={values.body}
                assets={previewAssets}
                sender={user}
                onAssetClick={() => { }}
                className="h-full w-full p-6 pb-0"
              />
            </div>
          </div>
        </div>
        <div className="modal-container overflow-hidden scrollbar-hide !w-[500px] !max-w-[500px] !h-full !max-h-full !p-6 !rounded-3xl shrink-0 !bg-white">
          <ModalCloseBtn onClick={handleAttemptClose} />
          <div className="flex flex-col gap-8 w-full h-full">
            <h4 className="modal-title">
              {isEditMode ? "Edit Time Capsule" : "Create Time Capsule"}
            </h4>
            <form
              onSubmit={(e) => {
                e.preventDefault();
              }}
              className="flex flex-col gap-8 pb-6"
            >
              <div className="flex flex-col gap-2">
                <Taginput
                  values={values.recipients}
                  placeholder="Enter recipients email address"
                  inputClassName="!px-2"
                  label={
                    <div className="mb-2 text-base text-gray-800 normal-case">
                      Select recipient(s)
                    </div>
                  }
                  setValue={(r) => {
                    handleValue("recipients", r);
                  }}
                  error={errors.recipients as string}
                />
                <div className="flex flex-col gap-1 rounded-xl text-sm text-white p-0">
                  <RecentRecipients
                    recipients={beneficiaries?.data?.docs}
                    selectedRecipients={values.recipients}
                    onSelect={handleRecipientSelect}
                    onSeeAll={() => { }}
                    hideRelationship
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col">
                  <div className="flex justify-between mb-2">
                    <span className="text-base text-gray-800">
                      Upload Media
                    </span>
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
                    <span className="mt-6 text-sm font-medium text-center text-gray-900">
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
                    <p className="mb-6 text-xs font-light text-center max-w-60 text-gray-600">
                      Supports JPG, PNG, MP4, MP3, PDF, DOC, TXT. Max 120mb
                    </p>
                    <BrowseFileBtn onUpload={handleUpload} />
                  </div>
                </div>
                <div className="flex flex-col border-t-0 rounded-2xl bg-[#f5f5f5] p-3">
                  <span className="block mb-2 text-xs text-gray-600 font-medium">
                    Recently uploaded
                  </span>
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
                    <small className="text-xs text-danger">{errors.body}</small>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-base text-gray-800 block">
                  Capsule delivery date:
                </span>
                {capsuleMaxDate ? (
                  <p className="font-inter text-xs text-gray-600">
                    Free plan: latest delivery{" "}
                    <span className="font-medium text-gray-800">
                      {dayjs(capsuleMaxDate).format("MMM D, YYYY")}
                    </span>
                    .
                  </p>
                ) : null}
                <DateOptionsDropdown
                  maxSelectableDate={capsuleMaxDate}
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
                    {pendingStatus === "draft" && (
                      <Spinner loading={isMutating} className="size-4! !text-v3-text-strong" />
                    )}
                  </button>
                )}
                {isEditMode && (
                  <button
                    type="button"
                    disabled={!isDirty}
                    className="btn-outline"
                    onClick={handleAttemptClose}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  className="btn"
                  disabled={
                    !isFormValid || isMutating || (isEditMode && !isDirty)
                  }
                >
                  {isEditMode ? "Save Changes" : "Schedule Capsule"}
                  {pendingStatus === "scheduled" && (
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
          onClose={handleAttemptClose}
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
