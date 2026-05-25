"use client";

import endpoint from "@/api/endpoint";
import { Textinput } from "@/components/Form";
import Spinner from "@/components/spinner";
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
      await trigger({ ...p, relationship: "friend" })

    },
  });
  return (
    <form onSubmit={handleSubmit} className="space-y-[6px]">
      <label htmlFor="beneficiary-email" className="input-label !mb-[6px]">
        Email
      </label>
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:gap-2">
        <div className="w-full flex-1">
          <Textinput
            name="email"
            type="email"
            id="beneficiary-email"
            placeholder="example@yahoo.com"
            className="!mt-0"
            onChange={handleChange}
            value={values.email}
            error={errors.email}
          />
        </div>
        <button
          type="submit"
          className="flex min-h-10 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-stroke-neutral-weak px-8 text-center transition-[transform,background-color,border-color] duration-150 ease-out hover:border-black/10 hover:bg-black/[0.02] active:scale-[0.98] sm:w-auto"
        >
          <span className="whitespace-nowrap text-center font-inter text-sm font-semibold text-gray-900">
            Send invite
          </span>
          <Spinner loading={isMutating} className="!size-4 !text-gray-950/90" />
        </button>
      </div>
    </form>
  );
}
