"use client";

import endpoint from "@/api/endpoint";
import { Button } from "@/components/Buttons";
import { Textinput } from "@/components/Form";
import { useRouter } from "next/navigation";
import useForm from "@/hooks/use-form";
import * as yup from "yup";
import useFetcher from "@/hooks/use-fetcher";

const schema = yup.object().shape({
  email: yup
    .string()
    .required("Email is required")
    .email("Invalid email address")
    .trim(),
  type: yup.string().default("reset")
});

const initial = { email: "", type: "reset" };

export function ForgetPassword() {
  const router = useRouter();
  const { trigger, isMutating } = useFetcher(endpoint.sendLink);
  const { handleSubmit, getField } = useForm({
    schema,
    initial,
    async onSubmit(payload) {
      const result = await trigger(payload);
      if (result) {
        router.push(`/check-mail?email=${payload.email}`);
      }
    },
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Textinput
        label="Email"
        placeholder="johndoe@mail.com"
        {...getField("email")}
      />
      <Button
        title="Submit"
        type="submit"
        loading={isMutating}
        className="mt-3 !rounded-full"
      />
    </form>
  );
}
