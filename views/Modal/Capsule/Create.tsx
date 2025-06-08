import { useState } from "react";
import * as yup from "yup";
import dayjs from "dayjs";
import { Selectinput } from "@/components/Form";
import Taginput from "@/components/Form/TagInput";
import { ModalCloseBtn } from "@/components/ModalLayout";
import { useModal } from "@/hooks/use-modal";
import AttachmentIcon from "@/public/icon/clip.svg"
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import useForm from "@/hooks/use-form";
import SelectBeneficiary from "../SelectBeneficiary";
import { toast } from "sonner";
import Spinner from "@/components/Spinner";

const schema = yup.object().shape({
  delivery_date: yup.string().required("Delivery date is required"),
  title: yup.string().required("Title is required"),
  body: yup.string().required("Body is required"),
  // status: yup.string().default("saved").required("Title is required"),
  recipients: yup.array().min(1, "At least one recipients is required")
});

const initial = {
  delivery_date: "",
  title: "",
  body: "",
  status: "",
  recipients: []
};

export default function CreateCapsule() {
  const { close, open } = useModal()
  const [show, setShow] = useState(false);
  const { trigger, isMutating } = useFetcher(endpoint.capsule)

  const onSubmit = async (p, { setValues }) => {
    const result = await trigger(p)
    if (result?.success) {
      toast.success(result?.message)
      setValues(initial)
      close("create-capsule")
    }
  }
  const { values, errors, handleSubmit, handleChange, handleValue } = useForm({ initial, schema, onSubmit })
  if (show) return (
    <SelectBeneficiary
      handleClose={() => setShow(false)}
      onAddRecipient={(r) => handleValue("recipients", r)}
    />
  )
  return (
    <div className="modal-container">
      <ModalCloseBtn onClick={() => close("create-capsule")} />
      <div className="space-y-6">
        <h4 className="modal-title">New Capsule</h4>
        <form onSubmit={handleSubmit} className="space-y-6">
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
          <Selectinput
            label={<span className="text-[#667085] font-normal text-xs font-inter">Message delivery date:</span>}
            name="delivery_date"
            onChange={handleChange}
            value={values.delivery_date}
            error={errors.delivery_date}
            data={[
              { label: "In 24 hours", value: dayjs().add(1, "day").format("YYYY-MM-DD") },
              { label: "In 3 days", value: dayjs().add(3, "days").format("YYYY-MM-DD") },
              { label: "In 1 week", value: dayjs().add(1, "week").format("YYYY-MM-DD") },
              { label: "Last day of this month", value: dayjs().endOf("month").format("YYYY-MM-DD") },
              { label: "Set custom date", value: "n" }
            ]}
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
            </div>
            {errors.body && <small className="text-xs text-danger">{errors.body}</small>}
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-stretch gap-3">
              <button className="rounded-lg cursor-pointer border border-danger/14 bg-danger/5 text-danger disabled:border-[#0011661A] disabled:text-[#0011661A] disabled:bg-[#0011661A] py-2 px-5">Discard</button>
              <button className="text-secondary border cursor-pointer border-[#EAECF0] flex justify-center items-center size-10 rounded-full">
                <AttachmentIcon width={16} />
              </button>
            </div>
            <div className="flex gap-3 items-center">
              <button type="button" className="btn-outline">Save to draft</button>
              <button disabled={isMutating} type="submit" className="btn">
                Send
                <Spinner loading={isMutating} className="!size-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}