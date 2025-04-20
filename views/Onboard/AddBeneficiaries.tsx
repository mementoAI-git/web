import endpoint from "@/api/endpoint";
import { Textinput } from "@/components/Form";
import Spinner from "@/components/Spinner";
import useFetcher from "@/hooks/use-fetcher";
import useForm from "@/hooks/use-form";
import * as yup from "yup"

const schema = yup.object().shape({
  email: yup.string().required("Email is required").email("Invalid email address").trim()
})

const initial = { email: "" }

export default function AddBeneficiaries() {
  const { trigger, isMutating } = useFetcher(endpoint.beneficiaries)
  const { handleSubmit, handleChange, values, errors } = useForm({
    initial,
    schema,
    async onSubmit(p) {
      trigger(p)
    },
  })
  return (
    <form onSubmit={handleSubmit} className="">
      <label htmlFor="email" className="input-label">Email</label>
      <div className="flex flex-row gap-1">
        <div className="flex-3 w-full">
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
        <button className="cursor-pointer flex-1 shrink-0 min-w-[129px] px-4 h-[40px] rounded-lg text-center border border-primary/80 justify-center items-center flex gap-2">
          <span className="text-center text-primary font-bold font-geist whitespace-nowrap">Send invite</span>
          <Spinner loading={isMutating} className="!text-primary" />
        </button>
      </div>
    </form>
  )
}