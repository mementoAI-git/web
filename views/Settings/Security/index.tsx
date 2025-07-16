"use client"

import { Button } from "@/components/Buttons";
import { Passwordinput } from "@/components/Form";
import useForm from "@/hooks/use-form";
import * as yup from "yup";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import TwoFactorAuthenticator from "./2FA";

const initial = {
  new_password: "",
  old_password: "",
  c_password: ""
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
    .matches(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must contain at least one special character",
    ),
  c_password: yup
    .string()
    .oneOf([yup.ref("new_password"), null], "Passwords must match")
    .required("Confirm Password is required"),
});

export function Security() {
  const { trigger, isMutating } = useFetcher(endpoint.changePassword);
  const { values, handleChange, handleSubmit, errors } = useForm({
    initial,
    schema,
    async onSubmit(p) {
      const result = await trigger(p)
      if (result.success) [
        toast.success(result?.message)
      ]
    }
  })

  return (
    <div className="max-w-140">
      <div className="space-y-2">
        <h4 className="text-secondary font-geist font-bold">Security</h4>
        <small className="text-sm font-geist text-grey-600">Manage your memento security</small>
      </div>
      <div className="py-8 flex flex-col gap-6">
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
            labelClassName="!text-grey-200 !font-normal"
            name="new_password"
            value={values.new_password}
            error={errors.new_password}
            onChange={handleChange}
          />
          <Passwordinput
            label="Confirm Password"
            labelClassName="!text-grey-200 !font-normal"
            name="c_password"
            value={values.c_password}
            error={errors.c_password}
            onChange={handleChange}
          />
          <Button
            type="submit"
            loading={isMutating}
            title="Change password"
            className="mt-3"
          />
        </form>

        <TwoFactorAuthenticator />
      </div>
    </div>
  )
}