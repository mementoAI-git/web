import {
  FormDialog,
  FormDialogField,
  FormDialogFooter,
  FormDialogInput,
} from "../../form-dialog";
import { useId, useState } from "react";
import { Check, X } from "lucide-react";
import useSWR from "swr";
import { groupColorVar } from "@/components/group-color";
import { groupsListFetcher, groupsListKey } from "@/api/groups";
import type { IGroup } from "@/utility/interface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useForm from "@/hooks/use-form";
import * as yup from "yup";
import { useModal } from "@/hooks/use-modal";
import Spinner from "@/components/spinner";
import { useGuardedModalFetcher } from "@/components/modal/use-guarded-modal-fetcher";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import { mutate } from "swr";
import { SETTINGS_BENEFICIARIES_SWR_KEY } from "@/components/modal/settings/beneficiary&group/beneficiaries-list-swr-key";
import { SelectGroup, type GroupSearchResultItem } from "./select-group";
import { handleSubscriptionGateError } from "@/features/pricing/subscription-errors";
import { isPeopleKey } from "@/api/people";
import posthog from "@/lib/posthog";

const initial = {
  email: "",
  name: "",
  relationship: "",
};

const schema = yup.object().shape({
  email: yup
    .string()
    .required("Email is required")
    .email("Invalid email address")
    .trim(),
  name: yup.string().required("Name is required"),
  relationship: yup.string().required("Relationship is required"),
});

const inputClass =
  "h-11 w-full rounded-lg border border-v3-stroke-weak bg-bg-neutral-solid px-3 font-inter text-sm text-v3-text-strong shadow-none outline-none placeholder:text-v3-text-weaker transition-colors hover:border-v3-stroke-strong focus:border-v3-stroke-strong";

export function AddBeneficiary({
  data,
}: {
  data?: { mode?: "connection" | "beneficiary" };
}) {
  const fieldId = useId();
  const isConnection = data?.mode !== "beneficiary";
  const { close } = useModal();
  const { trigger, isMutating } = useGuardedModalFetcher(
    "add-beneficiary",
    endpoint.beneficiaries,
  );
  const [selectedGroups, setSelectedGroups] = useState<GroupSearchResultItem[]>(
    [],
  );
  const { data: groupsData } = useSWR(
    isConnection ? groupsListKey(1) : null,
    groupsListFetcher,
    { shouldRetryOnError: false },
  );
  const { handleSubmit, isValid, getField } = useForm({
    initial,
    schema,
    async onSubmit(payload) {
      try {
        const result = await trigger({
          ...payload,
          groups: selectedGroups.map((g) => g.id),
          ...(isConnection && { access_scope: "shared_only" }),
        });
        if (result?.success) {
          if (posthog.__loaded) {
            posthog.capture("beneficiary_invited", {
              invitation_mode: isConnection ? "connection" : "beneficiary",
              group_count: selectedGroups.length,
            });
          }
          void mutate(SETTINGS_BENEFICIARIES_SWR_KEY).catch(() => undefined);
          void mutate(isPeopleKey).catch(() => undefined);
          toast.success(result?.message);
          close?.("add-beneficiary");
        }
      } catch (e) {
        if (handleSubscriptionGateError(e)) return;
      }
    },
  });

  const emailField = getField("email");
  const nameField = getField("name");
  const relationshipField = getField("relationship");

  const form = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor={`${fieldId}-email`}
          className="font-inter text-xs font-normal text-v3-text-weak"
        >
          Email
        </Label>
        <Input
          disabled={isMutating}
          type="email"
          placeholder="example@gmail.com"
          id={`${fieldId}-email`}
          name={emailField.name}
          value={emailField.value}
          onChange={emailField.onChange}
          aria-invalid={!!emailField.error}
          className={inputClass}
        />
        {emailField.error && (
          <span className="font-inter text-xs text-danger">
            {emailField.error}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor={`${fieldId}-name`}
          className="font-inter text-xs font-normal text-v3-text-weak"
        >
          Name
        </Label>
        <Input
          disabled={isMutating}
          placeholder="John Doe"
          id={`${fieldId}-name`}
          name={nameField.name}
          value={nameField.value}
          onChange={nameField.onChange}
          aria-invalid={!!nameField.error}
          className={inputClass}
        />
        {nameField.error && (
          <span className="font-inter text-xs text-danger">
            {nameField.error}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor={`${fieldId}-relationship`}
          className="font-inter text-xs font-normal text-v3-text-weak"
        >
          Relationship
        </Label>
        <Input
          disabled={isMutating}
          placeholder="Brother, Friend, Spouse…"
          id={`${fieldId}-relationship`}
          name={relationshipField.name}
          value={relationshipField.value}
          onChange={relationshipField.onChange}
          aria-invalid={!!relationshipField.error}
          className={inputClass}
        />
        {relationshipField.error && (
          <span className="font-inter text-xs text-danger">
            {relationshipField.error}
          </span>
        )}
      </div>
      {!isConnection && (
        <SelectGroup
          value={selectedGroups}
          onChange={(next) => {
            if (!isMutating) setSelectedGroups(next);
          }}
          label="Group"
          labelHint="(optional)"
          placeholder="Search groups to add…"
        />
      )}

      <div className="flex items-center justify-end gap-2 border-t border-v3-stroke-weak pt-4">
        <Button
          type="button"
          variant="outline"
          size="form"
          className="border-v3-stroke-weak text-v3-text-strong"
          disabled={isMutating}
          onClick={() => close?.("add-beneficiary")}
        >
          Cancel
        </Button>
        <Button type="submit" size="form" disabled={isMutating || !isValid}>
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
  );

  if (isConnection) {
    const groups = groupsData?.docs ?? [];
    const toggleGroup = (group: IGroup) =>
      setSelectedGroups((current) =>
        current.some((item) => item.id === group._id)
          ? current.filter((item) => item.id !== group._id)
          : [
              ...current,
              {
                id: group._id,
                name: group.name,
                source: "group",
                color: group.color,
              },
            ],
      );
    return (
      <FormDialog
        title="Invite person"
        description="Share memories with someone you know."
        onClose={() => close?.("add-beneficiary")}
        busy={isMutating}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <FormDialogField
            label="Name"
            htmlFor={`${fieldId}-name`}
            error={nameField.error}
          >
            <FormDialogInput
              disabled={isMutating}
              placeholder="John Doe"
              id={`${fieldId}-name`}
              name={nameField.name}
              value={nameField.value}
              onChange={nameField.onChange}
              aria-invalid={!!nameField.error}
            />
          </FormDialogField>
          <FormDialogField
            label="Email address"
            htmlFor={`${fieldId}-email`}
            error={emailField.error}
          >
            <FormDialogInput
              disabled={isMutating}
              type="email"
              placeholder="example@gmail.com"
              id={`${fieldId}-email`}
              name={emailField.name}
              value={emailField.value}
              onChange={emailField.onChange}
              aria-invalid={!!emailField.error}
            />
          </FormDialogField>
          <FormDialogField
            label="Relationship"
            htmlFor={`${fieldId}-relationship`}
            error={relationshipField.error}
          >
            <FormDialogInput
              disabled={isMutating}
              placeholder="Brother, Friend, Spouse…"
              id={`${fieldId}-relationship`}
              name={relationshipField.name}
              value={relationshipField.value}
              onChange={relationshipField.onChange}
              aria-invalid={!!relationshipField.error}
            />
          </FormDialogField>
          {groups.length > 0 ? (
            <fieldset>
              <legend className="mb-3 text-sm text-text-neutral-strong">
                Add to groups
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {groups.map((group) => {
                  const selected = selectedGroups.some(
                    (item) => item.id === group._id,
                  );
                  return (
                    <button
                      key={group._id}
                      type="button"
                      disabled={isMutating}
                      aria-pressed={selected}
                      onClick={() => toggleGroup(group)}
                      style={{ backgroundColor: groupColorVar(group.color) }}
                      className="inline-flex h-6 cursor-pointer items-center gap-1 rounded-full px-2.5 text-xs font-medium text-[var(--group-on-color)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-neutral-strong"
                    >
                      {selected ? <Check className="size-3.5" aria-hidden /> : null}
                      {group.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}
          <FormDialogFooter
            submitLabel="Send invite"
            busyLabel="Sending…"
            busy={isMutating}
            disabled={!isValid}
            onDismiss={() => close?.("add-beneficiary")}
          />
        </form>
      </FormDialog>
    );
  }

  return (
    <div className="modal-container !max-w-[480px]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-inter text-sm font-semibold text-v3-text-strong">
            {isConnection ? "Invite someone" : "Invite beneficiary"}
          </h2>
          <p className="font-inter text-sm text-v3-text-weak">
            {isConnection
              ? "Share memories with someone you know."
              : "They'll receive an email to accept and access your Memento."}
          </p>
        </div>
        <button
          type="button"
          disabled={isMutating}
          onClick={() => close?.("add-beneficiary")}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-v3-text-weak hover:bg-v3-fill-weak hover:text-v3-text-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2"
          aria-label="Close"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      {form}
    </div>
  );
}
