"use client"

import endpoint from "@/api/endpoint"
import { Button } from "@/components/Buttons"
import { Passwordinput, Textinput } from "@/components/Form"
import useFetcher from "@/hooks/use-fetcher"
import useForm from "@/hooks/use-form"
import { useRouter } from "next/navigation"
import * as yup from "yup"

const schema = yup.object().shape({
  email: yup.string().required("Email is required").email("Invalid email address").trim(),
  password: yup.string().required("Password is required")
    .min(6, "Password must be at least 6 characters long")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
})

const initial = { email: "", password: "" }

export function Register() {
  const router = useRouter()
  const { trigger, isMutating } = useFetcher(endpoint.register)
  const { handleSubmit, handleChange, values, errors } = useForm({
    schema,
    initial,
    async onSubmit(payload) {
      await trigger(payload)
      router.push(`/verify-email?email=${payload.email}`)
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
      <Passwordinput
        label="Password"
        name="password"
        value={values.password}
        error={errors.password}
        onChange={handleChange}
      />
      <Button loading={isMutating} type="submit" title="Create account" className="mt-3" />

      <small className="font-inter px-3 text-sm leading-5 text-center text-grey-200">
        By clicking “Create account” you agree to the
        <span className="text-primary underline">Terms of Use</span> and
        <span className="text-primary underline"> Privacy Policy</span>
      </small>
    </form >
  )
}