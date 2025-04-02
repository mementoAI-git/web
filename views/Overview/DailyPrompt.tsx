
interface IDailyPrompt {
  onClick?: () => void
}
export default function DailyPrompt({ onClick }: IDailyPrompt) {
  return (
    <div className="rounded-2xl h-72.5 max-w-[368.5px] w-1/2 flex-1 p-8 flex flex-col justify-between bg-grey-700">
      <span className="inline-block w-fit py-1 px-3 rounded-full bg-grey-400 font-inter font-medium text-xs text-grey-800 uppercase">Question</span>
      <div className="space-y-3">
        <span className="block text-grey-900 font-inter font-semibold ">What is one of your earliest childhood memories?</span>
        <button onClick={onClick} className="block rounded-full px-5 py-2 bg-secondary disabled:bg-grey-500 text-white disabled:text-grey-800 font-inter font-medium text-sm">Reply</button>
      </div>
    </div>
  )
}