"use client";

import { Button } from "@/components/Buttons";
import { Passwordinput } from "@/components/Form";
import StrengthIndicator from "./StrengthIndicator";
import useForm from "@/hooks/use-form";
import * as yup from "yup";
import endpoint from "@/api/endpoint";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import useFetcher from "@/hooks/use-fetcher";
import { toast } from "sonner";

const schema = yup.object().shape({
  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters long")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .matches(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must contain at least one special character",
    ),
  confirm_password: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Please confirm password"),
});

export function SetPassword({ token }: { token: string }) {
  const router = useRouter();
  const initial = { confirm_password: "", password: "", token };
  const { trigger, isMutating } = useFetcher(endpoint.setPassword);

  const { handleSubmit, values, getField } = useForm({
    schema,
    initial,
    async onSubmit(payload) {
      const result = await trigger(payload);
      if (result) {
        toast.success(result?.message)
        router.push("/login");
      }
    },
  });
  const level = useMemo(() => {
    let strength = 0;
    if (/[A-Z]/.test(values.password)) {
      strength += 1;
    }
    if (/[a-z]/.test(values.password)) {
      strength += 1;
    }
    if (/[0-9]/.test(values.password)) {
      strength += 1;
    }
    if (/[!@#$%^&*(),.?":{}|<>]/.test(values.password)) {
      strength += 1;
    }
    if (values.password.length >= 8) {
      strength += 1;
    }

    return strength;
  }, [values.password]);
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Passwordinput
        label="Password"
        {...getField("password")}
      />
      <Passwordinput
        label="Confirm Password"
        {...getField("confirm_password")}
      />
      <StrengthIndicator level={level} />
      <Button
        loading={isMutating}
        type="submit"
        title="Set new password"
        className="mt-3"
      />
    </form>
  );
}
