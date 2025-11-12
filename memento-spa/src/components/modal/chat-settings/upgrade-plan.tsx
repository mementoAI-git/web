import diamond from "@/assets/image/diamond.png";
import bg from "@/assets/image/bg/4.png";

export default function UpgradePlan() {
  return (
    <div className="relative flex gap-4 rounded-2xl border border-black/10 bg-black/5 px-3 py-3 sm:px-4 sm:py-5">
      <img src={bg} alt="Background" className="absolute inset-0 size-full object-cover" />
      <img src={diamond} width={61} height={61} className="relative size-[40px] shrink-0 md:size-[61px]" alt="diamond" />
      <div className="relative flex-1 space-y-1 text-sm">
        <div className="flex w-full items-center justify-between text-secondary">
          <span className="font-garamond text-xl text-[#1D2939]">Unlock more with Pro</span>
        </div>
        <span className="inline-block text-xs text-[#565C79]">
          Access more advanced model options and more storage with Memento Pro.
        </span>
        <div className="mt-3 space-x-3 font-semibold">
          <button type="button" className="inline-block cursor-pointer font-inter text-sm text-blue-7">
            Upgrade plan
          </button>
        </div>
      </div>
    </div>
  );
}

