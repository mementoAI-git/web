import React from "react";
import CheckIcon from "@/public/icon/check.svg";
import ChevronRightIcon from "@/public/icon/chevron-right.svg";
import SpinnerIcon from "@/public/icon/spinner.svg";

interface IStep {
  title: string;
  subtitle: string;
  status?: string;
}

function Step({ title, subtitle, status = "pending" }: IStep) {
  const completed = status === "done";
  const active = status === "active";
  if (active) {
    return (
      <div className="mb-7 flex items-center rounded-xl bg-surface p-3">
        <div className="flex flex-1 items-start gap-3">
          <SpinnerIcon />
          <div className="flex flex-col gap-2">
            <span className="font-geist font-bold">{title}</span>
            <span className="font-inter text-grey-200">{subtitle}</span>
          </div>
        </div>
        <ChevronRightIcon />
      </div>
    );
  }
  return (
    <div className={`${!completed && "mb-7"} px-3 pt-3`}>
      <div className="flex items-center gap-3">
        <div
          className={`${completed ? "bg-success" : "border border-dashed border-grey-300 bg-transparent"} flex aspect-square w-6 items-center justify-center rounded-full text-white`}
        >
          {completed && <CheckIcon width={10} height={7} />}
        </div>
        <span className="font-inter font-normal text-secondary">{title}</span>
      </div>
      {completed && (
        <div className="tran h-9 translate-x-3 border-l border-success" />
      )}
    </div>
  );
}

export function OnboardSideBar() {
  return (
    <React.Fragment>
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <span className="font-inter text-xl font-bold">Setup guide</span>
          <span className="font-inter text-sm leading-5 text-grey-200">
            1 of 4 completed
          </span>
        </div>

        <div>
          <Step title="Created account" status="done" subtitle="" />
          <Step
            title="Let's get to know you better"
            status="active"
            subtitle="Fill in the required info"
          />
          <Step title="Add beneficiaries" subtitle="" />
          <Step title="Done" subtitle="" />
        </div>
      </div>
      <div className="flex flex-col items-start justify-start gap-6 rounded-lg bg-[#9E8DFB0D] p-3">
        <span className="font-inter text-xl leading-7 font-bold">
          Need help?
        </span>
        <span>
          Feel free to contact us with the button below. We’re always ready to
          help you get started on Laracept.{" "}
        </span>
        <button className="flex max-h-8 cursor-pointer items-center justify-center rounded-lg border border-grey-100 p-3 font-geist text-sm font-bold text-grey-200 shadow-btn">
          Get help
        </button>
      </div>
    </React.Fragment>
  );
}
