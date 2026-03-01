"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import { Dateinput, Textinput } from "@/components/Form";
import Spinner from "@/components/spinner";
import useForm from "@/hooks/use-form";
import useFetcher from "@/hooks/use-fetcher";
import { useStore } from "@/hooks/use-store";
import { isEmpty } from "@/utility";
import endpoint from "@/api/endpoint";
import ReasonsSelector from "../components/reasons-selector";
import { mutate } from "swr";
import { storageKeys } from "@/utility/constant";

const initial = {
  dob: "",
  self_description: "",
  join_reasons: [] as string[],
  current_priority: "",
};

const schema = yup.object().shape({
  dob: yup
    .string()
    .required("Date of birth is required")
    .test("not-in-future", "Date of birth cannot be in the future", (value) => {
      if (!value) return true;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return false;
      const today = new Date();
      parsed.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      return parsed.getTime() <= today.getTime();
    }),
  self_description: yup.string().required("Self description is required"),
  current_priority: yup.string().required("Current priority is required"),
});

export default function MiscPage() {
  const { user } = useStore();
  const navigate = useNavigate();
  const { trigger: completeOnboarding, isMutating } = useFetcher(endpoint.completeOnboarding);

  const { handleSubmit, values, setValues, getField, handleValue } = useForm({
    schema,
    initial,
    async onSubmit(payload) {
      try {
        await completeOnboarding(payload);
        await mutate(endpoint.profile);
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKeys.welcomeOnce, "1");
        }
        navigate("/onboard/beneficiary");
      } catch (error) {
        console.error("Failed to complete onboarding:", error);
      }
    },
  });

  const handleInterestClick = (interest: string) => {
    if (values.join_reasons.includes(interest)) {
      handleValue(
        "join_reasons",
        values.join_reasons.filter((reason) => reason !== interest),
      );
    } else {
      handleValue("join_reasons", [...values.join_reasons, interest]);
    }
  };

  const handleAddCustom = (reason: string) => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    if (!values.join_reasons.includes(trimmed)) {
      handleValue("join_reasons", [...values.join_reasons, trimmed]);
    }
  };

  useEffect(() => {
    if (user && isEmpty(user?.nickname)) {
      navigate("/onboard/nickname");
    }
    if (user) {
      setValues({
        dob: user?.dob ?? "",
        self_description: user?.context?.self_description ?? "",
        join_reasons: user?.context?.join_reasons ?? [],
        current_priority: user?.context?.current_priority ?? "",
      });
    }
  }, [user, navigate, setValues]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 sm:gap-8 md:gap-10 p-4 sm:p-6 md:p-10">
      <div className="flex flex-col gap-3 sm:gap-4">
        <h3 className="font-garamond text-2xl sm:text-[28px] md:text-[32px] font-medium leading-[32px] sm:leading-[36px] md:leading-[38px] text-gray-950/90">
          Okay, <span className="capitalize">{user?.nickname}</span>. I've got some questions for
          you.
        </h3>
        <span className="font-garamond text-base sm:text-xl md:text-2xl font-normal leading-[24px] sm:leading-[26px] md:leading-[28px] text-gray-950/80">
          These questions will help Memento better personalize your experience on the product.
        </span>
      </div>

      <Dateinput
        id="onboard-profile-dob"
        label="Date of birth"
        className="font-garamond! text-base sm:text-lg md:text-[20px] placeholder:!text-[#667085]"
        labelClassName="!text-gray-950/90"
        required
        {...getField("dob")}
      />

      <div className="space-y-4 sm:space-y-5 md:space-y-6">
        <p className="font-garamond text-lg sm:text-xl md:text-[24px] font-medium leading-[28px] sm:leading-[30px] md:leading-[32px] text-gray-950/80">
          What brings you to Memento? <span className="text-orange">(multi-select)</span>
        </p>
        <ReasonsSelector
          selected={values.join_reasons}
          onToggle={handleInterestClick}
          onAdd={handleAddCustom}
        />
      </div>

      <Textinput
        label="How would you describe yourself in a few words?"
        labelClassName="!text-gray-950/90"
        className="!font-garamond text-base sm:text-lg md:text-[20px] placeholder:!text-[#667085]"
        placeholder="Eg: Curious, ambitious, simple "
        required
        {...getField("self_description")}
      />
      <Textinput
        label="What matters most to you now?"
        labelClassName="!text-gray-950/90"
        className="!font-garamond text-base sm:text-lg md:text-[20px] placeholder:!text-[#667085]"
        placeholder="Eg: Family, self growth, creativity, etc"
        required
        {...getField("current_priority")}
      />

      <div className="w-full border-t border-black/5" />
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-full bg-black/4 px-6 sm:px-8 py-4 sm:py-[18px] text-sm font-semibold leading-[20px] text-gray-900 transition-colors duration-200 hover:bg-black/6 active:bg-black/8"
        >
          Prev
        </button>
        <button
          type="submit"
          disabled={isMutating}
          className="flex items-center gap-2 rounded-full bg-orange px-6 sm:px-8 py-4 sm:py-[18px] text-sm font-semibold leading-[20px] text-white transition-colors duration-200 hover:bg-[#C55A1D] active:bg-[#A84D19] disabled:cursor-not-allowed disabled:bg-orange/40"
        >
          <span>Continue</span>
          <Spinner loading={isMutating} className="!size-4" />
        </button>
      </div>
    </form>
  );
}

