import React from "react";
import CheckIcon from "@/public/icon/check.svg"
import ChevronRightIcon from "@/public/icon/chevron-right.svg"
import SpinnerIcon from "@/public/icon/spinner.svg"

interface IStep {
  title: string
  subtitle: string
  status?: string
}

function Step({ title, subtitle, status = "pending" }: IStep) {
  const completed = status === "done"
  const active = status === "active"
  if (active) {
    return (
      <div className="bg-surface flex items-center p-3 mb-7 rounded-xl">
        <div className="flex flex-1 gap-3 items-start">
          <SpinnerIcon />
          <div className="flex flex-col gap-2">
            <span className="font-geist font-bold">{title}</span>
            <span className="font-inter text-grey-200">{subtitle}</span>
          </div>
        </div>
        <ChevronRightIcon />
      </div>
    )
  }
  return (
    <div className={`${!completed && "mb-7"} px-3 pt-3`}>
      <div className="flex items-center gap-3">
        <div className={`${completed ? "bg-success" : "bg-transparent border border-dashed border-grey-300"} w-6 aspect-square rounded-full flex justify-center items-center`}>
          {completed && <CheckIcon />}
        </div>
        <span className="font-inter font-normal text-secondary">{title}</span>
      </div>
      {completed && <div className="tran translate-x-3 border-l border-success h-9" />}
    </div>
  )
}

export function OnboardSideBar() {
  return (
    <React.Fragment>
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <span className="font-inter font-bold text-xl">Setup guide</span>
          <span className="font-inter text-sm leading-5 text-grey-200">1 of 4 completed</span>
        </div>

        <div>
          <Step title="Created account" status="done" subtitle="" />
          <Step title="Let's get to know you better" status="active" subtitle="Fill in the required info" />
          <Step title="Add beneficiaries" subtitle="" />
          <Step title="Done" subtitle="" />
        </div>
      </div>
      <div className="bg-[#9E8DFB0D] p-3 rounded-lg gap-6 justify-start items-start flex flex-col">
        <span className="font-inter text-xl font-bold leading-7">Need help?</span>
        <span>Feel free to contact us with the button below. We’re always ready to help you get started on Laracept. </span>
        <button className="cursor-pointer flex justify-center items-center p-3 text-sm text-grey-200 font-geist rounded-lg shadow-btn border border-grey-100 max-h-8 font-bold">Get help</button>
      </div>
    </React.Fragment>
  )
}