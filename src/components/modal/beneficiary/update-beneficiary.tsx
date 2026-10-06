import endpoint from "@/api/endpoint";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/spinner";
import useFetcher from "@/hooks/use-fetcher";
import useForm from "@/hooks/use-form";
import { useModal } from "@/hooks/use-modal";
import { isEmpty } from "@/utility";
import { toast } from "sonner";
import { mutate } from "swr";
import { SETTINGS_BENEFICIARIES_SWR_KEY } from "@/components/modal/settings/beneficiary&group/beneficiaries-list-swr-key";
import * as yup from "yup";

const schema = yup.object().shape({
  email: yup.string().email("Invalid email address").trim(),
  name: yup.string(),
  relationship: yup.string(),
  level: yup.number().required("Level is required").default(1),
});

interface UpdateBeneficiaryProps {
  data: {
    _id: string;
    email?: string;
    name?: string;
    relationship?: string;
    level?: number;
  };
}

const inputClass =
  "h-10 w-full rounded-xl border border-v3-stroke-weak bg-bg-neutral px-3 font-inter text-sm text-v3-text-strong shadow-none outline-none placeholder:text-v3-text-weaker transition-colors hover:border-v3-stroke-strong focus:border-v3-stroke-strong";

const PERMISSION_LEVELS = [
  { label: "Level 1", value: "1" },
  { label: "Level 2", value: "2" },
  { label: "Level 3", value: "3" },
];

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
        await mutate(SETTINGS_BENEFICIARIES_SWR_KEY);
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

  const emailField = getField("email");
  const nameField = getField("name");
  const relationshipField = getField("relationship");
  const levelField = getField("level");

  return (
    <div className="modal-container !max-w-[480px]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-inter text-sm font-semibold text-v3-text-strong">Edit beneficiary</h2>
          <p className="font-inter text-sm text-v3-text-weak">Update details for this beneficiary.</p>
        </div>
        <button
          type="button"
          onClick={() => close?.("update-beneficiary")}
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
            disabled={!isEmpty(beneficiary?.accepted_at)}
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
        <div className="flex flex-col gap-1.5">
          <label className="font-inter text-xs text-v3-text-weak">Permission level</label>
          <select
            name={levelField.name}
            value={String(values.level)}
            onChange={(e) => levelField.onChange({ target: { name: levelField.name, value: Number(e.target.value) } } as unknown as React.ChangeEvent<HTMLInputElement>)}
            className="h-10 w-full rounded-xl border border-v3-stroke-weak bg-bg-neutral px-3 font-inter text-sm text-v3-text-strong outline-none transition-colors hover:border-v3-stroke-strong focus:border-v3-stroke-strong"
          >
            {PERMISSION_LEVELS.map((lvl) => (
              <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
            ))}
          </select>
          {levelField.error && (
            <span className="font-inter text-xs text-danger">{levelField.error}</span>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-v3-stroke-weak pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-full border-v3-stroke-weak font-inter text-sm font-medium text-v3-text-strong hover:bg-v3-fill-weak"
            onClick={handleDiscard}
          >
            Discard
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isMutating || !isValid}
            className="h-9 rounded-full bg-v3-fill-strong px-4 font-inter text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {isMutating ? (
              <span className="flex items-center gap-2">
                Saving… <Spinner className="!size-4" loading />
              </span>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
