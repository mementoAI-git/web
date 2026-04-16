import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useForm from "@/hooks/use-form";
import * as yup from "yup";
import { useModal } from "@/hooks/use-modal";
import Spinner from "@/components/spinner";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import { mutate } from "swr";
import { SETTINGS_BENEFICIARIES_SWR_KEY } from "@/components/modal/settings/beneficiary&group/beneficiaries-list-swr-key";
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

const inputClass =
  "h-10 w-full rounded-xl border border-v3-stroke-weak bg-white px-3 font-inter text-sm text-v3-text-strong shadow-none outline-none placeholder:text-v3-text-weaker transition-colors hover:border-v3-stroke-strong focus:border-v3-stroke-strong";

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
        await mutate(SETTINGS_BENEFICIARIES_SWR_KEY);
        toast.success(result?.message);
        close?.("add-beneficiary");
      }
    },
  });

  const emailField = getField("email");
  const nameField = getField("name");
  const relationshipField = getField("relationship");

  return (
    <div className="modal-container !max-w-[480px]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-inter text-sm font-semibold text-v3-text-strong">Invite beneficiary</h2>
          <p className="font-inter text-sm text-v3-text-weak">
            They'll receive an email to accept and access your Memento.
          </p>
        </div>
        <button
          type="button"
          onClick={() => close?.("add-beneficiary")}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-v3-text-weak hover:bg-v3-fill-weak hover:text-v3-text-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2"
          aria-label="Close"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="font-inter text-xs font-normal text-v3-text-weak">Email</Label>
          <Input
            type="email"
            placeholder="example@gmail.com"
            name={emailField.name}
            value={emailField.value}
            onChange={emailField.onChange}
            aria-invalid={!!emailField.error}
            className={inputClass}
          />
          {emailField.error && <span className="font-inter text-xs text-danger">{emailField.error}</span>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="font-inter text-xs font-normal text-v3-text-weak">Name</Label>
          <Input
            placeholder="John Doe"
            name={nameField.name}
            value={nameField.value}
            onChange={nameField.onChange}
            aria-invalid={!!nameField.error}
            className={inputClass}
          />
          {nameField.error && <span className="font-inter text-xs text-danger">{nameField.error}</span>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="font-inter text-xs font-normal text-v3-text-weak">Relationship (this person to you)</Label>
          <Input
            placeholder="Brother, Friend, Spouse…"
            name={relationshipField.name}
            value={relationshipField.value}
            onChange={relationshipField.onChange}
            aria-invalid={!!relationshipField.error}
            className={inputClass}
          />
          {relationshipField.error && <span className="font-inter text-xs text-danger">{relationshipField.error}</span>}
        </div>
        <SelectGroup
          value={selectedGroups}
          onChange={setSelectedGroups}
          label="Group"
          labelHint="(optional)"
          placeholder="Search groups to add…"
        />

        <div className="flex items-center justify-end gap-2 border-t border-v3-stroke-weak pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-full border-v3-stroke-weak font-inter text-sm font-medium text-v3-text-strong hover:bg-v3-fill-weak"
            onClick={() => close?.("add-beneficiary")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isMutating || !isValid}
            className="h-9 rounded-full bg-v3-fill-strong px-4 font-inter text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {isMutating ? (
              <span className="flex items-center gap-2">
                Sending… <Spinner className="!size-4" loading />
              </span>
            ) : (
              "Send invite"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
