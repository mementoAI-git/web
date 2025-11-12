import * as yup from "yup";
import { Button } from "@/components/Buttons";
import { Passwordinput } from "@/components/Form";
import useFetcher from "@/hooks/use-fetcher";
import useForm from "@/hooks/use-form";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import TwoFactorAuthenticator from "./two-fa";

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
    <div>
      <div className="flex flex-col gap-2">
        <span className="font-inter text-base font-bold text-gray-950/90">Security</span>
        <span className="font-inter text-sm text-gray-950/70">
          Manage your Memento account security
        </span>
      </div>
      <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Passwordinput
            label="Old Password"
            name="old_password"
            value={values.old_password}
            error={errors.old_password}
            onChange={handleChange}
            labelClassName="!text-grey-200 !font-normal"
          />
          <Passwordinput
            label="New Password"
            name="new_password"
            value={values.new_password}
            error={errors.new_password}
            onChange={handleChange}
            labelClassName="!text-grey-200 !font-normal"
          />
          <Passwordinput
            label="Confirm Password"
            name="c_password"
            value={values.c_password}
            error={errors.c_password}
            onChange={handleChange}
            labelClassName="!text-grey-200 !font-normal"
          />
          <Button type="submit" loading={isMutating} title="Change password" className="mt-3" />
        </form>

        <TwoFactorAuthenticator />
      </div>
    </div>
  );
}

