import { useState } from "react";
import { createPortal } from "react-dom";
import * as yup from "yup";
import { X } from "lucide-react";
import { Passwordinput } from "@/components/Form";
import useFetcher from "@/hooks/use-fetcher";
import useForm from "@/hooks/use-form";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import Spinner from "@/components/spinner";
import { cn } from "@/utility";
import TwoFactorAuthenticator from "./two-fa";
import { SettingsSectionCard } from "./settings-section-card";
import { SettingsPillButton } from "./settings-action-row";

const initial = {
  new_password: "",
  old_password: "",
  c_password: "",
};

const schema = yup.object().shape({
  old_password: yup.string().required("Old Password is required"),
  new_password: yup
    .string()
    .required("New Password is required")
    .min(6, "Password must be at least 6 characters long")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .matches(/[!@#$%^&*(),.?\":{}|<>]/, "Password must contain at least one special character"),
  c_password: yup
    .string()
    .oneOf([yup.ref("new_password"), null], "Passwords must match")
    .required("Confirm Password is required"),
});

const inputLabelClass = "!text-v3-text-weak !font-normal";

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { trigger, isMutating } = useFetcher(endpoint.changePassword);
  const { values, handleChange, handleSubmit, errors } = useForm({
    initial,
    schema,
    async onSubmit(payload) {
      const result = await trigger(payload);
      if (result.success) {
        toast.success(result?.message);
        onClose();
      }
    },
  });

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={cn(
          "relative w-full max-w-md rounded-2xl border border-v3-stroke-weak bg-white p-6 shadow-xl",
          "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200",
        )}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-inter text-sm font-semibold text-v3-text-strong">Change password</h2>
            <p className="font-inter text-sm text-v3-text-weak">Update the password you use to sign in.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full",
              "text-v3-text-weak hover:bg-v3-fill-weak hover:text-v3-text-strong",
              "motion-safe:transition-colors motion-safe:duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2",
            )}
            aria-label="Close"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Passwordinput
            label="Old password"
            name="old_password"
            value={values.old_password}
            error={errors.old_password}
            onChange={handleChange}
            labelClassName={inputLabelClass}
          />
          <Passwordinput
            label="New password"
            name="new_password"
            value={values.new_password}
            error={errors.new_password}
            onChange={handleChange}
            labelClassName={inputLabelClass}
          />
          <Passwordinput
            label="Confirm password"
            name="c_password"
            value={values.c_password}
            error={errors.c_password}
            onChange={handleChange}
            labelClassName={inputLabelClass}
          />
          <div className="flex justify-end border-t border-v3-stroke-weak pt-4">
            <SettingsPillButton type="submit" variant="default" disabled={isMutating}>
              <span>Save password</span>
              {isMutating ? <Spinner loading className="!size-4 text-v3-text-strong" /> : null}
            </SettingsPillButton>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

export default function Security() {
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex min-w-0 flex-col gap-1">
        <span className="font-inter text-base font-bold text-v3-text-strong text-balance">Security</span>
        <span className="font-inter text-sm text-v3-text-weak text-pretty">Manage your Memento account security</span>
      </header>

      <SettingsSectionCard
        title="Password"
        description="Update the password you use to sign in to Memento."
      >
        <SettingsPillButton variant="default" onClick={() => setPasswordModalOpen(true)}>
          Change password
        </SettingsPillButton>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Two-factor authentication"
        description="An authenticator app adds a verification step each time you sign in."
      >
        <TwoFactorAuthenticator />
      </SettingsSectionCard>

      {passwordModalOpen && <ChangePasswordModal onClose={() => setPasswordModalOpen(false)} />}
    </div>
  );
}
