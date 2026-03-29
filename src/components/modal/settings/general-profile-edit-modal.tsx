import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { mutate } from "swr";
import dayjs from "dayjs";
import { X } from "lucide-react";
import { toast } from "sonner";
import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { useStore } from "@/hooks/use-store";
import { Textinput } from "@/components/Form";
import { cn } from "@/utility";
import type { IUser } from "@/utility/interface";
import Spinner from "@/components/spinner";
import {
  profileFieldInputShellClassName,
  profileFieldLabelClassName,
  profileFieldTextInputClassName,
} from "./profile-field-input-classes";

export type GeneralProfileEditModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ProfileDraft = Pick<
  IUser,
  "nickname" | "first_name" | "last_name" | "phone_number" | "location" | "dob" | "country"
>;

function fieldFromUser(user: IUser | null, key: keyof ProfileDraft): string {
  if (!user) return "";
  const v = user[key];
  if (v == null) return "";
  return String(v);
}

function normalizeDobForInput(raw: string): string {
  if (!raw || !dayjs(raw).isValid()) return "";
  return dayjs(raw).format("YYYY-MM-DD");
}

function buildPayload(user: IUser | null, draft: ProfileDraft): Partial<Record<keyof IUser, string>> {
  if (!user) return {};
  const out: Partial<Record<keyof IUser, string>> = {};

  const textKeys: (keyof Omit<ProfileDraft, "dob">)[] = [
    "nickname",
    "first_name",
    "last_name",
    "phone_number",
    "location",
    "country",
  ];
  for (const key of textKeys) {
    const next = draft[key].trim();
    const prev = fieldFromUser(user, key).trim();
    if (next !== prev) {
      (out as Record<string, string>)[key] = next;
    }
  }

  const prevDob = normalizeDobForInput(fieldFromUser(user, "dob"));
  const rawNext = draft.dob.trim();
  const nextDob = rawNext === "" ? "" : normalizeDobForInput(rawNext) || rawNext;
  if (prevDob !== nextDob) {
    out.dob = nextDob;
  }

  return out;
}

export function GeneralProfileEditModal({ open, onOpenChange }: GeneralProfileEditModalProps) {
  const headingId = useId();
  const { user } = useStore();
  const { isMutating, trigger } = useFetcher(endpoint.profile, "put");

  const [draft, setDraft] = useState<ProfileDraft>({
    nickname: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    location: "",
    dob: "",
    country: "",
  });

  const resetDraft = useCallback(() => {
    if (!user) return;
    setDraft({
      nickname: fieldFromUser(user, "nickname"),
      first_name: fieldFromUser(user, "first_name"),
      last_name: fieldFromUser(user, "last_name"),
      phone_number: fieldFromUser(user, "phone_number"),
      location: fieldFromUser(user, "location"),
      dob: normalizeDobForInput(fieldFromUser(user, "dob")),
      country: fieldFromUser(user, "country"),
    });
  }, [user]);

  useEffect(() => {
    if (open && user) {
      resetDraft();
    }
  }, [open, user, resetDraft]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const handleSave = async () => {
    if (!user) return;
    const payload = buildPayload(user, draft);
    if (Object.keys(payload).length === 0) {
      toast.info("No changes to save");
      return;
    }
    try {
      const result = await trigger(payload as Partial<Record<keyof IUser, unknown>>);
      if (result?.success) {
        toast.success(result?.message ?? "Profile updated");
        await mutate(endpoint.profile);
        onOpenChange(false);
      }
    } catch {
      /* toast handled in fetcher */
    }
  };

  const set =
    (key: keyof ProfileDraft) =>
    (value: string) => {
      setDraft((d) => ({ ...d, [key]: value }));
    };

  const handleDobChange = (raw: string) => {
    if (!raw) {
      setDraft((d) => ({ ...d, dob: "" }));
      return;
    }
    setDraft((d) => ({
      ...d,
      dob: dayjs(raw).isValid() ? dayjs(raw).format("YYYY-MM-DD") : raw,
    }));
  };

  if (!open) return null;

  const email = user?.email ?? "";

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(94,94,94,0.5)] p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="flex max-h-[min(90vh,720px)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-v3-stroke-weak bg-white shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-v3-stroke-weak px-5 py-4">
          <h2 id={headingId} className="font-garamond text-xl font-semibold text-v3-text-strong">
            Edit profile
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={cn(
              "inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-v3-text-weak",
              "motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",
              "hover:bg-v3-fill-weaker hover:text-v3-text-strong",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2",
            )}
            aria-label="Close"
          >
            <X className="size-5 shrink-0" strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Textinput
                label="Email"
                name="email"
                value={email}
                disabled
                readOnly
                aria-label="Email"
                className={cn(profileFieldTextInputClassName, "opacity-80")}
                labelClassName={cn(profileFieldLabelClassName)}
                inputClassName={cn(profileFieldInputShellClassName)}
              />
            </div>

            <Textinput
              label="Display name"
              name="nickname"
              value={draft.nickname}
              onChange={(e) => set("nickname")(e.target.value)}
              placeholder="How we greet you"
              aria-label="Display name"
              className={profileFieldTextInputClassName}
              labelClassName={profileFieldLabelClassName}
              inputClassName={profileFieldInputShellClassName}
            />

            <Textinput
              label="First name"
              name="first_name"
              value={draft.first_name}
              onChange={(e) => set("first_name")(e.target.value)}
              aria-label="First name"
              className={profileFieldTextInputClassName}
              labelClassName={profileFieldLabelClassName}
              inputClassName={profileFieldInputShellClassName}
            />

            <Textinput
              label="Last name"
              name="last_name"
              value={draft.last_name}
              onChange={(e) => set("last_name")(e.target.value)}
              aria-label="Last name"
              className={profileFieldTextInputClassName}
              labelClassName={profileFieldLabelClassName}
              inputClassName={profileFieldInputShellClassName}
            />

            <Textinput
              label="Phone"
              name="phone_number"
              value={draft.phone_number}
              onChange={(e) => set("phone_number")(e.target.value)}
              aria-label="Phone number"
              className={profileFieldTextInputClassName}
              labelClassName={profileFieldLabelClassName}
              inputClassName={profileFieldInputShellClassName}
            />

            <Textinput
              label="Location"
              name="location"
              value={draft.location}
              onChange={(e) => set("location")(e.target.value)}
              placeholder="e.g. New York, USA"
              aria-label="Location"
              className={profileFieldTextInputClassName}
              labelClassName={profileFieldLabelClassName}
              inputClassName={profileFieldInputShellClassName}
            />

            <Textinput
              label="Country"
              name="country"
              value={draft.country}
              onChange={(e) => set("country")(e.target.value)}
              placeholder="e.g. US"
              aria-label="Country"
              className={profileFieldTextInputClassName}
              labelClassName={profileFieldLabelClassName}
              inputClassName={profileFieldInputShellClassName}
            />

            <div className="input-container group sm:col-span-2">
              <label className={cn("input-label", profileFieldLabelClassName)} htmlFor="general-profile-dob">
                Birthday
              </label>
              <div className={cn("input-base flex items-center px-3 py-2", profileFieldInputShellClassName)}>
                <input
                  id="general-profile-dob"
                  type="date"
                  name="dob"
                  aria-label="Birthday"
                  disabled={!user}
                  value={draft.dob}
                  onChange={(e) => handleDobChange(e.target.value)}
                  className={cn(
                    "min-w-0 flex-1 cursor-pointer bg-transparent font-inter text-sm outline-none",
                    profileFieldTextInputClassName,
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-v3-stroke-weak px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={cn(
              "inline-flex h-10 min-h-10 items-center justify-center rounded-full border border-v3-stroke-weak",
              "bg-white px-5 font-inter text-sm font-semibold text-v3-text-strong",
              "motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",
              "hover:bg-v3-fill-weaker focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2",
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isMutating || !user}
            onClick={() => void handleSave()}
            className={cn(
              "inline-flex h-10 min-h-10 items-center justify-center gap-2 rounded-full px-5",
              "bg-v3-fill-strong font-inter text-sm font-semibold text-white",
              "disabled:cursor-not-allowed disabled:opacity-60",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2",
            )}
          >
            {isMutating ? <Spinner loading className="!size-4 !text-white" /> : null}
            Save changes
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
