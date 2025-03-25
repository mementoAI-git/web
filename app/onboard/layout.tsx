import { PropsWithChildren } from "react";
import Logo from "@/components/Logo";

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="bg-white w-screen min-h-screen">
      <header className="max-w-[1440px] max-h-[96px] py-6 px-20 flex justify-between items-center w-full">
        <Logo />
      </header>
      <div className="border-t border-grey-100" />
      <main className="h-full flex max-w-[1440px]">
        <div className="flex-1 flex justify-center items-center">
          {children}
        </div>
        <aside className="max-w-[446px] px-4 py-8 flex flex-col justify-between flex-1 border-l border-grey-100">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-inter font-bold text-xl">Setup guide</span>
              <span className="font-inter text-sm fon leading-5 text-grey-200">1 of 4 completed</span>
            </div>
          </div>
          <div className="bg-[#9E8DFB0D] p-3 rounded-lg gap-6 justify-start items-start flex flex-col">
            <span className="font-inter text-xl font-bold leading-7">Need help?</span>
            <span>Feel free to contact us with the button below. We’re always ready to help you get started on Laracept. </span>
            <button className="cursor-pointer flex justify-center items-center p-3 text-sm text-grey-200 font-geist rounded-lg shadow-btn border border-grey-100 max-h-8 font-bold">Get help</button>
          </div>
        </aside>
      </main>
    </div>
  )
}