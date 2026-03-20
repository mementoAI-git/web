import { useState } from "react";
import { Textinput } from "@/components/Form";
import { ModalCloseBtn } from "../../modalLayout";
import useForm from "@/hooks/use-form";
import * as yup from "yup";
import { useModal } from "@/hooks/use-modal";
import Spinner from "@/components/spinner";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import { mutate } from "swr";
import { LightBulbIcon } from "@/components/icons";
import { SelectGroup, type GroupSearchResultItem } from "./select-group";

const initial = {
  email: "",
  name: "",
  relationship: "",
};

const schema = yup.object().shape({
  email: yup.string().required("Email is required").email("Invalid email address").trim(),
  name: yup.string().required("Name is required"),
  relationship: yup.string().required("Relationship is required"),
});

export function AddBeneficiary() {
  const { close } = useModal();
  const { trigger, isMutating } = useFetcher(endpoint.beneficiaries);
  const [selectedGroups, setSelectedGroups] = useState<GroupSearchResultItem[]>([]);
  const { handleSubmit, isValid, getField } = useForm({
    initial,
    schema,
    async onSubmit(payload) {
      const result = await trigger({
        ...payload,
        groups: selectedGroups.map((g) => g.id),
      });
      if (result.success) {
        await mutate(`${endpoint.beneficiaries}?page=1`);
        toast.success(result?.message);
        close?.("add-beneficiary");
      }
    },
  });

  return (
    <div className="modal-container">
      <ModalCloseBtn onClick={() => close?.("add-beneficiary")} />
      <div className="space-y-6">
        <div>
          <h4 className="modal-title">Invite beneficiary</h4>
        </div>
        <div className="flex gap-3 rounded-xl border border-[#FDDFC5] bg-v3-brand-strong/[0.03] p-3 text-v3-brand-strong">
          <div className="size-5">
            <LightBulbIcon width={18} height={18} />
          </div>
          <span className="font-inter text-sm font-normal">
            Add a Beneficiary by sending an invite to their email address. They will be taken through a process to accept
            the invite. Once a beneficiary has accepted your invite, they will be able to converse with your Memento.
          </span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Textinput
            label={<span className="font-inter text-sm font-normal text-gray-950/70">Email</span>}
            type="email"
            inputClassName="!h-[50px]"
            {...getField("email")}
            placeholder="example@gmail.com"
            labelClassName="!text-[rgba(0,9,51,0.65)] !text-xs !font-normal"
          />
          <Textinput
            label={<span className="font-inter text-sm font-normal text-gray-950/70">Name</span>}
            inputClassName="!h-[50px]"
            {...getField("name")}
            placeholder="John Doe"
            labelClassName="!text-[rgba(0,9,51,0.65)] !text-xs !font-normal"
          />
          <Textinput
            {...getField("relationship")}
            placeholder="Brother"
            label={<span className="font-inter text-sm font-normal text-gray-950/70">Relationship(This person to you)</span>}
            inputClassName="!h-[50px]"
            labelClassName="!text-[rgba(0,9,51,0.65)] !text-xs !font-normal"
          />
          <SelectGroup
            value={selectedGroups}
            onChange={setSelectedGroups}
            label={<span className="font-inter text-sm font-normal text-gray-950/70">Group</span>}
            labelHint="(add beneficiary to groups)"
            placeholder="Type to search groups..."
          />
          <div className="flex w-full items-center justify-end gap-4">
            <button type="button" className="btn-outline">
              Discard
            </button>
            <button type="submit" disabled={isMutating || !isValid} className="btn">
              <span>Send invite</span>
              <Spinner className="!size-4" loading={isMutating} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

