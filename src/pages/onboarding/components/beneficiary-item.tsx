export default function BeneficiaryItem({ email }: { email: string }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex aspect-square w-10 items-center justify-center rounded-full border border-stroke-success-strong bg-fill-success-weak text-text-success-strong uppercase">
          {email[0]}
        </span>
        <span className="min-w-0 break-all font-inter text-text-neutral-strong">{email}</span>
      </div>
      <span className="block w-fit rounded-full px-3 py-1 font-inter text-xs font-medium text-grey-200">
        pending
      </span>
    </div>
  );
}
