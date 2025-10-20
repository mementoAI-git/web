"use client";

import endpoint from "@/api/endpoint";
import { Textinput } from "@/components/Form";
import Spinner from "@/components/Spinner";
import useFetcher from "@/hooks/use-fetcher";
import useForm from "@/hooks/use-form";
// import { isEmpty } from "@/utility";
import * as yup from "yup";

const schema = yup.object().shape({
  email: yup
    .string()
    .required("Email is required")
    .email("Invalid email address")
    .trim(),
});

const initial = { email: "" };

function AddBeneficiaries() {
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
          <Spinner loading={isMutating} className="!text-primary" />
        </button>
      </div>
    </form>
  );
}

export default function BeneficiaryPage() {
  return (
    <div className="flex flex-1 flex-col gap-10 p-10">
      <div className="flex flex-col gap-4">
        <h3 className="text-[32px] text-gray-950/90 leading-[38px] font-garamond font-medium">
          Great. Now let’s add some beneficiaries
        </h3>
        <span className="text-gray-950/80 text-2xl !leading-[28px] font-garamond font-normal">
          Is there someone you’d like to share your Memento with? You can simply invite them as a beneficiary.
        </span>
      </div>
      <AddBeneficiaries />

      {/* {!isEmpty(data?.data?.docs) && (
        <div className="space-y-3 rounded-lg bg-white p-4">
          <span className="font-inter text-sm font-semibold tracking-[2px] text-grey-300 uppercase">
            invites
          </span>
          <div className="mt-4 space-y-3">
            {data?.data?.docs?.map((item, i) => (
              <BeneficiaryItem email={item.email} key={i} />
            ))}
          </div>
        </div>
      )} */}

      <div className="w-full border-t border-black/5" />
      <div className="flex items-center justify-between">
        <button
          className="bg-black/4 text-gray-900 text-sm leading-[20px] cursor-pointer font-semibold rounded-full py-[18px] px-8"
        >
          Prev
        </button>
        <button
          className="bg-blue-6 text-white text-sm leading-[20px] cursor-pointer font-semibold rounded-full py-[18px] px-8"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
