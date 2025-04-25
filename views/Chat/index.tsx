import ChatInput from "./Input";


export default function Chat() {
  return (
    <div className="w-full flex justify-center min-h-screen">
      <div style={{ minHeight: 'calc(100vh - 88px)' }} className="relative mx-auto w-full max-w-220 flex flex-col flex-1">
        <div style={{ minHeight: 'calc(100% - 185px)' }} className="absolute top-0 right-0 left-0 flex-1 py-1 pb-6 overflow-auto flex flex-col justify-end">
          <div>
            <div className="rounded-xl bg-black/4 w-fit px-4 py-2 max-w-81 text-[#475467] font-inter font-normal">
              Welcome back, Groot. It’s good to have you come by today. what’s up? :)
            </div>
            <span></span>
          </div>

          <div className="ml-auto">
            <div className="rounded-xl bg-[#E9ECFC52] w-fit px-4 py-2 max-w-81 text-[#475467] font-inter font-normal">
              Been swell. Was just thinking about how cool it is to have a space where i could recollect my thoughts and ponder on them all by myself for a bit.
            </div>
            <span></span>
          </div>
        </div>

        <ChatInput />
      </div>
    </div>
  )
}