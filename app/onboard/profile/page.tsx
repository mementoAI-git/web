import { Textinput } from "@/components/Form";

export default function ProfilePage() {
  return (
    <div className="max-w-[583px] flex flex-col gap-10 py-20 w-full">
      <div className="bg-surface flex flex-col p-10 gap-5 rounded-3xl">
        <span className="font-bold text-[32px] leading-10 font-bricolage">Let’s get to know you better</span>
        <Textinput name="first_name" label="First name" placeholder="Enter first name" />
        <Textinput name="last_name" label="Last name" placeholder="Enter last name" />
        <Textinput name="first_name" label="First name" placeholder="Enter first name" />
        <Textinput name="first_name" label="First name" placeholder="Enter first name" />
      </div>
      <div className="flex items-end justify-between font-geist font-bold text-base">
        <span className="underline text-grey-200 cursor-pointer">Go back</span>
        <button className="rounded-lg text-white bg-secondary px-4 cursor-pointer h-12">Continue</button>
      </div>
    </div>
  )
}