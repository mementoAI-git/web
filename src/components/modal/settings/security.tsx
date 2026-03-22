import * as yup from "yup";
import { Passwordinput } from "@/components/Form";
import useFetcher from "@/hooks/use-fetcher";
import useForm from "@/hooks/use-form";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import Spinner from "@/components/spinner";
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

export default function Security() {
  const { trigger, isMutating } = useFetcher(endpoint.changePassword);
  const { values, handleChange, handleSubmit, errors } = useForm({
    initial,
    schema,
    async onSubmit(payload) {
      const result = await trigger(payload);
      if (result.success) {
        toast.success(result?.message);
      }
    },
  });

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
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
              <span>Change password</span>
              {isMutating ? <Spinner loading className="!size-4 text-v3-text-strong" /> : null}
            </SettingsPillButton>
          </div>
        </form>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Two-factor authentication"
        description="An authenticator app adds a verification step each time you sign in."
      >
        <TwoFactorAuthenticator />
      </SettingsSectionCard>
    </div>
  );
}
