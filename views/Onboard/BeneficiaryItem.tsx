export default function BeneficiaryItem({ email }: { email: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="flex aspect-square w-10 items-center justify-center rounded-full bg-[#0015800A] text-secondary uppercase">
          {email[0]}
        </span>
        <span className="font-inter text-grey-200">{email}</span>
      </div>
      <span className="block rounded-full px-3 py-1 font-inter text-xs font-medium text-grey-200">
        pending
      </span>
    </div>
  );
}
