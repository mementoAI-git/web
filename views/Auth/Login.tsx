"use client";

import endpoint from "@/api/endpoint";
import { Button } from "@/components/Buttons";
import { Checkbox, Passwordinput, Textinput } from "@/components/Form";
import useForm from "@/hooks/use-form";
import Link from "next/link";
import * as yup from "yup";
import { useRouter } from "next/navigation";
import { clearCache } from "@/utility";
import useFetcher from "@/hooks/use-fetcher";
import { useStore } from "@/hooks/use-store";

const schema = yup.object().shape({
  email: yup
    .string()
    .required("Email is required")
    .email("Invalid email address")
    .trim(),
  password: yup.string().required("Password is required"),
  remember_for_30_days: yup.boolean().default(false),
});

const initial = {
  email: "",
  password: "",
  remember_for_30_days: false,
};

export function Login() {
  const router = useRouter();
  const { setAuth } = useStore();
  const { trigger, isMutating } = useFetcher(endpoint.login);
  const { handleSubmit, handleChange, values, errors } = useForm({
    schema,
    initial,
    async onSubmit(payload) {
      try {
        const result = await trigger(payload);
        if (result.data) {
          setAuth(result.data);
          await clearCache();
          router.push("/overview");
        }
      } catch (err: any) {
        if (err && err.data.requires_verification) {
          router.push(`/verify-email?email=${payload.email}`);
        }
      }
    },
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Textinput
        label="Email"
        name="email"
        placeholder="johndoe@mail.com"
        value={values.email}
        error={errors.email}
        onChange={handleChange}
      />
      <Passwordinput
        label="Password"
        name="password"
        value={values.password}
        error={errors.email}
        onChange={handleChange}
      />

      <div className="flex items-center justify-between font-inter text-sm">
        <Checkbox
          label="Remember for 30 days"
          name="remember_for_30_days"
          checked={values.remember_for_30_days}
          onChange={handleChange}
        />
        <Link
          href="/forget-password"
          className="cursor-pointer font-bold text-primary"
        >
          Reset password
        </Link>
      </div>
      <Button
        loading={isMutating}
        type="submit"
        title="Login"
        className="mt-3"
      />
    </form>
  );
}
