"use client";

import { Dateinput, Textinput } from "@/components/Form";
import { useStore } from "@/hooks/use-store";
import { useEffect } from "react";
import { isEmpty } from "@/utility";
import { useRouter } from "next/navigation";
import useForm from "@/hooks/use-form";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import * as yup from "yup";
import { mutate } from "swr/_internal";
import Spinner from "@/components/Spinner";
import ReasonsSelector from "./reasons-selector";

const initial = {
  dob: "",
  self_description: "",
  join_reasons: [],
  current_priority: "",
}

const schema = yup.object().shape({
  dob: yup
    .string()
    .required("Date of birth is required")
    .test(
      "not-in-future",
      "Date of birth cannot be in the future",
      (value) => {
        if (!value) return true;
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return false;
        const today = new Date();
        parsed.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        return parsed.getTime() <= today.getTime();
      }
    ),
  self_description: yup.string().required("Self description is required"),
  current_priority: yup.string().required("Current priority is required"),
})

export default function MiscPage() {
  const { user } = useStore()
  const router = useRouter()
  const { trigger: completeOnboarding, isMutating } = useFetcher(endpoint.completeOnboarding);

  const { handleSubmit, values, setValues, getField, handleValue } = useForm({
    schema,
    initial,
    async onSubmit(payload) {
      try {
        await completeOnboarding(payload);
        mutate(endpoint.profile)
        if (typeof window !== 'undefined') {
          localStorage.setItem('welcome_once', '1')
        }
        router.push("/onboard/beneficiary")
      } catch (error) {
        console.error("Failed to complete onboarding:", error)
      }
    }
  })

  const handleInterestClick = (interest: string) => {
    if (values.join_reasons.includes(interest)) {
      handleValue(
        "join_reasons",
        values.join_reasons.filter((r: string) => r !== interest)
      )
    } else {
      handleValue("join_reasons", [...values.join_reasons, interest])
    }
  }

  const handleAddCustom = (reason: string) => {
    const trimmed = reason.trim()
    if (!trimmed) return
    if (!values.join_reasons.includes(trimmed)) {
      handleValue("join_reasons", [...values.join_reasons, trimmed])
    }
  }

  useEffect(() => {
    if (user && isEmpty(user?.nickname)) {
      router.push("/onboard/nickname")
    }
    if (user) {
      setValues({
        dob: user?.dob,
        self_description: user?.context?.self_description,
        join_reasons: user?.context?.join_reasons,
        current_priority: user?.context?.current_priority
      })
    }
  }, [user?.nickname])

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-10 p-10">
      <div className="flex flex-col gap-4">
        <h3 className="text-[32px] text-gray-950/90 leading-[38px] font-garamond font-medium">
          Okay, <span className="capitalize">{user?.nickname}</span>. I’ve got some questions for you.
        </h3>
        <span className="text-gray-950/80 text-2xl !leading-[28px] font-garamond font-normal">
          These questions will help Memento better personalize your experience on the product.
        </span>
      </div>
      <Dateinput
        id="onboard-profile-dob"
        name="dob"
        label="Date of birth"
        className="!font-garamond text-[20px] placeholder:!text-[#667085]"
        labelClassName="!text-gray-950/90"
        required
        {...getField("dob")}
      />
      <div className="space-y-6">
        <p className="font-garamond font-medium text-[24px] leading-[32px] text-gray-950/80">
          What brings you to Memento? <span className="text-orange">(multi-select)</span>
        </p>
        <ReasonsSelector
          selected={values.join_reasons}
          onToggle={handleInterestClick}
          onAdd={handleAddCustom}
        />
      </div>
      <Textinput
        name="self_description"
        label="How would you describe yourself in a few words?"
        labelClassName="!text-gray-950/90"
        className="!font-garamond text-[20px] placeholder:!text-[#667085]"
        placeholder="Eg: Curious, ambitious, simple "
        required
        {...getField("self_description")}
      />
      <Textinput
        name="current_priority"
        label="What matters most to you now?"
        labelClassName="!text-gray-950/90"
        className="!font-garamond text-[20px] placeholder:!text-[#667085]"
        placeholder="Eg: Family, self growth, creativity, etc"
        required
        {...getField("current_priority")}
      />
      <div className="w-full border-t border-black/5" />
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="bg-black/4 text-gray-900 text-sm leading-[20px] cursor-pointer font-semibold rounded-full py-[18px] px-8"
        >
          Prev
        </button>
        <button
          type="submit"
          disabled={isMutating}
          className="bg-blue-6 flex items-center gap-2 text-white text-sm leading-[20px] cursor-pointer font-semibold rounded-full py-[18px] px-8"
        >
          <span>Continue</span>
          <Spinner loading={isMutating} className="!size-4" />
        </button>
      </div>
    </form>
  )
}