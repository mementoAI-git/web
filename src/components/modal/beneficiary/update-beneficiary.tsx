import endpoint from "@/api/endpoint";
import { Selectinput, Textinput } from "@/components/Form";
import { ModalCloseBtn } from "../modalLayout";
import Spinner from "@/components/spinner";
import useFetcher from "@/hooks/use-fetcher";
import useForm from "@/hooks/use-form";
import { useModal } from "@/hooks/use-modal";
import { isEmpty } from "@/utility";
import { toast } from "sonner";
import * as yup from "yup";

const schema = yup.object().shape({
  email: yup.string().email("Invalid email address").trim(),
  name: yup.string(),
  relationship: yup.string(),
  level: yup.number().required("Level is required").default(1),
});

interface UpdateBeneficiaryProps {
  data: any;
}

export function UpdateBeneficiary({ data: beneficiary }: UpdateBeneficiaryProps) {
  const { close } = useModal();
  const { trigger, isMutating } = useFetcher(`${endpoint.beneficiaries}/${beneficiary?._id}`, "put");
  const { values, handleSubmit, setValues, isValid, getField } = useForm({
    initial: {
      email: beneficiary?.email || "",
      name: beneficiary?.name || "",
      relationship: beneficiary?.relationship || "",
      level: beneficiary?.level || 1,
    },
    schema,
    async onSubmit(payload) {
      const result = await trigger(payload);
      if (result?.data) {
        toast.success(result?.message);
        close?.("update-beneficiary");
      }
    },
  });

  const handleDiscard = () => {
    setValues({
      email: beneficiary?.email,
      name: beneficiary?.name,
      relationship: beneficiary?.relationship,
      level: beneficiary?.level,
    });
  };

  return (
    <div className="modal-container">
      <ModalCloseBtn onClick={() => close?.("update-beneficiary")} />
      <div className="space-y-6">
        <h4 className="modal-title">Update Beneficiary</h4>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Textinput
            label="Email"
            type="email"
            inputClassName="!h-[50px]"
            disabled={!isEmpty(beneficiary?.accepted_at)}
            {...getField("email")}
            labelClassName="!text-[rgba(0,9,51,0.65)] !text-xs !font-normal"
          />
          <Textinput
            label="Name"
            inputClassName="!h-[50px]"
            {...getField("name")}
            labelClassName="!text-[rgba(0,9,51,0.65)] !text-xs !font-normal"
          />
          <Textinput
            {...getField("relationship")}
            label="Relationship(This person to you)"
            inputClassName="!h-[50px]"
            labelClassName="!text-[rgba(0,9,51,0.65)] !text-xs !font-normal"
          />
          <Selectinput
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
          <div className="flex w-full items-center justify-end gap-4">
            <button type="button" onClick={handleDiscard} className="btn-outline">
              Discard
            </button>
            <button type="submit" disabled={isMutating || !isValid} className="btn">
              <span>Save</span>
              <Spinner className="!size-4" loading={isMutating} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

