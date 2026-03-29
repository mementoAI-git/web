import endpoint from "@/api/endpoint";
import { X } from "lucide-react";
import { Input, Button } from "@heroui/react";
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
  data: any;
}

const inputClassNames = {
  label: "!text-v3-text-weak !font-normal !text-xs pb-0.5",
  input: "font-inter text-sm text-v3-text-strong placeholder:text-v3-text-weaker",
  inputWrapper: "border-v3-stroke-weak bg-white hover:border-v3-stroke-strong data-[focus=true]:border-v3-stroke-strong shadow-none",
};

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
        <Input
          label="Email"
          type="email"
          variant="bordered"
          labelPlacement="outside"
          placeholder="example@gmail.com"
          name={emailField.name}
          value={emailField.value}
          onChange={emailField.onChange}
          isInvalid={!!emailField.error}
          errorMessage={emailField.error}
          isDisabled={!isEmpty(beneficiary?.accepted_at)}
          classNames={inputClassNames}
        />
        <Input
          label="Name"
          variant="bordered"
          labelPlacement="outside"
          placeholder="John Doe"
          name={nameField.name}
          value={nameField.value}
          onChange={nameField.onChange}
          isInvalid={!!nameField.error}
          errorMessage={nameField.error}
          classNames={inputClassNames}
        />
        <Input
          label="Relationship (this person to you)"
          variant="bordered"
          labelPlacement="outside"
          placeholder="Brother, Friend, Spouse…"
          name={relationshipField.name}
          value={relationshipField.value}
          onChange={relationshipField.onChange}
          isInvalid={!!relationshipField.error}
          errorMessage={relationshipField.error}
          classNames={inputClassNames}
        />
        <div className="flex flex-col gap-1.5">
          <label className="font-inter text-xs text-v3-text-weak">Permission level</label>
          <select
            name={levelField.name}
            value={String(values.level)}
            onChange={(e) => levelField.onChange({ target: { name: levelField.name, value: Number(e.target.value) } } as any)}
            className="h-10 w-full rounded-xl border border-v3-stroke-weak bg-white px-3 font-inter text-sm text-v3-text-strong outline-none transition-colors hover:border-v3-stroke-strong focus:border-v3-stroke-strong"
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
            variant="bordered"
            size="sm"
            className="h-9 rounded-full border-v3-stroke-weak font-inter text-sm font-medium text-v3-text-strong hover:bg-v3-fill-weak"
            onPress={handleDiscard}
          >
            Discard
          </Button>
          <Button
            type="submit"
            size="sm"
            isDisabled={isMutating || !isValid}
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
