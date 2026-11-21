import { useEffect, useState } from "react";
import * as yup from "yup";
import dayjs from "dayjs";
import { Dateinput, Taginput } from "@/components/Form";
import { ModalCloseBtn } from "../../modalLayout";
import { useModal } from "@/hooks/use-modal";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import useForm from "@/hooks/use-form";
import SelectBeneficiary from "../../select-beneficiary";
import { toast } from "sonner";
import Spinner from "@/components/spinner";
import FileAttachment from "@/components/file-attachment";
import AttachFileBtn from "./attach-file-btn";
import useFileUpload from "@/hooks/use-file-upload";
import { isEmpty } from "@/utility";
import { mutate } from "swr";
import type { IOnUploadPayload } from "@/utility/interface";

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
  data?: (Partial<typeof initial> & { _id?: string }) | null;
}

export default function CreateCapsule({ data = null }: CreateCapsuleProps) {
  const { close } = useModal();
  const [showBeneficiaryList, setShowBeneficiaryList] = useState(false);
  const { files, handleUpload, handleDeleteFile } = useFileUpload();
  const { trigger, isMutating } = useFetcher(
    isEmpty(data) ? endpoint.capsule : `${endpoint.capsule}/${data?._id}`,
    isEmpty(data) ? "post" : "put",
  );

  const onSubmit = async (payload: typeof initial, { setValues }: { setValues: (values: typeof initial) => void }) => {
    const submission: typeof initial & { attachments?: string[] } = { ...payload };
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

  const { setValues, values, errors, handleSubmit, handleChange, handleValue, getField } = useForm({
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
        recipients: data?.recipients?.map((recipient: { email: string }) => recipient.email) || [],
      });
    }
  }, [data, setValues]);

  if (showBeneficiaryList) {
    return (
      <SelectBeneficiary
        value={values.recipients}
        handleClose={() => setShowBeneficiaryList(false)}
        onAddRecipient={(recipients) => handleValue("recipients", recipients)}
      />
    );
  }

  const renderFileAttachment = (file: IOnUploadPayload) => (
    <FileAttachment
      key={file.id}
      onDelete={handleDeleteFile}
      progressType="text"
      file={file}
      className="max-w-67 bg-white"
    />
  );

  return (
    <div className="modal-container">
      <ModalCloseBtn onClick={() => close?.("create-capsule")} />
      <div className="space-y-6">
        <h4 className="modal-title">New Capsule</h4>
        <form onSubmit={handleSave} className="space-y-6">
          <Taginput
            values={values.recipients}
            placeholder="Enter recipients email address"
            label={
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-inter font-normal text-v3-text-weak">To (recipients):</span>
                <span className="cursor-pointer" onClick={() => setShowBeneficiaryList(true)}>
                  Connection list
                </span>
              </div>
            }
            setValue={(recipients) => handleValue("recipients", recipients)}
            error={errors.recipients as string}
          />
          <Dateinput
            id="delivery_date"
            label={<span className="font-inter text-xs font-normal text-v3-text-weak">Message delivery date:</span>}
            {...getField("delivery_date")}
            name={getField("delivery_date")?.name as string}
            value={values.delivery_date}
            minDate={dayjs().toDate()}
          />
          <div className="border-t border-v3-stroke-weak py-2 pr-10">
            <input
              placeholder="Enter title here"
              name="title"
              onChange={handleChange}
              value={values.title}
              className="h-9 w-full min-h-9 resize-none font-inter text-2xl font-semibold first-letter:capitalize outline-0"
            />
            {errors.title && <small className="text-xs text-danger">{errors.title}</small>}
          </div>
          <div>
            <div className="h-fit w-full rounded-2xl border border-grey-100 bg-grey-700 p-3 focus-within:border-2 focus-within:border-primary">
              <textarea
                placeholder="Enter text here"
                name="body"
                onChange={handleChange}
                value={values.body}
                className="min-h-34 size-full flex-1 resize-none outline-0"
              />
              <div className="w-full space-y-3">
                {files.map((file) => renderFileAttachment(file))}
              </div>
            </div>
            {errors.body && <small className="text-xs text-danger">{errors.body}</small>}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-stretch gap-3">
              <button
                type="button"
                className="rounded-lg border border-danger/14 bg-danger/5 px-5 py-2 text-danger transition disabled:border-[#0011661A] disabled:bg-[#0011661A] disabled:text-[#0011661A]"
              >
                Discard
              </button>
              <AttachFileBtn onUpload={handleUpload} />
            </div>
            <div className="flex items-center gap-3">
              <button type="button" className="btn-outline" onClick={handleSaveToDraft}>
                Save to draft
                {values.status === "draft" && <Spinner loading={isMutating} className="!size-4" />}
              </button>
              <button type="submit" className="btn">
                Send
                {values.status === "scheduled" && <Spinner loading={isMutating} className="!size-4" />}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

