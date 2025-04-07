'use client'

import endpoint from "@/api/endpoint"
import { Button } from "@/components/Buttons";
import { Textinput } from "@/components/Form";
import { useRouter } from "next/navigation";
import useForm from "@/hooks/use-form"
import useSWRMutation from "swr/mutation"
import * as yup from "yup"
import { postFetcher } from "@/api/fetcher";

const schema = yup.object().shape({
  email: yup.string().required("Email is required").email("Invalid email address").trim()
})
const initial = { email: "" }
export function ForgetPassword() {
  const router = useRouter()
  const { trigger, isMutating } = useSWRMutation(endpoint.sendLink, postFetcher)
  const { handleSubmit, handleChange, values, errors } = useForm({
    schema,
    initial,
    async onSubmit(payload) {
      const result = await trigger(payload)
      if (result) {
        router.push(`/check-mail?email=${payload.email}`)
      }
    }
  })

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
      <Button
        title="Submit"
        type="submit"
        loading={isMutating}
        className="mt-3"
      />
    </form>
  )
}