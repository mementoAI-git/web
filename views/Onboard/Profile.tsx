import { Checkbox, Textinput } from "@/components/Form";
import { Dateinput } from "@/components/Form/Dateinput";
import { Selectinput } from "@/components/Form/Selectinput";
import useForm from "@/hooks/use-form";
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
  const { handleSubmit, handleChange, values, errors } = useForm({ initial, schema })
  return (
    <div className="max-w-[583px] flex flex-col gap-10 py-20 w-full">
      <div className="bg-surface flex flex-col p-10 gap-5 rounded-3xl">
        <span className="font-bold text-[32px] leading-10 font-bricolage">Let’s get to know you better</span>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Textinput
            name="first_name"
            label="First name"
            placeholder="Enter first name"
            value={values.first_name}
            onChange={handleChange}
          />
          <Textinput
            name="last_name"
            label="Last name"
            placeholder="Enter last name"
            value={values.last_name}
            onChange={handleChange}
          />
          <Dateinput
            name="dob"
            label="Date of birth"
            value={values.dob}
            onChange={handleChange}
          />
          <Selectinput
            name="country"
            label="Country of residence"
            placeholder="Select country"
            value={values.country}
            onChange={handleChange}
          />
          <Checkbox
            name="newsletter_subscriber"
            label="I’d like to receive email updates and newsletters."
            checked={values.newsletter_subscriber}
            onChange={handleChange}
          />
        </form>
      </div>
      <div className="flex items-end justify-between font-geist font-bold text-base">
        <span className="underline text-grey-200 cursor-pointer">Go back</span>
        <button className="rounded-lg text-white bg-secondary px-4 cursor-pointer h-12">Continue</button>
      </div>
    </div>
  )
}