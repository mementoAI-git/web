import { useEffect, useState, useCallback } from "react";
import * as yup from "yup";
import dayjs from "dayjs";
import { Dateinput, Taginput } from "@/components/Form";
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
import type { IOnUploadPayload } from "@/utility/interface";
import { ImagePlusIcon } from "@/components/icons";
import SelectFromMemory from "../../select-from-memory";
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

const schema = yup.object().shape({
  delivery_date: yup.date().required("Delivery date is required"),
  title: yup.string().required("Title is required"),
  body: yup.string().required("Body is required"),
  status: yup.string().default("scheduled").required("Status is required"),
  recipients: yup.array().min(1, "At least one recipient is required"),
});

const initial = {
  delivery_date: "",
  title: "",
  body: "",
  status: "scheduled",
  recipients: [] as string[],
};

interface CreateCapsuleProps {
  data?: any;
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

export default function CreateCapsule({ data = null }: CreateCapsuleProps) {
  const { close } = useModal();
  const { files, handleUpload, handleDeleteFile } = useFileUpload();
  const { trigger, isMutating } = useFetcher(
    isEmpty(data) ? endpoint.capsule : `${endpoint.capsule}/${data?._id}`,
    isEmpty(data) ? "post" : "put",
  );
  const [page] = useState(1);
  const { data: beneficiaries, isLoading } = useSWR(
    `${endpoint.beneficiaries}?page=${page}`,
  );

  const { data: recentMedia } = useSWR(`${endpoint.files}?page=${page}`);

  // const { data: beneficiaries } = useFetcher(endpoint.beneficiaries);
  // console.log(beneficiaries, "beneficiaries")
  useEffect(() => {
    // console.log(beneficiaries);
    if (recentMedia) console.log(recentMedia);
    // console.log(beneficiaries.data.docs);
  }, [beneficiaries, recentMedia]);

  const [showMemoryList, setShowMemoryList] = useState(false);

  const onSubmit = async (
    payload: any,
    { setValues }: { setValues: (values: typeof initial) => void },
  ) => {
    const submission = { ...payload };
    if (!isEmpty(files)) {
      submission.attachments = files
        .map((file) => file.uploadedFile?._id)
        .filter((id): id is string => Boolean(id));
    }

    const result = await trigger(submission);
    if (result?.success) {
      toast.success(result?.message);
      mutate(`${endpoint.capsule}?page=1`);
      setValues(initial);
      close?.("create-capsule");
    }
  };

  const {
    setValues,
    values,
    errors,
    handleSubmit,
    handleChange,
    handleValue,
    getField,
  } = useForm({
    initial,
    schema,
    onSubmit,
  });

  const handleSaveToDraft = (event: React.FormEvent<HTMLButtonElement>) => {
    if (isMutating) return;
    handleValue("status", "draft");
    handleSubmit(event as unknown as React.FormEvent<HTMLFormElement>);
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    if (isMutating) return;
    handleValue("status", "scheduled");
    handleSubmit(event);
  };

  useEffect(() => {
    if (data) {
      setValues({
        title: data?.title || "",
        body: data?.body || "",
        delivery_date: data?.delivery_date || "",
        status: data?.status || "scheduled",
        recipients:
          data?.recipients?.map(
            (recipient: { email: string }) => recipient.email,
          ) || [],
      });
    }
  }, [data, setValues]);

  const renderFileAttachment = (file: IOnUploadPayload) => (
    <FileAttachment
      key={file.id}
      onDelete={handleDeleteFile}
      progressType="text"
      file={file}
      className="max-w-67 bg-white"
    />
  );

  // Handle file drop
  const handleFileDrop = useCallback(
    (droppedFiles: FileList) => {
      const MAX_FILE_SIZE = 120 * 1024 * 1024;

      Array.from(droppedFiles).forEach((file) => {
        // Get extension from filename
        const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;

        // Check by MIME type first, then by extension fallback
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

  // const recipients = [
  //   {
  //     id: "1",
  //     name: "Katrina",
  //     relationship: "Daughter",
  //     avatar: "/avatars/katrina.jpg",
  //   },
  //   {
  //     id: "2",
  //     name: "Frank",
  //     relationship: "Brother",
  //     avatar: "/avatars/frank.jpg",
  //   },
  //   {
  //     id: "3",
  //     name: "Aina",
  //     relationship: "Friend",
  //     avatar: "/avatars/aina.jpg",
  //   },
  //   {
  //     id: "4",
  //     name: "Eve",
  //     relationship: "Daughter",
  //     avatar: "/avatars/eve.jpg",
  //   },
  //   {
  //     id: "5",
  //     name: "John",
  //     relationship: "Son",
  //     avatar: "/avatars/john.jpg",
  //   },
  // ];

  // {
  //     "_id": "69392e37f76458c1d4a66ef6",
  //     "type": "audio/webm",
  //     "size": 296030,
  //     "name": "recorded_251210092400.webm",
  //     "user": "692fd53a55d5c61cfb0b586a",
  //     "duration": null,
  //     "deleted": false,
  //     "__v": 0,
  //     "created_at": "2025-12-10T08:24:23.323Z",
  //     "updated_at": "2025-12-10T08:25:10.555Z",
  //     "transcription": {
  //         "full_text": "All right, so I'm running my final tests now to check the transcription and also check the speed of response from the AI model. So, mic check, mic check.",
  //         "segments": [
  //             {
  //                 "start": 0,
  //                 "end": 6.2,
  //                 "text": "All right, so I'm running my final tests now to check the transcription."
  //             },
  //             {
  //                 "start": 6.2,
  //                 "end": 12.3,
  //                 "text": "And also check the speed of response from the AI model."
  //             },
  //             {
  //                 "start": 12.3,
  //                 "end": 14.8,
  //                 "text": "So, mic check, mic check."
  //             }
  //         ]
  //     },
  //     "url": "http://localhost:5002/files/recorded_251210092400.webm",
  //     "id": "69392e37f76458c1d4a66ef6"
  // }

  const mediaItems = [
    { id: "1", type: "video", thumbnail: "/sunset-pier.jpg" },
    { id: "2", type: "image", thumbnail: "/sunset-bird.jpg" },
    { id: "3", type: "image", thumbnail: "/phone-screen.jpg" },
    { id: "4", type: "audio", thumbnail: "/waveform-bg.jpg" },
    { id: "5", type: "video", thumbnail: "/more-content.jpg" },
  ];

  const assets = [
    {
      id: "1",
      type: "audio",
      thumbnail: "/audio-waveform.jpg",
      duration: "00:32:24",
      title: "My advice on life and meaning",
    },
    {
      id: "2",
      type: "video",
      thumbnail: "/katrina-walk.jpg",
      title: "Katrina's first walk in the backyard",
    },
  ];

  const [cardStyle, setCardStyle] = useState<CardCustomization>({
    backgroundColor: "#E2EADF",
    fontFamily: "Geist Mono",
    fontSize: "2xl",
  });

  const handleStyleChange = (updates: Partial<CardCustomization>) => {
    setCardStyle((prev) => ({ ...prev, ...updates }));
  };

  const handleMemoryClose = useCallback(() => {
    setShowMemoryList(false);
  }, []);

  const handleMemoryAddRecipient = useCallback(
    (recipients: string[]) => {
      handleValue("recipients", recipients);
    },
    [handleValue],
  );

  if (showMemoryList) {
    return (
      <SelectFromMemory
        value={values.recipients}
        handleClose={handleMemoryClose}
        onAddRecipient={handleMemoryAddRecipient}
      />
    );
  }

  return (
    <div className="max-w-[1440px] flex flex-col justify-center max-h-[900px] h-full w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-3">
        <div className="flex justify-center w-full">
          <div className="bg-black/60 gap-6 h-fit mt-10 w-[640px] rounded-2xl py-8 px-6 lg:px-24 flex flex-col items-center">
            <StyleControls
              cardStyle={cardStyle}
              onStyleChange={handleStyleChange}
            />

            <div className="h-[770px]">
              {/*<CapsulePreviewCard
                className="h-full"
                style={cardStyle}
                recipients={values.recipients}
                title={values.title}
                body={values.body}
                sender="Groot"
              />*/}

              <CapsulePreviewCard
                style={cardStyle}
                recipients={values.recipients}
                title={values.title}
                body={values.body}
                assets={assets}
                onAssetClick={(asset) => console.log("Clicked:", asset)}
                className="h-full"
              />
            </div>
          </div>
        </div>

        <div className="modal-container overflow-auto scrollbar-hide">
          <ModalCloseBtn onClick={() => close?.("create-capsule")} />
          <div className="space-y-6">
            <h4 className="modal-title">Create Capsule</h4>
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
                  onSelect={(recipient) => console.log("Selected:", recipient)}
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
                    {files.map((file) => renderFileAttachment(file))}
                  </div>
                </div>
              </div>

              <div>
                <span className="bloc mb-2">Recent</span>
                <RecentMedia
                  // items={mediaItems}
                  items={recentMedia?.data?.docs}
                  onSelect={(item) => console.log("Selected:", item)}
                  onSeeMore={() => console.log("See more clicked")}
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
                  handleValue("delivery_date", date.toISOString())
                }
                CustomCalendarComponent={DatePickerWrapper}
                defaultLabel="In 3 days"
              />

              <div className="flex items-center justify-end">
                <div className="flex items-center gap-3">
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
                  <button type="submit" className="btn">
                    Schedule Capsule
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
