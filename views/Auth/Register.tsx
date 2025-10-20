"use client";

import endpoint from "@/api/endpoint";
import { Button } from "@/components/Buttons";
import { Passwordinput, Textinput } from "@/components/Form";
import useFetcher from "@/hooks/use-fetcher";
import useForm from "@/hooks/use-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as yup from "yup";

const schema = yup.object().shape({
  first_name: yup
    .string()
    .required("First name is required")
    .trim(),
  last_name: yup
    .string()
    .required("Last name is required")
    .trim(),
  email: yup
    .string()
    .required("Email is required")
    .email("Invalid email address")
    .trim(),
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
});

const initial = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
};

export function Register() {
  const router = useRouter();
  const { trigger, isMutating } = useFetcher(endpoint.register);
  const { handleSubmit, getField } = useForm({
    schema,
    initial,
    async onSubmit(payload) {
      const result = await trigger(payload);
      if (result) {
        toast.success(result?.message)
      }
      router.push(`/verify-email?email=${payload.email}`);
    },
  });
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex justify-between items-center gap-3 w-full">
        <div className="flex-1">
          <Textinput
            label="First name"
            placeholder="John"
            className="flex-1"
            {...getField("first_name")}
          />
        </div>
        <div className="flex-1">
          <Textinput
            label="Last name"
            placeholder="Doe"
            {...getField("last_name")}
          />
        </div>
      </div>
      <Textinput
        label="Email"
        placeholder="johndoe@mail.com"
        {...getField("email")}
      />
      <Passwordinput
        label="Password"
        {...getField("password")}
      />
      <Button
        loading={isMutating}
        type="submit"
        title="Create account"
        className="mt-3 !rounded-full"
      />

      <small className="px-3 text-center font-inter text-sm leading-5 text-gray-800">
        By clicking “Create account” you agree to the
        <span className="text-blue-6 underline">Terms of Use</span> and
        <span className="text-blue-6 underline"> Privacy Policy</span>
      </small>
    </form>
  );
}
