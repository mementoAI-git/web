"use client"

import endpoint from "@/api/endpoint";
import { Checkbox, Textinput } from "@/components/Form";
import { Dateinput } from "@/components/Form/Dateinput";
import { Selectinput } from "@/components/Form/Selectinput";
import Spinner from "@/components/Spinner";
import useFetcher from "@/hooks/use-fetcher";
import useForm from "@/hooks/use-form";
import countries from "@/utility/countries";
import * as yup from "yup"

const schema = yup.object().shape({
  first_name: yup.string().required("Firstname is required").trim(),
  last_name: yup.string().required("Lastname is required").trim(),
  dob: yup.string().required(),
  country: yup.string().required(),
  newsletter_subscriber: yup.boolean().default(false)
})

const initial = {
  first_name: "",
  last_name: "",
  dob: "",
  country: "",
  newsletter_subscriber: false
}

export function Profile() {
  const { trigger, isMutating } = useFetcher(endpoint.profile, "put")
  const { handleSubmit, handleChange, values, errors } = useForm({
    initial,
    schema,
    async onSubmit(p) {
      trigger(p, {
        revalidate: false,
        populateCache(result, currentData) {
          return {
            ...currentData,
            data: { ...currentData?.data, ...result?.data }
          }
        },
      })
    }
  })
  return (
    <form onSubmit={handleSubmit} className="max-w-[583px] flex flex-col gap-10 py-20 w-full">
      <div className="bg-surface flex flex-col p-10 gap-5 rounded-3xl">
        <span className="font-bold text-[32px] leading-10 font-bricolage">Let’s get to know you better</span>
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
            data={countries.map(c => ({ label: c, value: c }))}
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
      <div className="flex items-end justify-between font-geist font-bold text-base">
        <span className="underline text-grey-200 cursor-pointer">Go back</span>
        <button className="rounded-lg text-white bg-secondary px-4 cursor-pointer h-12">
          Continue {isMutating && <Spinner />}
        </button>
      </div>
    </form>
  )
}