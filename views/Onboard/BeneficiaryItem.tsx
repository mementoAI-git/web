
export default function BeneficiaryItem({ email }: { email: string }) {
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