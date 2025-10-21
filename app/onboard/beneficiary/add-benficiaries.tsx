"use client";

import endpoint from "@/api/endpoint";
import { Textinput } from "@/components/Form";
import Spinner from "@/components/Spinner";
import useFetcher from "@/hooks/use-fetcher";
import useForm from "@/hooks/use-form";

import * as yup from "yup";

const schema = yup.object().shape({
  email: yup
    .string()
    .required("Email is required")
    .email("Invalid email address")
    .trim(),
});

const initial = { email: "" };

export default function AddBeneficiaries() {
  const { trigger, isMutating } = useFetcher(endpoint.beneficiaries);
  const { handleSubmit, handleChange, values, errors } = useForm({
    initial,
    schema,
    async onSubmit(p) {
      trigger({ ...p, relationship: "friend" })
    },
  });
  return (
    <form onSubmit={handleSubmit} className="space-y-[6px]">
      <label htmlFor="email" className="input-label !mb-[6px]">
        Email
      </label>
      <div className="flex flex-row items-stretch gap-2">
        <div className="w-full flex-3">
          <Textinput
            name="email"
            type="email"
            id="email"
            placeholder="example@yahoo.com"
            className="!mt-0"
            onChange={handleChange}
            value={values.email}
            error={errors.email}
          />
        </div>
        <button className="flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-[#10182866] px-8 text-center">
          <span className="text-center font-inter font-semibold text-sm whitespace-nowrap text-gray-900">
            Send invite
          </span>
          <Spinner loading={isMutating} className="!text-gray-950/90 !size-4" />
        </button>
      </div>
    </form>
  );
}