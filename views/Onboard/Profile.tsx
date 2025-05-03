"use client";

import endpoint from "@/api/endpoint";
import { Checkbox, Textinput } from "@/components/Form";
import { Dateinput } from "@/components/Form/Dateinput";
import { Selectinput } from "@/components/Form/Selectinput";
import Spinner from "@/components/Spinner";
import useFetcher from "@/hooks/use-fetcher";
import useForm from "@/hooks/use-form";
import { useStore } from "@/hooks/use-store";
import { isEmpty } from "@/utility";
import countries from "@/utility/countries";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import * as yup from "yup"

const schema = yup.object().shape({
  first_name: yup.string().required("Firstname is required").trim(),
  last_name: yup.string().required("Lastname is required").trim(),
  dob: yup.string().required("date of birth is required"),
  country: yup.string().required().lowercase(),
  newsletter_subscriber: yup.boolean().default(false),
});

const initial = {
  first_name: "",
  last_name: "",
  dob: "",
  country: "",
  newsletter_subscriber: false,
};

export function Profile() {
  const router = useRouter()
  const { user } = useStore()
  const { trigger, isMutating } = useFetcher(endpoint.profile, "put")

  const { handleSubmit, setValues, handleChange, values, errors } = useForm({
    initial,
    schema,
    async onSubmit(p) {
      const result = await trigger(p)
      if (result) {
        router.push("/onboard/beneficiary");
      }
    },
  });

  useEffect(() => {
    if (isEmpty(user)) return;
    setValues(user)
  }, [user])

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-[583px] flex-col gap-10 py-20"
    >
      <div className="flex flex-col gap-5 rounded-3xl bg-surface p-10">
        <span className="font-bricolage text-[32px] leading-10 font-bold">
          Let’s get to know you better
        </span>
        <div className="space-y-6">
          <Textinput
            name="first_name"
            label="First name"
            placeholder="Enter first name"
            value={values.first_name}
            error={errors.first_name}
            onChange={handleChange}
          />
          <Textinput
            name="last_name"
            label="Last name"
            placeholder="Enter last name"
            value={values.last_name}
            error={errors.last_name}
            onChange={handleChange}
          />
          <Dateinput
            id="onboard-profile-dob"
            name="dob"
            label="Date of birth"
            value={values.dob}
            error={errors.dob}
            onChange={handleChange}
          />
          <Selectinput
            name="country"
            label="Country of residence"
            placeholder="Select country"
            data={countries.map((c) => ({ label: c, value: c }))}
            value={values.country}
            error={errors.country}
            onChange={handleChange}
          />
          <Checkbox
            name="newsletter_subscriber"
            label="I’d like to receive email updates and newsletters."
            checked={values.newsletter_subscriber}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="flex items-end justify-between font-geist text-base font-bold">
        <span className="cursor-pointer text-grey-200 underline">Go back</span>
        <button className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg bg-secondary px-4 text-white">
          Continue <Spinner loading={isMutating} />
        </button>
      </div>
    </form>
  );
}
