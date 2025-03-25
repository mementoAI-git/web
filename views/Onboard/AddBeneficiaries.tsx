import { Textinput } from "@/components/Form";

function Beneficiary({ email }: { email: string }) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <span className="w-10 aspect-square uppercase rounded-full flex justify-center items-center text-secondary bg-[#0015800A]">
          {email[0]}
        </span>
        <span className="font-inter text-grey-200">{email}</span>
      </div>
      <span className="font-inter font-medium text-xs text-grey-200 block px-3 py-1 rounded-full">pending</span>
    </div>
  )
}

export function AddBeneficiaries() {
  return (
    <div className="max-w-[583px] flex flex-col gap-10 py-20 w-full">
      <div className="bg-surface flex flex-col p-10 gap-5 rounded-3xl">
        <span className="font-bold text-[32px] leading-10 font-bricolage">Add beneficiaries</span>
        <form className="flex flex-row gap-1 items-end">
          <div className="flex-1 w-full">
            <Textinput name="email" type="email" label="Email" placeholder="example@yahoo.com" />
          </div>
          <button className="cursor-pointer flex-3 shrink-0 max-w-[129px] h-[40px] rounded-lg text-center border border-primary/80 justify-center items-center flex">
            <span className="text-center text-primary font-bold font-geist">Send invite</span>
          </button>
        </form>

        <div className="bg-white space-y-3 p-4 rounded-lg">
          <span className="uppercase font-inter text-sm text-grey-300 font-semibold tracking-[2px]">invites</span>

          <div className="space-y-3 mt-4">
            <Beneficiary email="Egwu@email.com" />
            <Beneficiary email="Joshuajohn73@email.com" />
            <Beneficiary email="frankedoho@email.com" />
          </div>
        </div>
      </div>
      <div className="flex items-end justify-between font-geist font-bold text-base">
        <span className="underline text-grey-200 cursor-pointer">Go back</span>
        <button className="rounded-lg text-white bg-secondary px-4 cursor-pointer h-12">Continue</button>
      </div>
    </div>
  )
}