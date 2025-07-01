import { useEffect, useState } from "react";
import * as yup from "yup";
import dayjs from "dayjs";
import { Dateinput } from "@/components/Form";
import Taginput from "@/components/Form/TagInput";
import { ModalCloseBtn } from "@/components/ModalLayout";
import { useModal } from "@/hooks/use-modal";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import useForm from "@/hooks/use-form";
import SelectBeneficiary from "../../SelectBeneficiary";
import { toast } from "sonner";
import Spinner from "@/components/Spinner";
import FileAttachment from "@/components/FileAttachment";
import AttachFileBtn from "./AttachFileBtn";
import useFileUpload from "@/hooks/use-file-upload";
import { isEmpty } from "@/utility";
import { mutate } from "swr";

const schema = yup.object().shape({
  delivery_date: yup.date().required("Delivery date is required"),
  title: yup.string().required("Title is required"),
  body: yup.string().required("Body is required"),
  status: yup.string().default("scheduled").required("Title is required"),
  recipients: yup.array().min(1, "At least one recipients is required")
});

const initial = {
  delivery_date: "",
  title: "",
  body: "",
  status: "scheduled",
  recipients: []
};

export default function CreateCapsule({ data = null }) {
  const { close } = useModal()
  const [show, setShow] = useState(false);
  const { files, handleUpload, handleDeleteFile } = useFileUpload()
  const { trigger, isMutating } = useFetcher(isEmpty(data) ? endpoint.capsule : `${endpoint.capsule}/${data?._id}`, isEmpty(data) ? "post" : "put")

  const onSubmit = async (p, { setValues }) => {
    if (!isEmpty(files)) {
      p.attachments = files.map(file => file.uploadedFile._id)
    }

    const result = await trigger(p)
    if (result?.success) {
      toast.success(result?.message)
      mutate(`${endpoint.capsule}?page=1`)
      setValues(initial)
      close("create-capsule")
    }
  }
  const { setValues, values, errors, handleSubmit, handleChange, handleValue, getField } = useForm({ initial, schema, onSubmit })

  const handleSaveToDraft = (e) => {
    if (isMutating) return;
    handleValue("status", "draft")
    handleSubmit(e)
  }
  const handleSave = (e) => {
    if (isMutating) return;
    handleValue("status", "scheduled")
    handleSubmit(e)
  }

  useEffect(() => {
    if (data) {
      setValues({
        title: data?.title,
        body: data?.body,
        delivery_date: data?.delivery_date,
        recipients: data?.recipients?.map(r => r.email)
      })
    }
  }, [])

  if (show) return (
    <SelectBeneficiary
      value={values.recipients}
      handleClose={() => setShow(false)}
      onAddRecipient={(r) => handleValue("recipients", r)}
    />
  )
  return (
    <div className="modal-container">
      <ModalCloseBtn onClick={() => close("create-capsule")} />
      <div className="space-y-6">
        <h4 className="modal-title">New Capsule</h4>
        <form onSubmit={handleSave} className="space-y-6">
          <Taginput
            values={values.recipients}
            placeholder="Enter recipients email address"
            label={
              <div className="flex items-center text-xs justify-between mb-2">
                <span className="text-[#667085] font-normal font-inter">To (recipients):</span>
                <span onClick={() => setShow(true)} className="cursor-pointer">Beneficiary list</span>
              </div>
            }
            setValue={r => handleValue("recipients", r)}
            error={errors.recipients}
          />
          <Dateinput
            id="delivery_date"
            name="delivery_date"
            label={<span className="text-[#667085] font-normal text-xs font-inter">Message delivery date:</span>}
            value={values.delivery_date}
            error={errors.delivery_date}
            onChange={handleChange}
            minDate={dayjs().toDate()}
          />
          <div className="border-t border-[#0011661A] py-2 pr-10">
            <input
              placeholder="Enter title here"
              name="title"
              onChange={handleChange}
              value={values.title}
              className="font-inter resize-none text-2xl w-full h-9 min-h-9 outline-0 first-letter:capitalize font-semibold"
            />
            {errors.title && <small className="text-xs text-danger">{errors.title}</small>}
          </div>
          <div>
            <div className="bg-grey-700 h-fit w-full rounded-2xl p-3 focus-within:border-2 focus-within:border-primary border border-grey-100">
              <textarea
                placeholder="Enter text here"
                name="body"
                onChange={handleChange}
                value={values.body}
                className="size-full min-h-34 flex-1 resize-none outline-0"
              ></textarea>

              <div className="w-full">
                {files.map(file => (
                  <FileAttachment
                    onDelete={handleDeleteFile}
                    progressType="text"
                    file={file}
                    className="max-w-67 bg-white"
                  />
                ))}
              </div>
            </div>
            {errors.body && <small className="text-xs text-danger">{errors.body}</small>}
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-stretch gap-3">
              <button className="rounded-lg cursor-pointer border border-danger/14 bg-danger/5 text-danger disabled:border-[#0011661A] disabled:text-[#0011661A] disabled:bg-[#0011661A] py-2 px-5">Discard</button>
              <AttachFileBtn onUpload={handleUpload} />
            </div>
            <div className="flex gap-3 items-center">
              <button
                type="button"
                className="btn-outline"
                onClick={handleSaveToDraft}
              >
                Save to draft
                {
                  values.status === "draft" &&
                  <Spinner loading={isMutating} className="!size-4" />
                }
              </button>
              <button type="submit" className="btn">
                Send
                {
                  values.status === "scheduled" &&
                  <Spinner loading={isMutating} className="!size-4" />
                }
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}