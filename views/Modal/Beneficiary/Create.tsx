import { Selectinput, Textinput } from "@/components/Form";
import { ModalCloseBtn } from "@/components/ModalLayout";
import useForm from "@/hooks/use-form";
import * as yup from "yup";
import { useModal } from "@/hooks/use-modal";
import Spinner from "@/components/Spinner";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import { mutate } from "swr";

const initial = {
  email: "",
  name: "",
  relationship: "",
  level: 1
}

const schema = yup.object().shape({
  email: yup
    .string()
    .required("Email is required")
    .email("Invalid email address")
    .trim(),
  name: yup.string().required("Name is required"),
  relationship: yup.string().required("Relationship is required"),
  level: yup.number().required("Level is required").default(1),
});

export function AddBeneficiary() {
  const { close } = useModal();
  const { trigger, isMutating } = useFetcher(endpoint.beneficiaries)
  const { values, handleSubmit, isValid, handleChange, errors, getField } = useForm({
    initial,
    schema,
    async onSubmit(p) {
      const result = await trigger(p)
      if (result.success) {
        await mutate(`${endpoint.beneficiaries}?page=1`)
        toast.success(result?.message)
        close("add-beneficiary")
      }
    }
  })
  return (
    <div className="modal-container">
      <ModalCloseBtn onClick={() => close("add-beneficiary")} />
      <div className="space-y-6">
        <div>
          <h4 className="modal-title">Add Beneficiary</h4>
          <small className="font-inter text-sm text-grey-600">Add a beneficiary by sending an invite to their email</small>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Textinput
            label="Email"
            type="email"
            name="email"
            inputClassName="!h-[50px]"
            {...getField("email")}
            placeholder="example@gmail.com"
            labelClassName="!text-[rgba(0,9,51,0.65)] !text-xs !font-normal"
          />
          <Textinput
            label="Name"
            name="name"
            {...getField("name")}
            placeholder="John Doe"
            inputClassName="!h-[50px]"
            labelClassName="!text-[rgba(0,9,51,0.65)] !text-xs !font-normal"
          />
          <Textinput
            name="relationship"
            {...getField("relationship")}
            placeholder="Brother"
            label="Relationship(This person to you)"
            inputClassName="!h-[50px]"
            labelClassName="!text-[rgba(0,9,51,0.65)] !text-xs !font-normal"
          />
          <Selectinput
            name="level"
            label="Permission level"
            labelClassName="!text-[rgba(0,9,51,0.65)] !text-xs !font-normal"
            placeholder="Set permission level"
            data={[
              { label: "Level 1", value: "1" },
              { label: "Level 2", value: "2" },
              { label: "Level 3", value: "3" },
            ]}
            {...getField("level")}
            value={String(values.level)}
          />
          <div className="w-full flex gap-4 items-center justify-end">
            <button className="btn-outline">Discard</button>
            <button type="submit" disabled={isMutating || !isValid} className="btn">
              <span>Send invite</span>
              <Spinner className="!size-4" loading={isMutating} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}