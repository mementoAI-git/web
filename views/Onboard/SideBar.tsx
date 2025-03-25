import React from "react";

export function OnboardSideBar() {
  return (
    <React.Fragment>
      <div>
        <div className="flex items-center justify-between">
          <span className="font-inter font-bold text-xl">Setup guide</span>
          <span className="font-inter text-sm leading-5 text-grey-200">1 of 4 completed</span>
        </div>

        <div></div>
      </div>
      <div className="bg-[#9E8DFB0D] p-3 rounded-lg gap-6 justify-start items-start flex flex-col">
        <span className="font-inter text-xl font-bold leading-7">Need help?</span>
        <span>Feel free to contact us with the button below. We’re always ready to help you get started on Laracept. </span>
        <button className="cursor-pointer flex justify-center items-center p-3 text-sm text-grey-200 font-geist rounded-lg shadow-btn border border-grey-100 max-h-8 font-bold">Get help</button>
      </div>
    </React.Fragment>
  )
}